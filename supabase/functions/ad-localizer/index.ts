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
              text: `Analyze this advertisement image with extreme precision. Extract every detail needed to faithfully reproduce it in another language.

Return JSON with these keys:

1. "text_elements": array of objects, each with:
   - "content": the exact text string
   - "role": one of "headline", "subheadline", "body", "cta", "legal", "tagline", "price", "label"
   - "approximate_position": one of "top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right"
   - "style": object with "size" (e.g. "large", "medium", "small"), "weight" (e.g. "bold", "regular", "light"), "color_description" (e.g. "white", "dark blue"), "case" (e.g. "uppercase", "mixed", "lowercase")

2. "visual_elements": array of objects, each with:
   - "element": description of the visual element
   - "role": one of "product", "person", "logo", "icon", "background", "decoration", "graphic"
   - "position": approximate position in the image

3. "layout": object with:
   - "composition": description of overall layout structure (e.g. "split layout with image left, text right")
   - "text_alignment": dominant text alignment
   - "background_type": e.g. "solid color", "gradient", "photo", "pattern"
   - "background_description": brief description of the background

4. "color_palette": array of objects with "color" (descriptive name), "hex_estimate" (best guess hex), "usage" (where it's used, e.g. "headline text", "background", "CTA button")

5. "brand_marks": array of objects with "type" ("logo", "wordmark", "icon", "watermark"), "content" (text if readable), "position"

6. "mood": string describing overall aesthetic/emotional tone
7. "style_category": one of "minimal", "bold", "luxury", "playful", "corporate", "editorial", "retro", "modern"
8. "dominant_font_style": best guess at font category (e.g. "sans-serif geometric", "serif classic", "display decorative")`
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

  // Build detailed analysis context block
  const textElements = analysis?.text_elements || [];
  const legacyText = analysis?.text || [];
  const textBlock = textElements.length > 0
    ? textElements.map((t: any) => `  • [${t.role || 'text'}] "${t.content}" at ${t.approximate_position || 'unknown'} (${t.style?.size || ''} ${t.style?.weight || ''} ${t.style?.color_description || ''} ${t.style?.case || ''})`).join('\n')
    : legacyText.length > 0 ? legacyText.map((t: string) => `  • "${t}"`).join('\n') : '  N/A';

  const visualElements = analysis?.visual_elements || analysis?.elements || [];
  const visualBlock = Array.isArray(visualElements) 
    ? visualElements.map((v: any) => typeof v === 'string' ? `  • ${v}` : `  • [${v.role}] ${v.element} at ${v.position || 'unknown'}`).join('\n')
    : '  N/A';

  const layoutBlock = analysis?.layout
    ? `Layout: ${analysis.layout.composition || 'unknown'}, alignment: ${analysis.layout.text_alignment || 'unknown'}, background: ${analysis.layout.background_type || 'unknown'} (${analysis.layout.background_description || ''})`
    : '';

  const colorBlock = analysis?.color_palette?.length
    ? `Color Palette:\n${analysis.color_palette.map((c: any) => `  • ${c.color} (${c.hex_estimate || '?'}) — used for: ${c.usage || 'unknown'}`).join('\n')}`
    : '';

  const brandMarksBlock = analysis?.brand_marks?.length
    ? `Brand Marks:\n${analysis.brand_marks.map((b: any) => `  • ${b.type}: "${b.content || 'visual'}" at ${b.position || 'unknown'}`).join('\n')}`
    : '';

  const styleInfo = [
    analysis?.mood ? `Mood: ${analysis.mood}` : '',
    analysis?.style_category ? `Style: ${analysis.style_category}` : '',
    analysis?.dominant_font_style ? `Font style: ${analysis.dominant_font_style}` : '',
  ].filter(Boolean).join(' | ');

  const analysisBlock = `
       Detailed Image Analysis:
       TEXT ELEMENTS (preserve exact hierarchy, position, and styling):
${textBlock}
       VISUAL ELEMENTS:
${visualBlock}
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
