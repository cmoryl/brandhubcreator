// Canva Connect OAuth — initiate authorization (with PKCE, required by Canva)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SCOPES = [
  'brandtemplate:meta:read',
  'brandtemplate:content:read',
  'design:meta:read',
].join(' ');

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
  const clientId = url.searchParams.get('client_id') ?? '';
  const clientSecret = url.searchParams.get('client_secret') ?? '';

  if (!clientId || !clientSecret) {
    return new Response(
      'Missing client_id or client_secret in query string. Open the Canva Connect panel and enter both, then click Connect.',
      { status: 400, headers: { 'Content-Type': 'text/plain' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const redirectUri = `${supabaseUrl}/functions/v1/canva-oauth-callback`;
  const returnTo = url.searchParams.get('return_to') ?? '/transperfect/lifesci-canva-audit.html';

  // PKCE — Canva Connect requires code_challenge (S256)
  const verifierBytes = new Uint8Array(48);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = base64url(verifierBytes);
  const codeChallenge = base64url(await sha256(codeVerifier));

  const state = btoa(JSON.stringify({
    returnTo,
    cid: clientId,
    csec: clientSecret,
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
