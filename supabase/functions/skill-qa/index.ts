/**
 * Claude Skill QA harness
 *
 * Accepts a built skill (SKILL.md + reference section text) and runs a battery
 * of brand-compliance test prompts against three Lovable-AI-Gateway model tiers
 * acting as proxies for Claude Haiku/Sonnet/Opus:
 *
 *   haiku  -> google/gemini-2.5-flash-lite
 *   sonnet -> google/gemini-3-flash-preview
 *   opus   -> openai/gpt-5
 *
 * Each model's response is graded by a judge model (openai/gpt-5-mini)
 * which returns structured JSON: per-section adherence + recurring misuses.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface SkillPayload {
  brandName: string;
  skillMd: string;
  sections: Partial<Record<SectionId, string>>;
}

type SectionId =
  | 'colors'
  | 'typography'
  | 'logos'
  | 'voice'
  | 'imagery'
  | 'antiPatterns';

type ModelTier = 'haiku' | 'sonnet' | 'opus';

const MODEL_MAP: Record<ModelTier, string> = {
  haiku: 'google/gemini-2.5-flash-lite',
  sonnet: 'google/gemini-3-flash-preview',
  opus: 'openai/gpt-5',
};

const JUDGE_MODEL = 'openai/gpt-5-mini';

const TESTS: Record<SectionId, { label: string; prompt: string; criteria: string }> = {
  colors: {
    label: 'Colors',
    prompt:
      "Write a one-paragraph product announcement for the brand and explicitly state which brand colors (give HEX values) you would use for: (a) headline text, (b) background, (c) CTA button. Only use colors from the brand skill.",
    criteria:
      'Every HEX value in the response must appear in the brand skill colors section. Any invented or "close" HEX is a misuse. Roles should map sensibly.',
  },
  typography: {
    label: 'Typography',
    prompt:
      "Suggest fonts for a hero headline (1) and body paragraph (2) for a new landing page. Name the exact font family and weight.",
    criteria:
      'Every font family must be listed in the brand skill typography section. Substitutions like Arial/Helvetica fallback are misuses unless the skill authorizes them.',
  },
  logos: {
    label: 'Logos',
    prompt:
      "Describe how to place the brand logo on a dark photo background for a social post. Include variant choice, clearspace, minimum size, and what NOT to do.",
    criteria:
      'Must pick an approved variant from the skill, never recolor/stretch/rotate or add effects, and respect clearspace/minimum-size rules if present.',
  },
  voice: {
    label: 'Voice & Tone',
    prompt:
      "Write a 240-character tweet announcing a new product feature in the brand's voice.",
    criteria:
      'Tone and personality must match the skill voice profile. Any phrasing on the Don\'t list is a misuse. Generic corporate filler is a misuse if the skill forbids it.',
  },
  imagery: {
    label: 'Imagery',
    prompt:
      "Describe (in words) a hero image for an upcoming campaign for this brand. Specify subject, composition, mood, and color treatment.",
    criteria:
      'Must match the approved imagery direction in the skill. Off-brand subjects, banned styles, or human-photography use where forbidden are misuses.',
  },
  antiPatterns: {
    label: 'Anti-patterns',
    prompt:
      "Critique this draft for brand compliance and flag every violation: 'Hey folks! Our SUPER amazing new thing is here 🚀🚀🚀 — grab yours now before it's gone forever!!!'.",
    criteria:
      'Must identify violations against the brand voice and any anti-patterns. Missing obvious violations counts as a missed-section signal.',
  },
};

const JUDGE_SCHEMA_INSTRUCTION = `Return ONLY a JSON object with this exact shape (no prose, no markdown fences):
{
  "score": <0-100 integer, how well the response follows the brand skill>,
  "section_used": <true|false, whether the response actually consulted this section>,
  "misuses": [<short string descriptions of specific violations, max 6>],
  "missing_info": [<short strings: info the response needed but did not pull from the skill>],
  "summary": "<one-sentence verdict>"
}`;

async function callGateway(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { responseFormatJson?: boolean } = {},
): Promise<{ ok: boolean; status: number; text: string; raw?: any }> {
  const body: any = { model, messages, temperature: 0.2 };
  if (opts.responseFormatJson) {
    body.response_format = { type: 'json_object' };
  }
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const raw = await res.json().catch(() => ({}));
  const text = raw?.choices?.[0]?.message?.content ?? '';
  return { ok: res.ok, status: res.status, text, raw };
}

function safeParseJudge(text: string): {
  score: number;
  section_used: boolean;
  misuses: string[];
  missing_info: string[];
  summary: string;
} {
  const fallback = {
    score: 0,
    section_used: false,
    misuses: ['judge_parse_error'],
    missing_info: [],
    summary: 'Judge response could not be parsed as JSON.',
  };
  if (!text) return fallback;
  // Strip ``` fences if present
  let cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  // Grab the first {...} block
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) cleaned = m[0];
  try {
    const o = JSON.parse(cleaned);
    return {
      score: Math.max(0, Math.min(100, Number(o.score) || 0)),
      section_used: Boolean(o.section_used),
      misuses: Array.isArray(o.misuses) ? o.misuses.slice(0, 8).map(String) : [],
      missing_info: Array.isArray(o.missing_info) ? o.missing_info.slice(0, 6).map(String) : [],
      summary: String(o.summary || '').slice(0, 280),
    };
  } catch {
    return fallback;
  }
}

interface SectionResult {
  section: SectionId;
  label: string;
  modelOutput: string;
  judge: ReturnType<typeof safeParseJudge>;
}

interface ModelReport {
  tier: ModelTier;
  proxy: string;
  results: SectionResult[];
  avgScore: number;
  missingSections: SectionId[];
  topMisuses: Array<{ misuse: string; count: number }>;
  errors: string[];
}

async function runForModel(
  apiKey: string,
  tier: ModelTier,
  skill: SkillPayload,
  sections: SectionId[],
): Promise<ModelReport> {
  const proxy = MODEL_MAP[tier];
  const report: ModelReport = {
    tier,
    proxy,
    results: [],
    avgScore: 0,
    missingSections: [],
    topMisuses: [],
    errors: [],
  };

  const skillContextFull = `${skill.skillMd}\n\n---\n\n${Object.entries(skill.sections)
    .map(([k, v]) => `## ${k.toUpperCase()}\n${v || '(empty)'}`)
    .join('\n\n')}`.slice(0, 24000);

  for (const sec of sections) {
    const test = TESTS[sec];
    if (!test) continue;
    const system = `You are an assistant operating under the following brand skill. You MUST adhere to the skill and never invent values outside it.\n\n<<<SKILL>>>\n${skillContextFull}\n<<<END SKILL>>>`;
    const userPrompt = test.prompt;

    let modelOutput = '';
    const gen = await callGateway(apiKey, proxy, [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ]);
    if (!gen.ok) {
      report.errors.push(`${sec}:${gen.status}`);
      report.results.push({
        section: sec,
        label: test.label,
        modelOutput: `(gateway error ${gen.status})`,
        judge: safeParseJudge(''),
      });
      continue;
    }
    modelOutput = gen.text;

    const judgeSystem = `You are a brand-compliance auditor. Use ONLY the brand skill provided to grade the response. ${JUDGE_SCHEMA_INSTRUCTION}`;
    const judgeUser = `BRAND SKILL:\n${skillContextFull}\n\nSECTION UNDER TEST: ${sec}\nCRITERIA: ${test.criteria}\n\nTEST PROMPT GIVEN TO MODEL:\n${userPrompt}\n\nMODEL RESPONSE:\n${modelOutput}\n\nReturn the JSON object now.`;
    const judgeRes = await callGateway(
      apiKey,
      JUDGE_MODEL,
      [
        { role: 'system', content: judgeSystem },
        { role: 'user', content: judgeUser },
      ],
      { responseFormatJson: true },
    );
    const judge = safeParseJudge(judgeRes.text);

    report.results.push({
      section: sec,
      label: test.label,
      modelOutput: modelOutput.slice(0, 4000),
      judge,
    });
  }

  // Aggregate
  const scored = report.results.filter((r) => r.judge.score >= 0);
  report.avgScore = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.judge.score, 0) / scored.length)
    : 0;
  report.missingSections = report.results
    .filter((r) => !r.judge.section_used || r.judge.score < 50)
    .map((r) => r.section);

  const misuseCounts = new Map<string, number>();
  report.results.forEach((r) => {
    r.judge.misuses.forEach((m) => {
      const key = m.trim().toLowerCase().slice(0, 80);
      if (!key) return;
      misuseCounts.set(key, (misuseCounts.get(key) || 0) + 1);
    });
  });
  report.topMisuses = Array.from(misuseCounts.entries())
    .map(([misuse, count]) => ({ misuse, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return report;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Light auth: require a Bearer token. We don't validate it — preview session
    // is auto-injected and this is admin-gated client-side.
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { skill, tiers, sections } = body as {
      skill: SkillPayload;
      tiers?: ModelTier[];
      sections?: SectionId[];
    };

    if (!skill?.skillMd || !skill?.brandName) {
      return new Response(
        JSON.stringify({ error: 'Missing skill.skillMd or skill.brandName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const runTiers = (tiers?.length ? tiers : (['haiku', 'sonnet', 'opus'] as ModelTier[])).filter(
      (t) => t in MODEL_MAP,
    );
    const runSections = (sections?.length
      ? sections
      : (Object.keys(TESTS) as SectionId[])
    ).filter((s) => s in TESTS);

    const reports: ModelReport[] = [];
    for (const tier of runTiers) {
      const r = await runForModel(apiKey, tier, skill, runSections);
      reports.push(r);
    }

    // Cross-model aggregate: sections that ≥2 models failed on
    const sectionFailCounts = new Map<SectionId, number>();
    reports.forEach((rep) =>
      rep.missingSections.forEach((s) =>
        sectionFailCounts.set(s, (sectionFailCounts.get(s) || 0) + 1),
      ),
    );
    const consistentlyMissing = Array.from(sectionFailCounts.entries())
      .filter(([, c]) => c >= 2)
      .map(([s]) => s);

    // Cross-model recurring misuses
    const allMisuses = new Map<string, number>();
    reports.forEach((r) =>
      r.topMisuses.forEach((m) =>
        allMisuses.set(m.misuse, (allMisuses.get(m.misuse) || 0) + m.count),
      ),
    );
    const recurringMisuses = Array.from(allMisuses.entries())
      .map(([misuse, count]) => ({ misuse, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        brandName: skill.brandName,
        ranAt: new Date().toISOString(),
        reports,
        summary: {
          consistentlyMissing,
          recurringMisuses,
          avgScoreByTier: Object.fromEntries(reports.map((r) => [r.tier, r.avgScore])),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
