// Canva Connect OAuth — initiate authorization
// Redirects the admin to Canva's consent screen with our requested scopes.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID') ?? '';
const SCOPES = [
  'brandtemplate:meta:read',
  'brandtemplate:content:read',
  'design:meta:read',
].join(' ');

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!CANVA_CLIENT_ID) {
    return new Response(
      JSON.stringify({ error: 'CANVA_CLIENT_ID not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const redirectUri = `${supabaseUrl}/functions/v1/canva-oauth-callback`;
  const returnTo = url.searchParams.get('return_to') ?? '/transperfect/lifesci-canva-audit.html';
  const state = btoa(JSON.stringify({ returnTo, nonce: crypto.randomUUID() }));

  const authorize = new URL('https://www.canva.com/api/oauth/authorize');
  authorize.searchParams.set('client_id', CANVA_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('state', state);

  return Response.redirect(authorize.toString(), 302);
});
