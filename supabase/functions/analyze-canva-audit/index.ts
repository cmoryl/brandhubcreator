/**
 * analyze-canva-audit
 *
 * Reads the static Canva audit registry (replicated server-side) + the
 * published audit HTML reports, computes deterministic template-hygiene
 * findings (naming, casing, stale, duplicates, gaps), asks Lovable AI for
 * a short narrative + recommendation list, and writes the result into
 * three places:
 *   1. public.canva_audit_analyses  (per brand+audit cache)
 *   2. public.brand_intelligence.competitive_landscape.canvaAudits[]  (Brain)
 *   3. public.recommendation_actions  (top 5 actions, deduped)
 *
 * Triggered manually from the CanvaAuditsSection cards and auto-debounced
 * on audit page open. Idempotent — skips re-analysis if the source hash
 * matches and last_analyzed_at < 24h ago, unless ?force=1 is set.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireAiAccess } from '../_shared/requireAiAccess.ts';
import { callLovableAI, AIGatewayError } from '../_shared/aiGateway.ts';

// --------------------------------------------------------------------------
// Server-side replica of the audit registry. Kept in sync with
// src/data/canvaAudits.ts. If you add a new audit there, mirror it here.
// --------------------------------------------------------------------------
interface AuditDef {
  slug: string;
  title: string;
  division: string;
  htmlUrl: string; // absolute or origin-relative
  category: string;
}

const AUDITS_BY_BRAND: Record<string, AuditDef[]> = {
  transperfect: [
    {
      slug: '/transperfect-canva-audit',
      title: 'Canva Master Registry + Audit',
      division: 'All Divisions',
      htmlUrl: '/transperfect/canva-audit.html',
      category: 'master',
    },
    {
      slug: '/transperfect-lifesciences-canva-audit',
      title: 'Life Sciences Canva Audit',
      division: 'Life Sciences',
      htmlUrl: '/transperfect/lifesci-canva-audit.html',
      category: 'division',
    },
    {
      slug: '/transperfect-dataforce-template-inventory',
      title: 'Dataforce Template Inventory',
      division: 'Dataforce',
      htmlUrl: '/transperfect/dataforce-template-inventory.html',
      category: 'division',
    },
  ],
};

interface RequestBody {
  brandId?: string | null;
  brandSlug: string;
  organizationId: string;
  auditSlug?: string; // omit = run all audits for the brand
  force?: boolean;
}

interface Template {
  name: string;
  category?: string;
  updatedAt?: string;
  size?: string;
}

interface Finding {
  key: string;
  severity: 'low' | 'medium' | 'high';
  type:
    | 'typo'
    | 'casing'
    | 'naming_inconsistency'
    | 'stale'
    | 'duplicate'
    | 'category_gap'
    | 'format_gap';
  message: string;
  templateNames?: string[];
}

// --------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const gate = await requireAiAccess(req, { corsHeaders });
  if (gate.response) return gate.response;
  const { userId } = gate;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }
  if (!body.brandSlug || !body.organizationId) {
    return json(400, { error: 'brandSlug and organizationId are required' });
  }

  const audits = (AUDITS_BY_BRAND[body.brandSlug.toLowerCase()] ?? []).filter(
    (a) => !body.auditSlug || a.slug === body.auditSlug,
  );
  if (audits.length === 0) {
    return json(404, { error: `No Canva audits registered for brand "${body.brandSlug}"` });
  }

  // Service-role client for writes that bypass RLS (we authorize via requireAiAccess
  // + organization scope check already done by caller selection).
  const serviceUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return json(500, { error: 'LOVABLE_API_KEY not configured' });
  const admin = createClient(serviceUrl, serviceKey);

  // Confirm the user actually belongs to this org (defense in depth).
  const { data: membership } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('user_id', userId)
    .eq('organization_id', body.organizationId)
    .maybeSingle();
  if (!membership) return json(403, { error: 'Not a member of this organization' });

  const origin = new URL(req.url).origin
    .replace(`/functions/v1/analyze-canva-audit`, '')
    .replace(`.functions.supabase.co`, '.lovable.app');
  // The published HTML files live on the app's public origin, not on Supabase.
  // The caller should pass the app origin via the Origin header; fall back to
  // a sensible default if it's missing.
  const appOrigin =
    req.headers.get('origin') ||
    req.headers.get('referer')?.replace(/\/[^/]*$/, '') ||
    origin ||
    'https://brandhubcreator.lovable.app';

  const results: any[] = [];

  for (const audit of audits) {
    try {
      const result = await analyzeOne(audit, body, appOrigin, admin, apiKey, userId);
      results.push(result);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[analyze-canva-audit] ${audit.slug} failed:`, msg);
      if (e instanceof AIGatewayError && e.code === 'payment_required') {
        return json(402, { error: e.message });
      }
      if (e instanceof AIGatewayError && e.code === 'rate_limited') {
        return json(429, { error: e.message });
      }
      results.push({ auditSlug: audit.slug, ok: false, error: msg });
    }
  }

  return json(200, { ok: true, results });
});

// --------------------------------------------------------------------------
async function analyzeOne(
  audit: AuditDef,
  body: RequestBody,
  appOrigin: string,
  admin: ReturnType<typeof createClient>,
  apiKey: string,
  userId: string,
) {
  // 1. Fetch & parse the audit HTML to extract templates.
  const htmlUrl = audit.htmlUrl.startsWith('http')
    ? audit.htmlUrl
    : `${appOrigin}${audit.htmlUrl}`;
  const templates = await fetchAndParseAudit(htmlUrl);

  // 2. Compute the source hash. If we've analyzed this exact corpus in
  //    the last 24h, skip unless force.
  const sourceHash = await hash(JSON.stringify({ slug: audit.slug, templates }));
  const { data: existing } = await admin
    .from('canva_audit_analyses')
    .select('id, source_hash, last_analyzed_at')
    .eq('brand_slug', body.brandSlug)
    .eq('audit_slug', audit.slug)
    .maybeSingle();

  if (
    !body.force &&
    existing?.source_hash === sourceHash &&
    existing.last_analyzed_at &&
    Date.now() - new Date(existing.last_analyzed_at).getTime() < 24 * 3600_000
  ) {
    return { auditSlug: audit.slug, ok: true, skipped: 'fresh_cache' };
  }

  // 3. Compute deterministic findings.
  const findings = computeFindings(templates);
  const categoryBreakdown = bucketByCategory(templates);
  const flagCount = findings.length;
  const healthScore = computeHealthScore(templates, findings);

  // 4. Ask Lovable AI for narrative + actionable recommendations.
  const { summary, recommendations } = await synthesizeNarrative(
    apiKey,
    audit,
    templates,
    findings,
    categoryBreakdown,
    healthScore,
    body,
    userId,
  );

  // 5. Upsert into canva_audit_analyses.
  const row = {
    organization_id: body.organizationId,
    brand_id: body.brandId ?? null,
    brand_slug: body.brandSlug,
    audit_slug: audit.slug,
    audit_title: audit.title,
    template_count: templates.length,
    flag_count: flagCount,
    category_count: Object.keys(categoryBreakdown).length,
    health_score: healthScore,
    findings,
    summary,
    recommendations,
    category_breakdown: categoryBreakdown,
    model_used: 'google/gemini-3-flash-preview',
    source_hash: sourceHash,
    last_analyzed_at: new Date().toISOString(),
  };
  const { error: upsertErr } = await admin
    .from('canva_audit_analyses')
    .upsert(row, { onConflict: 'brand_slug,audit_slug' });
  if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);

  // 6. Merge into brand_intelligence.competitive_landscape.canvaAudits[]
  if (body.brandId) {
    await mergeIntoBrain(admin, body, audit, row);
  }

  // 7. Push the top 5 recommendations into recommendation_actions.
  await pushRecommendations(admin, body, audit, recommendations);

  return {
    auditSlug: audit.slug,
    ok: true,
    templateCount: templates.length,
    flagCount,
    healthScore,
  };
}

// --------------------------------------------------------------------------
// HTML parsing — extracts <table> rows naming Templates / Names / Categories
// from the published audit reports.
// --------------------------------------------------------------------------
async function fetchAndParseAudit(url: string): Promise<Template[]> {
  let html = '';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.warn(`[analyze-canva-audit] HTML fetch ${url} -> ${res.status}`);
      return [];
    }
    html = await res.text();
  } catch (e) {
    console.warn(`[analyze-canva-audit] fetch failed for ${url}: ${(e as Error).message}`);
    return [];
  }

  // Try to find <tr> rows with at least 2 <td>s. Treat the first cell as the
  // template name, second as category, third (optional) as updated_at.
  const templates: Template[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      cells.push(stripHtml(cellMatch[1]).trim());
    }
    if (cells.length < 1) continue;
    const name = cells[0];
    if (!name || name.length < 2 || /^name$|^template$/i.test(name)) continue;
    // Heuristic: skip header rows / pure numbers.
    if (/^\d+$/.test(name)) continue;
    templates.push({
      name,
      category: cells[1] || undefined,
      updatedAt: cells.find((c) => /\d{4}-\d{2}-\d{2}|\b20\d{2}\b/.test(c)) || undefined,
      size: cells.find((c) => /\d+\s*×\s*\d+|\d+x\d+/i.test(c)) || undefined,
    });
  }
  return templates;
}

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

// --------------------------------------------------------------------------
// Deterministic findings — no AI required.
// --------------------------------------------------------------------------
const COMMON_TYPOS = [
  'transperfct',
  'transpefect',
  'lifescienes',
  'lifescience ',
  'dataforse',
  'managment',
  'recieve',
  'occured',
  'seperately',
  'definately',
];

function computeFindings(templates: Template[]): Finding[] {
  if (templates.length === 0) return [];
  const findings: Finding[] = [];

  // 1. Typo detection.
  for (const t of templates) {
    const lc = t.name.toLowerCase();
    const hit = COMMON_TYPOS.find((typo) => lc.includes(typo));
    if (hit) {
      findings.push({
        key: `typo:${hit}:${t.name}`,
        severity: 'high',
        type: 'typo',
        message: `Possible typo "${hit}" in "${t.name}"`,
        templateNames: [t.name],
      });
    }
  }

  // 2. Casing variants of the brand mark.
  const brandTokenCounts = new Map<string, string[]>();
  for (const t of templates) {
    const tokens = t.name.match(/\b(TransPerfect|Transperfect|TRANSPERFECT|Dataforce|DataForce|DATAFORCE|LifeSci|LifeSciences|Life Sciences)\b/g) || [];
    for (const tok of tokens) {
      const key = tok.toLowerCase();
      if (!brandTokenCounts.has(key)) brandTokenCounts.set(key, []);
      brandTokenCounts.get(key)!.push(tok);
    }
  }
  const casingGroups = new Map<string, Set<string>>();
  for (const [key, variants] of brandTokenCounts) {
    const root = key.replace(/\s+/g, '');
    if (!casingGroups.has(root)) casingGroups.set(root, new Set());
    for (const v of variants) casingGroups.get(root)!.add(v);
  }
  for (const [root, variants] of casingGroups) {
    if (variants.size > 1) {
      findings.push({
        key: `casing:${root}`,
        severity: 'medium',
        type: 'casing',
        message: `Inconsistent brand-mark casing for "${root}": ${Array.from(variants).join(', ')}`,
      });
    }
  }

  // 3. Stale templates (no updated date OR > 18 months old).
  const now = Date.now();
  const eighteenMo = 540 * 24 * 3600_000;
  const stale: string[] = [];
  for (const t of templates) {
    const dateMatch = t.updatedAt?.match(/(20\d{2})-(\d{2})-(\d{2})/);
    if (!dateMatch) continue;
    const ts = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).getTime();
    if (now - ts > eighteenMo) stale.push(t.name);
  }
  if (stale.length > 0) {
    findings.push({
      key: `stale:${stale.length}`,
      severity: stale.length > 10 ? 'high' : 'medium',
      type: 'stale',
      message: `${stale.length} template${stale.length === 1 ? '' : 's'} not updated in over 18 months`,
      templateNames: stale.slice(0, 8),
    });
  }

  // 4. Duplicate concept detection (normalized name match).
  const norm = new Map<string, string[]>();
  for (const t of templates) {
    const k = t.name.toLowerCase().replace(/\s*[-–—|]\s*\d+\s*[x×]\s*\d+\s*$/, '').replace(/\s+/g, ' ').trim();
    if (!norm.has(k)) norm.set(k, []);
    norm.get(k)!.push(t.name);
  }
  for (const [k, names] of norm) {
    if (names.length >= 3) {
      findings.push({
        key: `dup:${k}`,
        severity: 'low',
        type: 'duplicate',
        message: `${names.length} templates share the concept "${k}"`,
        templateNames: names.slice(0, 6),
      });
    }
  }

  // 5. Category gaps (heuristic — known important categories).
  const cats = new Set(
    templates
      .map((t) => (t.category || '').toLowerCase())
      .filter(Boolean),
  );
  const expected = ['webinar', 'social', 'case stud', 'story', 'event'];
  for (const want of expected) {
    if (!Array.from(cats).some((c) => c.includes(want))) {
      findings.push({
        key: `gap:${want}`,
        severity: 'medium',
        type: 'category_gap',
        message: `No templates found in "${want}" category`,
      });
    }
  }

  // Sort by severity (high → medium → low).
  const order = { high: 0, medium: 1, low: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return findings;
}

function bucketByCategory(templates: Template[]): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const t of templates) {
    const k = (t.category || 'Uncategorized').slice(0, 60);
    buckets[k] = (buckets[k] ?? 0) + 1;
  }
  return buckets;
}

function computeHealthScore(templates: Template[], findings: Finding[]): number {
  if (templates.length === 0) return 0;
  let score = 100;
  for (const f of findings) {
    score -= f.severity === 'high' ? 8 : f.severity === 'medium' ? 4 : 1;
  }
  return Math.max(0, Math.min(100, score));
}

async function hash(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

// --------------------------------------------------------------------------
// AI narrative + recommendations.
// --------------------------------------------------------------------------
async function synthesizeNarrative(
  apiKey: string,
  audit: AuditDef,
  templates: Template[],
  findings: Finding[],
  categoryBreakdown: Record<string, number>,
  healthScore: number,
  body: RequestBody,
  userId: string,
) {
  // Compact context so we stay well under token limits regardless of audit size.
  const ctx = {
    audit: { title: audit.title, division: audit.division },
    metrics: {
      templateCount: templates.length,
      flagCount: findings.length,
      categoryBreakdown,
      healthScore,
    },
    topFindings: findings.slice(0, 12).map((f) => ({
      severity: f.severity,
      type: f.type,
      message: f.message,
    })),
  };

  const system =
    `You are a brand operations analyst. Given a Canva template audit summary, write:
1) A 2-3 sentence executive summary in plain prose.
2) Exactly 5 prioritized recommendations, each one specific and actionable, formatted as JSON.
Return STRICT JSON: { "summary": string, "recommendations": [{"title": string, "rationale": string, "severity": "high"|"medium"|"low", "key": string}] }.
Do not include markdown fences.`;

  const user = `Audit context:\n${JSON.stringify(ctx, null, 2)}`;

  const result = await callLovableAI(apiKey, {
    model: 'google/gemini-3-flash-preview',
    responseFormatJson: true,
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    telemetry: {
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      functionName: 'analyze-canva-audit',
      purpose: 'audit_narrative',
      userId,
      organizationId: body.organizationId,
      entityType: 'brand',
      entityId: body.brandId ?? null,
    },
  });

  const content =
    typeof result.message?.content === 'string'
      ? result.message.content
      : JSON.stringify(result.message?.content ?? {});
  try {
    const parsed = JSON.parse(content);
    return {
      summary: String(parsed.summary || '').slice(0, 1200),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 5)
        : [],
    };
  } catch {
    return { summary: content.slice(0, 1200), recommendations: [] };
  }
}

// --------------------------------------------------------------------------
async function mergeIntoBrain(
  admin: ReturnType<typeof createClient>,
  body: RequestBody,
  audit: AuditDef,
  row: Record<string, any>,
) {
  // Pull the current row, merge cumulatively into competitive_landscape.canvaAudits[].
  const { data: existing } = await admin
    .from('brand_intelligence')
    .select('id, competitive_landscape')
    .eq('entity_type', 'brand')
    .eq('entity_id', body.brandId!)
    .maybeSingle();

  const landscape = (existing?.competitive_landscape as any) || {};
  const audits = Array.isArray(landscape.canvaAudits) ? [...landscape.canvaAudits] : [];
  const next = audits.filter((a: any) => a.auditSlug !== audit.slug);
  next.push({
    auditSlug: audit.slug,
    auditTitle: audit.title,
    division: audit.division,
    healthScore: row.health_score,
    templateCount: row.template_count,
    flagCount: row.flag_count,
    summary: row.summary,
    topFindings: (row.findings as Finding[]).slice(0, 5).map((f) => ({
      severity: f.severity,
      type: f.type,
      message: f.message,
    })),
    lastAnalyzedAt: row.last_analyzed_at,
  });
  landscape.canvaAudits = next;

  if (existing?.id) {
    await admin
      .from('brand_intelligence')
      .update({
        competitive_landscape: landscape,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await admin.from('brand_intelligence').insert({
      entity_type: 'brand',
      entity_id: body.brandId!,
      organization_id: body.organizationId,
      competitive_landscape: landscape,
      last_analyzed_at: new Date().toISOString(),
    });
  }
}

async function pushRecommendations(
  admin: ReturnType<typeof createClient>,
  body: RequestBody,
  audit: AuditDef,
  recommendations: any[],
) {
  if (!recommendations?.length) return;
  const rows = recommendations.slice(0, 5).map((r) => ({
    organization_id: body.organizationId,
    recommendation_key: `canva:${audit.slug}:${r.key || r.title || 'rec'}`.slice(0, 240),
    recommendation_text: [r.title, r.rationale].filter(Boolean).join(' — ').slice(0, 1200),
    source: 'canva_audit',
  }));
  // Avoid dupes: pre-delete same keys, then insert. Safer than upsert without
  // a unique constraint on recommendation_key.
  await admin
    .from('recommendation_actions')
    .delete()
    .eq('organization_id', body.organizationId)
    .in('recommendation_key', rows.map((r) => r.recommendation_key));
  await admin.from('recommendation_actions').insert(rows);
}
