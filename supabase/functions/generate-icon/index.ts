import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * SVG Architect System Prompt
 * Generates high-quality, professional-grade vector icons following
 * "Iconic Simplicity" principles - legible at 16px, detailed at 1024px
 */
const SVG_ARCHITECT_PROMPT = `You are a Senior SVG Architect and Brand Systems Designer. Your goal is to generate high-quality, professional-grade vector icons that function as part of a cohesive brand library. You specialize in "Iconic Simplicity"—creating symbols that are legible at 16px but detailed enough for marketing at 1024px.

## Core Directives

1. **Geometric Precision**: All icons must be constructed on a 24x24 pixel grid. Use whole numbers for coordinates whenever possible to prevent sub-pixel blurring.

2. **Structural Consistency**: Maintain consistent visual weight. A "Home" icon and a "Plus" icon must have the same optical volume.

3. **Path Logic**: Use single, clean paths. Avoid overlapping shapes or "messy" intersections that break when converted to strokes or duotones.

4. **Style Agnostic**: Generate the "Master Vector" (the skeleton). The styling parameters will be applied via attributes.

## Technical Constraints (SVG Standards)

- **ViewBox**: Always \`0 0 24 24\`
- **Path Construction**: Prefer \`<path>\` elements over basic shapes (circle, rect) to allow for universal CSS stroke control
- **No Raster Data**: Never include \`<image>\` tags or base64 data
- **Closed Paths**: Ensure all shapes are properly closed for "Solid" and "Duotone" preset compatibility
- **Optimization**: Strip all metadata, comments, and editor-specific tags

## The 6-Category Taxonomy

Categorize icons into one of these buckets:

1. **Foundation**: Navigation, UI states, basic logic (arrows, menus, toggles)
2. **Communication**: Email, social, feedback, support (chat, notifications, mail)
3. **SaaS/Data**: Analytics, security, settings, workflows (charts, locks, gears)
4. **E-Commerce**: Payments, shipping, storefront, loyalty (carts, cards, packages)
5. **Marketing Hero**: Growth, trophies, "trust" signals, abstract concepts (stars, badges, rockets)
6. **Industry Specific**: Custom symbols based on context (medical, legal, AI, etc.)

## Style Preset Awareness

Adapt the path structure to support these 10 style outcomes:

1. **Minimalist/Linear**: Focus on stroke paths and open terminals
2. **Brutalist**: Paths strictly 0°, 45°, or 90° angles only
3. **Hand-Drawn**: Subtle "human" imperfections in path coordinates
4. **Glassmorphic**: Clear "Background" and "Foreground" path separation for layering
5. **Duotone**: Separate primary stroke and secondary fill paths
6. **Outlined**: Standard stroke-based with consistent weight
7. **Filled/Solid**: Closed paths suitable for solid fills
8. **Sharp**: Square terminals and miter joins
9. **Soft/Rounded**: Round terminals and round joins
10. **Thick Stroke**: Heavy stroke weight (3-4px)

## Output Requirements

Return ONLY valid SVG code with these attributes applied based on the style parameter:
- Use \`stroke="currentColor"\` and \`fill="none"\` for stroke-based
- Use \`fill="currentColor"\` and \`stroke="none"\` for filled icons
- Apply stroke-width, stroke-linecap, stroke-linejoin as specified

The SVG must be clean, optimized, and immediately usable.`;

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

    // Build contextual user prompt
    let userPrompt = `Create an icon for: ${prompt}`;
    if (category) {
      userPrompt += `\n\nThis icon belongs to the "${category}" category. Ensure it fits the visual language of ${
        category === 'Foundation' ? 'navigation and UI elements' :
        category === 'Communication' ? 'messaging and social interactions' :
        category === 'SaaS/Data' ? 'analytics, settings, and data workflows' :
        category === 'E-Commerce' ? 'shopping, payments, and commerce' :
        category === 'Marketing Hero' ? 'growth, trust signals, and abstract concepts' :
        'industry-specific professional symbols'
      }.`;
    }
    if (preset) {
      userPrompt += `\n\nApply the "${preset}" style preset - ${
        preset === 'minimalist' ? 'ultra-clean thin strokes with open terminals' :
        preset === 'brutalist' ? 'strict 0°, 45°, or 90° angles only' :
        preset === 'hand-drawn' ? 'subtle human imperfections in paths' :
        preset === 'glassmorphic' ? 'layered background/foreground separation' :
        preset === 'duotone' ? 'primary stroke with secondary fill layer' :
        'standard professional icon styling'
      }.`;
    }

    const styleDirective = `
Apply these exact SVG attributes:
- viewBox="0 0 24 24"
- stroke-width="${strokeWidth}"
- stroke-linecap="${linecap}"
- stroke-linejoin="${linejoin}"
- stroke="${isFilled ? 'none' : 'currentColor'}"
- fill="${isFilled ? 'currentColor' : 'none'}"

Output ONLY the complete SVG element, nothing else.`;

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
    const content = data.choices?.[0]?.message?.content || "";

    // Extract SVG from the response
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error("No SVG found in response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to generate valid SVG. Please try a different description." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const svg = svgMatch[0];

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
