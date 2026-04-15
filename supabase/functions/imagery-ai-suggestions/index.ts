import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Check AI access
    const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
    if (!canUse) throw new Error("AI features not available");

    const { entityId, entityType, existingSections } = await req.json();
    if (!entityId || !entityType) throw new Error("Missing entityId or entityType");

    // Fetch entity context + latest imagery strategy audit in parallel
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";
    const [contextRes, auditRes, actionsRes] = await Promise.all([
      supabase.rpc("get_entity_text_context", { p_table: tableName, p_id: entityId }),
      supabase
        .from("imagery_strategy_audits")
        .select("*")
        .eq("entity_id", entityId)
        .eq("entity_type", entityType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("competitive_recommendation_actions")
        .select("recommendation_title, recommendation_type, status")
        .eq("entity_id", entityId)
        .eq("entity_type", entityType)
        .eq("applied_to_imagery_hub", true),
    ]);

    const context = contextRes.data;
    const audit = auditRes.data;
    const approvedActions = actionsRes.data || [];

    // Build audit intelligence section for the prompt
    let auditContext = "";
    if (audit) {
      const stopSignals = Array.isArray(audit.stop_signals_detected) ? audit.stop_signals_detected : [];
      const goSignals = Array.isArray(audit.go_signals_present) ? audit.go_signals_present : [];
      const recommendations = Array.isArray(audit.recommendations) ? audit.recommendations : [];

      auditContext = `
IMAGERY STRATEGY AUDIT DATA (latest scores out of 100):
- Overall Score: ${audit.overall_score || 0}
- Diversity Score: ${audit.diversity_score || 0}
- Authenticity Score: ${audit.authenticity_score || 0}
- Cultural Context Score: ${audit.cultural_context_score || 0}
- Action Orientation Score: ${audit.action_orientation_score || 0}
- Inclusive Prompting Score: ${audit.inclusive_prompting_score || 0}
- Stock Dependency: ${audit.stock_dependency || "unknown"}
${stopSignals.length > 0 ? `\nSTOP SIGNALS DETECTED (imagery to AVOID):\n${stopSignals.map((s: string) => `- ${s}`).join("\n")}` : ""}
${goSignals.length > 0 ? `\nGO SIGNALS PRESENT (good patterns to continue):\n${goSignals.map((s: string) => `- ${s}`).join("\n")}` : ""}
${recommendations.length > 0 ? `\nAUDIT RECOMMENDATIONS:\n${recommendations.slice(0, 5).map((r: any) => `- [${r.priority || "medium"}] ${r.title}: ${r.description}`).join("\n")}` : ""}
`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an imagery curation expert. Based on this brand/entity context and its imagery strategy audit results, suggest 6-8 specific Shutterstock search queries that would find ideal stock imagery.

Entity: ${JSON.stringify(context || {})}
Existing imagery categories: ${(existingSections || []).join(", ") || "None"}
${auditContext}

Return a JSON array of search query strings. Your suggestions MUST:
- Directly address any low-scoring audit dimensions (diversity, authenticity, cultural context, action orientation, inclusive prompting)
- Fill gaps identified by audit recommendations
- AVOID imagery matching any detected Stop Signals
- Reinforce patterns matching Go Signals
- Consider stock dependency level — if "high", suggest queries for authentic/documentary-style imagery
- Brand identity and visual DNA
- Emotional tone matching the brand archetype
- Diverse and inclusive representation

Return ONLY a JSON array like: ["query1", "query2", ...]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse suggestions
    let suggestions: string[] = [];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = content.split("\n").filter((l: string) => l.trim()).slice(0, 8);
    }

    return new Response(JSON.stringify({
      suggestions,
      auditScore: audit?.overall_score ?? null,
      hasAudit: !!audit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("imagery-ai-suggestions error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
