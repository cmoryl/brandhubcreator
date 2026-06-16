/**
 * Regression test for the `can_use_ai_features` RPC schema-cache fix.
 *
 * Background: `requireAiAccess` calls `supabase.rpc('can_use_ai_features')`
 * with no arguments. The DB originally only had a 3-arg overload
 * `(uuid, uuid, text)`, so PostgREST could not resolve the call and every
 * AI-gated edge function returned 503 "AI feature gate temporarily unavailable".
 *
 * This test guards against that regression by verifying:
 *   1. The zero-arg overload resolves in the schema cache (no PGRST202).
 *   2. The 3-arg overload still resolves in the schema cache.
 *   3. The `icon-semantic-search` edge function never returns 503 at the gate.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

assert(SUPABASE_URL, "VITE_SUPABASE_URL missing from .env");
assert(SUPABASE_ANON_KEY, "VITE_SUPABASE_PUBLISHABLE_KEY missing from .env");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/** PostgREST returns this code when a function signature is not in the schema cache. */
const SCHEMA_CACHE_MISS = "PGRST202";

Deno.test("can_use_ai_features() zero-arg overload is resolvable", async () => {
  const { data, error } = await supabase.rpc("can_use_ai_features");

  if (error) {
    assertNotEquals(
      error.code,
      SCHEMA_CACHE_MISS,
      `Schema cache miss — the zero-arg overload is not registered. ` +
        `This is the original 503 root cause. Error: ${JSON.stringify(error)}`,
    );
    throw new Error(`Unexpected RPC error: ${JSON.stringify(error)}`);
  }

  // Anonymous caller -> auth.uid() is null -> function returns false.
  // The point is that it RESOLVED — value can be true or false.
  assertEquals(typeof data, "boolean", "RPC should return a boolean");
});

Deno.test("can_use_ai_features(_user_id, _entity_id, _entity_type) overload is resolvable", async () => {
  const fakeUserId = "00000000-0000-0000-0000-000000000001";
  const fakeEntityId = "00000000-0000-0000-0000-000000000002";

  const { data, error } = await supabase.rpc("can_use_ai_features", {
    _user_id: fakeUserId,
    _entity_id: fakeEntityId,
    _entity_type: "brand",
  });

  if (error) {
    assertNotEquals(
      error.code,
      SCHEMA_CACHE_MISS,
      `Schema cache miss — the 3-arg overload is not registered. ` +
        `Error: ${JSON.stringify(error)}`,
    );
    throw new Error(`Unexpected RPC error: ${JSON.stringify(error)}`);
  }

  assertEquals(typeof data, "boolean", "RPC should return a boolean");
});

Deno.test("icon-semantic-search edge function never returns 503 at the AI gate", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/icon-semantic-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ query: "growth" }),
  });

  const body = await res.text();

  assertNotEquals(
    res.status,
    503,
    `AI gate returned 503 — the schema-cache regression is back. Body: ${body}`,
  );

  // Anon callers may legitimately get 401/403 from the gate, or 200 if signed in.
  // We only care that the gate itself is healthy (not 503).
  assert(
    [200, 401, 403].includes(res.status),
    `Unexpected status ${res.status}. Body: ${body}`,
  );
});
