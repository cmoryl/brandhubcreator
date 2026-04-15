import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * generate-icon-visual
 * 
 * Two-phase visual icon generation pipeline:
 * Phase 1: Generate pixel-perfect icon IMAGE using gemini-2.5-flash-image
 * Phase 2: Trace the image to clean SVG using gemini-2.5-flash vision
 * 
 * Optionally accepts a reference_image for style transfer.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      prompt,
      style = "outlined",
      strokeWidth = 2,
      cornerStyle = "rounded",
      brandColors = [],
      referenceImage = null,
      phase = "full", // "image" | "trace" | "full"
      generatedImage = null, // For phase="trace" only
      count = 1,
    } = await req.json();

    if (!prompt && !generatedImage) {
      return new Response(JSON.stringify({ error: "Prompt or generated image required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const colorContext = brandColors.length > 0
      ? `Brand colors: ${brandColors.map((c: any) => `${c.name || ''} ${c.hex}`).join(', ')}.`
      : "";

    // ═══════════════════════════════════════════════
    // PHASE 1: Generate icon as IMAGE
    // ═══════════════════════════════════════════════
    let iconImageUrl = generatedImage;

    if (phase !== "trace") {
      console.log(`[generate-icon-visual] Phase 1: Generating icon image for "${prompt}"`);

      // Raster styles produce standalone PNG images (no SVG trace)
      const RASTER_STYLES = new Set(['isometric-3d', 'flat-illustration', 'realistic-3d', 'clay-3d']);
      const isRasterStyle = RASTER_STYLES.has(style);

      const styleDescriptions: Record<string, string> = {
        outlined: "Clean outlined icon with uniform 2px strokes on a pure white background. Minimal, geometric, professional like Lucide or SF Symbols.",
        filled: "Solid filled icon silhouette on pure white background. Clean cutouts for internal detail. Bold and immediately recognizable.",
        minimalist: "Ultra-minimal single-weight thin line icon on pure white background. Maximum whitespace, elegant.",
        brutalist: "Bold geometric icon using only straight lines and 90-degree angles on pure white background. Raw and powerful.",
        duotone: "Two-tone icon with a primary outline and a lighter filled accent area on pure white background.",
        glassmorphic: "Layered icon with depth separation, background shape and foreground detail on pure white background.",
        sharp: "Precise sharp-cornered icon with square terminals and miter joins on pure white background.",
        soft: "Rounded friendly icon with extra-round terminals on pure white background.",
        thick: "Bold thick-stroked icon with 3px+ weight on pure white background. High-impact.",
        'isometric-3d': "Beautiful Airbnb-style isometric 3D icon rendered at a 30° isometric angle. Soft shadows, clean surfaces, pastel/vibrant colors, subtle gradients, professional quality. Transparent background.",
        'flat-illustration': "Modern flat-design colorful illustration icon. Bold shapes, bright colors, no gradients or shadows, clean geometric forms. Transparent background.",
        'realistic-3d': "Photorealistic 3D rendered icon with realistic materials (glass, metal, plastic), studio lighting, subtle reflections, and soft ambient occlusion. Transparent background.",
        'clay-3d': "Soft clay/plasticine-style 3D rendered icon. Rounded puffy shapes, matte texture, warm soft lighting, playful and tactile feel. Transparent background.",
      };

      const styleDesc = styleDescriptions[style] || styleDescriptions.outlined;

      const imageMessages: any[] = [];
      
      let imagePrompt: string;

      if (isRasterStyle) {
        imagePrompt = `Create a single, beautiful 3D rendered icon for: "${prompt}"

Style: ${styleDesc}
${colorContext ? `\n${colorContext} Incorporate these brand colors into the icon's palette.` : "Use vibrant, appealing colors."}

CRITICAL REQUIREMENTS:
- TRANSPARENT background — the icon must float with NO background surface or plane
- Single centered icon, no text, labels, or watermarks
- High quality 3D rendering with professional lighting and materials
- The icon must be instantly recognizable and visually stunning
- Clean, polished, production-ready quality
- Render at 512x512 with crisp edges
- Think BnbIcons / Airbnb illustration style — premium, delightful, modern`;
      } else {
        imagePrompt = `Create a single, highly detailed professional vector-style icon design for: "${prompt}"

Style: ${styleDesc}
${colorContext ? `\n${colorContext} Use these colors for the icon strokes/fills.` : "Use black (#000000) for the icon."}

CRITICAL REQUIREMENTS:
- Pure white (#FFFFFF) background, no gradients or textures
- Single centered icon, no text or labels
- HIGHLY DETAILED: Include fine interior details, secondary elements, and texture cues that make the icon rich and visually interesting
- Clean geometric shapes with ${cornerStyle === "sharp" ? "sharp 90° corners" : "smooth rounded corners"}
- The icon must be instantly recognizable as a ${count > 1 ? "set of " + count + " icons arranged in a grid" : "single icon"}
- Professional quality matching Apple SF Symbols or Google Material Icons at their most detailed variants
- Include subtle interior lines, notches, ridges, or accent marks that add depth and craftsmanship
- High contrast, crisp edges, pixel-perfect rendering at 512x512
- Think of the most detailed, premium icon you've seen — match that level of refinement`;
      }

      if (referenceImage) {
        imagePrompt += `\n\nIMPORTANT: Match the visual style, line weight, and aesthetic of the reference image provided. Generate new icons in the SAME visual language.`;
        imageMessages.push({
          role: "user",
          content: [
            { type: "text", text: imagePrompt },
            { type: "image_url", image_url: { url: referenceImage } },
          ],
        });
      } else {
        imageMessages.push({
          role: "user",
          content: imagePrompt,
        });
      }

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: imageMessages,
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errText = await imageResponse.text();
        console.error("[generate-icon-visual] Image gen error:", imageResponse.status, errText);
        throw new Error("Failed to generate icon image");
      }

      const imageData = await imageResponse.json();
      iconImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!iconImageUrl) {
        console.error("[generate-icon-visual] No image in response");
        throw new Error("AI did not return an image. Try a different prompt.");
      }

      console.log("[generate-icon-visual] Phase 1 complete: image generated");

      // If only image phase requested OR raster style (no SVG trace needed), return early
      if (phase === "image" || isRasterStyle) {
        return new Response(JSON.stringify({
          imageUrl: iconImageUrl,
          phase: isRasterStyle ? "raster" : "image",
          isRaster: isRasterStyle,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ═══════════════════════════════════════════════
    // PHASE 2: Trace image to SVG
    // ═══════════════════════════════════════════════
    console.log("[generate-icon-visual] Phase 2: Tracing image to SVG");

    const isFilled = style === "filled";
    const linecap = cornerStyle === "sharp" ? "square" : "round";
    const linejoin = cornerStyle === "sharp" ? "miter" : "round";

    const tracePrompt = `Convert this icon image into a production-ready SVG.

## ABSOLUTE RULES
1. ViewBox: 0 0 24 24. Content within 2,2 → 22,22 safe zone.
2. ONLY <path> elements. NO <circle>, <rect>, <line>, <polygon>, <g>, <use>, <defs>.
3. All coordinates: whole integers or exactly .5 (e.g. 6, 12.5). NEVER 7.33 or 15.8.
4. Maximum 6 <path> elements to preserve detail. Each path MUST close with Z.
5. Remove only truly redundant points. Keep detail-carrying segments.
6. Use arcs (A/a) for curves, not cubic Bézier chains for circles.

## Style
- stroke-width="${strokeWidth}"
- stroke-linecap="${linecap}" | stroke-linejoin="${linejoin}"
- stroke="${isFilled ? "none" : "currentColor"}" | fill="${isFilled ? "currentColor" : "none"}"

## Quality Standard
- Must be recognizable as a filled silhouette at 12×12px
- Clean geometric paths, not noisy traces
- Interpret the image SEMANTICALLY — create an iconic SVG, not a pixel trace

Return ONLY the complete <svg> element. No explanation.`;

    const traceModels = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    let traceContent = "";
    let lastTraceStatus: number | null = null;

    for (const traceModel of traceModels) {
      const traceController = new AbortController();
      const traceTimeout = setTimeout(() => traceController.abort(), 45000);

      try {
        const traceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: traceModel,
            messages: [
              { role: "system", content: "You are an expert SVG vectorizer. Convert images to clean, highly detailed optimized SVG icons. Preserve ALL visual details from the source image." },
              {
                role: "user",
                content: [
                  { type: "text", text: tracePrompt },
                  { type: "image_url", image_url: { url: iconImageUrl } },
                ],
              },
            ],
          }),
          signal: traceController.signal,
        });

        if (!traceResponse.ok) {
          lastTraceStatus = traceResponse.status;
          const errText = await traceResponse.text();
          console.error(`[generate-icon-visual] Trace error (${traceModel}):`, traceResponse.status, errText);
          continue;
        }

        const traceData = await traceResponse.json();
        traceContent = traceData.choices?.[0]?.message?.content || "";

        if (traceContent.includes("<svg")) {
          break;
        }

        console.warn(`[generate-icon-visual] No SVG returned from ${traceModel}, trying fallback model`);
      } catch (traceErr) {
        console.error(`[generate-icon-visual] Trace request failed (${traceModel}):`, traceErr);
      } finally {
        clearTimeout(traceTimeout);
      }
    }

    if (!traceContent) {
      if (lastTraceStatus === 429) {
        return new Response(JSON.stringify({
          error: "Rate limit on trace step. Image was generated — try tracing again.",
          imageUrl: iconImageUrl,
          phase: "image",
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (lastTraceStatus === 402) {
        return new Response(JSON.stringify({
          error: "AI credits exhausted on trace step.",
          imageUrl: iconImageUrl,
          phase: "image",
        }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        error: "SVG tracing failed. Image preview is available.",
        imageUrl: iconImageUrl,
        phase: "image",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const svgMatch = traceContent.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error("[generate-icon-visual] No SVG in trace response:", traceContent.slice(0, 200));
      return new Response(JSON.stringify({
        error: "SVG tracing failed. Image preview is available.",
        imageUrl: iconImageUrl,
        phase: "image",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let svg = svgMatch[0];

    // Post-process SVG
    if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    if (!svg.includes("viewBox=")) svg = svg.replace("<svg", '<svg viewBox="0 0 24 24"');
    svg = svg.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

    console.log("[generate-icon-visual] Phase 2 complete: SVG traced");

    return new Response(JSON.stringify({
      svg,
      imageUrl: iconImageUrl,
      phase: "full",
      metadata: {
        style,
        strokeWidth,
        cornerStyle,
        hasReference: !!referenceImage,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[generate-icon-visual] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
