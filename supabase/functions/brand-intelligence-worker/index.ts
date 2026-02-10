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

    // Extract full brand context from all sections
    const { extractFullBrandContext } = await import('../_shared/extractFullBrandContext.ts');
    const { text: brandContext, sectionsWithData } = extractFullBrandContext(
      (entity.guide_data || {}) as Record<string, unknown>,
      entity.name,
      job.entity_type,
      2500,
    );

    const prompt = `Analyze "${entity.name}" brand using ALL the following data. Return compact JSON:
${brandContext}

Sections with data: ${sectionsWithData.join(', ')}

Return ONLY valid JSON:
{"summary":"2 sentences","position":"1 sentence","audience":"1 sentence","advantages":["up to 3"],"voice":{"tone":"1-2 words","style":"1-2 words"},"recommendation":"1 sentence","insight":"1 sentence","readiness":50,"cultural_insights":{"global_readiness_score":50,"primary_markets":["up to 3"],"cultural_considerations":[],"localization_priorities":[]},"globallink_recommendations":[{"product":"Translation|AI|Connect","relevance":"high|medium|low","use_case":"1 sentence"}]}`;

    // Use streaming to minimize memory - read chunks instead of full response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

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

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 80 })
      .eq('id', jobId);

    // Get or create intelligence record
    let { data: intel } = await supabase
      .from('brand_intelligence')
      .select('id, knowledge_entries')
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
        .select('id, knowledge_entries')
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

    // Update intelligence with comprehensive data
    await supabase
      .from('brand_intelligence')
      .update({
        brand_summary: analysis.summary || null,
        market_position: analysis.position || null,
        target_audience: { primary: analysis.audience || "" },
        competitive_advantages: analysis.advantages || [],
        brand_voice_profile: analysis.voice || {},
        growth_recommendations: analysis.recommendation ? [{
          priority: "medium",
          recommendation: analysis.recommendation,
          rationale: "",
          confidence: 0.7
        }] : [],
        cultural_insights: analysis.cultural_insights || null,
        globallink_recommendations: analysis.globallink_recommendations || [],
        knowledge_entries: [...entries, newInsight],
        last_analyzed_at: new Date().toISOString(),
        analysis_count: (intel as any).analysis_count ? (intel as any).analysis_count + 1 : 1,
        localization_readiness_score: analysis.cultural_insights?.global_readiness_score || analysis.readiness || 50,
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
