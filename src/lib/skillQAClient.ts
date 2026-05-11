/**
 * Skill QA client — async job + realtime.
 *
 * Flow:
 *  1. Build the exact SKILL.md + reference markdown files the exporter writes.
 *  2. POST to `skill-qa` which creates a `skill_qa_jobs` row and returns jobId.
 *  3. Subscribe to that row via Supabase Realtime; resolve when status==='completed'.
 */
import { supabase } from '@/integrations/supabase/client';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export type SectionId =
  | 'colors' | 'typography' | 'logos' | 'voice' | 'imagery' | 'antiPatterns';
export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export interface SkillQAJudgeResult {
  score: number; section_used: boolean; misuses: string[]; missing_info: string[]; summary: string;
}
export interface SkillQASectionResult {
  section: SectionId; label: string; modelOutput: string; judge: SkillQAJudgeResult;
}
export interface SkillQAModelReport {
  tier: ModelTier; proxy: string; results: SkillQASectionResult[]; avgScore: number;
  missingSections: SectionId[]; topMisuses: Array<{ misuse: string; count: number }>; errors: string[];
}
export interface VisualRegressionResult {
  ok: boolean;
  generatedImageUrl?: string;
  referenceImageUrl?: string | null;
  identity_match?: number;
  color_fidelity?: number;
  composition_match?: number;
  drift_notes?: string[];
  verdict?: string;
  error?: string;
}
export interface SkillQAReport {
  brandName: string;
  ranAt: string;
  reports: SkillQAModelReport[];
  visualRegression?: VisualRegressionResult | null;
  summary: {
    consistentlyMissing: SectionId[];
    recurringMisuses: Array<{ misuse: string; count: number }>;
    avgScoreByTier: Record<ModelTier, number>;
  };
}

export interface SkillQAJobRow {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: { current: number; total: number; label: string };
  partial_results: any;
  error: string | null;
  brand_name: string;
}

async function buildSkillPayload(guide: AnyGuide) {
  const mod = await import('@/lib/exportClaudeSkill');
  const brandName = guide.hero?.name || 'Guide';
  const { blob } = await mod.exportGuideAsClaudeSkill(guide, {
    embedAssets: false, includeIntelligence: false, skipValidation: true,
  });
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(blob);
  const folder = Object.keys(zip.files).find((p) => p.endsWith('/SKILL.md'))?.split('/')[0];
  const root = folder ? zip.folder(folder)! : zip;
  const read = async (path: string) => (await root.file(path)?.async('string')) || '';
  const skillMd = await read('SKILL.md');
  const sections: Partial<Record<SectionId, string>> = {
    colors: await read('references/colors.md'),
    typography: await read('references/typography.md'),
    logos: await read('references/logos.md'),
    voice: await read('references/voice-and-messaging.md'),
    imagery: await read('references/imagery.md'),
    antiPatterns: await read('references/anti-patterns.md'),
  };

  // Pick a canonical reference image for visual regression
  const referenceImageUrl: string | null =
    (guide as any).hero?.coverImage ||
    (guide as any).hero?.cardImage ||
    (guide as any).imagery?.gallery?.[0]?.url ||
    null;

  return { brandName, skillMd, sections, referenceImageUrl };
}

export interface RunOptions {
  tiers?: ModelTier[];
  sections?: SectionId[];
  includeVisualRegression?: boolean;
  onProgress?: (job: SkillQAJobRow) => void;
}

/** Starts an async skill-qa job and resolves when it completes. */
export async function runSkillQA(guide: AnyGuide, opts: RunOptions = {}): Promise<SkillQAReport> {
  const skill = await buildSkillPayload(guide);
  const kind = ((guide as any).type || 'brand') as 'brand' | 'product' | 'event';
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase.functions.invoke('skill-qa', {
    body: {
      skill,
      tiers: opts.tiers,
      sections: opts.sections,
      includeVisualRegression: opts.includeVisualRegression !== false,
      context: {
        entity_type: kind,
        entity_id: guide.id,
        organization_id: (guide as any).organizationId || (guide as any).organization_id || null,
        user_id: userData?.user?.id || null,
      },
    },
  });
  if (error) throw new Error(error.message || 'skill-qa failed');
  const jobId: string | undefined = (data as any)?.jobId;
  if (!jobId) throw new Error((data as any)?.error || 'no job id returned');

  return await waitForJob(jobId, opts.onProgress);
}

async function fetchJob(jobId: string): Promise<SkillQAJobRow | null> {
  const { data } = await supabase.from('skill_qa_jobs').select('*').eq('id', jobId).maybeSingle();
  return (data as any) || null;
}

