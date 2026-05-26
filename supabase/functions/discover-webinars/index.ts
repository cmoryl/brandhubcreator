// Discover webinars via Lovable AI
// Returns a list of upcoming/recorded webinars hosted by the brand/product/event
// that are NOT already in the existing list.

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
  existingWebinars?: Array<{ title?: string; date?: string }>;
  limit?: number;
}

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
    const existing = (body.existingWebinars || [])
      .map((w) => (w.title || '').trim())
      .filter(Boolean)
      .slice(0, 50);

    const systemPrompt = `You are a research assistant that finds public webinars, virtual events, and on-demand recordings hosted or co-hosted by a specific brand or organization.

Rules:
- Only return real webinars you have reasonable confidence exist (no fabrication).
- Prefer recent (past 18 months) and upcoming events.
- Skip anything already in the "existingTitles" list (case-insensitive substring match).
- If you cannot find new webinars, return an empty array.
- Do NOT include generic conferences the brand only attended; only events they hosted, presented, or co-produced.
- Status: "upcoming" if date is in the future, "recorded" if past, "live" only if currently happening.
- Use ISO date format YYYY-MM-DD when known. Omit the field if unknown.`;

    const userPrompt = `Find up to ${limit} webinars for: "${entityName}"${
      body.entityType ? ` (${body.entityType})` : ''
    }${body.industry ? `\nIndustry: ${body.industry}` : ''}${
      body.websiteUrl ? `\nWebsite: ${body.websiteUrl}` : ''
    }

Existing titles to skip:
${existing.length ? existing.map((t) => `- ${t}`).join('\n') : '(none)'}

Return only NEW webinars not in that list.`;

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
              name: 'return_webinars',
              description: 'Return discovered webinars',
              parameters: {
                type: 'object',
                properties: {
                  webinars: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        date: { type: 'string', description: 'YYYY-MM-DD if known' },
                        duration: { type: 'string' },
                        registrationUrl: { type: 'string' },
                        recordingUrl: { type: 'string' },
                        speakers: { type: 'array', items: { type: 'string' } },
                        status: { type: 'string', enum: ['upcoming', 'live', 'recorded'] },
                        sourceNote: {
                          type: 'string',
                          description: 'Where this info was sourced from',
                        },
                      },
                      required: ['title'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['webinars'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_webinars' } },
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
    let webinars: any[] = [];
    try {
      const args = JSON.parse(toolCall?.function?.arguments || '{}');
      webinars = Array.isArray(args.webinars) ? args.webinars : [];
    } catch (e) {
      console.error('Failed to parse tool args:', e);
    }

    // Final dedupe against existing titles
    const existingLower = new Set(existing.map((t) => t.toLowerCase()));
    webinars = webinars.filter(
      (w) => w?.title && !existingLower.has(String(w.title).toLowerCase()),
    );

    return new Response(JSON.stringify({ webinars }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('discover-webinars error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
