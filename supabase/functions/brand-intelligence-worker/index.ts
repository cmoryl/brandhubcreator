/**
 * Brand Intelligence Analysis Worker
 * Lightweight edge function dedicated to AI analysis
 * Called by the main brand-intelligence function via job system
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

  try {
    const { jobId } = await req.json();
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('brand_intelligence_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return new Response(JSON.stringify({ error: "Job already processed", status: job.status }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update to processing
    await supabase
      .from('brand_intelligence_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString(), progress: 10 })
      .eq('id', jobId);

    const { entity_type: entityType, entity_id: entityId, organization_id: organizationId } = job;

    // Fetch entity data
    const table = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    const { data: entityData, error: entityError } = await supabase
      .from(table)
      .select('name, guide_data')
      .eq('id', entityId)
      .single();

    if (entityError || !entityData) {
      throw new Error(`Failed to fetch ${entityType} data`);
    }

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 30 })
      .eq('id', jobId);

    const guideData = entityData.guide_data as any;
    const isEvent = entityType === 'event';
    const eventDetails = isEvent ? guideData?.eventDetails : null;

    // Ultra-minimal prompt to reduce memory
    const entityInfo = isEvent 
      ? `${eventDetails?.eventName || entityData.name} (${eventDetails?.eventType || 'event'})`
      : `${entityData.name} - ${guideData?.hero?.tagline || 'brand'}`;

    const prompt = `Analyze "${entityInfo}". Return JSON:
{"brand_summary":"2 sentences","market_position":"1 sentence","target_audience":{"primary":"","secondary":[],"demographics":[]},"competitive_advantages":["1","2"],"brand_voice_profile":{"tone":["1"],"personality":["1"],"communication_style":""},"growth_recommendations":[{"priority":"high","recommendation":"","rationale":"","confidence":0.8}],"new_insights":[{"content":"","confidence":0.8}],"cultural_insights":{"global_readiness_score":50,"primary_markets":["US"],"cultural_considerations":[],"localization_priorities":[],"color_cultural_notes":[],"imagery_guidelines":[]},"globallink_recommendations":[]}`;

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 50 })
      .eq('id', jobId);

    // Call AI with aggressive token limits
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[analysis-worker] AI error:", aiResponse.status, errText);
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    await supabase
      .from('brand_intelligence_jobs')
      .update({ progress: 75 })
      .eq('id', jobId);

    // Read response as text first to minimize memory spikes
    const responseText = await aiResponse.text();
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (e) {
      console.error("[analysis-worker] Failed to parse AI response:", responseText.slice(0, 500));
      throw new Error("Failed to parse AI response");
    }

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response content");

    let analysis;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[analysis-worker] JSON parse failed:", content.slice(0, 500));
      throw new Error("Failed to parse analysis JSON");
    }

    // Get current intelligence
    let { data: intel } = await supabase
      .from('brand_intelligence')
      .select('id, knowledge_entries, semantic_hashes, analysis_history, analysis_count')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle();

    if (!intel) {
      const { data: newIntel } = await supabase
        .from('brand_intelligence')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId,
          knowledge_entries: [],
          semantic_hashes: [],
        })
        .select('id, knowledge_entries, semantic_hashes, analysis_history, analysis_count')
        .single();
      intel = newIntel;
    }

    if (!intel) throw new Error("Failed to get/create intelligence record");

    // Add new insights
    const newInsights = (analysis.new_insights || []).map((i: any) => ({
      id: crypto.randomUUID(),
      type: 'insight',
      content: typeof i === 'string' ? i : i.content,
      source: 'ai',
      category: 'ai-analysis',
      created_at: new Date().toISOString(),
      confidence: typeof i === 'string' ? 0.7 : i.confidence || 0.7,
    }));

    // Update intelligence
    await supabase
      .from('brand_intelligence')
      .update({
        brand_summary: analysis.brand_summary,
        market_position: analysis.market_position,
        target_audience: analysis.target_audience,
        competitive_advantages: analysis.competitive_advantages,
        brand_voice_profile: analysis.brand_voice_profile,
        growth_recommendations: analysis.growth_recommendations,
        knowledge_entries: [...(intel.knowledge_entries as any[] || []), ...newInsights],
        last_analyzed_at: new Date().toISOString(),
        analysis_count: (intel.analysis_count || 0) + 1,
        cultural_insights: analysis.cultural_insights || {},
        globallink_recommendations: analysis.globallink_recommendations || [],
        localization_readiness_score: analysis.cultural_insights?.global_readiness_score || 0,
      })
      .eq('id', intel.id);

    // Mark job complete
    await supabase
      .from('brand_intelligence_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        result: { success: true, analysis, insights_added: newInsights.length },
      })
      .eq('id', jobId);

    return new Response(JSON.stringify({ success: true, insights_added: newInsights.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[analysis-worker] Error:", error);
    
    const { jobId } = await req.json().catch(() => ({}));
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
