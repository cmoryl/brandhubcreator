/**
 * Regression test for the shared `requireAiAccess` gate across ALL edge
 * functions that depend on it.
 *
 * The 503 "AI feature gate temporarily unavailable" response is the failure
 * mode this test guards against. It happened when the zero-arg overload of
 * `can_use_ai_features` was missing from the PostgREST schema cache, causing
 * every AI-gated function to fail closed.
 *
 * This test calls every function that imports `requireAiAccess` and asserts
 * none of them return 503 with the gate-unavailable payload. The functions
 * may legitimately return 200/400/401/403/422/500 depending on the payload
 * and auth — we only forbid 503-from-the-gate.
 *
 * Discovery: kept in sync manually with `rg -l requireAiAccess supabase/functions`.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

assert(SUPABASE_URL, "VITE_SUPABASE_URL missing from .env");
assert(SUPABASE_ANON_KEY, "VITE_SUPABASE_PUBLISHABLE_KEY missing from .env");

/**
 * Every edge function that imports `requireAiAccess`.
 * Each entry has a minimal payload that allows the gate to run. The gate
 * runs FIRST in each function, so the body shape rarely matters for this
 * test — empty `{}` is enough for most.
 */
const GATED_FUNCTIONS: Array<{ name: string; body: unknown }> = [
  { name: "generate-icon-colors", body: {} },
  { name: "icon-semantic-search", body: { query: "test" } },
  { name: "skill-autofix", body: {} },
  { name: "skill-chat", body: { messages: [] } },
  { name: "skill-pdf-vision", body: {} },
  { name: "skill-qa", body: {} },
  { name: "skill-token-optimizer", body: {} },
  { name: "suggest-icons", body: {} },
];

const GATE_ERROR_MESSAGE = "AI feature gate temporarily unavailable";

async function callFunction(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

for (const fn of GATED_FUNCTIONS) {
  Deno.test(`${fn.name} — AI gate never returns 503`, async () => {
    const { status, body } = await callFunction(fn.name, fn.body);

    // The specific regression: gate cannot resolve `can_use_ai_features`
    // and returns 503 with this exact message.
    const isGateFailure =
      status === 503 && body.includes(GATE_ERROR_MESSAGE);

    assert(
      !isGateFailure,
      `[${fn.name}] AI gate is down (503): ${body}. ` +
        `Schema-cache regression on can_use_ai_features is back.`,
    );

    // Also fail if anything 5xx slips through with the gate message
    // (defensive — in case the message ever changes status code).
    if (body.includes(GATE_ERROR_MESSAGE)) {
      throw new Error(
        `[${fn.name}] Gate-unavailable message leaked at status ${status}: ${body}`,
      );
    }

    // Status sanity: anything other than 503-from-gate is acceptable here.
    assertNotEquals(
      status,
      503,
      `[${fn.name}] Returned 503 — unexpected gateway/runtime failure. Body: ${body}`,
    );
  });
}
