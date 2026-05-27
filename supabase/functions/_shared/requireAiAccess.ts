/**
 * Shared auth + AI-access guard for edge functions.
 *
 * Verifies the caller's JWT and (optionally) checks the `can_use_ai_features`
 * RPC for role/credit gating. Returns the resolved user id or a 401/403 Response
 * the caller should return immediately.
 *
 * Usage:
 *   const gate = await requireAiAccess(req, { corsHeaders });
 *   if (gate.response) return gate.response;
 *   const { userId, supabase } = gate;
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface RequireOpts {
  corsHeaders: Record<string, string>;
  /** Skip can_use_ai_features RPC (auth-only). Default false. */
  skipFeatureCheck?: boolean;
}

export type GateResult =
  | { response: Response; userId?: undefined; supabase?: undefined }
  | { response: null; userId: string; email: string | null; supabase: SupabaseClient };

export async function requireAiAccess(req: Request, opts: RequireOpts): Promise<GateResult> {
  const { corsHeaders, skipFeatureCheck = false } = opts;
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return { response: json(401, { error: 'Unauthorized' }) };
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) {
    return { response: json(500, { error: 'Server misconfigured: missing Supabase env' }) };
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });

  const token = auth.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { response: json(401, { error: 'Unauthorized' }) };
  }
  const userId = data.claims.sub as string;
  const email = (data.claims.email as string | undefined) ?? null;

  if (!skipFeatureCheck) {
    try {
      const { data: allowed, error: rpcErr } = await supabase.rpc('can_use_ai_features');
      if (rpcErr) {
        // Fail CLOSED: a broken feature-gate RPC must not allow unrestricted
        // AI consumption. Surface a clear 503 so the client can retry / show
        // a maintenance state instead of silently billing the workspace.
        console.error('[requireAiAccess] can_use_ai_features RPC error:', rpcErr.message);
        return { response: json(503, { error: 'AI feature gate temporarily unavailable' }) };
      }
      if (allowed === false) {
        return { response: json(403, { error: 'AI features not enabled for this account' }) };
      }
    } catch (e) {
      console.error('[requireAiAccess] feature check threw:', (e as Error).message);
      return { response: json(503, { error: 'AI feature gate temporarily unavailable' }) };
    }
  }

  return { response: null, userId, email, supabase };
}
