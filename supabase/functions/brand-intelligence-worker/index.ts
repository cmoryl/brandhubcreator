/**
 * Brand Intelligence Analysis Worker
 * Ultra-lightweight edge function for AI analysis
 * Optimized to stay under 150MB memory limit
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let jobId: string | null = null;

  try {
    const body = await req.json();
    jobId = body.jobId;
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('brand_intelligence_jobs')
      .select('id, entity_type, entity_id, organization_id, status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return new Response(JSON.stringify({ error: "Job already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update to processing
    await supabase
      .from('brand_intelligence_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString(), progress: 10 })
      .eq('id', jobId);

    // Fetch name + guide_data for comprehensive analysis
    const table = job.entity_type === 'brand' ? 'brands' : job.entity_type === 'product' ? 'products' : 'events';
    const { data: entity } = await supabase
      .from(table)
      .select('name, guide_data')
      .eq('id', job.entity_id)
      .single();

    if (!entity) {
      throw new Error(`Entity not found`);
    }

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    // Extract full brand context from all sections including image URLs
    const { extractFullBrandContext, buildMultimodalContent, fetchDocumentContext, fetchSocialMetricsContext } = await import('../_shared/extractFullBrandContext.ts');
    const guideData = (entity.guide_data || {}) as Record<string, unknown>;
    const { text: brandContext, sectionsWithData, imageUrls } = extractFullBrandContext(
      guideData,
      entity.name,
      job.entity_type,
      2500,
      true,
      10,
    );

    // Fetch document-based content, social metrics, AND Oracle context in parallel
    const [docResult, socialResult, oracleResult] = await Promise.all([
      fetchDocumentContext(supabase, job.entity_id, job.entity_type, guideData, 1500),
      fetchSocialMetricsContext(supabase, job.entity_id, job.entity_type),
      fetchOracleContext(supabase, job.organization_id),
    ]);
    const { text: docContext, imageUrls: docImages, documentCount } = docResult;
    const { text: socialContext, platformCount: socialPlatformCount, hasMetrics: hasSocialMetrics } = socialResult;

    // Merge document images into main image set
    for (const di of docImages.slice(0, 5)) {
      if (imageUrls.length < 15) imageUrls.push(di);
    }

    const oracleContext = oracleResult ? `\nORACLE BRAIN CONTEXT (Org-Level Intelligence):\n${oracleResult}` : '';

    const prompt = `Analyze "${entity.name}" brand using ALL the following data including visual assets, documents, social media performance, and organization-level Oracle intelligence. Return compact JSON:
${brandContext}
${docContext ? `\nDOCUMENT CONTENT:\n${docContext}` : ''}
${socialContext || ''}
${oracleContext}

Sections with data: ${sectionsWithData.join(', ')}
Documents analyzed: ${documentCount} files
Visual assets included: ${imageUrls.length} images from ${[...new Set(imageUrls.map(i => i.section))].join(', ')}
${hasSocialMetrics ? `Social platforms tracked: ${socialPlatformCount}` : 'No social metrics data available'}

Analyze provided images and document content for visual consistency, content quality, messaging alignment, and brand coherence.${hasSocialMetrics ? ' Incorporate social media performance data into your competitive positioning, growth recommendations, and digital presence assessment.' : ''}${oracleResult ? ' Incorporate Oracle org-level intelligence for strategic alignment and portfolio-level context.' : ''} Return ONLY valid JSON:
{"summary":"2 sentences","position":"1 sentence","audience":"1 sentence","advantages":["up to 3"],"voice":{"tone":"1-2 words","style":"1-2 words"},"recommendation":"1 sentence","insight":"1 sentence","readiness":50,"visual_analysis":{"consistency":"1 sentence","quality":"1 sentence","alignment":"1 sentence"},"document_analysis":{"content_quality":"1 sentence","messaging_consistency":"1 sentence","asset_coverage":"1 sentence"},"social_performance":{"overall_assessment":"1 sentence","strongest_platform":"platform name","growth_opportunity":"1 sentence","engagement_quality":"1 sentence"},"cultural_insights":{"global_readiness_score":50,"primary_markets":["up to 3"],"cultural_considerations":[],"localization_priorities":[]},"globallink_recommendations":[{"product":"Translation|AI|Connect","relevance":"high|medium|low","use_case":"1 sentence"}]}`;

    // Build multimodal content with images for vision analysis
    const messageContent = imageUrls.length > 0
      ? buildMultimodalContent(prompt, imageUrls, 6)
      : prompt;

    // Use vision-capable model when images are available
    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageUrls.length > 0 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: messageContent }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    // If multimodal request fails (e.g. broken image URLs), retry with text-only
    if (!aiResponse.ok && imageUrls.length > 0) {
      const errText = await aiResponse.text();
      console.warn("[worker] Multimodal AI failed, retrying text-only:", aiResponse.status, errText.slice(0, 150));
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[worker] AI error:", aiResponse.status, errText.slice(0, 200));
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 60 })
      .eq('id', jobId);

    // Parse response carefully
    const responseText = await aiResponse.text();
    let content = "";
    
    try {
      const parsed = JSON.parse(responseText);
      content = parsed.choices?.[0]?.message?.content || "";
    } catch {
      console.error("[worker] Response parse error");
      throw new Error("Failed to parse AI response");
    }

    // Extract JSON from potential markdown
    let analysis: any;
    try {
      // Try direct parse first
      analysis = JSON.parse(content.trim());
    } catch {
      try {
        // Try extracting from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                          content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
        analysis = JSON.parse(jsonStr);
      } catch {
        console.error("[worker] JSON extract error:", content.slice(0, 200));
        // Use minimal fallback
        analysis = {
          summary: "Analysis completed",
          position: "Market participant",
          audience: "General consumers",
          advantages: ["Brand recognition"],
          voice: { tone: "Professional", style: "Clear" },
          recommendation: "Continue brand development",
          insight: "Opportunity for growth identified",
          readiness: 50
        };
      }
    }

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 80 })
      .eq('id', jobId);

    // Get or create intelligence record
    let { data: intel } = await supabase
      .from('brand_intelligence')
      .select('id, knowledge_entries, brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, cultural_insights, globallink_recommendations, localization_readiness_score, analysis_count, competitive_landscape, learning_context')
      .eq('entity_type', job.entity_type)
      .eq('entity_id', job.entity_id)
      .maybeSingle();

    if (!intel) {
      const { data: newIntel } = await supabase
        .from('brand_intelligence')
        .insert({
          entity_type: job.entity_type,
          entity_id: job.entity_id,
          organization_id: job.organization_id,
          knowledge_entries: [],
          semantic_hashes: [],
        })
        .select('id, knowledge_entries, brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, cultural_insights, globallink_recommendations, localization_readiness_score, analysis_count, competitive_landscape, learning_context')
        .single();
      intel = newIntel;
    }

    if (!intel) throw new Error("Failed to get intelligence record");

    // Create insight entry
    const newInsight = {
      id: crypto.randomUUID(),
      type: 'insight',
      content: analysis.insight || analysis.summary || "Brand analysis completed",
      source: 'ai',
      category: 'ai-analysis',
      created_at: new Date().toISOString(),
      confidence: 0.7,
    };

    const entries = Array.isArray(intel.knowledge_entries) ? intel.knowledge_entries : [];

    // --- MERGE logic: preserve existing data, only update if AI returned something meaningful ---

    // Merge arrays by combining existing + new, deduplicating
    const mergeArrays = (existing: any, incoming: any) => {
      const ex = Array.isArray(existing) ? existing : [];
      const inc = Array.isArray(incoming) ? incoming : [];
      const combined = [...ex];
      for (const item of inc) {
        const str = typeof item === 'string' ? item : JSON.stringify(item);
        const isDuplicate = combined.some(e => {
          const eStr = typeof e === 'string' ? e : JSON.stringify(e);
          return eStr.toLowerCase() === str.toLowerCase();
        });
        if (!isDuplicate) combined.push(item);
      }
      return combined;
    };

    // Only replace text fields if AI returned a substantive value and existing is empty
    const mergeText = (existing: string | null, incoming: string | null | undefined) => {
      if (!incoming) return existing;
      if (!existing) return incoming;
      // If existing is very short and new is longer, prefer new
      if (existing.length < 20 && incoming.length > existing.length) return incoming;
      return existing; // Keep existing by default
    };

    // Merge voice profile
    const existingVoice = (intel.brand_voice_profile as any) || {};
    const incomingVoice = analysis.voice || {};
    const mergedVoice = {
      ...existingVoice,
      tone: existingVoice.tone || incomingVoice.tone || "",
      style: existingVoice.style || incomingVoice.style || "",
      personality: existingVoice.personality || incomingVoice.personality,
      communication_style: existingVoice.communication_style || incomingVoice.style || "",
    };

    // Merge growth recommendations
    const existingRecs = Array.isArray(intel.growth_recommendations) ? intel.growth_recommendations : [];
    const incomingRecs = analysis.recommendation ? [{
      priority: "medium",
      recommendation: analysis.recommendation,
      rationale: "",
      confidence: 0.7
    }] : [];
    const mergedRecs = mergeArrays(existingRecs, incomingRecs);

    // Merge cultural insights
    const existingCultural = (intel.cultural_insights as any) || {};
    const incomingCultural = analysis.cultural_insights || {};
    const mergedCultural = Object.keys(incomingCultural).length > 0 ? {
      ...existingCultural,
      global_readiness_score: incomingCultural.global_readiness_score || existingCultural.global_readiness_score || 50,
      primary_markets: mergeArrays(existingCultural.primary_markets, incomingCultural.primary_markets),
      cultural_considerations: mergeArrays(existingCultural.cultural_considerations, incomingCultural.cultural_considerations),
      localization_priorities: mergeArrays(existingCultural.localization_priorities, incomingCultural.localization_priorities),
      color_cultural_notes: mergeArrays(existingCultural.color_cultural_notes, incomingCultural.color_cultural_notes),
      imagery_guidelines: mergeArrays(existingCultural.imagery_guidelines, incomingCultural.imagery_guidelines),
    } : existingCultural;

    // Merge target audience
    const existingAudience = (intel.target_audience as any) || {};
    const mergedAudience = {
      ...existingAudience,
      primary: existingAudience.primary || analysis.audience || "",
      secondary: mergeArrays(existingAudience.secondary, []),
      demographics: mergeArrays(existingAudience.demographics, []),
    };

    // Merge learning_context to persist social_performance, visual_analysis, document_analysis
    const existingLearning = (intel.learning_context as Record<string, unknown>) || {};
    const mergedLearning = {
      ...existingLearning,
      ...(analysis.social_performance ? { social_performance: analysis.social_performance } : {}),
      ...(analysis.visual_analysis ? { visual_analysis: analysis.visual_analysis } : {}),
      ...(analysis.document_analysis ? { document_analysis: analysis.document_analysis } : {}),
      last_updated: new Date().toISOString(),
    };

    // Update intelligence with MERGED data
    await supabase
      .from('brand_intelligence')
      .update({
        brand_summary: mergeText(intel.brand_summary as string | null, analysis.summary),
        market_position: mergeText(intel.market_position as string | null, analysis.position),
        target_audience: mergedAudience,
        competitive_advantages: mergeArrays(intel.competitive_advantages, analysis.advantages),
        brand_voice_profile: mergedVoice,
        growth_recommendations: mergedRecs,
        cultural_insights: Object.keys(mergedCultural).length > 0 ? mergedCultural : null,
        globallink_recommendations: mergeArrays(intel.globallink_recommendations, analysis.globallink_recommendations),
        knowledge_entries: [...entries, newInsight],
        learning_context: mergedLearning,
        last_analyzed_at: new Date().toISOString(),
        analysis_count: ((intel as any).analysis_count || 0) + 1,
        localization_readiness_score: Math.max(
          (intel.localization_readiness_score as number) || 0,
          analysis.cultural_insights?.global_readiness_score || analysis.readiness || 50
        ),
      })
      .eq('id', intel.id);

    // Mark job complete
    await supabase
      .from('brand_intelligence_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        result: { success: true, summary: analysis.summary },
      })
      .eq('id', jobId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[worker] Error:", error);
    
    if (jobId) {
      await supabase
        .from('brand_intelligence_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', jobId);
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Fetch Oracle Brain context for org-level intelligence injection
 */
