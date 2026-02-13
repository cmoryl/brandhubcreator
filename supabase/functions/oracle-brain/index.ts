/**
 * Oracle Brain - Master Organization Intelligence
 * Acts as a strategic router that synthesizes all entity brains
 * into unified org-level intelligence
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
    // Verify JWT manually
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check AI permissions
    const { data: canUse } = await supabase.rpc("can_use_ai_features", {
      _user_id: user.id,
    });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, organizationId } = body;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Add Knowledge Entry ----
    if (action === "add_knowledge") {
      const { title, content, contentType, tags } = body;
      if (!title || !content) {
        return new Response(JSON.stringify({ error: "title and content required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.from("oracle_knowledge_base").insert({
        organization_id: organizationId,
        title,
        content,
        content_type: contentType || "text",
        source_type: "manual",
        tags: tags || [],
        created_by: user.id,
      }).select("id").single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Delete Knowledge Entry ----
    if (action === "delete_knowledge") {
      const { knowledgeId } = body;
      const { error } = await supabase.from("oracle_knowledge_base")
        .delete().eq("id", knowledgeId).eq("organization_id", organizationId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Get Oracle Context (Router) ----
    if (action === "get_context") {
      const { entityId, entityType } = body;
      
      // Fetch oracle intelligence
      const { data: oracle } = await supabase.from("oracle_intelligence")
        .select("*").eq("organization_id", organizationId).maybeSingle();

      // Fetch relevant knowledge entries
      const { data: knowledge } = await supabase.from("oracle_knowledge_base")
        .select("title, content, tags, content_type")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({
        oracle: oracle || null,
        knowledge: knowledge || [],
        entityContext: { entityId, entityType },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Synthesize (Full Oracle Analysis) ----
    if (action === "synthesize") {
      // Create a job
      const { data: job, error: jobError } = await supabase.from("oracle_jobs").insert({
        organization_id: organizationId,
        job_type: "synthesis",
        status: "pending",
        triggered_by: user.id,
      }).select("id").single();

      if (jobError) throw jobError;

      // Trigger background worker
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(
        processOracleSynthesis(supabase, lovableApiKey, job.id, organizationId)
      );

      return new Response(JSON.stringify({ success: true, job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[oracle-brain] Error:", error);
    const status = (error as any)?.status === 429 ? 429 : (error as any)?.status === 402 ? 402 : 500;
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Background synthesis processor
 */
