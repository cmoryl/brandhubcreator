/**
 * Skill Auto-Fix
 *
 * Given the current SKILL.md / reference markdown and a QA report with
 * recurring misuses, produces section-level rewrites that close each
 * specific gap. Returns patched markdown for SKILL.md and any referenced
 * section file the model decides to update.
 *
 * Input:  { skill: { skillMd, sections }, misuses: [...], consistentlyMissing: [...] }
 * Output: { patches: { 'SKILL.md'?: string, 'references/<name>.md'?: string }, rationale: string }
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const SECTION_TO_PATH: Record<string, string> = {
  colors: 'references/colors.md',
  typography: 'references/typography.md',
  logos: 'references/logos.md',
  voice: 'references/voice-and-messaging.md',
  imagery: 'references/imagery.md',
  antiPatterns: 'references/anti-patterns.md',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const { skill, misuses, consistentlyMissing } = body as {
      skill: { skillMd: string; sections: Record<string, string> };
      misuses: Array<{ misuse: string; count: number }>;
      consistentlyMissing: string[];
    };
    if (!skill?.skillMd) return new Response(JSON.stringify({ error: 'skill.skillMd required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const tool = {
      type: 'function',
      function: {
        name: 'submit_patches',
        description: 'Submit revised markdown for each file that needs to change to fix the misuses.',
        parameters: {
          type: 'object',
          properties: {
            patches: {
              type: 'object',
              description: 'Map of file path (e.g. SKILL.md, references/colors.md) → full revised markdown for that file.',
              additionalProperties: { type: 'string' },
            },
            rationale: { type: 'string', description: 'One paragraph summarising the changes and why they fix the misuses.' },
            changed_sections: { type: 'array', items: { type: 'string' } },
          },
          required: ['patches', 'rationale', 'changed_sections'],
          additionalProperties: false,
        },
      },
    };

    const sectionContext = Object.entries(skill.sections || {}).map(([k, v]) => `--- ${SECTION_TO_PATH[k] || k} ---\n${v?.slice(0, 6000) || '(empty)'}`).join('\n\n');
    const misuseList = (misuses || []).slice(0, 12).map((m) => `- (${m.count}×) ${m.misuse}`).join('\n') || '(none)';
    const missingList = (consistentlyMissing || []).join(', ') || '(none)';

    const messages = [
      {
        role: 'system',
        content: `You revise Claude Skill markdown files to fix concrete brand-compliance gaps surfaced by QA. Rules:
- Only change the minimum needed to fix the listed misuses or missing sections.
- Keep YAML frontmatter in SKILL.md valid and identical unless wording must change.
- Preserve all factual brand data (HEXes, font names, URLs) verbatim — never invent.
- Make the language concrete, scannable, and instructional ("Use #003D7A for primary CTA. Never tint or shade.").
- Strengthen anti-pattern callouts where misuses indicate the model invented values or used forbidden phrasing.
- Output ONLY a tool call to submit_patches.
- The "patches" argument MUST be a non-empty object whose KEYS are file paths (e.g. "SKILL.md", "references/colors.md", "references/anti-patterns.md") and whose VALUES are the COMPLETE revised markdown for that file (not a diff, not a summary, not a description of changes — the entire new file contents).
- "changed_sections" must list those exact file path keys, identical to the keys of "patches".
- If nothing genuinely needs changing, still return at least one file in "patches" with its current contents unchanged rather than omitting the field.`,
      },
      {
        role: 'user',
        content: `Current SKILL.md:\n\n${skill.skillMd}\n\n=== Section files ===\n${sectionContext}\n\n=== Recurring misuses ===\n${misuseList}\n\n=== Sections missed by ≥2 models ===\n${missingList}\n\nPropose patches now. Remember: "patches" must be an object mapping file paths to full revised markdown.`,
      },
    ];

    async function callModel(model: string, extraMessages: any[] = []) {
      const r = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          tools: [tool],
          tool_choice: { type: 'function', function: { name: 'submit_patches' } },
          messages: [...messages, ...extraMessages],
        }),
      });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, json: j };
    }

    let { ok, status, json: raw } = await callModel('openai/gpt-5');
    if (!ok) {
      return new Response(JSON.stringify({ error: 'autofix_failed', status, detail: raw?.error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let call = raw?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = {};
    try { parsed = JSON.parse(call?.function?.arguments || '{}'); } catch { parsed = {}; }

    // Retry once if the model returned the tool call without the required "patches" object.
    if (!parsed?.patches || typeof parsed.patches !== 'object' || Object.keys(parsed.patches).length === 0) {
      const retry = await callModel('openai/gpt-5', [
        { role: 'assistant', content: null, tool_calls: call ? [call] : [] },
        { role: 'tool', tool_call_id: call?.id || 'missing', name: 'submit_patches', content: 'ERROR: "patches" field was missing or empty. You MUST resubmit submit_patches with patches as an object mapping file paths to the FULL revised markdown for each file you listed in changed_sections.' },
      ]);
      if (retry.ok) {
        raw = retry.json;
        call = raw?.choices?.[0]?.message?.tool_calls?.[0];
        try { parsed = JSON.parse(call?.function?.arguments || '{}'); } catch { parsed = {}; }
      }
    }

    if (!parsed?.patches || typeof parsed.patches !== 'object' || Object.keys(parsed.patches).length === 0) {
      return new Response(JSON.stringify({ error: 'no_patches_returned', raw }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ok: true,
      patches: parsed.patches,
      rationale: String(parsed.rationale || ''),
      changedSections: Array.isArray(parsed.changed_sections) ? parsed.changed_sections : Object.keys(parsed.patches),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
