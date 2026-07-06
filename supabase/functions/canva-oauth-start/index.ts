// Canva Connect OAuth — initiate authorization (PKCE + stored credentials)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SCOPES = [
  'brandtemplate:meta:read',
  'brandtemplate:content:read',
  'design:meta:read',
].join(' ');

const PUBLIC_APP_ORIGIN = Deno.env.get('PUBLIC_APP_ORIGIN') ?? 'https://brandhubcreator.lovable.app';

function normalizeOrigin(value: string | null): string {
  if (!value) return PUBLIC_APP_ORIGIN;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : PUBLIC_APP_ORIGIN;
  } catch {
    return PUBLIC_APP_ORIGIN;
  }
}

function base64url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // Prefer server-side stored credentials; fall back to query params for legacy panel flow.
  const clientId = Deno.env.get('CANVA_CLIENT_ID') || url.searchParams.get('client_id') || '';
  const clientSecret = Deno.env.get('CANVA_CLIENT_SECRET') || url.searchParams.get('client_secret') || '';

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'Canva credentials not configured. Ask an admin to set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const redirectUri = `${supabaseUrl}/functions/v1/canva-oauth-callback`;
  const returnTo = url.searchParams.get('return_to') ?? '/';
  const appOrigin = normalizeOrigin(url.searchParams.get('app_origin'));

  // PKCE — Canva Connect requires code_challenge (S256)
  const verifierBytes = new Uint8Array(48);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = base64url(verifierBytes);
  const codeChallenge = base64url(await sha256(codeVerifier));

  // Only carry non-secret info in state.
  const state = btoa(JSON.stringify({
    returnTo,
    appOrigin,
    cv: codeVerifier,
    nonce: crypto.randomUUID(),
  }));

  const authorize = new URL('https://www.canva.com/api/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', codeChallenge);
  authorize.searchParams.set('code_challenge_method', 'S256');

  return Response.redirect(authorize.toString(), 302);
});