export function waitForJob(jobId: string, onProgress?: (j: SkillQAJobRow) => void): Promise<SkillQAReport> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const finish = (row: SkillQAJobRow | null) => {
      if (!row || resolved) return;
      if (row.status === 'completed') {
        resolved = true;
        channel.unsubscribe();
        clearInterval(poll);
        resolve(row.partial_results as SkillQAReport);
      } else if (row.status === 'failed') {
        resolved = true;
        channel.unsubscribe();
        clearInterval(poll);
        reject(new Error(row.error || 'skill-qa job failed'));
      } else {
        onProgress?.(row);
      }
    };

    const channel = supabase
      .channel(`skill-qa-${jobId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'skill_qa_jobs', filter: `id=eq.${jobId}` },
        (payload) => finish(payload.new as any))
      .subscribe();

    // Fallback poll in case realtime drops a packet
    const poll = setInterval(async () => {
      const row = await fetchJob(jobId);
      if (row) finish(row);
    }, 4000);

    // Initial fetch (in case it already finished by the time we subscribe)
    fetchJob(jobId).then((row) => row && finish(row));
  });
}

export interface SkillQAHistoryRow {
  id: string;
  created_at: string;
  brand_name: string;
  avg_score_by_tier: Record<string, number>;
  consistently_missing: string[];
  visual_regression: VisualRegressionResult | null;
  full_report: SkillQAReport;
}

export async function fetchSkillQAHistory(entityType: string, entityId: string, limit = 10): Promise<SkillQAHistoryRow[]> {
  const { data, error } = await supabase
    .from('skill_qa_reports')
    .select('id, created_at, brand_name, avg_score_by_tier, consistently_missing, visual_regression, full_report')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as any) || [];
}

export function reportToMarkdown(r: SkillQAReport): string {
  const lines: string[] = [];
  lines.push(`# Skill QA Report — ${r.brandName}`);
  lines.push(`_Ran ${r.ranAt}_`);
  lines.push('');
  lines.push('## Average score by model tier');
  Object.entries(r.summary.avgScoreByTier).forEach(([tier, score]) => lines.push(`- **${tier}**: ${score}/100`));
  lines.push('');
  if (r.visualRegression && r.visualRegression.ok) {
    lines.push('## Visual regression');
    if (typeof r.visualRegression.identity_match === 'number') lines.push(`- Identity match: ${r.visualRegression.identity_match}/100`);
    if (typeof r.visualRegression.color_fidelity === 'number') lines.push(`- Color fidelity: ${r.visualRegression.color_fidelity}/100`);
    if (typeof r.visualRegression.composition_match === 'number') lines.push(`- Composition: ${r.visualRegression.composition_match}/100`);
    (r.visualRegression.drift_notes || []).forEach((d) => lines.push(`- drift: ${d}`));
    if (r.visualRegression.verdict) lines.push(`- ${r.visualRegression.verdict}`);
    lines.push('');
  }
  if (r.summary.consistentlyMissing.length) {
    lines.push('## Sections missed by ≥2 models');
    r.summary.consistentlyMissing.forEach((s) => lines.push(`- ${s}`));
    lines.push('');
  }
  if (r.summary.recurringMisuses.length) {
    lines.push('## Top recurring misuses');
    r.summary.recurringMisuses.forEach((m) => lines.push(`- (${m.count}×) ${m.misuse}`));
    lines.push('');
  }
  r.reports.forEach((rep) => {
    lines.push(`## ${rep.tier} (${rep.proxy}) — avg ${rep.avgScore}/100`);
    rep.results.forEach((res) => {
      lines.push(`- **${res.label}** — ${res.judge.score}/100 ${res.judge.section_used ? '✓ used section' : '✗ section not used'}`);
      if (res.judge.misuses.length) res.judge.misuses.forEach((m) => lines.push(`  - misuse: ${m}`));
      if (res.judge.summary) lines.push(`  - ${res.judge.summary}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

// --------- PDF Vision helper ---------
export interface PdfVisionTokens {
  colors?: Array<{ name?: string; hex?: string; role?: string; notes?: string }>;
  typography?: Array<{ family?: string; weights?: string[]; usage?: string; pairing?: string }>;
  logos?: { variants?: string[]; clearspace?: string; minSize?: string; donts?: string[]; backgrounds?: string[] };
  layout?: { grid?: string; spacingScale?: string; cornerRadius?: string; elevation?: string };
  imagery?: { direction?: string; subjects?: string[]; composition?: string; colorTreatment?: string; banned?: string[] };
  doDont?: { do?: string[]; dont?: string[] };
  confidence?: number;
  sourceNotes?: string[];
}

export async function extractIdentityFromPdfs(pdfUrls: string[], brandName?: string): Promise<PdfVisionTokens | null> {
  if (!pdfUrls?.length) return null;
  const { data, error } = await supabase.functions.invoke('skill-pdf-vision', {
    body: { pdfs: pdfUrls.slice(0, 8), brandName: brandName || 'Brand' },
  });
  if (error) throw new Error(error.message || 'pdf-vision failed');
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any)?.tokens || null;
}
