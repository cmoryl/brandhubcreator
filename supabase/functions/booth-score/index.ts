import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "AI access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      layoutName = "inline",
      boothSize = "10x10",
      panelCount = 3,
      panelLabels = [],
      furnitureList = [],
      hasMonitors = false,
      hasGraphics = false,
      crowdScore,
      divisionName = "Booth",
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a trade show booth effectiveness evaluator. Analyze the booth configuration and return scores across 4 dimensions plus actionable suggestions.

Scoring rubric (0-100 each):
- Visibility: How visible is the booth from the aisle? Consider height, signage, screens, lighting.
- Traffic Flow: How well does the layout invite and manage visitor traffic? Open front, clear pathways, no bottlenecks.
- Brand Impact: How strong is the visual branding? Graphics coverage, color consistency, logo placement.
- Engagement Potential: How many interaction points? Demos, screens, seating, staff positions.

Overall = weighted average: Visibility(30%) + Traffic(25%) + Brand(25%) + Engagement(20%)

Booth Context:
- Layout: ${layoutName} (${boothSize})
- Panels: ${panelCount} (${panelLabels.join(", ") || "standard"})
- Furniture: ${furnitureList.length > 0 ? furnitureList.join(", ") : "minimal setup"}
- Has monitors: ${hasMonitors}
- Has graphics assigned: ${hasGraphics}
${crowdScore ? `- Crowd simulation score: ${crowdScore}/100` : ""}
- Division: ${divisionName}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Score this booth and provide 3 strengths and 3-5 improvement suggestions.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "evaluate_booth",
            description: "Return booth effectiveness scores and suggestions",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Weighted overall score 0-100" },
                visibility: { type: "number", description: "Visibility score 0-100" },
                trafficFlow: { type: "number", description: "Traffic flow score 0-100" },
                brandImpact: { type: "number", description: "Brand impact score 0-100" },
                engagementPotential: { type: "number", description: "Engagement potential score 0-100" },
                strengths: { type: "array", items: { type: "string" }, description: "3 key strengths" },
                suggestions: { type: "array", items: { type: "string" }, description: "3-5 improvement suggestions" },
              },
              required: ["overallScore", "visibility", "trafficFlow", "brandImpact", "engagementPotential", "strengths", "suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "evaluate_booth" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let scoreData: any;

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      scoreData = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scoreData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify(scoreData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booth-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
