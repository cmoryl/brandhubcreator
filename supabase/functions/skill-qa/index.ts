/**
 * Claude Skill QA harness (v2)
 *
 * Async, DB-backed job pattern. POST starts a job and returns immediately;
 * heavy work runs via EdgeRuntime.waitUntil and writes progress + partial
 * results to `skill_qa_jobs` (realtime-enabled) and a final report row to
 * `skill_qa_reports`. GET ?jobId=... returns latest status.
 *
 * Improvements over v1:
 *  - Upgraded judges: gemini-3.1-pro-preview (Opus), gemini-3-flash-preview (Sonnet),
 *    gemini-2.5-flash-lite (Haiku). Meta-judge: openai/gpt-5.2.
 *  - Strict JSON-schema enforcement via function-calling tool output.
 *  - Agent loop: judge can call `check_color_contrast` and `count_token_in_skill`
 *    tools to ground its scoring instead of hallucinating.
 *  - Visual regression: renders sample asset via gemini-3.1-flash-image-preview,
 *    vision-grades against the brand's canonical reference.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type SectionId =
  | 'colors' | 'typography' | 'logos' | 'voice' | 'imagery' | 'antiPatterns';
type ModelTier = 'haiku' | 'sonnet' | 'opus';

const MODEL_MAP: Record<ModelTier, string> = {
  haiku: 'google/gemini-3.1-flash-lite-preview',
  sonnet: 'google/gemini-3-flash-preview',
  opus: 'google/gemini-3.1-pro-preview',
};
const JUDGE_MODEL = 'openai/gpt-5.2';
const IMAGE_MODEL = 'google/gemini-3.1-flash-image-preview';
const VISION_JUDGE = 'google/gemini-3.1-pro-preview';

interface SkillPayload {
  brandName: string;
  skillMd: string;
  sections: Partial<Record<SectionId, string>>;
  referenceImageUrl?: string | null; // canonical brand reference for visual regression
}

const TESTS: Record<SectionId, { label: string; prompt: string; criteria: string }> = {
  colors: {
    label: 'Colors',
    prompt: 'Write a one-paragraph product announcement and state exactly which brand HEX colors you would use for (a) headline, (b) background, (c) CTA button. Only use colors from the brand skill.',
    criteria: 'Every HEX must appear verbatim in the colors section. Use `count_token_in_skill` to verify each HEX. Invented or "close" hexes are misuses.',
  },
  typography: {
    label: 'Typography',
    prompt: 'Suggest fonts for a hero headline (1) and body paragraph (2). Name exact font family + weight.',
    criteria: 'Every font family must be listed in typography. Substitutions are misuses unless authorized.',
  },
  logos: {
    label: 'Logos',
    prompt: 'Describe placing the brand logo on a dark photo background for a social post. Cover variant, clearspace, min size, and do-nots.',
    criteria: 'Must pick approved variant, respect clearspace/min-size, never recolor/stretch/rotate.',
  },
  voice: {
    label: 'Voice & Tone',
    prompt: "Write a 240-character tweet announcing a new product feature in the brand's voice.",
    criteria: 'Tone matches voice profile. Anything on the Don\'t list = misuse. Generic filler = misuse if forbidden.',
  },
  imagery: {
    label: 'Imagery',
    prompt: 'Describe a hero image for an upcoming campaign — subject, composition, mood, color treatment.',
    criteria: 'Must match approved imagery direction. Off-brand subjects or banned styles are misuses.',
  },
  antiPatterns: {
    label: 'Anti-patterns',
    prompt: "Critique for brand compliance: 'Hey folks! Our SUPER amazing new thing is here 🚀🚀🚀 — grab yours now before it's gone forever!!!'",
    criteria: 'Must identify every violation against voice and explicit anti-patterns.',
  },
};

// ---------- gateway helpers ----------

interface GatewayMsg { role: string; content: any }

async function callGateway(
  apiKey: string,
  model: string,
  messages: GatewayMsg[],
  opts: { tools?: any[]; toolChoice?: any; responseFormatJson?: boolean; temperature?: number } = {},
): Promise<{ ok: boolean; status: number; raw: any; message: any }> {
  const body: any = { model, messages, temperature: opts.temperature ?? 0.2 };
  if (opts.tools) body.tools = opts.tools;
  if (opts.toolChoice) body.tool_choice = opts.toolChoice;
  if (opts.responseFormatJson) body.response_format = { type: 'json_object' };
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, raw, message: raw?.choices?.[0]?.message ?? {} };
}

// ---------- judge: structured output via tool-call ----------

const JUDGE_TOOL = {
  type: 'function',
  function: {
    name: 'submit_grading',
    description: 'Submit your final grading of the model response against the brand skill.',
    parameters: {
      type: 'object',
      properties: {
        score: { type: 'integer', minimum: 0, maximum: 100, description: 'Overall compliance score' },
        section_used: { type: 'boolean', description: 'Did the response actually consult the section under test?' },
        misuses: { type: 'array', items: { type: 'string' }, maxItems: 6 },
        missing_info: { type: 'array', items: { type: 'string' }, maxItems: 6 },
        summary: { type: 'string', description: 'One-sentence verdict, ≤280 chars' },
      },
      required: ['score', 'section_used', 'misuses', 'missing_info', 'summary'],
      additionalProperties: false,
    },
  },
};

interface JudgeResult {
  score: number; section_used: boolean; misuses: string[]; missing_info: string[]; summary: string;
}

const FALLBACK_JUDGE: JudgeResult = {
  score: 0, section_used: false, misuses: ['judge_parse_error'], missing_info: [], summary: 'Judge response could not be parsed.',
};

function normalizeJudge(args: any): JudgeResult {
  if (!args || typeof args !== 'object') return FALLBACK_JUDGE;
  return {
    score: Math.max(0, Math.min(100, parseInt(String(args.score ?? 0), 10) || 0)),
    section_used: Boolean(args.section_used),
    misuses: Array.isArray(args.misuses) ? args.misuses.slice(0, 8).map(String) : [],
    missing_info: Array.isArray(args.missing_info) ? args.missing_info.slice(0, 6).map(String) : [],
    summary: String(args.summary || '').slice(0, 280),
  };
}

// ---------- judge tools (agent loop) ----------

function buildJudgeTools(skill: SkillPayload) {
  return [
    JUDGE_TOOL,
    {
      type: 'function',
      function: {
        name: 'count_token_in_skill',
        description: 'Count exact case-insensitive occurrences of a token (HEX, font name, phrase) anywhere in the brand skill.',
        parameters: {
          type: 'object',
          properties: { token: { type: 'string' } },
          required: ['token'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_color_contrast',
        description: 'Check WCAG AA contrast ratio between two HEX colors. Returns ratio and pass/fail at 4.5:1.',
        parameters: {
          type: 'object',
          properties: { fg: { type: 'string' }, bg: { type: 'string' } },
          required: ['fg', 'bg'],
          additionalProperties: false,
        },
      },
    },
  ];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace('#', '');
  if (!/^([0-9a-f]{6}|[0-9a-f]{3})$/i.test(m)) return null;
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function relLum([r, g, b]: [number, number, number]): number {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = relLum(ra), lb = relLum(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function execJudgeTool(name: string, args: any, skill: SkillPayload): string {
  try {
    if (name === 'count_token_in_skill') {
      const token = String(args?.token || '');
      if (!token) return JSON.stringify({ count: 0 });
      const hay = `${skill.skillMd}\n${Object.values(skill.sections).join('\n')}`.toLowerCase();
      const t = token.toLowerCase();
      let count = 0; let i = 0;
      while ((i = hay.indexOf(t, i)) !== -1) { count++; i += t.length; }
      return JSON.stringify({ count, token });
    }
    if (name === 'check_color_contrast') {
      const ratio = contrastRatio(String(args?.fg || ''), String(args?.bg || ''));
      if (ratio == null) return JSON.stringify({ error: 'invalid hex' });
      return JSON.stringify({ ratio: Number(ratio.toFixed(2)), passes_AA: ratio >= 4.5, passes_AAA: ratio >= 7 });
    }
  } catch (e) { return JSON.stringify({ error: String((e as Error).message) }); }
  return JSON.stringify({ error: 'unknown tool' });
}

async function runJudgeWithTools(
  apiKey: string,
  skill: SkillPayload,
  section: SectionId,
  test: { label: string; prompt: string; criteria: string },
  modelOutput: string,
  skillContext: string,
): Promise<JudgeResult> {
  const tools = buildJudgeTools(skill);
  const messages: GatewayMsg[] = [
    {
      role: 'system',
      content: `You are a brand-compliance auditor. Use ONLY the brand skill provided. You may call \`count_token_in_skill\` to verify any HEX/font/phrase appears in the skill, and \`check_color_contrast\` to verify legibility. When done, you MUST call \`submit_grading\` with your final verdict. Never write prose outside tool calls.`,
    },
    {
      role: 'user',
      content: `BRAND SKILL (truncated):\n${skillContext}\n\nSECTION UNDER TEST: ${section}\nCRITERIA: ${test.criteria}\n\nTEST PROMPT:\n${test.prompt}\n\nMODEL RESPONSE:\n${modelOutput}\n\nAudit now. Call tools to verify, then submit_grading.`,
    },
  ];

  for (let step = 0; step < 6; step++) {
    const r = await callGateway(apiKey, JUDGE_MODEL, messages, { tools, temperature: 0 });
    if (!r.ok) return { ...FALLBACK_JUDGE, summary: `judge gateway ${r.status}` };
    const msg = r.message;
    const toolCalls = msg?.tool_calls || [];
    if (!toolCalls.length) {
      // try to coerce: ask once more for tool call
      if (step === 0) {
        messages.push({ role: 'assistant', content: msg?.content || '' });
        messages.push({ role: 'user', content: 'You MUST call submit_grading now.' });
        continue;
      }
      return FALLBACK_JUDGE;
    }
    messages.push(msg);
    let submitted: JudgeResult | null = null;
    for (const tc of toolCalls) {
      const name = tc?.function?.name;
      const args = (() => { try { return JSON.parse(tc?.function?.arguments || '{}'); } catch { return {}; } })();
      if (name === 'submit_grading') { submitted = normalizeJudge(args); }
      const result = name === 'submit_grading' ? JSON.stringify({ received: true }) : execJudgeTool(name, args, skill);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result } as any);
    }
    if (submitted) return submitted;
  }
  return FALLBACK_JUDGE;
}

// ---------- per-model run ----------

interface SectionResult { section: SectionId; label: string; modelOutput: string; judge: JudgeResult }
interface ModelReport {
  tier: ModelTier; proxy: string; results: SectionResult[]; avgScore: number;
  missingSections: SectionId[]; topMisuses: Array<{ misuse: string; count: number }>; errors: string[];
}

async function runForModel(
  apiKey: string,
  tier: ModelTier,
  skill: SkillPayload,
  sections: SectionId[],
  onProgress: (label: string) => Promise<void>,
): Promise<ModelReport> {
  const proxy = MODEL_MAP[tier];
  const report: ModelReport = { tier, proxy, results: [], avgScore: 0, missingSections: [], topMisuses: [], errors: [] };
  const skillContextFull = `${skill.skillMd}\n\n---\n\n${Object.entries(skill.sections).map(([k, v]) => `## ${k.toUpperCase()}\n${v || '(empty)'}`).join('\n\n')}`.slice(0, 24000);

  for (const sec of sections) {
    const test = TESTS[sec]; if (!test) continue;
    await onProgress(`${tier}/${sec}`);
    const gen = await callGateway(apiKey, proxy, [
      { role: 'system', content: `You are an assistant operating under this brand skill. You MUST adhere and never invent values outside it.\n\n<<<SKILL>>>\n${skillContextFull}\n<<<END SKILL>>>` },
      { role: 'user', content: test.prompt },
    ]);
    if (!gen.ok) {
      report.errors.push(`${sec}:${gen.status}`);
      report.results.push({ section: sec, label: test.label, modelOutput: `(gateway error ${gen.status})`, judge: FALLBACK_JUDGE });
      continue;
    }
    const modelOutput = gen.message?.content || '';
    const judge = await runJudgeWithTools(apiKey, skill, sec, test, modelOutput, skillContextFull);
    report.results.push({ section: sec, label: test.label, modelOutput: String(modelOutput).slice(0, 4000), judge });
  }

  const scored = report.results.filter((r) => r.judge.score >= 0);
  report.avgScore = scored.length ? Math.round(scored.reduce((s, r) => s + r.judge.score, 0) / scored.length) : 0;
  report.missingSections = report.results.filter((r) => !r.judge.section_used || r.judge.score < 50).map((r) => r.section);
  const counts = new Map<string, number>();
  report.results.forEach((r) => r.judge.misuses.forEach((m) => {
    const k = m.trim().toLowerCase().slice(0, 80); if (k) counts.set(k, (counts.get(k) || 0) + 1);
  }));
  report.topMisuses = Array.from(counts.entries()).map(([misuse, count]) => ({ misuse, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  return report;
}

// ---------- visual regression ----------

async function runVisualRegression(apiKey: string, skill: SkillPayload): Promise<any> {
  try {
    // 1) generate sample asset from skill instructions
    const genRes = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ['image', 'text'],
        messages: [{
          role: 'user',
          content: `Generate a single 1024x1024 marketing key visual that strictly follows ONLY the brand skill below. Use the exact colors, typography style, and imagery direction described.\n\n${skill.skillMd.slice(0, 6000)}\n\nIMAGERY:\n${skill.sections.imagery?.slice(0, 2000) || ''}\n\nCOLORS:\n${skill.sections.colors?.slice(0, 2000) || ''}`,
        }],
      }),
    });
    const genRaw = await genRes.json().catch(() => ({}));
    const imgUrl: string | undefined = genRaw?.choices?.[0]?.message?.images?.[0]?.image_url?.url
      || genRaw?.choices?.[0]?.message?.content?.[0]?.image_url?.url;
    if (!imgUrl) return { ok: false, error: 'no_image_generated', raw: genRaw?.error };

    // 2) vision-grade against canonical reference (if provided)
    const visionMessages: GatewayMsg[] = [{
      role: 'user',
      content: [
        { type: 'text', text: `Compare the GENERATED image to the brand's canonical visual identity. ${skill.referenceImageUrl ? 'The first image is the canonical reference, the second is the generated sample.' : 'Score the generated sample against the brand skill description below.'} Return JSON: {"identity_match":0-100,"color_fidelity":0-100,"composition_match":0-100,"drift_notes":["..."],"verdict":"..."}.\n\nBrand skill imagery rules:\n${skill.sections.imagery?.slice(0, 1500) || '(none)'}` },
        ...(skill.referenceImageUrl ? [{ type: 'image_url', image_url: { url: skill.referenceImageUrl } } as any] : []),
        { type: 'image_url', image_url: { url: imgUrl } } as any,
      ],
    }];
    const r = await callGateway(apiKey, VISION_JUDGE, visionMessages, { responseFormatJson: true, temperature: 0 });
    let scores: any = {};
    try { scores = JSON.parse(r.message?.content || '{}'); } catch { /* */ }
    return { ok: true, generatedImageUrl: imgUrl, referenceImageUrl: skill.referenceImageUrl || null, ...scores };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

