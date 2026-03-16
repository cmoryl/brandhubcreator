/**
 * Ad Localizer Edge Function
 * Analyzes and generates localized ad creatives via Lovable AI Gateway
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'analyze') {
      return await handleAnalyze(body, LOVABLE_API_KEY);
    } else if (action === 'generate') {
      return await handleGenerate(body, LOVABLE_API_KEY);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Ad localizer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAnalyze(
  body: { imageBase64: string },
  apiKey: string
) {
  const { imageBase64 } = body;
  if (!imageBase64) {
    return new Response(
      JSON.stringify({ success: false, error: 'No image provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: `You are a senior creative director performing a forensic analysis of this advertisement. Extract every detail a human designer would need to rebuild this ad pixel-perfectly from scratch, WITHOUT the original source files.

Return JSON with these keys:

1. "text_elements": array of objects, each with:
   - "content": the exact text string
   - "role": one of "headline", "subheadline", "body", "cta", "legal", "tagline", "price", "label", "caption"
   - "position": object with "x_percent" (0-100 from left), "y_percent" (0-100 from top), "width_percent" (estimated width as % of image), "anchor" ("left"|"center"|"right")
   - "typography": object with:
     - "font_guess": best guess at specific font name (e.g. "Helvetica Neue", "Futura", "Playfair Display") or closest match
     - "font_category": "sans-serif"|"serif"|"display"|"monospace"|"script"|"slab-serif"
     - "font_weight": numeric (100-900) or descriptive ("light"|"regular"|"medium"|"semibold"|"bold"|"black")
     - "size_px_estimate": estimated pixel size relative to a 1080px-wide canvas
     - "line_height_estimate": e.g. "1.2" or "tight"
     - "letter_spacing": "normal"|"tight"|"wide"|"very-wide"
     - "text_transform": "uppercase"|"lowercase"|"capitalize"|"none"
     - "color_hex": best guess hex color
     - "color_opacity": 0-100
     - "text_shadow": null or description (e.g. "soft black shadow 2px")
     - "text_decoration": null or "underline"|"strikethrough"

2. "cta_elements": array of button/badge objects, each with:
   - "text": button text
   - "position": same as text_elements position object
   - "style": object with "background_color_hex", "text_color_hex", "border_radius" ("none"|"small"|"medium"|"pill"|"circle"), "border" (null or "1px solid #hex"), "padding_estimate" (e.g. "12px 24px"), "shadow" (null or description), "width_px_estimate", "height_px_estimate"

3. "visual_elements": array of objects, each with:
   - "element": description of the visual element
   - "role": one of "product", "person", "logo", "icon", "background", "decoration", "graphic", "overlay", "badge"
   - "position": object with "x_percent", "y_percent", "width_percent", "height_percent"
   - "z_order": layer order (0 = back, higher = front)
   - "opacity": 0-100
   - "blend_mode": "normal"|"multiply"|"overlay"|"screen" or null
   - "visual_description": detailed description for asset sourcing

4. "layout": object with:
   - "canvas_orientation": "landscape"|"portrait"|"square"
   - "estimated_aspect_ratio": e.g. "16:9", "1:1", "9:16", "4:5"
   - "composition_type": e.g. "split-left-image-right-text", "centered-overlay", "full-bleed-photo-text-overlay", "grid", "diagonal"
   - "text_alignment": "left"|"center"|"right"|"mixed"
   - "visual_hierarchy": ordered array of elements by attention priority
   - "margins": object with "top", "right", "bottom", "left" as percentage estimates
   - "grid_structure": description of underlying grid if visible

5. "background": object with:
   - "type": "solid"|"gradient"|"photo"|"pattern"|"composite"
   - "primary_color_hex": dominant background hex
   - "secondary_color_hex": if gradient or two-tone
   - "gradient_direction": if gradient (e.g. "top-to-bottom", "135deg")
   - "description": full visual description
   - "overlay": null or object with "color_hex", "opacity"

6. "color_palette": array of objects with "name" (descriptive), "hex", "usage" (where used), "approximate_area_percent"

7. "brand_marks": array of objects with:
   - "type": "logo"|"wordmark"|"icon-mark"|"monogram"|"watermark"|"lockup"
   - "content": text if readable
   - "position": same position object format
   - "size_estimate": "small"|"medium"|"large"
   - "color_treatment": "full-color"|"monochrome"|"reversed"|"transparent"

8. "production_specs": object with:
   - "dominant_font_style": detailed font description (e.g. "geometric sans-serif, similar to Montserrat or Gotham")
   - "secondary_font_style": if a second font family is used
   - "mood": overall aesthetic/emotional tone
   - "style_category": "minimal"|"bold"|"luxury"|"playful"|"corporate"|"editorial"|"retro"|"modern"|"brutalist"
   - "effects": array of special effects detected (e.g. "drop shadow on text", "gradient overlay", "rounded corners")
   - "estimated_dpi_quality": "web-72dpi"|"print-150dpi"|"print-300dpi"

Be extremely precise. This data will be used by designers to reconstruct the ad without the original files.`
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limited. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (status === 402) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI credits exhausted.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw new Error(`AI analysis failed: ${status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  let analysis;
  try {
    analysis = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    analysis = { text_elements: [], visual_elements: [], color_palette: [], brand_marks: [], mood: 'unknown' };
  }

  return new Response(
    JSON.stringify({ success: true, analysis }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerate(
  body: {
    imageBase64: string;
    market: string;
    aspectRatio?: string;
    culturalAdaptation?: boolean;
    analysis?: any;
    globalLinkInsights?: {
      color_notes?: string;
      imagery_notes?: string;
      messaging_notes?: string;
      typography_notes?: string;
      taboos?: string;
      adaptation_summary?: string;
    } | null;
    brandContext?: {
      name?: string;
      colors?: { name: string; hex: string }[];
      archetype?: string;
      voiceTone?: string;
      industry?: string;
      tagline?: string;
    } | null;
  },
  apiKey: string
) {
  const { imageBase64, market, aspectRatio = '16:9', culturalAdaptation = false, analysis, globalLinkInsights, brandContext } = body;

  if (!imageBase64 || !market) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing image or market' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Build brand context block
  const brandBlock = brandContext ? `
       Brand Identity:
       ${brandContext.name ? `- Brand: ${brandContext.name}` : ''}
       ${brandContext.archetype ? `- Archetype: ${brandContext.archetype}` : ''}
       ${brandContext.voiceTone ? `- Voice: ${brandContext.voiceTone}` : ''}
       ${brandContext.industry ? `- Industry: ${brandContext.industry}` : ''}
       ${brandContext.tagline ? `- Tagline: ${brandContext.tagline}` : ''}
       ${brandContext.colors?.length ? `- Brand Colors: ${brandContext.colors.map(c => `${c.name} (${c.hex})`).join(', ')}` : ''}` : '';

  // Build GlobalLink cultural context block
  const glInsightsBlock = globalLinkInsights ? `
       GlobalLink Cultural Intelligence for ${market}:
       ${globalLinkInsights.color_notes ? `- Colors: ${globalLinkInsights.color_notes}` : ''}
       ${globalLinkInsights.imagery_notes ? `- Imagery: ${globalLinkInsights.imagery_notes}` : ''}
       ${globalLinkInsights.messaging_notes ? `- Messaging: ${globalLinkInsights.messaging_notes}` : ''}
       ${globalLinkInsights.typography_notes ? `- Typography: ${globalLinkInsights.typography_notes}` : ''}
       ${globalLinkInsights.taboos ? `- Avoid: ${globalLinkInsights.taboos}` : ''}
       ${globalLinkInsights.adaptation_summary ? `- Summary: ${globalLinkInsights.adaptation_summary}` : ''}` : '';

  // Build detailed analysis context block from new schema
  const textElements = analysis?.text_elements || [];
  const legacyText = analysis?.text || [];
  const textBlock = textElements.length > 0
    ? textElements.map((t: any) => {
        const pos = t.position ? `at (${t.position.x_percent}%, ${t.position.y_percent}%) w:${t.position.width_percent}% anchor:${t.position.anchor}` : (t.approximate_position || 'unknown');
        const typo = t.typography || t.style || {};
        const font = typo.font_guess || typo.font_category || '';
        const weight = typo.font_weight || typo.weight || '';
        const size = typo.size_px_estimate ? `${typo.size_px_estimate}px` : (typo.size || '');
        const color = typo.color_hex || typo.color_description || '';
        const transform = typo.text_transform || typo.case || '';
        const spacing = typo.letter_spacing ? `spacing:${typo.letter_spacing}` : '';
        return `  • [${t.role || 'text'}] "${t.content}" ${pos} | ${font} ${weight} ${size} ${color} ${transform} ${spacing}`;
      }).join('\n')
    : legacyText.length > 0 ? legacyText.map((t: string) => `  • "${t}"`).join('\n') : '  N/A';

  const ctaBlock = analysis?.cta_elements?.length
    ? `CTA BUTTONS:\n${analysis.cta_elements.map((c: any) => {
        const s = c.style || {};
        return `  • "${c.text}" bg:${s.background_color_hex || '?'} text:${s.text_color_hex || '?'} radius:${s.border_radius || '?'} padding:${s.padding_estimate || '?'}`;
      }).join('\n')}`
    : '';

  const visualElements = analysis?.visual_elements || analysis?.elements || [];
  const visualBlock = Array.isArray(visualElements) 
    ? visualElements.map((v: any) => {
        if (typeof v === 'string') return `  • ${v}`;
        const pos = v.position?.x_percent != null ? `(${v.position.x_percent}%, ${v.position.y_percent}%) ${v.position.width_percent || ''}x${v.position.height_percent || ''}%` : (v.position || 'unknown');
        return `  • [${v.role}] ${v.element} at ${pos} z:${v.z_order ?? '?'} opacity:${v.opacity ?? 100}%`;
      }).join('\n')
    : '  N/A';

  const bgBlock = analysis?.background
    ? `Background: ${analysis.background.type} | primary:${analysis.background.primary_color_hex || '?'} ${analysis.background.gradient_direction ? `gradient:${analysis.background.gradient_direction} to ${analysis.background.secondary_color_hex}` : ''} ${analysis.background.overlay ? `overlay:${analysis.background.overlay.color_hex} @${analysis.background.overlay.opacity}%` : ''}`
    : '';

  const layoutBlock = analysis?.layout
    ? `Layout: ${analysis.layout.composition_type || analysis.layout.composition || 'unknown'} | ${analysis.layout.canvas_orientation || ''} ${analysis.layout.estimated_aspect_ratio || ''} | align:${analysis.layout.text_alignment || 'unknown'} | grid:${analysis.layout.grid_structure || 'none'} | margins:${JSON.stringify(analysis.layout.margins || {})}`
    : '';

  const colorBlock = analysis?.color_palette?.length
    ? `Color Palette:\n${analysis.color_palette.map((c: any) => `  • ${c.name || c.color} (${c.hex || c.hex_estimate || '?'}) — ${c.usage || 'unknown'} ~${c.approximate_area_percent ?? '?'}%`).join('\n')}`
    : '';

  const brandMarksBlock = analysis?.brand_marks?.length
    ? `Brand Marks:\n${analysis.brand_marks.map((b: any) => {
        const pos = b.position?.x_percent != null ? `(${b.position.x_percent}%, ${b.position.y_percent}%)` : (b.position || 'unknown');
        return `  • ${b.type}: "${b.content || 'visual'}" at ${pos} size:${b.size_estimate || '?'} treatment:${b.color_treatment || '?'}`;
      }).join('\n')}`
    : '';

  const prodSpecs = analysis?.production_specs || {};
  const styleInfo = [
    prodSpecs.mood || analysis?.mood ? `Mood: ${prodSpecs.mood || analysis?.mood}` : '',
    prodSpecs.style_category || analysis?.style_category ? `Style: ${prodSpecs.style_category || analysis?.style_category}` : '',
    prodSpecs.dominant_font_style || analysis?.dominant_font_style ? `Primary font: ${prodSpecs.dominant_font_style || analysis?.dominant_font_style}` : '',
    prodSpecs.secondary_font_style ? `Secondary font: ${prodSpecs.secondary_font_style}` : '',
    prodSpecs.effects?.length ? `Effects: ${prodSpecs.effects.join(', ')}` : '',
  ].filter(Boolean).join(' | ');

  const analysisBlock = `
       Detailed Image Analysis:
       TEXT ELEMENTS (preserve exact hierarchy, position, and styling):
${textBlock}
       ${ctaBlock}
       VISUAL ELEMENTS:
${visualBlock}
       ${bgBlock}
       ${layoutBlock}
       ${colorBlock}
       ${brandMarksBlock}
       ${styleInfo}`;

  const adaptationPrompt = culturalAdaptation
    ? `Recreate this advertisement image with all text translated to the language of ${market}.
       ${brandBlock}
       ${analysisBlock}
       ${glInsightsBlock}

       CRITICAL INSTRUCTIONS:
       1. Translate EVERY text element to ${market}'s language, preserving exact position, size, weight, color, and case styling.
       2. Keep all logos, brand marks, and product imagery EXACTLY as they appear.
       3. Maintain the identical layout composition, color palette, and typography style.
       4. Subtly adapt cultural visual elements (models, scenery, symbols) to feel native to ${market} while keeping brand identity intact.
       5. The output must look like a professional, production-ready ad — not AI-generated.`
    : `Recreate this advertisement image with all text translated to the language of ${market}.
       ${brandBlock}
       ${analysisBlock}

       CRITICAL INSTRUCTIONS:
       1. Translate EVERY text element to ${market}'s language, preserving exact position, size, weight, color, and case styling.
       2. Keep ALL visual elements, composition, colors, backgrounds, logos, and imagery EXACTLY the same.
       3. The ONLY change should be the language of the text. Do NOT add cultural imagery, flags, or stereotypical elements.
       4. Match the original font style (${analysis?.dominant_font_style || 'as shown'}) as closely as possible.
       5. The output must look like a professional, production-ready ad — not AI-generated.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: adaptationPrompt
            }
          ]
        }
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limited. Please try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (status === 402) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI credits exhausted.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw new Error(`Image generation failed: ${status}`);
  }

  const data = await response.json();
  
  // Extract image from response
  const message = data.choices?.[0]?.message;
  let generatedImage: string | null = null;

  // Check images array first (new gateway format)
  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      const url = img?.image_url?.url;
      if (url) {
        generatedImage = url.startsWith('data:') ? url.split(',')[1] : url;
        break;
      }
    }
  }

  // Fallback: check content array (legacy format)
  if (!generatedImage && message?.content) {
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          generatedImage = dataUrl.startsWith('data:') ? dataUrl.split(',')[1] : dataUrl;
          break;
        }
      }
    } else if (typeof message.content === 'string' && message.content.startsWith('data:image')) {
      generatedImage = message.content.split(',')[1];
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      image: generatedImage,
      market,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
