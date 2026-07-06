// Resolve any Canva URL (canva.link/xxx or canva.com/design/{id}) to
// { id, title, thumbnailUrl, viewUrl, editUrl } using the stored Canva
// Connect OAuth token. Used by the Social Templates editor to auto-fill
// template card metadata when an admin pastes a link.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CANVA_API = 'https://api.canva.com/rest/v1';

async function getFreshAccessToken(admin: ReturnType<typeof createClient>): Promise<string> {
  const { data: row, error } = await admin
    .from('canva_oauth_tokens')
    .select('*')
    .eq('integration_name', 'default')
    .maybeSingle();
  if (error) throw new Error(`Failed to read token: ${error.message}`);
  if (!row) throw new Error('Canva is not connected yet.');

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) return row.access_token;

  if (!row.client_id || !row.client_secret) {
    throw new Error('Stored token row is missing client credentials. Reconnect Canva.');
  }
  const basic = btoa(`${row.client_id}:${row.client_secret}`);
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: row.refresh_token }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Canva refresh failed (${res.status}): ${text.slice(0, 300)}`);
  const t = JSON.parse(text);
  const newExpiry = new Date(Date.now() + (Number(t.expires_in ?? 3600) - 60) * 1000).toISOString();
  await admin.from('canva_oauth_tokens').update({
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? row.refresh_token,
    expires_at: newExpiry,
    scope: t.scope ?? row.scope,
  }).eq('integration_name', 'default');
  return t.access_token;
}

function extractDesignId(url: string): string | null {
  const m = url.match(/canva\.com\/design\/([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

async function resolveShortlink(url: string): Promise<string> {
  // canva.link/xxx redirects to canva.com/design/{id}/...
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.url || url;
  } catch {
    return url;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url: rawUrl } = await req.json().catch(() => ({}));
    if (!rawUrl || typeof rawUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let target = rawUrl.trim();
    if (/canva\.link/i.test(target)) {
      target = await resolveShortlink(target);
    }
    const designId = extractDesignId(target);
    if (!designId) {
      return new Response(JSON.stringify({ error: 'Could not extract Canva design ID', resolvedUrl: target }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getFreshAccessToken(admin);

    const res = await fetch(`${CANVA_API}/designs/${designId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const text = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({
        error: 'Canva API error',
        status: res.status,
        details: text.slice(0, 400),
      }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const json = JSON.parse(text);
    const d = json.design ?? json;

    const format =
      d.design_type?.name ||
      d.design_type?.type ||
      (d.dimensions?.width && d.dimensions?.height
        ? `${d.dimensions.width}×${d.dimensions.height}`
        : null);

    return new Response(JSON.stringify({
      ok: true,
      id: d.id ?? designId,
      title: d.title ?? null,
      thumbnailUrl: d.thumbnail?.url ?? null,
      viewUrl: d.urls?.view_url ?? target,
      editUrl: d.urls?.edit_url ?? null,
      format,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('canva-resolve-design error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
