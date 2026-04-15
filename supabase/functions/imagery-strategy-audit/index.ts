/**
 * Imagery Strategy Audit Edge Function
 * Scores entity imagery across 6 dimensions using inclusive heuristics
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { IMAGERY_STOP_GO } from "../_shared/inclusive-language-patterns.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user via service role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { entityId, entityType = "brand", organizationId } = await req.json();
    if (!entityId || !organizationId) {
      return new Response(JSON.stringify({ error: "entityId and organizationId required" }), { status: 400, headers: corsHeaders });
    }

    // Check AI permissions
    const { data: canUse } = await adminClient.rpc("can_use_ai_features", {
      _user_id: userId, _entity_id: entityId, _entity_type: entityType,
    });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403, headers: corsHeaders });
    }

    // Fetch entity context
    const { data: context } = await adminClient.rpc("get_entity_text_context", {
      p_table: entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events",
      p_id: entityId,
    });

    const entityName = context?.name || "Unknown";
    const imageryCount = context?.imagery_count || 0;
    const heroHasImage = context?.hero?.hasImage || false;
    const heroHasCover = context?.hero?.hasCover || false;
    const archetype = context?.archetype || "";
    const mission = context?.mission || "";
    const values = context?.values || [];
    const colorNames = context?.colorNames || [];

    // Build AI prompt
    const prompt = `You are an expert brand imagery auditor specializing in inclusive visual storytelling.

Analyze this entity's imagery strategy and score across 6 dimensions (0-100 each):

ENTITY: "${entityName}" (${entityType})
Archetype: ${archetype}
Mission: ${mission}
Values: ${JSON.stringify(values)}
Colors: ${JSON.stringify(colorNames)}
Imagery assets count: ${imageryCount}
Has hero image: ${heroHasImage}
Has cover image: ${heroHasCover}

STOP SIGNALS TO DETECT:
${IMAGERY_STOP_GO.stop_signals.map(s => `- ${s}`).join("\n")}

GO SIGNALS TO LOOK FOR:
${IMAGERY_STOP_GO.go_signals.map(s => `- ${s}`).join("\n")}

ADDITIONAL STOP SIGNALS:
- Tokenistic representation — single "diverse" person in a group
- Stereotypical roles (e.g., gender-specific occupations)
- Exoticizing or "othering" cultural imagery
- Inspiration porn — disability used as motivational device
- Homogeneous groups presented as universal default
- AI-generated faces or bodies without disclosure

ADDITIONAL GO SIGNALS:
- Authentic, candid moments over posed stock imagery
- Diverse age, ethnicity, gender, body type, and ability representation
- Contextual storytelling — people in real environments
- Inclusive family structures and relationship dynamics
- Cultural dress and traditions depicted respectfully

Based on available brand data, provide scores and analysis. If imagery data is limited, score based on brand positioning readiness.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500, headers: corsHeaders });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a brand imagery auditor. Return structured JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "imagery_audit_result",
            description: "Return imagery audit scores and analysis",
            parameters: {
              type: "object",
              properties: {
                diversity_score: { type: "number", description: "0-100 score for diversity representation" },
                authenticity_score: { type: "number", description: "0-100 score for authentic vs stock imagery" },
                cultural_context_score: { type: "number", description: "0-100 score for cultural sensitivity" },
                action_orientation_score: { type: "number", description: "0-100 score for showing people doing things" },
                inclusive_prompting_score: { type: "number", description: "0-100 score for inclusive prompting compliance" },
                stock_dependency: { type: "string", enum: ["low", "medium", "high"], description: "Level of stock photo dependency" },
                stop_signals_detected: { type: "array", items: { type: "string" }, description: "Stop signals found" },
                go_signals_present: { type: "array", items: { type: "string" }, description: "Go signals present" },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      dimension: { type: "string" },
                    },
                    required: ["title", "description", "priority", "dimension"],
                  },
                },
              },
              required: ["diversity_score", "authenticity_score", "cultural_context_score", "action_orientation_score", "inclusive_prompting_score", "stock_dependency", "stop_signals_detected", "go_signals_present", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "imagery_audit_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), { status: 429, headers: corsHeaders });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: corsHeaders });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    // Calculate overall score
    const overall = Math.round(
      (result.diversity_score * 0.25) +
      (result.authenticity_score * 0.2) +
      (result.cultural_context_score * 0.2) +
      (result.action_orientation_score * 0.15) +
      (result.inclusive_prompting_score * 0.2)
    );

    // Persist to database
    const { data: audit, error: insertErr } = await adminClient
      .from("imagery_strategy_audits")
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId,
        overall_score: overall,
        diversity_score: result.diversity_score,
        authenticity_score: result.authenticity_score,
        cultural_context_score: result.cultural_context_score,
        action_orientation_score: result.action_orientation_score,
        inclusive_prompting_score: result.inclusive_prompting_score,
        stock_dependency: result.stock_dependency,
        stop_signals_detected: result.stop_signals_detected,
        go_signals_present: result.go_signals_present,
        recommendations: result.recommendations,
        images_analyzed: imageryCount,
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw new Error("Failed to save audit results");
    }

    return new Response(JSON.stringify({ success: true, audit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("imagery-strategy-audit error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
