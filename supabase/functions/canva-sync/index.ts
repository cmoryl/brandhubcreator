// Canva Connect — sync brand templates into the database.
// Auto-refreshes the access token if expired. Requires an authenticated admin.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID') ?? '';
const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET') ?? '';

const CANVA_API = 'https://api.canva.com/rest/v1';

async function getFreshAccessToken(admin: ReturnType<typeof createClient>): Promise<string> {
  const { data: row, error } = await admin
    .from('canva_oauth_tokens')
    .select('*')
    .eq('integration_name', 'default')
    .maybeSingle();
  if (error) throw new Error(`Failed to read token: ${error.message}`);
  if (!row) throw new Error('Canva is not connected yet. Run OAuth first.');

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) return row.access_token;

  // Refresh
  const basic = btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`);
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
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

async function fetchAllBrandTemplates(accessToken: string) {
  const all: any[] = [];
  let continuation: string | undefined;
  let pages = 0;
  do {
    const u = new URL(`${CANVA_API}/brand-templates`);
    if (continuation) u.searchParams.set('continuation', continuation);
    u.searchParams.set('limit', '100');
    const res = await fetch(u.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Canva brand-templates failed (${res.status}): ${text.slice(0, 300)}`);
    const json = JSON.parse(text);
    const items = Array.isArray(json.items) ? json.items : [];
    all.push(...items);
    continuation = json.continuation;
    pages++;
    if (pages > 50) break; // safety cap (5000 templates)
  } while (continuation);
  return all;
}

function normalize(t: any) {
  const thumb = t.thumbnail?.url ?? null;
  return {
    canva_id: t.id,
    title: t.title ?? null,
    design_type: t.design_type ?? t.design?.type ?? null,
    thumbnail_url: thumb,
    view_url: t.urls?.view_url ?? null,
    edit_url: t.urls?.edit_url ?? null,
    width: t.dimensions?.width ?? null,
    height: t.dimensions?.height ?? null,
    tags: Array.isArray(t.tags) ? t.tags : [],
    raw: t,
    canva_updated_at: t.updated_at ? new Date(t.updated_at * 1000 || t.updated_at).toISOString() : null,
    synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth: caller must be an authenticated admin
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
    const { data: isAdmin } = await userClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    const { data: isSuper } = await userClient.rpc('is_super_admin', { _user_id: user.id });
    if (!isAdmin && !isSuper) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getFreshAccessToken(admin);
    const templates = await fetchAllBrandTemplates(accessToken);
    const rows = templates.map(normalize);

    if (rows.length) {
      // Upsert in batches of 200
      for (let i = 0; i < rows.length; i += 200) {
        const slice = rows.slice(i, i + 200);
        const { error } = await admin.from('canva_templates').upsert(slice, { onConflict: 'canva_id' });
        if (error) throw new Error(`Upsert failed: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, synced: rows.length, at: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('canva-sync error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
