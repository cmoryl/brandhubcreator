import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrls, existingSections, entityName } = await req.json();
    if (!imageUrls?.length) throw new Error("imageUrls is required");
    if (imageUrls.length > 20) throw new Error("Maximum 20 images per batch");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sectionNames = (existingSections || []).map((s: any) => s.name || s);

    const imageContent = imageUrls.map((url: string, i: number) => ([
      { type: "text" as const, text: `Image ${i + 1}:` },
      { type: "image_url" as const, image_url: { url } },
    ])).flat();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          {
            role: "system",
            content: `You are an image categorization assistant for brand asset management.
Given images and existing category names, suggest which category each image belongs to.
You may also suggest new categories if none fit.
${entityName ? `Entity: ${entityName}` : ""}
Existing categories: ${sectionNames.length ? sectionNames.join(", ") : "None yet"}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Categorize these ${imageUrls.length} images into the most appropriate sections.` },
              ...imageContent,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_images",
              description: "Return category assignments and suggested tags for each image",
              parameters: {
                type: "object",
                properties: {
                  assignments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "0-based image index" },
                        suggestedCategory: { type: "string", description: "Best matching existing category or new category name" },
                        isNewCategory: { type: "boolean", description: "True if suggesting a new category" },
                        confidence: { type: "number", description: "Confidence 0-100" },
                        suggestedTags: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-5 descriptive tags for the image",
                        },
                        reasoning: { type: "string", description: "Brief explanation of categorization" },
                      },
                      required: ["index", "suggestedCategory", "isNewCategory", "confidence", "suggestedTags"],
                    },
                  },
                },
                required: ["assignments"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_images" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { assignments: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Auto-categorize error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
