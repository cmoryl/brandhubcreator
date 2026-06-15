// Canva Connect OAuth — initiate authorization
// Reads client_id + client_secret from query params (entered in the side panel),
// encodes both into the OAuth state so the callback can complete the exchange
// without needing backend secrets.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SCOPES = [
  'brandtemplate:meta:read',
  'brandtemplate:content:read',
  'design:meta:read',
].join(' ');

Deno.serve((req) => {
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

  // Pack client credentials into state so the callback can exchange the code.
  const state = btoa(JSON.stringify({
    returnTo,
    cid: clientId,
    csec: clientSecret,
    nonce: crypto.randomUUID(),
  }));

  const authorize = new URL('https://www.canva.com/api/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('state', state);

  return Response.redirect(authorize.toString(), 302);
});
