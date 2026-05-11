import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandColors, iconCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const colorList = (brandColors || [])
      .map((c: { hex: string; name: string }) => `${c.name}: ${c.hex}`)
      .join(", ");

    const prompt = `You are a brand color expert. Given these brand colors: ${colorList || "no brand colors provided"}

Generate 3 creative icon color palettes for ${iconCount || 20} icons. Each palette should include:
1. A name (2-3 words)
2. A short description (under 15 words)
3. 4-6 hex colors that work well for icons (good contrast, legibility)
4. 1-2 gradient suggestions with stops (color + position%) and angle

Consider:
- Icon legibility at small sizes (16-48px)
- Brand consistency while offering creative variations
- One palette should be brand-native, one complementary, one bold/experimental

Return ONLY a JSON object with this structure:
{
  "palettes": [
    {
      "name": "Palette Name",
      "description": "Short description",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
      "gradients": [
        {
          "stops": [{"color": "#hex1", "position": 0}, {"color": "#hex2", "position": 100}],
          "angle": 135,
          "label": "Gradient Name"
        }
      ]
    }
  ]
}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite-preview",
          messages: [
            { role: "system", content: "You are a color expert for icon design. Return valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      // Try direct parse
      parsed = JSON.parse(content);
    } catch {
      // Try extracting from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-icon-colors error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
