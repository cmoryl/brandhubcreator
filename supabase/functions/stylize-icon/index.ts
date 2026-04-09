import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SVG Stylizer System Prompt
 * Converts PNG/image descriptions into clean, brand-aligned SVG icons
 */
const STYLIZER_PROMPT = `You are an expert SVG Icon Vectorizer. Your task is to convert an uploaded image into a clean, production-ready SVG icon.

## Core Principles

1. **Semantic Interpretation**: Don't just trace edges. Understand what the image represents and create an iconic, simplified version.

2. **Geometric Primitives**: Prefer geometric shapes (circles, rectangles, lines) over complex curves when possible.

3. **Path Optimization**:
   - Keep anchor points under 50
   - Use whole numbers or single decimal coordinates
   - Combine overlapping paths into single clean paths

4. **Grid Alignment**: 
   - ViewBox: Always 0 0 24 24
   - Content Zone: Keep all elements within a 20px safe zone (2-22 on both axes)
   - Center the icon both horizontally and vertically

## Style Application

Apply these style parameters to the output:
- stroke-width: {STROKE_WIDTH}px
- stroke-linecap: round
- stroke-linejoin: round
- Corner radius: {CORNER_RADIUS}px (round sharp corners)
- Fill mode: {FILL_MODE}

## Output Requirements

Return ONLY a valid SVG element. No explanation, no markdown.
The SVG must:
- Have xmlns="http://www.w3.org/2000/svg"
- Use viewBox="0 0 24 24"
- Use currentColor for stroke/fill (for theming)
- Be properly centered
- Have clean, optimized paths

Example output format:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/></svg>`;

interface StylizerOptions {
  removeBackground: boolean;
  edgeSharpening: number;
  simplifyThreshold: number;
  maxAnchorPoints: number;
  strokeWidth: number;
  cornerRadius: number;
  fillMode: 'stroke' | 'fill' | 'auto';
  preserveHoles: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { image, options = {} } = await req.json() as { 
      image: string; 
      options: Partial<StylizerOptions> 
    };

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build style parameters
    const strokeWidth = options.strokeWidth ?? 2;
    const cornerRadius = options.cornerRadius ?? 4;
    const fillMode = options.fillMode ?? 'auto';
    const simplifyThreshold = options.simplifyThreshold ?? 0.5;
    const maxAnchorPoints = options.maxAnchorPoints ?? 50;

    // Build the prompt with style parameters
    const styledPrompt = STYLIZER_PROMPT
      .replace('{STROKE_WIDTH}', String(strokeWidth))
      .replace('{CORNER_RADIUS}', String(cornerRadius))
      .replace('{FILL_MODE}', fillMode === 'stroke' ? 'stroke only (fill="none")' : 
                              fillMode === 'fill' ? 'solid fill (stroke="none")' : 
                              'auto-detect based on image');

    const userPrompt = `Convert this image into a clean SVG icon.

Style parameters:
- Simplification level: ${simplifyThreshold < 0.3 ? 'Keep maximum detail' : simplifyThreshold < 0.7 ? 'Balance detail and simplicity' : 'Maximum simplification for clean lines'}
- Target anchor points: Under ${maxAnchorPoints}
- Preserve negative space/holes: ${options.preserveHoles ? 'Yes' : 'No'}
- Corner style: ${cornerRadius > 0 ? `Rounded (${cornerRadius}px radius)` : 'Sharp corners'}

Analyze the image and create a semantic, iconic SVG representation. Output ONLY the SVG element.`;

    console.log(`[stylize-icon] Processing image for user ${user.id}`);

    // Use vision model to interpret the image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: styledPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } }
            ]
          },
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
      throw new Error("Failed to process image");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract SVG from the response
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error("No SVG found in response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to generate SVG from image. Please try a different image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let svg = svgMatch[0];

    // ── Single-pass attribute builder ──
    // Parse existing attributes from <svg> tag, merge defaults, rebuild
    const svgOpenMatch = svg.match(/<svg([^>]*)>/i);
    if (svgOpenMatch) {
      const existingAttrs = svgOpenMatch[1];
      const attrMap = new Map<string, string>();

      // Parse existing attributes
      const attrRegex = /(\S+?)=["']([^"']*)["']/g;
      let m;
      while ((m = attrRegex.exec(existingAttrs)) !== null) {
        attrMap.set(m[1].toLowerCase(), m[2]);
      }

      // Set defaults (only if not already present)
      if (!attrMap.has('xmlns')) attrMap.set('xmlns', 'http://www.w3.org/2000/svg');
      if (!attrMap.has('viewbox')) attrMap.set('viewBox', '0 0 24 24');

      // Apply fill mode
      if (fillMode === 'stroke') {
        attrMap.set('fill', 'none');
        if (!attrMap.has('stroke')) attrMap.set('stroke', 'currentColor');
      } else if (fillMode === 'fill') {
        attrMap.set('stroke', 'none');
        if (!attrMap.has('fill')) attrMap.set('fill', 'currentColor');
      }

      // Apply stroke width (override)
      if (fillMode !== 'fill') {
        attrMap.set('stroke-width', String(strokeWidth));
      }

      // Ensure rounded caps/joins
      if (!attrMap.has('stroke-linecap')) attrMap.set('stroke-linecap', 'round');
      if (!attrMap.has('stroke-linejoin')) attrMap.set('stroke-linejoin', 'round');

      // Add accessibility
      attrMap.set('role', 'img');

      // Rebuild <svg> opening tag with deduplicated attributes
      const attrsStr = Array.from(attrMap.entries())
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      
      const svgBody = svg.slice(svgOpenMatch[0].length);
      svg = `<svg ${attrsStr}>${svgBody.startsWith('</svg>') ? '</svg>' : svgBody}`;
    }

    // Also strip fill/stroke from child elements for stroke-only mode
    if (fillMode === 'stroke') {
      svg = svg.replace(/<(path|circle|rect|line|polyline|polygon|ellipse)([^>]*)\bfill="(?!none)[^"]*"/gi, 
        '<$1$2fill="none"');
    }

    // Clean up whitespace
    svg = svg.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

    console.log(`[stylize-icon] Successfully generated SVG`);

    return new Response(
      JSON.stringify({ 
        svg,
        metadata: {
          fillMode,
          strokeWidth,
          cornerRadius,
          simplifyThreshold,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stylize icon error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
