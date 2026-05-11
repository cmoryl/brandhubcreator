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
    const { division_id, division_name, variant_label, colors } = body;

    if (!division_id) throw new Error("Missing division_id");
    if (!colors || !Array.isArray(colors) || colors.length === 0) throw new Error("No colors to analyze");

    console.log(`Analyzing ${colors.length} colors for ${division_name || division_id} variant=${variant_label || 'shared'}`);

    const prompt = `You are a professional color strategist and exhibition design expert. Analyze this booth color palette for "${division_name || division_id}"${variant_label ? ` (${variant_label} variant)` : ''}.

Colors: ${colors.join(', ')}

Provide a comprehensive analysis covering:

1. **Overall Assessment** (score 0-100): How effective is this palette for trade show booth use?
2. **Accessibility** (score 0-100): WCAG contrast ratios between key pairs, readability on booth panels
3. **Production Suitability** (score 0-100): Print compatibility (CMYK gamut), large-format considerations, material constraints
4. **Color Psychology**: Emotional associations, industry appropriateness, audience impact
5. **Harmony Analysis**: Color relationships (complementary, analogous, triadic), balance assessment
6. **Contrast Pairs**: Best foreground/background combinations for booth signage
7. **Color Code Conversions**: For EVERY color in the palette, provide the full set of color codes: HEX, RGB (r,g,b), CMYK (c,m,y,k percentages), and the closest Pantone match name
8. **Recommendations**: Specific actionable improvements

Use the analyze_colors tool to return structured results.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_colors",
              description: "Return structured color analysis results",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "integer", description: "Overall palette effectiveness score 0-100" },
                  accessibility_score: { type: "integer", description: "WCAG accessibility score 0-100" },
                  production_score: { type: "integer", description: "Print/production suitability score 0-100" },
                  summary: { type: "string", description: "2-3 sentence overall assessment" },
                  harmony_type: { type: "string", description: "Color harmony type (e.g., complementary, analogous, triadic, split-complementary)" },
                  harmony_notes: { type: "string", description: "Notes on color harmony and balance" },
                  psychology: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        color: { type: "string", description: "Hex color" },
                        emotion: { type: "string", description: "Primary emotional association" },
                        industry_fit: { type: "string", description: "How well it fits trade show/exhibition context" },
                        notes: { type: "string", description: "Additional psychological notes" },
                      },
                      required: ["color", "emotion", "industry_fit"],
                    },
                    description: "Psychology analysis per color",
                  },
                  contrast_pairs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        foreground: { type: "string", description: "Foreground hex color" },
                        background: { type: "string", description: "Background hex color" },
                        ratio: { type: "number", description: "Approximate contrast ratio" },
                        wcag_aa: { type: "boolean", description: "Passes WCAG AA for normal text" },
                        wcag_aaa: { type: "boolean", description: "Passes WCAG AAA" },
                        use_case: { type: "string", description: "Recommended use case (e.g., headings, body text, signage)" },
                      },
                      required: ["foreground", "background", "ratio", "wcag_aa"],
                    },
                    description: "Best contrast pairs for booth signage",
                  },
                  production_notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        color: { type: "string", description: "Hex color code including # prefix" },
                        hex: { type: "string", description: "HEX color code (e.g. #1A2B3C)" },
                        rgb: { type: "string", description: "RGB values as 'R, G, B' (e.g. '26, 43, 60')" },
                        cmyk: { type: "string", description: "CMYK percentages as 'C, M, Y, K' (e.g. '57, 28, 0, 76')" },
                        pantone: { type: "string", description: "Closest Pantone color match name (e.g. 'Pantone 289 C')" },
                        cmyk_safe: { type: "boolean", description: "Whether the color reproduces well in CMYK" },
                        large_format_notes: { type: "string", description: "Notes for large-format printing" },
                        material_notes: { type: "string", description: "Notes about material/substrate considerations" },
                      },
                      required: ["color", "hex", "rgb", "cmyk", "pantone", "cmyk_safe"],
                    },
                    description: "Production suitability and color codes per color",
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Recommendation title" },
                        description: { type: "string", description: "Detailed recommendation" },
                        priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority level" },
                        suggested_color: { type: "string", description: "Optional suggested replacement hex color" },
                      },
                      required: ["title", "description", "priority"],
                    },
                    description: "Actionable improvement recommendations",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key strengths of the palette",
                  },
                },
                required: ["overall_score", "accessibility_score", "production_score", "summary", "harmony_type", "psychology", "contrast_pairs", "recommendations", "strengths"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_colors" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
      if (aiResponse.status === 402) throw new Error("AI credits exhausted.");
      throw new Error("AI color analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No analysis returned from AI");

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI analysis response");
    }

    const targetVariant = variant_label || null;
    const coalesced = variant_label || '';

    // Check existing
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/booth_color_analyses?division_id=eq.${encodeURIComponent(division_id)}&select=id,variant_label`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();
    const match = Array.isArray(existing) ? existing.find((e: Record<string, unknown>) => (e.variant_label || '') === coalesced) : null;

    const payload = {
      colors,
      analysis_data: {
        summary: result.summary,
        harmony_type: result.harmony_type,
        harmony_notes: result.harmony_notes,
        contrast_pairs: result.contrast_pairs,
        production_notes: result.production_notes,
        strengths: result.strengths,
      },
      overall_score: result.overall_score,
      accessibility_score: result.accessibility_score,
      production_score: result.production_score,
      psychology_data: result.psychology,
      recommendations: result.recommendations,
    };

    let saveRes: Response;
    if (match) {
      saveRes = await fetch(
        `${SUPABASE_URL}/rest/v1/booth_color_analyses?id=eq.${match.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );
    } else {
      saveRes = await fetch(`${SUPABASE_URL}/rest/v1/booth_color_analyses`, {
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
          created_by: user.id,
          ...payload,
        }),
      });
    }

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Save analysis error:", errText);
      throw new Error("Failed to save color analysis");
    }

    return new Response(
      JSON.stringify({ success: true, ...payload }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("booth-color-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
