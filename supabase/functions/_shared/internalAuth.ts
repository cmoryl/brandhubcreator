/**
 * Internal auth helpers for edge functions.
 *
 * `requireServiceRole` — for worker / queue functions that are only invoked
 * server-to-server (other edge functions, cron). Rejects any caller that does
 * not present the project's service-role key as the bearer token.
 *
 * `verifyServiceRoleOrUser` — for endpoints that accept BOTH a logged-in user
 * (via their JWT) AND server-to-server callers (via service-role bearer).
 * Returns `{ kind: 'service' }` or `{ kind: 'user', userId }`.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (status: number, body: unknown, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** Constant-time string compare to avoid timing oracles on the bearer token. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function requireServiceRole(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return json(401, { error: 'Unauthorized' }, corsHeaders);
  }
  const token = auth.slice('Bearer '.length).trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!serviceKey || !safeEqual(token, serviceKey)) {
    return json(401, { error: 'Unauthorized' }, corsHeaders);
  }
  return null;
}

export interface UserAuthResult {
  kind: 'user';
  userId: string;
  email: string | null;
}
export interface ServiceAuthResult {
  kind: 'service';
}
export type AuthResult = UserAuthResult | ServiceAuthResult;

export async function verifyServiceRoleOrUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ ok: true; auth: AuthResult } | { ok: false; response: Response }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, response: json(401, { error: 'Unauthorized' }, corsHeaders) };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (serviceKey && safeEqual(token, serviceKey)) {
    return { ok: true, auth: { kind: 'service' } };
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) {
    return { ok: false, response: json(500, { error: 'Server misconfigured' }, corsHeaders) };
  }
  const sb = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { ok: false, response: json(401, { error: 'Unauthorized' }, corsHeaders) };
  }
  return {
    ok: true,
    auth: {
      kind: 'user',
      userId: data.claims.sub as string,
      email: (data.claims.email as string | undefined) ?? null,
    },
  };
}
