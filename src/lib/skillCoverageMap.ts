/**
 * Coverage map: for each guide section, computes whether it made it
 * into the exported SKILL.md / references files, with a richness score.
 */
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export type CoverageStatus = 'full' | 'partial' | 'missing' | 'na';

export interface CoverageRow {
  section: string;
  label: string;
  guideCount: number;
  inSkill: boolean;
  inRef: string | null;
  refTokens: number;
  status: CoverageStatus;
  hint?: string;
}

const tok = (s: string) => Math.round((s || '').length / 4);
const has = (md: string, needle: string) => md && md.toLowerCase().includes(needle.toLowerCase());

const SECTIONS: Array<{ key: string; label: string; ref?: string; needle?: string; pick: (g: any) => any[] | undefined }> = [
  { key: 'colors',           label: 'Colors',                 ref: 'references/colors.md',              needle: 'colors',     pick: (g) => g.colors },
  { key: 'colorCombinations', label: 'Color combinations',    ref: 'references/colors.md',              needle: 'combination', pick: (g) => g.colorCombinations },
  { key: 'typography',       label: 'Typography',             ref: 'references/typography.md',          needle: 'typography', pick: (g) => g.typography },
  { key: 'logos',            label: 'Logos',                  ref: 'references/logos.md',               needle: 'logo',       pick: (g) => g.logos },
  { key: 'voice',            label: 'Voice & tone',           ref: 'references/voice-and-messaging.md', needle: 'voice',      pick: (g) => g.voice ? [g.voice] : [] },
  { key: 'taglines',         label: 'Tagline library',        ref: 'references/voice-and-messaging.md', needle: 'tagline',    pick: (g) => g.taglineLibrary || g.taglines },
  { key: 'imagery',          label: 'Imagery direction',      ref: 'references/imagery.md',             needle: 'imagery',    pick: (g) => g.imagery },
  { key: 'approvedImagery',  label: 'Approved imagery',       ref: 'references/imagery.md',             needle: 'approved',   pick: (g) => g.approvedImagery?.sections },
  { key: 'antiPatterns',     label: 'Anti-patterns',          ref: 'references/anti-patterns.md',       needle: 'anti',       pick: (g) => g.antiPatterns },
  { key: 'patterns',         label: 'Patterns',               ref: 'references/assets.md',              needle: 'pattern',    pick: (g) => g.patterns },
  { key: 'gradients',        label: 'Gradients',              ref: 'references/assets.md',              needle: 'gradient',   pick: (g) => g.gradients },
  { key: 'brochures',        label: 'Brochures',              ref: 'references/assets.md',              needle: 'brochure',   pick: (g) => g.brochures },
  { key: 'caseStudies',      label: 'Case studies',           ref: 'references/assets.md',              needle: 'case stud',  pick: (g) => g.caseStudies },
  { key: 'icons',            label: 'Icons',                  ref: 'references/assets.md',              needle: 'icon',       pick: (g) => g.brandIcons },
  { key: 'awards',           label: 'Awards',                 ref: 'references/overview.md',            needle: 'award',      pick: (g) => g.awards },
  { key: 'values',           label: 'Values',                 ref: 'references/overview.md',            needle: 'values',     pick: (g) => g.values },
  { key: 'identity',         label: 'Identity (mission/vision)', ref: 'references/overview.md',         needle: 'mission',    pick: (g) => g.identity ? [g.identity] : [] },
];

export interface CoverageInputs {
  skillMd: string;
  references: Record<string, string>; // path → body
}

export function computeCoverage(guide: AnyGuide, inputs: CoverageInputs): CoverageRow[] {
  return SECTIONS.map((s) => {
    const items = (s.pick(guide as any) || []).filter(Boolean);
    const guideCount = Array.isArray(items) ? items.length : (items ? 1 : 0);
    const refBody = s.ref ? inputs.references[s.ref] || '' : '';
    const refTokens = tok(refBody);
    const inSkill = !!s.needle && has(inputs.skillMd, s.needle);
    let status: CoverageStatus;
    if (guideCount === 0) status = 'na';
    else if (refBody && refTokens > 80) status = inSkill ? 'full' : 'partial';
    else status = 'missing';
    return {
      section: s.key,
      label: s.label,
      guideCount,
      inSkill,
      inRef: s.ref || null,
      refTokens,
      status,
      hint:
        status === 'missing'
          ? 'In guide but not present in any reference file.'
          : status === 'partial'
          ? 'In a reference file but not surfaced inline in SKILL.md.'
          : undefined,
    };
  });
}

export function coverageScore(rows: CoverageRow[]): number {
  const counted = rows.filter((r) => r.status !== 'na');
  if (!counted.length) return 0;
  const score = counted.reduce((s, r) => s + (r.status === 'full' ? 100 : r.status === 'partial' ? 60 : 0), 0);
  return Math.round(score / counted.length);
}
