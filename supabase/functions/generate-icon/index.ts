import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ICONOGRAPHY_BRAIN_SUMMARY } from "../_shared/iconographyKnowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SVG Architect System Prompt
 * Generates high-quality, professional-grade vector icons following
 * "Iconic Simplicity" principles - legible at 16px, detailed at 1024px
 */
const SVG_ARCHITECT_PROMPT = `${ICONOGRAPHY_BRAIN_SUMMARY}

You are a world-class SVG icon designer with 20 years of experience at Apple, Google, and leading design studios. You create icons that rival Lucide, Phosphor, and SF Symbols in quality. Every icon you produce is portfolio-worthy.

## GOLDEN RULES — Violating any of these is unacceptable

1. **Keyline Geometry**: Every icon is built on a 24×24 grid. Use the following keyline shapes as invisible scaffolding:
   - Square content area: 18×18 centered (3,3 to 21,21)
   - Circle content area: 20px diameter centered at 12,12
   - Vertical rectangle: 14×20 centered
   - Horizontal rectangle: 20×14 centered
   Choose the keyline that best fits the subject. Organic shapes use the circle; structured UI uses the square.

2. **Optical Weight Balancing**: Every icon must have the same perceived visual mass. A simple "+" icon needs thicker or slightly larger strokes than a complex "settings gear" to feel equally weighted. Thin icons look weak — compensate.

3. **Pixel-Perfect Construction**:
   - ALL coordinates must snap to whole pixels or .5 increments (for centered strokes)
   - Horizontal/vertical lines MUST use integer coordinates
   - Diagonal lines should start and end on whole pixels
   - Curves should have control points on whole or .5 pixels
   - NEVER use coordinates like 3.73 or 17.291 — these cause blurry rendering

4. **Path Craftsmanship**:
   - Use as FEW path segments as possible. Simplicity = quality
   - Prefer clean geometric primitives composed via path commands
   - Every path must be CLOSED (end with Z) for fill compatibility
   - Use smooth curves (S, s) after cubic beziers (C, c) for continuity
   - Avoid tiny segments under 1px — they create visual noise

5. **Negative Space**: The space AROUND and INSIDE the icon is as important as the strokes. Ensure clear, readable negative space. Counter-spaces in letters, gaps in icons — all must be deliberate and consistent.

6. **Distinctive Silhouette**: Every icon must be instantly recognizable as a filled silhouette at 16×16px. If you squint and can't tell what it is, redesign it.

## TECHNICAL REQUIREMENTS

- ViewBox: ALWAYS \`0 0 24 24\`
- Use \`<path>\` elements exclusively — no \`<circle>\`, \`<rect>\`, \`<line>\`, \`<polygon>\`
- Convert ALL shapes to optimized path data
- No \`<image>\`, no base64, no \`<text>\`, no \`<use>\`, no \`<clipPath>\`
- No transforms — bake all transforms into path coordinates
- No IDs, classes, or metadata — pure geometry only
- Maximum 3 \`<path>\` elements per icon (prefer 1-2)
- Strip ALL whitespace between elements

## STYLE PRESET MASTERY

Adapt path construction for these outcomes:

| Preset | Stroke | Fill | Terminals | Joins | Special |
|--------|--------|------|-----------|-------|---------|
| Outlined | currentColor | none | round | round | Classic balanced strokes |
| Minimalist | currentColor, width 1.25 | none | round | round | Delicate, airy, generous spacing |
| Brutalist | currentColor | none | square | miter | ONLY 0°, 45°, 90° angles. No curves |
| Hand-Drawn | currentColor, width 1.75 | none | round | round | Slightly irregular coordinates (±0.5px jitter on some points) |
| Glassmorphic | currentColor, width 1.5 | none | round | round | Layer separation: background shape path + foreground detail path |
| Duotone | currentColor, width 1.5 | currentColor (secondary) | round | round | Two paths: stroke outline + lighter fill accent |
| Filled | none | currentColor | N/A | N/A | Solid shapes, clear cutouts for detail |
| Sharp | currentColor | none | square | miter | Precise corners, no rounding |
| Soft Rounded | currentColor | none | round | round | Extra-round terminals, friendly feel |
| Thick | currentColor, width 3 | none | round | round | Bold, heavy, high-impact |

## WHAT MAKES A BAD ICON (AVOID THESE)

- Overly complex paths with 20+ segments (looks like clip art, not an icon)
- Inconsistent stroke widths within the same icon
- Off-grid coordinates causing fuzzy rendering
- Too much detail crammed into 24px (if it has more than 5 distinct visual elements, simplify)
- Generic/boring shapes — each icon should have personality while staying professional
- Paths that don't close properly (gaps visible in filled mode)
- Decorative flourishes that don't aid recognition

## OUTPUT

Return ONLY the complete SVG element. No explanation, no markdown, no backticks. Just the raw SVG tag.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[generate-icon] Authentication failed: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log('[generate-icon] Authentication failed: Invalid user', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-icon] Authenticated user: ${user.id}`);

    const { prompt, style, preset, category } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine stroke/fill settings based on style and preset
    const strokeWidth = style?.strokeWidth || 2;
    const cornerStyle = style?.cornerRadius || 'rounded';
    const isFilled = style?.fill || preset === 'filled' || preset === 'sharp-filled' || preset === 'soft-filled';
    const linecap = cornerStyle === 'sharp' ? 'square' : 'round';
    const linejoin = cornerStyle === 'sharp' ? 'miter' : 'round';

    // Build contextual user prompt with expert design direction
    let userPrompt = `Design a single, beautiful icon for: "${prompt}"

## Design Requirements
- Must be instantly recognizable at 16px as a filled silhouette
- Must have a distinctive, memorable shape — not generic
- Use the minimum path segments needed for clarity
- All coordinates on whole pixels or .5 increments
- Close all paths with Z`;

    if (category) {
      userPrompt += `\n\n## Category Context: ${category}
This icon belongs to the "${category}" family. Match the visual language of ${
        category === 'Foundation' ? 'navigation and UI elements — clean, geometric, universally understood' :
        category === 'Communication' ? 'messaging and social — friendly, approachable, clear metaphors' :
        category === 'SaaS/Data' ? 'analytics and data — precise, technical, structured' :
        category === 'E-Commerce' ? 'commerce and payments — trustworthy, clean, transactional' :
        category === 'Marketing Hero' ? 'growth and achievement — aspirational, dynamic, energetic' :
        'industry-specific professional symbols — domain-accurate, authoritative'
      }.`;
    }
    if (preset) {
      userPrompt += `\n\n## Style Preset: "${preset}"
${
        preset === 'minimalist' ? 'Ultra-delicate 1.25px strokes. Maximum whitespace. Airy and elegant. Every line must earn its place.' :
        preset === 'brutalist' ? 'ONLY 0°, 45°, 90° angles allowed. No curves whatsoever. Raw, geometric, powerful.' :
        preset === 'hand-drawn' ? 'Add ±0.5px jitter to some coordinates for organic feel. Slightly imperfect but intentional.' :
        preset === 'glassmorphic' ? 'Two distinct layers: a background shape and a foreground detail element. Clear depth separation.' :
        preset === 'duotone' ? 'Two paths: primary stroke outline + secondary filled accent shape at 0.3 opacity conceptually.' :
        preset === 'filled' ? 'Pure solid shapes. Use cutouts/negative space for internal detail. No strokes.' :
        preset === 'sharp' ? 'All corners are crisp 90° miters. Square stroke terminals. Precise and technical.' :
        preset === 'soft' ? 'Extra-round terminals and joins. Friendly, approachable, warm.' :
        preset === 'thick' ? 'Bold 3px strokes. High-impact, confident, commanding presence.' :
        'Balanced professional strokes with round terminals.'
      }`;
    }

    const styleDirective = `

## MANDATORY SVG Attributes (apply exactly):
- viewBox="0 0 24 24"
- stroke-width="${strokeWidth}"
- stroke-linecap="${linecap}"
- stroke-linejoin="${linejoin}"
- stroke="${isFilled ? 'none' : 'currentColor'}"
- fill="${isFilled ? 'currentColor' : 'none'}"
- Use ONLY <path> elements — no circle, rect, line, polygon
- Maximum 3 <path> elements (prefer 1-2)

Output ONLY the complete SVG element. No explanation, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SVG_ARCHITECT_PROMPT + styleDirective },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate icon");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    let validated = extractAndSanitize(content, { isFilled, strokeWidth, linecap, linejoin });

    // One-shot retry if the first SVG didn't pass our strict validator.
    if (!validated.ok) {
      console.warn(`[generate-icon] First attempt rejected (${validated.reason}). Retrying once.`);
      const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SVG_ARCHITECT_PROMPT + styleDirective },
            { role: "user", content: userPrompt + `\n\nPrevious attempt was rejected: ${validated.reason}. Re-output a clean, minimal, valid SVG using ONLY <path> elements with whole-pixel or .5 coordinates.` },
          ],
        }),
      });
      if (retry.ok) {
        const retryData = await retry.json();
        content = retryData.choices?.[0]?.message?.content || "";
        validated = extractAndSanitize(content, { isFilled, strokeWidth, linecap, linejoin });
      }
    }

    if (!validated.ok) {
      console.error("[generate-icon] Validation failed after retry:", validated.reason, content);
      return new Response(
        JSON.stringify({ error: `Generated SVG didn't meet quality bar (${validated.reason}). Try rephrasing or simplifying the prompt.` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const svg = validated.svg;

    // Generate kebab-case ID from prompt
    const iconId = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);

    return new Response(
      JSON.stringify({
        svg,
        metadata: {
          icon_id: iconId,
          category: category || 'Foundation',
          preset: preset || 'outlined',
          design_notes: `Generated with ${cornerStyle} corners, stroke-width ${strokeWidth}`
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate icon error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Pulls the first <svg>…</svg> out of model output and runs the same strict
 * sanitizer used by generate-icon-set: no primitives, no transforms, no baked
 * colors, no wild decimal coordinates. Wrapper attributes are normalized.
 */
function extractAndSanitize(
  content: string,
  opts: { isFilled: boolean; strokeWidth: number; linecap: string; linejoin: string },
): { ok: true; svg: string } | { ok: false; reason: string } {
  const match = String(content || "").match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return { ok: false, reason: "no <svg> in model output" };

  let svg = match[0].trim();

  if (/<(circle|rect|line|polygon|polyline|ellipse|g|use|defs|mask|clipPath|style|filter|linearGradient|radialGradient|image|text|foreignObject)\b/i.test(svg)) {
    return { ok: false, reason: "contains forbidden SVG primitive" };
  }

  const pathMatches = [...svg.matchAll(/<path\b[^>]*\bd\s*=\s*"([^"]+)"[^>]*\/?>/gi)];
  if (pathMatches.length === 0) return { ok: false, reason: "no <path d=…> found" };
  if (pathMatches.length > 3) return { ok: false, reason: `${pathMatches.length} paths (max 3)` };

  for (const m of pathMatches) {
    if ((m[1].match(/\d+\.\d{3,}/g) || []).length > 0) {
      return { ok: false, reason: "path has high-precision decimals (snap to .0/.5)" };
    }
  }

  // Strip forbidden attributes everywhere.
  svg = svg.replace(/\s(id|class|style|data-[\w-]+|transform)\s*=\s*"[^"]*"/gi, "");
  // Strip baked colors/opacities from <path> and the outer <svg> (we re-apply them).
  svg = svg.replace(/<(path|svg)\b([^>]*)>/gi, (_, tag, attrs) =>
    `<${tag}${attrs.replace(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|opacity|fill-opacity|stroke-opacity)\s*=\s*"[^"]*"/gi, "")}>`
  );

  const wrapperAttrs = opts.isFilled
    ? `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none"`
    : `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth}" stroke-linecap="${opts.linecap}" stroke-linejoin="${opts.linejoin}"`;

  svg = svg.replace(/<svg\b[^>]*>/i, `<svg ${wrapperAttrs}>`);

  if (!/<\/svg>\s*$/i.test(svg)) return { ok: false, reason: "unterminated <svg>" };
  return { ok: true, svg };
}
