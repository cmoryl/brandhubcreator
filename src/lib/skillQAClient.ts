/**
 * Skill QA client — invokes the skill-qa edge function with the same content
 * that the Claude Skill exporter would write into the zip.
 */
import { supabase } from '@/integrations/supabase/client';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export type SectionId =
  | 'colors'
  | 'typography'
  | 'logos'
  | 'voice'
  | 'imagery'
  | 'antiPatterns';

export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export interface SkillQAJudgeResult {
  score: number;
  section_used: boolean;
  misuses: string[];
  missing_info: string[];
  summary: string;
}

export interface SkillQASectionResult {
  section: SectionId;
  label: string;
  modelOutput: string;
  judge: SkillQAJudgeResult;
}

export interface SkillQAModelReport {
  tier: ModelTier;
  proxy: string;
  results: SkillQASectionResult[];
  avgScore: number;
  missingSections: SectionId[];
  topMisuses: Array<{ misuse: string; count: number }>;
  errors: string[];
}

export interface SkillQAReport {
  brandName: string;
  ranAt: string;
  reports: SkillQAModelReport[];
  summary: {
    consistentlyMissing: SectionId[];
    recurringMisuses: Array<{ misuse: string; count: number }>;
    avgScoreByTier: Record<ModelTier, number>;
  };
}

/**
 * Build the same section content that ends up in the exported zip,
 * without re-running the exporter.
 */
export async function buildSkillPayloadFromGuide(guide: AnyGuide) {
  // Lazy-import to keep the QA path light.
  const mod = await import('@/lib/exportClaudeSkill');
  // The exporter does not currently export its build* helpers — use a
  // tiny inline copy of the relevant joins so we don't need to refactor it.
  const kind = (guide as any).type || 'brand';
  const brandName = guide.hero?.name || 'Guide';

  // Re-run the exporter end-to-end and read the files back out of the zip.
  // This guarantees QA tests the EXACT artifact users download.
  const { blob } = await mod.exportGuideAsClaudeSkill(guide, {
    embedAssets: false,
    includeIntelligence: false,
    skipValidation: true,
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

  return { brandName, skillMd, sections, kind };
}

export async function runSkillQA(
  guide: AnyGuide,
  opts: { tiers?: ModelTier[]; sections?: SectionId[] } = {},
): Promise<SkillQAReport> {
  const skill = await buildSkillPayloadFromGuide(guide);
  const { data, error } = await supabase.functions.invoke('skill-qa', {
    body: { skill, tiers: opts.tiers, sections: opts.sections },
  });
  if (error) throw new Error(error.message || 'skill-qa failed');
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as SkillQAReport;
}

export function reportToMarkdown(r: SkillQAReport): string {
  const lines: string[] = [];
  lines.push(`# Skill QA Report — ${r.brandName}`);
  lines.push(`_Ran ${r.ranAt}_`);
  lines.push('');
  lines.push('## Average score by model tier');
  Object.entries(r.summary.avgScoreByTier).forEach(([tier, score]) =>
    lines.push(`- **${tier}**: ${score}/100`),
  );
  lines.push('');
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
      lines.push(
        `- **${res.label}** — ${res.judge.score}/100 ${res.judge.section_used ? '✓ used section' : '✗ section not used'}`,
      );
      if (res.judge.misuses.length) {
        res.judge.misuses.forEach((m) => lines.push(`  - misuse: ${m}`));
      }
      if (res.judge.summary) lines.push(`  - ${res.judge.summary}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}
