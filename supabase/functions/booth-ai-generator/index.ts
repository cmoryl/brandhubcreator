import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify JWT
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!userRes.ok) throw new Error("Unauthorized");

    const body = await req.json();
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string") throw new Error("Missing prompt");

    const systemPrompt = `You are an expert trade show booth designer. Given a natural language description, generate a complete booth configuration.

Available booth layouts:
- "inline" (10'×8' single wall)
- "inline-10x10" (10'×10' tall)
- "inline-10x20" (10'×20' double)
- "inline-10x30" (10'×30' triple)
- "l-shape" (10'×10' corner)
- "l-shape-10x20" (10'×20' corner)
- "u-shape" (10'×10' peninsula)
- "u-shape-10x20" (10'×20' peninsula)
- "t-shape-10x20" (10'×20' T-shape)
- "peninsula-20x20" (20'×20' three-sided)
- "island" (20'×20' freestanding)
- "island-20x30" (20'×30')
- "island-30x30" (30'×30')
- "island-40x40" (40'×40')

Available furniture asset IDs:
Tables: "table-6ft", "table-8ft", "table-6ft-covered", "table-8ft-covered", "counter-reception", "podium", "cocktail-table"
Displays: "tv-42", "tv-55", "tv-65", "tv-wall-42", "tv-wall-55"
Seating: "bar-stool", "lounge-chair"
Signage: "banner-stand", "banner-wide"
Accessories: "literature-rack", "kiosk-ipad"

Available lighting presets: "expo-bright", "showcase-dim", "warm-gallery", "cool-neutral"
Available flooring types: "carpet-plush", "carpet-berber", "vinyl-wood", "vinyl-concrete", "rubber-coin", "epoxy-metallic"

Conversion: 1 foot = 0.3048 meters. All positions are in meters. Y=0 is floor level.

Rules for placing furniture:
- Position [x, y, z]: x is left-right, y is height (usually 0 for floor items), z is front-back
- For inline/l-shape/u-shape booths, the back wall is at z=0, the open side faces positive z
- Place items within the booth footprint, not overlapping walls
- Demo stations should have a TV + table combo
- Reception areas need a counter or covered table
- Seating areas use lounge chairs or bar stools
- Keep pathways clear (at least 0.9m / 3ft between items)

Respond ONLY with valid JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a complete booth configuration for: "${prompt}"` },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        tools: [{
          type: "function",
          function: {
            name: "generate_booth",
            description: "Generate a complete trade show booth configuration from a text description",
            parameters: {
              type: "object",
              properties: {
                layout: {
                  type: "string",
                  description: "Booth layout type",
                  enum: ["inline", "inline-10x10", "inline-10x20", "inline-10x30", "l-shape", "l-shape-10x20", "u-shape", "u-shape-10x20", "t-shape-10x20", "peninsula-20x20", "island", "island-20x30", "island-30x30", "island-40x40"],
                },
                lighting: {
                  type: "string",
                  enum: ["expo-bright", "showcase-dim", "warm-gallery", "cool-neutral"],
                },
                flooring: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["carpet-plush", "carpet-berber", "vinyl-wood", "vinyl-concrete", "rubber-coin", "epoxy-metallic"] },
                    color: { type: "string", description: "Hex color for flooring" },
                  },
                  required: ["type", "color"],
                },
                furniture: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      assetId: { type: "string", description: "Furniture asset ID from catalog" },
                      position: {
                        type: "array",
                        items: { type: "number" },
                        description: "[x, y, z] position in meters",
                      },
                      rotation: {
                        type: "array",
                        items: { type: "number" },
                        description: "[x, y, z] rotation in radians. Use [0,0,0] for default orientation, [0, Math.PI/2, 0] for 90° turn, etc.",
                      },
                      label: { type: "string", description: "Optional label for the item" },
                    },
                    required: ["assetId", "position", "rotation"],
                  },
                },
                panelDescriptions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      panelId: { type: "string", description: "Panel ID (back, left, right, front, center-wing)" },
                      suggestion: { type: "string", description: "What should go on this panel" },
                    },
                    required: ["panelId", "suggestion"],
                  },
                },
                designNotes: { type: "string", description: "Brief design rationale and tips" },
                aesthetic: { type: "string", description: "The aesthetic style (e.g., modern tech, warm hospitality)" },
              },
              required: ["layout", "lighting", "flooring", "furniture", "panelDescriptions", "designNotes", "aesthetic"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_booth" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
      if (status === 402) throw new Error("AI credits exhausted. Please check your plan.");
      throw new Error(`AI request failed with status ${status}`);
    }

    const aiData = await aiResponse.json();

    // Extract tool call result
    let result;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        result = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        throw new Error("Failed to parse AI response");
      }
    } else {
      // Fallback: try to extract JSON from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return a valid booth configuration");
      }
    }

    // Validate furniture asset IDs
    const validAssets = new Set([
      "table-6ft", "table-8ft", "table-6ft-covered", "table-8ft-covered",
      "counter-reception", "podium", "cocktail-table",
      "tv-42", "tv-55", "tv-65", "tv-wall-42", "tv-wall-55",
      "bar-stool", "lounge-chair",
      "banner-stand", "banner-wide",
      "literature-rack", "kiosk-ipad",
    ]);

    if (Array.isArray(result.furniture)) {
      result.furniture = result.furniture.filter((f: any) => validAssets.has(f.assetId));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booth-ai-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
