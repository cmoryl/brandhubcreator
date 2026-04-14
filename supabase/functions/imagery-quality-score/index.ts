import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrls, entityId, entityType } = await req.json();
    if (!imageUrls?.length) throw new Error("imageUrls array is required");
    if (imageUrls.length > 10) throw new Error("Maximum 10 images per batch");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get brand context for alignment scoring
    let brandContext = "";
    if (entityId && entityType) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.rpc("get_entity_text_context", {
        p_table: entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events",
        p_id: entityId,
      });
      if (data) {
        const ctx = data as any;
        brandContext = `Brand: ${ctx.name || ""}. Archetype: ${ctx.archetype || ""}. Colors: ${JSON.stringify(ctx.colors || [])}.`;
      }
    }

    const imageContent = imageUrls.map((url: string, i: number) => ([
      { type: "text" as const, text: `Image ${i + 1}:` },
      { type: "image_url" as const, image_url: { url } },
    ])).flat();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an image quality analyst for brand management. Score each image on:
- resolution: Image clarity and sharpness (0-100)
- composition: Visual composition quality (0-100)
- brandAlignment: How well it fits the brand identity (0-100)
- technicalQuality: Technical aspects like noise, exposure, focus (0-100)
${brandContext ? `\nBrand context: ${brandContext}` : ""}
Provide a brief note for each image explaining key observations.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Score these ${imageUrls.length} images for quality and brand alignment.` },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "image_quality_scores",
              description: "Return quality scores for each image",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "0-based image index" },
                        overall: { type: "number", description: "Overall score 0-100" },
                        resolution: { type: "number" },
                        composition: { type: "number" },
                        brandAlignment: { type: "number" },
                        technicalQuality: { type: "number" },
                        notes: { type: "string", description: "Brief quality assessment" },
                        flags: {
                          type: "array",
                          items: { type: "string" },
                          description: "Quality flags like 'low-resolution', 'poor-composition', 'off-brand'",
                        },
                      },
                      required: ["index", "overall", "resolution", "composition", "brandAlignment", "technicalQuality", "notes"],
                    },
                  },
                },
                required: ["scores"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "image_quality_scores" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { scores: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Quality scoring error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
