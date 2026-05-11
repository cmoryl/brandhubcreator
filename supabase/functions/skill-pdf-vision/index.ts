/**
 * Skill PDF Vision Extractor
 *
 * Accepts an array of PDF URLs (brand books, guideline PDFs) and uses
 * gemini-2.5-pro multimodal to extract structured visual-identity tokens
 * that pure text extraction would miss: exact swatch HEXes, type pairings,
 * logo clear-space rules, and grid/layout principles.
 *
 * POST { pdfs: string[], brandName?: string }
 * Returns { tokens: { colors, typography, logos, layout, imagery, doDont } }
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const SCHEMA_INSTRUCTION = `Return STRICT JSON with this shape (no markdown, no prose):
{
  "colors": [{"name":"...","hex":"#XXXXXX","role":"primary|secondary|accent|neutral|semantic","notes":"..."}],
  "typography": [{"family":"...","weights":["..."],"usage":"display|headline|body|caption|mono","pairing":"..."}],
  "logos": {"variants":["..."],"clearspace":"...","minSize":"...","donts":["..."],"backgrounds":["..."]},
  "layout": {"grid":"...","spacingScale":"...","cornerRadius":"...","elevation":"..."},
  "imagery": {"direction":"...","subjects":["..."],"composition":"...","colorTreatment":"...","banned":["..."]},
  "doDont": {"do":["..."],"dont":["..."]},
  "confidence": 0-100,
  "sourceNotes": ["page-level observations explaining each extracted token"]
}
If a section is absent in the PDFs, return an empty array/string for it. Never invent.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const pdfs: string[] = Array.isArray(body?.pdfs) ? body.pdfs.filter((u: any) => typeof u === 'string').slice(0, 8) : [];
    const brandName: string = String(body?.brandName || 'Brand');
    if (!pdfs.length) return new Response(JSON.stringify({ error: 'pdfs[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const content: any[] = [
      { type: 'text', text: `Extract the complete visual identity for brand "${brandName}" from these brand-guideline PDFs. Be exhaustive on colors (every swatch with HEX), typography (every family + weight), logo rules, grid/spacing, imagery direction, and Do/Don't lists. ${SCHEMA_INSTRUCTION}` },
      ...pdfs.map((url) => ({ type: 'file', file: { file_data: url } })),
    ];

    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.1-pro-preview',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content }],
      }),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'vision_extract_failed', status: res.status, detail: raw?.error }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let tokens: any = {};
    const text = raw?.choices?.[0]?.message?.content;
    try {
      tokens = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const m = String(text || '').match(/\{[\s\S]*\}/);
      if (m) { try { tokens = JSON.parse(m[0]); } catch { /* */ } }
    }

    return new Response(JSON.stringify({ ok: true, brandName, tokens, pdfCount: pdfs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
