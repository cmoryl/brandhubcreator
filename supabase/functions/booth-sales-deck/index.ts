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
      divisionName = "Trade Show Booth",
      layoutName = "inline",
      boothSize = "10x10",
      panelCount = 3,
      furnitureList = [],
      hasMonitors = false,
      panelLabels = [],
      variantLabel = "default",
      crowdScore,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a trade show booth sales deck content writer. Generate compelling, professional presentation slide content for a booth sales deck.

Return JSON using the tool provided. Each slide must have a headline (short, punchy) and 3-5 bullet points. Notes are optional speaker notes.

Context:
- Division/Brand: ${divisionName}
- Booth Layout: ${layoutName} (${boothSize})
- Number of graphic panels: ${panelCount}
- Panel labels: ${panelLabels.join(", ") || "Standard panels"}
- Furniture/assets: ${furnitureList.length > 0 ? furnitureList.join(", ") : "Standard setup"}
- Has monitors/screens: ${hasMonitors}
- Variant: ${variantLabel}
${crowdScore ? `- Crowd simulation visibility score: ${crowdScore}/100` : ""}

Generate exactly 7 slides:
1. overview: Booth Overview — high-level summary of the booth experience
2. perspective: Front Perspective — what visitors see approaching the booth
3. layout: Overhead Layout — spatial arrangement and flow
4. journey: Visitor Journey — the attendee experience from approach to departure
5. panels: Graphic Panels — the branded visual panels and messaging
6. hardware: Hardware Breakdown — monitors, furniture, lighting, structural elements
7. cost: Cost Estimate — estimated budget breakdown categories (use realistic ranges)`;

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
          { role: "user", content: `Generate the 7-slide sales deck content for the "${divisionName}" booth (${layoutName} ${boothSize}).` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_sales_deck",
            description: "Generate slide content for the booth sales deck",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Deck title" },
                subtitle: { type: "string", description: "Deck subtitle" },
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slideType: { type: "string", enum: ["overview", "perspective", "layout", "journey", "panels", "hardware", "cost"] },
                      title: { type: "string" },
                      headline: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                      notes: { type: "string" },
                    },
                    required: ["slideType", "title", "headline", "bullets"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "subtitle", "slides"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_sales_deck" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let deckData: any;

    // Extract from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      deckData = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content directly
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        deckData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify(deckData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booth-sales-deck error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
