// Edge function: gradient-ai-designer
// Uses Lovable AI Gateway (Gemini) to produce a StudioGradient JSON from a
// natural-language prompt. Caller may pass a brand palette to bias output.

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  prompt: string;
  palette?: string[];
  preferType?: "linear" | "radial" | "conic" | "mesh" | "any";
  recommendedText?: "light" | "dark" | "any";
}

const SYSTEM = `You are an expert brand designer who outputs ONLY valid JSON for a "StudioGradient" object.

Schema (TypeScript):
{
  "name": string,
  "type": "linear" | "radial" | "conic" | "mesh",
  "angle": number,                      // 0..360, used by linear/conic
  "shape": "ellipse" | "circle",        // radial only
  "size": "farthest-corner" | "closest-side" | "closest-corner" | "farthest-side",
  "position": { "x": number, "y": number }, // 0..100, radial/conic center
  "stops":  [{ "color": "#RRGGBB", "position": 0..100 }, ...],  // 2-5 entries for linear/radial/conic
  "meshPoints": [{ "color": "#RRGGBB", "x": 0..100, "y": 0..100 }, ...] // 3-6 entries; required ONLY for type=mesh
}

Rules:
- Output JSON ONLY, no prose, no markdown, no code fences.
- Use HEX colors only.
- If a brand palette is provided, prefer those exact colors unless the user asks for something different.
- If the user wants light text on the result, keep all colors dark enough that white text passes WCAG AA (luminance < 0.35).
- If they want dark text, keep colors light enough that #111 passes WCAG AA (luminance > 0.5).
- Default angle = 135 if unsure.
- For mesh type, always populate "meshPoints"; for other types, always populate "stops".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: RequestBody = await req.json();
    if (!body.prompt || typeof body.prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = [
      `User request: ${body.prompt}`,
      body.palette?.length ? `Brand palette (prefer these): ${body.palette.join(", ")}` : "",
      body.preferType && body.preferType !== "any" ? `Preferred type: ${body.preferType}` : "",
      body.recommendedText && body.recommendedText !== "any" ? `Recommended text on gradient: ${body.recommendedText}` : "",
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429 || aiRes.status === 402) {
      const code = aiRes.status === 429 ? "rate_limited" : "payment_required";
      return new Response(JSON.stringify({ error: code }), {
        status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_gateway_error", detail: txt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    return new Response(JSON.stringify({ gradient: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unhandled", detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