async function processOracleSynthesis(
  supabase: any,
  apiKey: string,
  jobId: string,
  organizationId: string
) {
  try {
    await supabase.from("oracle_jobs").update({
      status: "processing", started_at: new Date().toISOString(), progress: 10
    }).eq("id", jobId);

    // 1. Gather all entity brains for this org
    const { data: brains } = await supabase.from("brand_intelligence")
      .select("entity_type, entity_id, brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, cultural_insights, localization_readiness_score, competitive_landscape, learning_context")
      .eq("organization_id", organizationId);

    // 2. Gather entity names
    const [{ data: brands }, { data: products }, { data: events }] = await Promise.all([
      supabase.from("brands").select("id, name").eq("organization_id", organizationId),
      supabase.from("products").select("id, name").eq("organization_id", organizationId),
      supabase.from("events").select("id, name").eq("organization_id", organizationId),
    ]);

    const nameMap: Record<string, string> = {};
    for (const b of (brands || [])) nameMap[b.id] = b.name;
    for (const p of (products || [])) nameMap[p.id] = p.name;
    for (const e of (events || [])) nameMap[e.id] = e.name;

    // 3. Gather knowledge base
    const { data: knowledge } = await supabase.from("oracle_knowledge_base")
      .select("title, content, content_type, tags")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .limit(30);

    await supabase.from("oracle_jobs").update({ progress: 30 }).eq("id", jobId);

    // 4. Compile context for AI
    const brainSummaries = (brains || []).map((b: any) => {
      const name = nameMap[b.entity_id] || "Unknown";
      return `${b.entity_type.toUpperCase()}: ${name}
Summary: ${b.brand_summary || "N/A"}
Position: ${b.market_position || "N/A"}
Advantages: ${Array.isArray(b.competitive_advantages) ? b.competitive_advantages.join(", ") : "N/A"}
Voice: ${b.brand_voice_profile?.communication_style || b.brand_voice_profile?.style || "N/A"}
Readiness: ${b.localization_readiness_score || "N/A"}%`;
    }).join("\n\n");

    const knowledgeContext = (knowledge || []).map((k: any) => 
      `[${k.content_type}] ${k.title}: ${k.content.slice(0, 300)}`
    ).join("\n");

    const entityCounts = {
      brands: (brands || []).length,
      products: (products || []).length,
      events: (events || []).length,
      brains: (brains || []).length,
    };

    await supabase.from("oracle_jobs").update({ progress: 40 }).eq("id", jobId);

    // 5. AI Synthesis
    const prompt = `You are the Master Oracle Brain for an organization. Synthesize ALL entity intelligence into unified org-level strategic insights.

ENTITY PORTFOLIO (${entityCounts.brands} brands, ${entityCounts.products} products, ${entityCounts.events} events, ${entityCounts.brains} analyzed):
${brainSummaries || "No entity brains available yet."}

KNOWLEDGE BASE (${(knowledge || []).length} entries):
${knowledgeContext || "No knowledge entries yet."}

Analyze portfolio synergies, gaps, conflicts, and strategic opportunities. Return ONLY valid JSON:
{"org_summary":"3-4 sentences synthesizing org identity and strategic direction","portfolio_analysis":{"synergies":["up to 4 cross-entity synergies"],"gaps":["up to 3 portfolio gaps"],"conflicts":["brand conflicts or cannibalization risks"],"recommendations":["up to 3 portfolio-level recs"]},"market_landscape":{"overall_position":"1-2 sentences","market_opportunities":["up to 3"],"threats":["up to 2"],"differentiation":"1 sentence"},"strategic_recommendations":[{"priority":"high|medium|low","recommendation":"actionable rec","rationale":"why","impact":"expected impact"}],"cross_entity_patterns":{"voice_consistency":"1 sentence assessment","audience_overlap":"1 sentence","visual_coherence":"1 sentence","messaging_alignment":"1 sentence"},"unified_voice_profile":{"primary_tone":"1-2 words","secondary_tones":["up to 3"],"communication_style":"1 sentence","personality_traits":["up to 4"]},"unified_audience_map":{"primary_segment":"1 sentence","secondary_segments":["up to 3"],"underserved_segments":["up to 2"]},"competitive_overview":{"market_position":"1 sentence","key_competitors":["up to 3"],"competitive_moat":"1 sentence"},"cultural_readiness":{"overall_score":50,"strongest_markets":["up to 3"],"expansion_opportunities":["up to 3"],"localization_gaps":["up to 2"]}}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[oracle] AI error:", aiResponse.status, errText.slice(0, 200));
      throw new Error(`AI synthesis failed: ${aiResponse.status}`);
    }

    await supabase.from("oracle_jobs").update({ progress: 70 }).eq("id", jobId);

    const responseText = await aiResponse.text();
    let content = "";
    try {
      const parsed = JSON.parse(responseText);
      content = parsed.choices?.[0]?.message?.content || "";
    } catch {
      throw new Error("Failed to parse AI response");
    }

    // Extract JSON
    let synthesis: any;
    try {
      synthesis = JSON.parse(content.trim());
    } catch {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        synthesis = JSON.parse((jsonMatch?.[1] || jsonMatch?.[0] || content).trim());
      } catch {
        console.error("[oracle] JSON parse error:", content.slice(0, 200));
        synthesis = {
          org_summary: "Organization intelligence synthesis completed.",
          portfolio_analysis: { synergies: [], gaps: [], conflicts: [], recommendations: [] },
          strategic_recommendations: [],
          cross_entity_patterns: {},
          unified_voice_profile: {},
          unified_audience_map: {},
          competitive_overview: {},
          cultural_readiness: { overall_score: 50 },
          market_landscape: {},
        };
      }
    }

    await supabase.from("oracle_jobs").update({ progress: 85 }).eq("id", jobId);

    // 6. Upsert oracle intelligence
    const { data: existing } = await supabase.from("oracle_intelligence")
      .select("id, synthesis_count").eq("organization_id", organizationId).maybeSingle();

    const oracleData = {
      organization_id: organizationId,
      org_summary: synthesis.org_summary || null,
      portfolio_analysis: synthesis.portfolio_analysis || {},
      market_landscape: synthesis.market_landscape || {},
      strategic_recommendations: synthesis.strategic_recommendations || [],
      cross_entity_patterns: synthesis.cross_entity_patterns || {},
      unified_voice_profile: synthesis.unified_voice_profile || {},
      unified_audience_map: synthesis.unified_audience_map || {},
      competitive_overview: synthesis.competitive_overview || {},
      cultural_readiness: synthesis.cultural_readiness || {},
      knowledge_entry_count: (knowledge || []).length,
      entity_brain_count: (brains || []).length,
      last_synthesis_at: new Date().toISOString(),
      synthesis_count: (existing?.synthesis_count || 0) + 1,
    };

    if (existing) {
      await supabase.from("oracle_intelligence").update(oracleData).eq("id", existing.id);
    } else {
      await supabase.from("oracle_intelligence").insert(oracleData);
    }

    // Mark job complete
    await supabase.from("oracle_jobs").update({
      status: "completed",
      progress: 100,
      completed_at: new Date().toISOString(),
      result: { success: true, summary: synthesis.org_summary?.slice(0, 200) },
    }).eq("id", jobId);

  } catch (error) {
    console.error("[oracle] Synthesis error:", error);
    await supabase.from("oracle_jobs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : "Unknown error",
    }).eq("id", jobId);
  }
}
