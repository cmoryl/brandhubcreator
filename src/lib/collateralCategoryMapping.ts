/**
 * Collateral Category → Layout Template mapping
 *
 * Maps a `BrandBrochure.category` string to the most appropriate
 * `LayoutSectionTarget` and picks a sensible default template id.
 *
 * Used by the "Refresh from Templates" bulk-regenerate wizard so we can
 * propose a brand-aligned layout for each existing collateral item.
 */
import {
  brandLayoutTemplates,
  getTemplatesForTarget,
  type BrandLayoutTemplate,
  type LayoutSectionTarget,
} from './brandLayoutTemplates';

/** Direct category → target lookup (case-insensitive). Falls back to keyword scan. */
const directMap: Record<string, LayoutSectionTarget> = {
  brief: 'onepager',
  spotlight: 'editorial',
  whitepaper: 'whitepaper',
  'white paper': 'whitepaper',
  'case study': 'casestudy',
  ebrochure: 'ebrochure',
  'e-brochure': 'ebrochure',
  brochure: 'ebrochure',
  infographic: 'editorial',
  'capability statement': 'onepager',
  'product brochure': 'product',
  'company overview': 'editorial',
  'pitch deck': 'pitch',
  'annual report': 'whitepaper',
};

const keywordMap: { match: RegExp; target: LayoutSectionTarget }[] = [
  { match: /social\s*banner/i, target: 'social' },
  { match: /story|reel|9:?16/i, target: 'story' },
  { match: /carousel/i, target: 'carousel' },
  { match: /billboard|ooh/i, target: 'billboard' },
  { match: /email|newsletter/i, target: 'email' },
  { match: /\bad\b|display\s*ad/i, target: 'ad' },
  { match: /landing|web/i, target: 'web' },
  { match: /event/i, target: 'event' },
  { match: /case/i, target: 'casestudy' },
  { match: /pitch|deck/i, target: 'pitch' },
  { match: /paper|report/i, target: 'whitepaper' },
  { match: /one[\s-]?pager|sheet/i, target: 'onepager' },
  { match: /brochure/i, target: 'ebrochure' },
];

export interface CategoryMappingResult {
  target: LayoutSectionTarget;
  /** A short, friendly explanation surfaced in the UI. */
  reason: string;
}

export const mapCategoryToTarget = (category: string | undefined | null): CategoryMappingResult => {
  const raw = (category ?? '').trim();
  if (!raw) {
    return { target: 'editorial', reason: 'No category — defaulting to Editorial' };
  }

  const lower = raw.toLowerCase();
  if (directMap[lower]) {
    return { target: directMap[lower], reason: `Matched "${raw}" → ${directMap[lower]}` };
  }

  for (const { match, target } of keywordMap) {
    if (match.test(raw)) {
      return { target, reason: `Detected "${raw}" → ${target}` };
    }
  }

  return { target: 'editorial', reason: `No template match for "${raw}" — using Editorial` };
};

/**
 * Pick a default template id for a given target.
 * Prefers the first template whose target matches; returns undefined if none.
 */
export const pickDefaultTemplateId = (target: LayoutSectionTarget): string | undefined => {
  const candidates = getTemplatesForTarget(target);
  return candidates[0]?.id;
};

export const findTemplateById = (id: string | undefined): BrandLayoutTemplate | undefined =>
  id ? brandLayoutTemplates.find((t) => t.id === id) : undefined;
