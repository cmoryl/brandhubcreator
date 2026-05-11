// Discover videos via Lovable AI
// Returns a list of public videos (YouTube/Vimeo/direct) related to the
// brand/product/event that are NOT already in the existing list.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DiscoverRequest {
  entityName: string;
  entityType?: 'brand' | 'product' | 'event';
  industry?: string;
  websiteUrl?: string;
  existingVideos?: Array<{ title?: string; url?: string }>;
  limit?: number;
}

const detectType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
  if (!url) return 'direct';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const body = (await req.json()) as DiscoverRequest;
    const entityName = (body.entityName || '').trim();
    if (!entityName) {
      return new Response(JSON.stringify({ error: 'entityName is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const limit = Math.min(Math.max(body.limit ?? 8, 1), 15);
    const existing = (body.existingVideos || [])
      .map((v) => ({
        title: (v.title || '').trim(),
        url: (v.url || '').trim(),
      }))
      .filter((v) => v.title || v.url)
      .slice(0, 50);

    const systemPrompt = `You are a research assistant that finds public, brand-relevant videos (YouTube, Vimeo, or direct video URLs) for a specific brand, product, or event.

Rules:
- Only return real videos you have reasonable confidence exist (no fabrication).
- Prefer official brand channels, brand-produced content, customer testimonials, product demos, tutorials, keynote talks, and conference recordings.
- Skip anything already in the "existing" list (case-insensitive title match OR same URL).
- Skip generic third-party reviews unless they are widely viewed and clearly relevant.
- If you cannot find new videos, return an empty array.
- Provide a working URL (preferably YouTube watch URL or Vimeo URL).
- Keep titles accurate to the actual video title where possible.`;

    const userPrompt = `Find up to ${limit} videos for: "${entityName}"${
      body.entityType ? ` (${body.entityType})` : ''
    }${body.industry ? `\nIndustry: ${body.industry}` : ''}${
      body.websiteUrl ? `\nWebsite: ${body.websiteUrl}` : ''
    }

Existing videos to skip:
${
  existing.length
    ? existing.map((v) => `- ${v.title}${v.url ? ` (${v.url})` : ''}`).join('\n')
    : '(none)'
}

Return only NEW videos not in that list.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_videos',
              description: 'Return discovered videos',
              parameters: {
                type: 'object',
                properties: {
                  videos: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        url: { type: 'string', description: 'Public video URL' },
                        sourceNote: {
                          type: 'string',
                          description: 'Where this info was sourced from',
                        },
                      },
                      required: ['title', 'url'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['videos'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_videos' } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit reached. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'AI credits exhausted. Add credits in Settings → Workspace → Usage.',
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let videos: any[] = [];
    try {
      const args = JSON.parse(toolCall?.function?.arguments || '{}');
      videos = Array.isArray(args.videos) ? args.videos : [];
    } catch (e) {
      console.error('Failed to parse tool args:', e);
    }

    // Final dedupe against existing titles + urls; attach detected type
    const existingTitles = new Set(existing.map((v) => v.title.toLowerCase()).filter(Boolean));
    const existingUrls = new Set(existing.map((v) => v.url.toLowerCase()).filter(Boolean));
    videos = videos
      .filter((v) => v?.title && v?.url)
      .filter(
        (v) =>
          !existingTitles.has(String(v.title).toLowerCase()) &&
          !existingUrls.has(String(v.url).toLowerCase()),
      )
      .map((v) => ({ ...v, type: detectType(String(v.url)) }));

    return new Response(JSON.stringify({ videos }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('discover-videos error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
