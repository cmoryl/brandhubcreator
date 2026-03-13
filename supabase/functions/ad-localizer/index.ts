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
              text: 'Analyze this advertisement image. Identify: 1. All visible text strings. 2. Key visual elements/objects. 3. The overall mood/aesthetic. Return as JSON with keys: "text" (array of strings), "elements" (array of strings), "mood" (string).'
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
    analysis = { text: [], elements: [], mood: 'unknown' };
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
    analysis?: { text: string[]; elements: string[]; mood: string };
    globalLinkInsights?: {
      color_notes?: string;
      imagery_notes?: string;
      messaging_notes?: string;
      typography_notes?: string;
      taboos?: string;
      adaptation_summary?: string;
    } | null;
  },
  apiKey: string
) {
  const { imageBase64, market, aspectRatio = '16:9', culturalAdaptation = false, analysis, globalLinkInsights } = body;

  if (!imageBase64 || !market) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing image or market' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const adaptationPrompt = culturalAdaptation
    ? `Translate all text in this advertisement image to the language of ${market}. 
       Context from image analysis:
       - Detected Text: ${analysis?.text?.join(', ') || 'N/A'}
       - Key Elements: ${analysis?.elements?.join(', ') || 'N/A'}
       - Mood: ${analysis?.mood || 'N/A'}
       
       Additionally, subtly adapt the visual elements, background, or models to be more culturally relevant and appealing to the ${market} market while maintaining the core brand identity, product placement, and overall composition. Ensure the final image feels native to ${market}.`
    : `Translate all text in this advertisement image to the language of ${market}. 
       Context from image analysis:
       - Detected Text: ${analysis?.text?.join(', ') || 'N/A'}
       
       ONLY translate the text - do not add any cultural imagery, flags, national symbols, or stereotypical visual elements. Keep the image, composition, styling, colors, and all visual elements exactly the same as the original. The only change should be the language of the text.`;

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
  
  // Extract image from response - the gateway returns base64 image data in content
  const message = data.choices?.[0]?.message;
  let generatedImage: string | null = null;

  if (message?.content) {
    // Check if content is an array (multimodal response)
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          // Extract base64 from data URL
          const dataUrl = part.image_url.url;
          if (dataUrl.startsWith('data:')) {
            generatedImage = dataUrl.split(',')[1];
          } else {
            generatedImage = dataUrl;
          }
          break;
        }
      }
    } else if (typeof message.content === 'string') {
      // Sometimes the image might be inline as base64
      if (message.content.startsWith('data:image')) {
        generatedImage = message.content.split(',')[1];
      }
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
