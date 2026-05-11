import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, entityId, entityType } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI to analyze the image and generate search descriptors
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          {
            role: "system",
            content: `You are a visual search assistant. Analyze the provided image and return descriptors that can be used to find visually similar images on stock photo platforms. Focus on: visual style, color palette, composition, subject matter, mood/atmosphere, lighting, and textures.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and provide search descriptors for finding visually similar images." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "visual_search_descriptors",
              description: "Return structured visual descriptors for finding similar images",
              parameters: {
                type: "object",
                properties: {
                  searchQueries: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 optimized search queries for stock photo platforms",
                  },
                  dominantColors: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 dominant hex colors in the image",
                  },
                  style: { type: "string", description: "Visual style (e.g., minimal, dramatic, warm, editorial)" },
                  mood: { type: "string", description: "Overall mood/atmosphere" },
                  subject: { type: "string", description: "Primary subject matter" },
                  composition: { type: "string", description: "Composition type (e.g., centered, rule-of-thirds, symmetrical)" },
                  lighting: { type: "string", description: "Lighting style (e.g., natural, studio, golden hour)" },
                  suggestedFilters: {
                    type: "object",
                    properties: {
                      orientation: { type: "string", enum: ["horizontal", "vertical", "square"] },
                      imageType: { type: "string", enum: ["photo", "illustration", "vector"] },
                      colorHex: { type: "string", description: "Dominant color hex for filtering" },
                    },
                  },
                },
                required: ["searchQueries", "dominantColors", "style", "mood", "subject"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "visual_search_descriptors" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const descriptors = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ descriptors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Visual search error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