// ---------- DB helpers ----------

async function dbUpdate(table: string, id: string, patch: Record<string, any>) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
}
async function dbInsert(table: string, row: Record<string, any>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  return res.json();
}

// ---------- worker ----------

async function runJob(jobId: string, skill: SkillPayload, tiers: ModelTier[], sections: SectionId[], includeVisual: boolean, ctx: { entity_type: string; entity_id: string; organization_id: string | null }) {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')!;
  const total = tiers.length * sections.length + (includeVisual ? 1 : 0);
  let current = 0;
  await dbUpdate('skill_qa_jobs', jobId, { status: 'running', started_at: new Date().toISOString(), progress: { current: 0, total, label: 'starting' } });

  const partial: { reports: ModelReport[] } = { reports: [] };
  try {
    for (const tier of tiers) {
      const rep = await runForModel(apiKey, tier, skill, sections, async (label) => {
        current++;
        await dbUpdate('skill_qa_jobs', jobId, { progress: { current, total, label }, partial_results: partial });
      });
      partial.reports.push(rep);
      await dbUpdate('skill_qa_jobs', jobId, { partial_results: partial });
    }

    let visual: any = null;
    if (includeVisual) {
      current++;
      await dbUpdate('skill_qa_jobs', jobId, { progress: { current, total, label: 'visual-regression' } });
      visual = await runVisualRegression(apiKey, skill);
    }

    // aggregates
    const sectionFails = new Map<SectionId, number>();
    partial.reports.forEach((r) => r.missingSections.forEach((s) => sectionFails.set(s, (sectionFails.get(s) || 0) + 1)));
    const consistentlyMissing = Array.from(sectionFails.entries()).filter(([, c]) => c >= 2).map(([s]) => s);
    const allMis = new Map<string, number>();
    partial.reports.forEach((r) => r.topMisuses.forEach((m) => allMis.set(m.misuse, (allMis.get(m.misuse) || 0) + m.count)));
    const recurringMisuses = Array.from(allMis.entries()).map(([misuse, count]) => ({ misuse, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const avgScoreByTier = Object.fromEntries(partial.reports.map((r) => [r.tier, r.avgScore]));

    const fullReport = {
      brandName: skill.brandName,
      ranAt: new Date().toISOString(),
      reports: partial.reports,
      visualRegression: visual,
      summary: { consistentlyMissing, recurringMisuses, avgScoreByTier },
    };

    await dbInsert('skill_qa_reports', {
      job_id: jobId,
      organization_id: ctx.organization_id,
      entity_type: ctx.entity_type,
      entity_id: ctx.entity_id,
      brand_name: skill.brandName,
      avg_score_by_tier: avgScoreByTier,
      consistently_missing: consistentlyMissing,
      recurring_misuses: recurringMisuses,
      visual_regression: visual,
      full_report: fullReport,
    });

    await dbUpdate('skill_qa_jobs', jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: { current: total, total, label: 'done' },
      partial_results: fullReport,
    });
  } catch (e) {
    await dbUpdate('skill_qa_jobs', jobId, {
      status: 'failed', error: String((e as Error).message || e), completed_at: new Date().toISOString(),
    });
  }
}

// ---------- HTTP ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!Deno.env.get('LOVABLE_API_KEY')) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const jobId = url.searchParams.get('jobId');
      if (!jobId) return new Response(JSON.stringify({ error: 'jobId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const res = await fetch(`${SUPABASE_URL}/rest/v1/skill_qa_jobs?id=eq.${jobId}&select=*`, {
        headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
      });
      const rows = await res.json();
      return new Response(JSON.stringify(rows?.[0] || null), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const { skill, tiers, sections, includeVisualRegression, context } = body as {
      skill: SkillPayload;
      tiers?: ModelTier[];
      sections?: SectionId[];
      includeVisualRegression?: boolean;
      context: { entity_type: 'brand' | 'product' | 'event'; entity_id: string; organization_id?: string | null; user_id?: string | null };
    };
    if (!skill?.skillMd || !skill?.brandName || !context?.entity_type || !context?.entity_id) {
      return new Response(JSON.stringify({ error: 'Missing skill or context' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const runTiers = ((tiers?.length ? tiers : ['haiku', 'sonnet', 'opus']) as ModelTier[]).filter((t) => t in MODEL_MAP);
    const runSections = ((sections?.length ? sections : Object.keys(TESTS)) as SectionId[]).filter((s) => s in TESTS);
    const includeVisual = includeVisualRegression !== false;

    const inserted = await dbInsert('skill_qa_jobs', {
      organization_id: context.organization_id || null,
      user_id: context.user_id || null,
      entity_type: context.entity_type,
      entity_id: context.entity_id,
      brand_name: skill.brandName,
      tiers: runTiers,
      sections: runSections,
      include_visual_regression: includeVisual,
      status: 'queued',
      progress: { current: 0, total: runTiers.length * runSections.length + (includeVisual ? 1 : 0), label: 'queued' },
    });
    const jobId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'failed_to_create_job', detail: inserted }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // @ts-ignore EdgeRuntime is provided by Supabase
    EdgeRuntime.waitUntil(runJob(jobId, skill, runTiers, runSections, includeVisual, { entity_type: context.entity_type, entity_id: context.entity_id, organization_id: context.organization_id || null }));

    return new Response(JSON.stringify({ jobId, status: 'queued' }), { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
