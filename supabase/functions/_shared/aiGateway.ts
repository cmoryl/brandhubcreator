/**
 * Shared Lovable AI Gateway helper.
 *
 * Centralizes:
 *  - Endpoint + auth header
 *  - 429 / 402 surfacing with a typed error
 *  - Timeout via AbortController
 *  - Optional structured logging into `ai_call_log` (best-effort, never throws)
 *
 * Use this from edge functions instead of hand-rolling fetch().
 */

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: any;
  tool_call_id?: string;
  name?: string;
}

export interface CallOptions {
  model: string;
  messages: GatewayMessage[];
  tools?: any[];
  toolChoice?: any;
  responseFormatJson?: boolean;
  temperature?: number;
  timeoutMs?: number;

  /**
   * Retry config for transient gateway failures (network blips, 5xx, and
   * — when honored — 429 rate limits). Defaults: 2 retries, 500ms base,
   * exponential backoff with jitter, capped at 8s. Set `retries: 0` to
   * disable.
   */
  retry?: {
    retries?: number;
    baseMs?: number;
    maxMs?: number;
    /** If true, also retry on 429 using Retry-After when present. Default true. */
    retryOn429?: boolean;
  };

  // Telemetry context (all optional). When supabaseUrl + serviceRoleKey are
  // provided, a row is inserted into ai_call_log.
  telemetry?: {
    supabaseUrl?: string;
    serviceRoleKey?: string;
    functionName: string;
    purpose?: string;
    userId?: string | null;
    organizationId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
  };
}

export interface CallResult {
  ok: boolean;
  status: number;
  raw: any;
  message: any;
  durationMs: number;
}

export class AIGatewayError extends Error {
  status: number;
  code: 'rate_limited' | 'payment_required' | 'gateway_error';
  raw: any;
  constructor(status: number, code: AIGatewayError['code'], message: string, raw: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

/**
 * Call the Lovable AI Gateway. Returns a structured result; throws AIGatewayError
 * for 429/402 so callers can map them to user-facing toasts.
 *
 * Includes built-in retry with exponential backoff + jitter for:
 *   - Network errors (fetch throws / aborts that aren't caller-initiated)
 *   - 5xx gateway responses
 *   - 429 rate limits (respects Retry-After when present), unless disabled
 *
 * 402 (payment required) is never retried — it's a hard stop.
 */
export async function callLovableAI(
  apiKey: string,
  opts: CallOptions,
): Promise<CallResult> {
  const retries = opts.retry?.retries ?? 2;
  const baseMs = opts.retry?.baseMs ?? 500;
  const maxMs = opts.retry?.maxMs ?? 8_000;
  const retryOn429 = opts.retry?.retryOn429 ?? true;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await attemptCall(apiKey, opts);
    } catch (e) {
      lastErr = e;
      const isLast = attempt === retries;
      if (isLast) throw e;

      // Decide if this error is retryable.
      let retryable = false;
      let waitMs = backoffMs(attempt, baseMs, maxMs);
      if (e instanceof AIGatewayError) {
        if (e.code === 'payment_required') throw e;
        if (e.code === 'rate_limited') {
          if (!retryOn429) throw e;
          retryable = true;
          const ra = Number(e.raw?.headers?.['retry-after']);
          if (Number.isFinite(ra) && ra > 0) waitMs = Math.min(ra * 1000, maxMs);
        } else if (e.code === 'gateway_error' && (e.status === 0 || e.status >= 500)) {
          retryable = true;
        }
      }
      if (!retryable) throw e;
      await sleep(waitMs);
    }
  }
  // Should be unreachable.
  throw lastErr instanceof Error
    ? lastErr
    : new AIGatewayError(0, 'gateway_error', 'Unknown gateway failure', null);
}

function backoffMs(attempt: number, baseMs: number, maxMs: number): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Full jitter
  return Math.floor(Math.random() * exp);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function attemptCall(apiKey: string, opts: CallOptions): Promise<CallResult> {
  const started = Date.now();
  const body: any = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.toolChoice) body.tool_choice = opts.toolChoice;
  if (opts.responseFormatJson) body.response_format = { type: 'json_object' };

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), opts.timeoutMs ?? 90_000);

  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Lovable-AIG-SDK': 'edge-function',
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const durationMs = Date.now() - started;
    void logCall(opts, { status: 0, durationMs, errorCode: 'network', usage: null });
    throw new AIGatewayError(0, 'gateway_error', `Network error: ${(e as Error).message}`, null);
  }
  clearTimeout(timeout);

  const text = await res.text();
  let raw: any;
  try { raw = text ? JSON.parse(text) : null; } catch { raw = { raw: text }; }
  const durationMs = Date.now() - started;

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    void logCall(opts, { status: 429, durationMs, errorCode: 'rate_limited', usage: null });
    throw new AIGatewayError(429, 'rate_limited', 'AI rate limit reached. Please retry shortly.', {
      ...raw,
      headers: retryAfter ? { 'retry-after': retryAfter } : undefined,
    });
  }
  if (res.status === 402) {
    void logCall(opts, { status: 402, durationMs, errorCode: 'payment_required', usage: null });
    throw new AIGatewayError(402, 'payment_required', 'AI credits exhausted. Add credits in Workspace → Usage.', raw);
  }
  if (!res.ok) {
    void logCall(opts, { status: res.status, durationMs, errorCode: 'gateway_error', usage: null });
    throw new AIGatewayError(res.status, 'gateway_error', raw?.error?.message || `Gateway error ${res.status}`, raw);
  }

  const message = raw?.choices?.[0]?.message ?? null;
  void logCall(opts, {
    status: res.status,
    durationMs,
    errorCode: null,
    usage: raw?.usage ?? null,
  });

  return { ok: true, status: res.status, raw, message, durationMs };
}

async function logCall(
  opts: CallOptions,
  result: {
    status: number;
    durationMs: number;
    errorCode: string | null;
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  },
): Promise<void> {
  const t = opts.telemetry;
  if (!t?.supabaseUrl || !t.serviceRoleKey) return;
  try {
    await fetch(`${t.supabaseUrl}/rest/v1/ai_call_log`, {
      method: 'POST',
      headers: {
        apikey: t.serviceRoleKey,
        Authorization: `Bearer ${t.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        function_name: t.functionName,
        purpose: t.purpose ?? null,
        model: opts.model,
        status_code: result.status,
        error_code: result.errorCode,
        duration_ms: result.durationMs,
        prompt_tokens: result.usage?.prompt_tokens ?? null,
        completion_tokens: result.usage?.completion_tokens ?? null,
        total_tokens: result.usage?.total_tokens ?? null,
        user_id: t.userId ?? null,
        organization_id: t.organizationId ?? null,
        entity_type: t.entityType ?? null,
        entity_id: t.entityId ?? null,
      }),
    });
  } catch {
    // never let telemetry failures bubble up
  }
}
