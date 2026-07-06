// Canva Connect OAuth — callback handler
// Pulls client_id/client_secret out of the state, exchanges the auth code
// for an access + refresh token, and stores them with the credentials so
// future refreshes work without needing backend secrets.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const PUBLIC_APP_ORIGIN = Deno.env.get('PUBLIC_APP_ORIGIN') ?? 'https://brandhubcreator.lovable.app';

function redirectResponse(returnTo: string, params: Record<string, string>) {
  const base = returnTo.startsWith('http') ? returnTo : `${PUBLIC_APP_ORIGIN}${returnTo}`;
  const dest = new URL(base);
  for (const [k, v] of Object.entries(params)) dest.searchParams.set(k, v);
  return Response.redirect(dest.toString(), 302);
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    let returnTo = '/transperfect/lifesci-canva-audit.html';
    let clientId = '';
    let clientSecret = '';
    let codeVerifier = '';
    try {
      if (state) {
        const decoded = JSON.parse(atob(state));
        if (decoded?.returnTo) returnTo = String(decoded.returnTo);
        if (decoded?.cid) clientId = String(decoded.cid);
        if (decoded?.csec) clientSecret = String(decoded.csec);
        if (decoded?.cv) codeVerifier = String(decoded.cv);
      }
    } catch {/* ignore bad state */}

    if (error) return htmlResponse('Canva connection cancelled', `<p>${error}</p>`, returnTo);
    if (!code) return htmlResponse('Missing authorization code', '<p>Canva did not return a code.</p>', returnTo);
    if (!clientId || !clientSecret) {
      return htmlResponse('Missing credentials', '<p>State did not carry your Canva client_id / client_secret. Open the panel and try again.</p>', returnTo);
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/canva-oauth-callback`;
    const basic = btoa(`${clientId}:${clientSecret}`);

    const tokenBody: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    };
    if (codeVerifier) tokenBody.code_verifier = codeVerifier;

    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenBody),
    });

    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error('Canva token exchange failed', tokenRes.status, tokenText);
      return htmlResponse('Canva token exchange failed', `<p>${tokenRes.status}: ${tokenText.slice(0, 400)}</p>`, returnTo);
    }
    const token = JSON.parse(tokenText);

    const expiresAt = new Date(Date.now() + (Number(token.expires_in ?? 3600) - 60) * 1000).toISOString();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: upsertErr } = await supabase
      .from('canva_oauth_tokens')
      .upsert({
        integration_name: 'default',
        client_id: clientId,
        client_secret: clientSecret,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_type: token.token_type ?? 'Bearer',
        scope: token.scope ?? null,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'integration_name' });

    if (upsertErr) {
      console.error('Token upsert failed', upsertErr);
      return htmlResponse('Failed to save token', `<p>${upsertErr.message}</p>`, returnTo);
    }

    return htmlResponse('Canva connected ✓', '<p>You can now click <strong>Refresh Canva</strong> on the audit page to pull the latest templates.</p>', returnTo);
  } catch (e) {
    console.error('canva-oauth-callback error', e);
    return htmlResponse('Unexpected error', `<p>${(e as Error).message}</p>`);
  }
});
