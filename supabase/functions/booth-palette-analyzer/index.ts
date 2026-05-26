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
    const user = await userRes.json();

    const body = await req.json();
    const { division_id, division_name, variant_label, image_urls } = body;

    if (!division_id) throw new Error("Missing division_id");
    if (!image_urls || !image_urls.length) throw new Error("No images to analyze");

    console.log(`Analyzing ${image_urls.length} images for division: ${division_name || division_id}`);

    // Build image content for the vision model — send up to 4 images
    const imageContent: any[] = [];
    const imagesToAnalyze = image_urls.slice(0, 4);

    for (const url of imagesToAnalyze) {
      imageContent.push({
        type: "image_url",
        image_url: { url },
      });
    }

    imageContent.push({
      type: "text",
      text: `You are a professional exhibition designer and color strategist. Analyze these trade show booth images for "${division_name || division_id}" and extract an optimal 6-color palette.

Requirements:
1. Extract the 6 most impactful and representative colors from these booth images
2. The palette should include: a primary brand color, a secondary accent, a dark tone, a mid-tone, and two complementary or supporting colors
3. Colors should work well together for booth graphics, signage, and printed materials
4. Consider contrast ratios for readability on booth panels
5. Return colors as hex values

Use the extract_palette tool to return the results.`,
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: imageContent,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_palette",
              description: "Return the extracted 6-color palette from booth images",
              parameters: {
                type: "object",
                properties: {
                  colors: {
                    type: "array",
                    items: { type: "string", description: "Hex color value like #1A2B3C" },
                    description: "Exactly 6 hex color values extracted from the booth images",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why these colors were chosen",
                  },
                },
                required: ["colors", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_palette" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted. Please add funds.");
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI palette analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No palette returned from AI");

    let result: { colors: string[]; reasoning: string };
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI palette response");
    }

    // Ensure exactly 6 colors
    const colors = result.colors
      .map((c: string) => c.startsWith("#") ? c : `#${c}`)
      .slice(0, 6);

    while (colors.length < 6) {
      colors.push("#888888");
    }

    console.log(`Extracted palette for ${division_name}:`, colors);

    // Upsert to booth_color_palettes — use division_id match since unique constraint is on division_id
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/booth_color_palettes?division_id=eq.${encodeURIComponent(division_id)}&select=id,variant_label`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();
    const targetVariant = variant_label || null;
    const match = Array.isArray(existing) ? existing.find((e: any) => e.variant_label === targetVariant) : null;

    let saveRes: Response;
    if (match) {
      saveRes = await fetch(
        `${SUPABASE_URL}/rest/v1/booth_color_palettes?id=eq.${match.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            colors,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } else if (Array.isArray(existing) && existing.length > 0 && !targetVariant) {
      // Update the existing row if same division, no variant
      saveRes = await fetch(
        `${SUPABASE_URL}/rest/v1/booth_color_palettes?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            colors,
            variant_label: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } else {
      saveRes = await fetch(`${SUPABASE_URL}/rest/v1/booth_color_palettes`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          division_id,
          variant_label: targetVariant,
          colors,
          created_by: user.id,
        }),
      });
    }

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Save palette error:", errText);
      throw new Error("Failed to save palette");
    }

    return new Response(
      JSON.stringify({
        success: true,
        division_id,
        colors,
        reasoning: result.reasoning,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("booth-palette-analyzer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
