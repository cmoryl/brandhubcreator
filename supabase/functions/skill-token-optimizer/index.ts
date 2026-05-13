/**
 * Skill Token Optimizer
 *
 * Input: { files: { [path: string]: string }, targetTokens?: number }
 * Output: { totals, perFile[], suggestions[] }
 *
 * Strategy:
 *  - Compute per-file approx tokens (chars/4)
 *  - Identify oversized references and suggest demotion to "load on demand"
 *  - Use Lovable AI to generate a 1-line condensed summary per oversized ref
 *    that can be inlined into SKILL.md while the full body is moved to a
 *    `references-deep/` folder.
 */
import { requireAiAccess } from '../_shared/requireAiAccess.ts';
import { callLovableAI } from '../_shared/aiGateway.ts';
import { MODELS } from '../_shared/models.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const tok = (s: string) => Math.round((s || '').length / 4);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { files, targetTokens } = await req.json().catch(() => ({}));
    if (!files || typeof files !== 'object') {
      return new Response(JSON.stringify({ error: 'files object required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const target = Number(targetTokens) || 60_000;

    const perFile = Object.entries(files as Record<string, string>)
      .map(([path, body]) => ({ path, tokens: tok(body), bytes: (body || '').length }))
      .sort((a, b) => b.tokens - a.tokens);

    const total = perFile.reduce((s, f) => s + f.tokens, 0);
    const overBudget = Math.max(0, total - target);

    // Pick top files contributing to overage, exclude SKILL.md (must stay)
    const candidates = perFile
      .filter((f) => f.path !== 'SKILL.md' && f.tokens > 1500)
      .slice(0, 6);

    const suggestions: Array<{
      path: string; tokens: number; action: 'condense' | 'demote' | 'split';
      condensedSummary?: string; rationale: string; estSavings: number;
    }> = [];

    for (const c of candidates) {
      const body = (files as any)[c.path] as string;
      let condensedSummary = '';
      try {
        const r = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3.1-flash-lite-preview',
            temperature: 0.1,
            messages: [
              { role: 'system', content: 'You compress brand reference markdown into a SINGLE 2-3 sentence pointer summary suitable for inlining inside SKILL.md. Preserve the most load-bearing facts (HEX, font names, hard rules). Never invent. Output plain text only.' },
              { role: 'user', content: body.slice(0, 12000) },
            ],
          }),
        });
        const j = await r.json().catch(() => ({}));
        condensedSummary = String(j?.choices?.[0]?.message?.content || '').trim().slice(0, 600);
      } catch { /* ignore */ }

      const action: 'condense' | 'demote' | 'split' =
        c.tokens > 8000 ? 'split' : c.tokens > 3000 ? 'demote' : 'condense';
      const estSavings = action === 'split' ? Math.round(c.tokens * 0.6) : Math.round(c.tokens * 0.85);
      suggestions.push({
        path: c.path,
        tokens: c.tokens,
        action,
        condensedSummary,
        rationale:
          action === 'split'
            ? 'Very large; split into per-topic files under references-deep/ and keep a 1-line pointer in SKILL.md.'
            : action === 'demote'
            ? 'Move full body to references-deep/ and replace inline mention with a 1-line pointer.'
            : 'Inline-condense — replace verbose sections with the condensed summary.',
        estSavings,
      });
    }

    const projectedTotal = total - suggestions.reduce((s, x) => s + x.estSavings, 0);

    return new Response(JSON.stringify({
      totals: { total, target, overBudget, projectedTotal },
      perFile,
      suggestions,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
