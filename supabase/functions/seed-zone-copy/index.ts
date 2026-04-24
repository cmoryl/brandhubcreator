/**
 * seed-zone-copy
 *
 * Generates brand-aware demo copy for empty text / CTA zones in templated
 * assets (case studies, brochures, digital collateral, event print, etc.).
 *
 * Returns one short string per requested zone, keyed by the caller-supplied
 * zone id. The model is instructed to honour zone type (text vs CTA), the
 * label as the topic hint, and the brand context (name, industry, tone) for
 * voice consistency.
 *
 * Designed to be called in a single batch from the editor — avoids one
 * request per zone and keeps latency / token usage low.
 */

// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ZoneRequest {
  id: string;
  type: 'text' | 'cta';
  label: string;
}

interface BrandContext {
  name?: string;
  industry?: string;
  tone?: string | string[];
  archetype?: string;
  tagline?: string;
}

interface RequestBody {
  zones: ZoneRequest[];
  brand?: BrandContext;
  /** Optional human-readable surface name (e.g. "Case study card"). */
  surface?: string;
}

const buildSystemPrompt = (brand: BrandContext | undefined, surface: string) => {
  const lines: string[] = [
    `You are a senior brand copywriter producing short demo placeholder copy for a ${surface}.`,
    'Constraints:',
    '- Each zone gets ONE concise string, in the voice of the brand.',
    '- text zones: 1 sentence, max ~14 words. No quotes around the value.',
    '- cta zones: 2-4 words, action verb first, Title Case, no trailing punctuation.',
    '- Treat the zone label as the topic hint (e.g. "Headline", "Subhead", "Stat", "Quote", "Download CTA").',
    '- Never reference the brand name unless the label asks for it.',
    '- Plain text only, no markdown.',
  ];
  if (brand?.name) lines.push(`Brand name: ${brand.name}`);
  if (brand?.industry) lines.push(`Industry: ${brand.industry}`);
  if (brand?.archetype) lines.push(`Archetype: ${brand.archetype}`);
  if (brand?.tagline) lines.push(`Tagline: ${brand.tagline}`);
  if (brand?.tone) {
    const toneStr = Array.isArray(brand.tone) ? brand.tone.join(', ') : brand.tone;
    lines.push(`Tone of voice: ${toneStr}`);
  }
  return lines.join('\n');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as RequestBody;
    const zones = Array.isArray(body?.zones) ? body.zones : [];

    // Light input validation — keep payloads bounded.
    const cleanZones = zones
      .filter((z) => z && typeof z.id === 'string' && (z.type === 'text' || z.type === 'cta'))
      .slice(0, 24)
      .map((z) => ({
        id: String(z.id).slice(0, 80),
        type: z.type,
        label: String(z.label || '').slice(0, 80),
      }));

    if (cleanZones.length === 0) {
      return new Response(JSON.stringify({ results: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const surface = String(body?.surface || 'templated marketing asset').slice(0, 80);
    const systemPrompt = buildSystemPrompt(body?.brand, surface);

    const userPrompt =
      `Produce demo copy for the following zones. Return one entry per zone using the provided id.\n\n` +
      JSON.stringify({ zones: cleanZones }, null, 2);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_zone_copy',
              description: 'Return demo copy for each requested zone.',
              parameters: {
                type: 'object',
                properties: {
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        content: { type: 'string' },
                      },
                      required: ['id', 'content'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['results'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_zone_copy' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const errText = await aiResponse.text();
      console.error('seed-zone-copy AI error:', aiResponse.status, errText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ai = await aiResponse.json();
    const toolCall = ai?.choices?.[0]?.message?.tool_calls?.[0];
    let results: Record<string, string> = {};

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        const arr = Array.isArray(parsed?.results) ? parsed.results : [];
        for (const r of arr) {
          if (r && typeof r.id === 'string' && typeof r.content === 'string') {
            results[r.id] = r.content.trim();
          }
        }
      } catch (err) {
        console.error('seed-zone-copy parse error:', err);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('seed-zone-copy error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