async function fetchOracleContext(supabase: any, organizationId: string | null): Promise<string | null> {
  if (!organizationId) return null;
  
  try {
    const [{ data: oracle }, { data: knowledge }] = await Promise.all([
      supabase.from('oracle_intelligence')
        .select('org_summary, portfolio_analysis, strategic_recommendations, unified_voice_profile, competitive_overview, cultural_readiness')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      supabase.from('oracle_knowledge_base')
        .select('title, content')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(5),
    ]);

    if (!oracle?.org_summary && (!knowledge || knowledge.length === 0)) return null;

    const parts: string[] = [];
    
    if (oracle?.org_summary) {
      parts.push(`Org Summary: ${oracle.org_summary}`);
    }
    if (oracle?.unified_voice_profile?.primary_tone) {
      parts.push(`Org Voice: ${oracle.unified_voice_profile.primary_tone}`);
    }
    if (oracle?.competitive_overview?.market_position) {
      parts.push(`Org Market Position: ${oracle.competitive_overview.market_position}`);
    }
    const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
    if (recs.length > 0) {
      parts.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
    }
    
    if (knowledge && knowledge.length > 0) {
      parts.push(`Knowledge Base Highlights: ${knowledge.map((k: any) => `${k.title}: ${k.content.slice(0, 150)}`).join(' | ')}`);
    }

    return parts.join('\n');
  } catch (err) {
    console.warn('[worker] Oracle context fetch failed:', err);
    return null;
  }
}
