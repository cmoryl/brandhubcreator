/**
 * Skill Chat
 *
 * Streaming chat that puts the exported SKILL.md + reference files into
 * the system prompt, so users can stress-test the skill ("write a tweet",
 * "what HEX for CTA on dark bg") before exporting to Claude. Returns
 * Server-Sent Events compatible with the AI SDK transport (openai
 * stream pass-through).
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const { skill, messages, model } = body as {
      skill: { skillMd: string; sections?: Record<string, string> };
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
    };
    if (!skill?.skillMd || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'skill.skillMd and messages[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sectionDump = Object.entries(skill.sections || {})
      .map(([k, v]) => `## ${k.toUpperCase()}\n${(v || '').slice(0, 8000)}`)
      .join('\n\n');
    const system = `You are operating under the brand skill below. You MUST follow it exactly — never invent colors, fonts, or phrasing outside the skill. When asked for a HEX, font, or rule, quote the exact value from the skill. If the user asks for something the skill doesn't cover, say so plainly.\n\n<<<SKILL>>>\n${skill.skillMd}\n\n${sectionDump}\n<<<END SKILL>>>`;

    const upstream = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'google/gemini-3-flash-preview',
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
      return new Response(JSON.stringify({ error: 'gateway_error', status: upstream.status, detail: errBody.slice(0, 500) }), { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Pass the OpenAI-compatible SSE stream straight through.
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
