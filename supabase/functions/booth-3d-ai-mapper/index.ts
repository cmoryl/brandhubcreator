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
    const { imageUrl, layout, panelIds, panelLabels } = body;

    if (!imageUrl) throw new Error("Missing imageUrl");
    if (!layout) throw new Error("Missing layout");
    if (!panelIds?.length) throw new Error("Missing panelIds");

    // Build the AI prompt for booth spec analysis
    const systemPrompt = `You are an expert trade show booth designer and production specialist. You analyze booth specification images and PDFs to identify individual panel designs, graphics, and content areas.

Your task: Analyze the provided booth specification image and determine how to map the visual content onto the 3D booth panels.

The booth layout is: ${layout}
Available panels: ${panelLabels.map((l: string, i: number) => `"${panelIds[i]}" (${l})`).join(", ")}

Instructions:
1. Examine the booth spec image carefully
2. Identify distinct panel sections, graphics, or design areas
3. Determine which part of the spec maps to which 3D panel
4. If the image shows a single panel design, assign it to the most prominent panel (usually "back")
5. If it shows multiple panels (e.g., a U-shape or island layout), map each section accordingly

Respond ONLY with valid JSON in this exact format:
{
  "assignments": [
    {
      "panelId": "back",
      "description": "Main branding wall with company logo and tagline",
      "useFullImage": true
    }
  ],
  "boothDescription": "Brief description of what the booth spec shows",
  "designNotes": "Any production notes or observations about the spec",
  "suggestedLayout": "${layout}"
}

Rules:
- "panelId" must be one of: ${panelIds.join(", ")}
- Set "useFullImage" to true if the uploaded image should be used as-is for that panel
- If the spec shows distinct sections for different panels, describe each in "description"
- "suggestedLayout" can differ from current layout if the spec better fits another configuration`;

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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this booth specification image and determine panel assignments for a ${layout} booth layout with panels: ${panelLabels.join(", ")}.`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
      if (status === 402) throw new Error("AI credits exhausted. Please check your plan.");
      throw new Error(`AI request failed with status ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      result = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback: assign image to the back/main panel
      result = {
        assignments: [{ panelId: panelIds[0], description: "Full booth spec", useFullImage: true }],
        boothDescription: "Booth specification uploaded",
        designNotes: "AI analysis could not parse the spec. The image has been assigned to the primary panel.",
        suggestedLayout: layout,
      };
    }

    // Validate panel IDs in assignments
    if (Array.isArray(result.assignments)) {
      result.assignments = result.assignments.filter(
        (a: any) => panelIds.includes(a.panelId)
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booth-3d-ai-mapper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
