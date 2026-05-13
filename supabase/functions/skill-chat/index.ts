/**
 * Skill Chat
 *
 * Streaming chat that puts the exported SKILL.md + reference files into
 * the system prompt, so users can stress-test the skill ("write a tweet",
 * "what HEX for CTA on dark bg") before exporting to Claude.
 *
 * Routing:
 *  - model starts with "claude-"  -> Anthropic Messages API (real Claude),
 *    re-emitted as OpenAI-compatible SSE so the existing client parser works.
 *  - otherwise                    -> Lovable AI Gateway (default Gemini).
 */
import { requireAiAccess } from '../_shared/requireAiAccess.ts';
import { MODELS } from '../_shared/models.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function sseFrame(delta: string): string {
  // OpenAI-compatible SSE delta frame
  const payload = { choices: [{ delta: { content: delta } }] };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

async function streamFromAnthropic(opts: {
  apiKey: string;
  model: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<Response> {
  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2048,
      temperature: 0.3,
      stream: true,
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const errBody = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: 'anthropic_error', status: upstream.status, detail: errBody.slice(0, 800) }),
      { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Transform Anthropic event-stream -> OpenAI-compatible SSE deltas the client already parses.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buf = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const j = JSON.parse(payload);
              // content_block_delta -> delta.type=text_delta -> delta.text
              if (j?.type === 'content_block_delta' && j?.delta?.type === 'text_delta') {
                const txt = j.delta.text;
                if (typeof txt === 'string' && txt) {
                  controller.enqueue(encoder.encode(sseFrame(txt)));
                }
              } else if (j?.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } catch { /* skip malformed frame */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const gate = await requireAiAccess(req, { corsHeaders });
    if (gate.response) return gate.response;

    const body = await req.json().catch(() => ({}));
    const { skill, messages, model } = body as {
      skill: { skillMd: string; sections?: Record<string, string> };
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
    };
    if (!skill?.skillMd || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'skill.skillMd and messages[] required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const sectionDump = Object.entries(skill.sections || {})
      .map(([k, v]) => `## ${k.toUpperCase()}\n${(v || '').slice(0, 8000)}`)
      .join('\n\n');
    const system = `You are operating under the brand skill below. You MUST follow it exactly — never invent colors, fonts, or phrasing outside the skill. When asked for a HEX, font, or rule, quote the exact value from the skill. If the user asks for something the skill doesn't cover, say so plainly.\n\n<<<SKILL>>>\n${skill.skillMd}\n\n${sectionDump}\n<<<END SKILL>>>`;

    // ---- Real Claude path ----
    if (model && /^claude-/i.test(model)) {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) {
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return await streamFromAnthropic({ apiKey: anthropicKey, model, system, messages });
    }

    // ---- Lovable AI Gateway path (default) ----
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const upstream = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || MODELS.fastChat,
        stream: true,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!upstream.ok || !upstream.body) {
      const errBody = await upstream.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: 'gateway_error', status: upstream.status, detail: errBody.slice(0, 500) }),
        { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error).message || e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
