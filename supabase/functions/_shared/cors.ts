/**
 * Shared CORS headers for edge functions.
 *
 * Centralizes the headers that were previously duplicated across ~105 edge
 * functions. New functions should import these instead of redeclaring them;
 * existing functions can be migrated incrementally.
 *
 * Usage:
 *   import { corsHeaders, handleCors } from '../_shared/cors.ts';
 *
 *   Deno.serve(async (req) => {
 *     const pre = handleCors(req);
 *     if (pre) return pre;
 *     // ... handler logic; merge corsHeaders into all responses
 *   });
 */

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Returns a 204 preflight response if the request is an OPTIONS preflight,
 * otherwise null. Lets handlers do `const pre = handleCors(req); if (pre) return pre;`.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

/** Convenience helper for JSON responses that always include CORS headers. */
export function jsonResponse(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}
