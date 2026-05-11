/**
 * Push a built Claude Skill zip to the Anthropic Skills API.
 * The client posts a base64 zip + skill name. We forward to Anthropic.
 *
 * If ANTHROPIC_API_KEY isn't configured, returns 412 with a clear message.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'ANTHROPIC_API_KEY not configured',
        hint: 'Add ANTHROPIC_API_KEY in Cloud → Secrets to enable Push to Claude.',
      }), { status: 412, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { zipBase64, skillName, description, dryRun } = await req.json().catch(() => ({}));
    if (!zipBase64 || !skillName) {
      return new Response(JSON.stringify({ error: 'zipBase64 and skillName required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        ok: true, dryRun: true, skillName, sizeBytes: Math.floor((zipBase64.length * 3) / 4),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Decode and POST as multipart/form-data to Anthropic Skills upload endpoint.
    const bin = Uint8Array.from(atob(zipBase64), (c) => c.charCodeAt(0));
    const fd = new FormData();
    fd.append('name', skillName);
    if (description) fd.append('description', String(description).slice(0, 1024));
    fd.append('file', new Blob([bin], { type: 'application/zip' }), `${skillName}.zip`);

    const res = await fetch('https://api.anthropic.com/v1/skills', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
      },
      body: fd,
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new Response(JSON.stringify({
      ok: res.ok, status: res.status, anthropic: data,
    }), { status: res.ok ? 200 : res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
