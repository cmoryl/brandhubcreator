/**
 * enrichLibrary — auto-populates an existing icon library with bundled icons
 * relevant to the library's inferred industry. Used by the "Auto-fill with
 * industry icons" bulk action in LibraryView so each saved set becomes a
 * full industry-specific repository drawing from the 111k bundled library.
 *
 * Strategy:
 *  1. Infer industry tokens from library.name + description (substring match
 *     against INDUSTRY_CATEGORY_MAP keys). Fall back to generic ['ui',
 *     'business', 'communication'].
 *  2. For each category, walk a preferred-pack ladder (high-quality outline
 *     packs first), pull icons up to `perCategory`, dedupe against existing
 *     library icon ids (`packId/iconName` shape).
 *  3. Materialize each as BrandIconography via loader and append.
 *
 * Network-safe: pack indexes + JSONs are cached at the loader layer, so
 * enriching 30 libraries only triggers ~29 pack fetches total.
 */

import type { BrandIconography } from '@/types/brand';
import {
  categoriesForIndustry,
  type IconCategory,
} from './categorization';
import { loadPackIndex, materializeAsBrandIconography } from './loader';

/** Preferred packs per category — first hit wins, monochrome only. */
const CATEGORY_PACKS: Record<IconCategory, string[]> = {
  ui: ['lucide', 'tabler', 'heroicons', 'ph'],
  arrows: ['lucide', 'tabler', 'ph'],
  shapes: ['lucide', 'tabler', 'radix-icons'],
  communication: ['lucide', 'tabler', 'ph', 'heroicons'],
  files: ['lucide', 'tabler', 'ph'],
  business: ['lucide', 'tabler', 'ph', 'carbon'],
  health: ['ph', 'lucide', 'tabler', 'hugeicons'],
  wellness: ['ph', 'lucide', 'tabler'],
  food: ['ph', 'lucide', 'tabler', 'mingcute'],
  travel: ['ph', 'lucide', 'tabler', 'hugeicons'],
  finance: ['ph', 'lucide', 'tabler', 'carbon'],
  ecommerce: ['ph', 'lucide', 'tabler'],
  education: ['ph', 'lucide', 'tabler'],
  science: ['ph', 'lucide', 'tabler', 'hugeicons'],
  nature: ['ph', 'lucide', 'tabler'],
  weather: ['ph', 'lucide', 'tabler'],
  transport: ['ph', 'lucide', 'tabler', 'hugeicons'],
  tech: ['lucide', 'tabler', 'ph', 'carbon'],
  devtools: ['lucide', 'tabler', 'ph', 'carbon'],
  media: ['lucide', 'tabler', 'ph'],
  security: ['lucide', 'tabler', 'ph', 'carbon'],
  gaming: ['game-icons', 'ph', 'lucide'],
  sports: ['ph', 'lucide', 'tabler'],
  brands: ['simple-icons'],
  social: ['simple-icons', 'lucide', 'ph'],
  emoji: ['ph', 'lucide'],
  flags: ['flag'],
  crypto: ['cryptocurrency', 'ph', 'lucide'],
  multicultural: ['twemoji', 'openmoji', 'flag', 'ph', 'lucide', 'fluent', 'mdi'],
  misc: ['lucide', 'tabler', 'ph'],
};

export interface EnrichOptions {
  /** Icons to pull per category. Default 12. */
  perCategory?: number;
  /** Hard cap on icons added to a single library. Default 80. */
  maxAdded?: number;
  /** Optional explicit industry override (skips inference). */
  industry?: string | null;
  /**
   * Extra categories to always include alongside the industry-derived ones.
   * Used for the "Build brand repository" action which guarantees coverage of
   * generic UI / business / communication / files areas no matter the
   * industry, so every brand library doubles as a working app icon set.
   */
  extraCategories?: IconCategory[];
}

export interface EnrichResult {
  /** Merged icons (existing + newly added). */
  icons: BrandIconography[];
  /** How many icons were newly added. */
  added: number;
  /** Industry categories that drove the enrichment. */
  categories: IconCategory[];
}

/** Heuristic industry detector based on free-text name + description. */
export function inferIndustry(name: string, description?: string | null): string {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  // Common industry tokens we want to detect even when they appear
  // mid-sentence (e.g. "Acme Health Cloud", "Loyalty + Travel kit").
  const TOKENS = [
    'health', 'medical', 'pharma', 'wellness', 'fitness', 'finance', 'bank',
    'fintech', 'insurance', 'crypto', 'tech', 'software', 'saas', 'ai',
    'security', 'travel', 'hotel', 'airline', 'hospitality', 'retail',
    'ecommerce', 'fashion', 'food', 'restaurant', 'beverage', 'media',
    'gaming', 'entertainment', 'publishing', 'education', 'edtech', 'sports',
    'energy', 'sustainability', 'agriculture', 'logistics', 'automotive',
    'shipping', 'legal', 'consulting', 'enterprise', 'government',
    'nonprofit', 'real estate', 'construction',
  ];
  for (const t of TOKENS) {
    if (text.includes(t)) return t.replace(/\s+/g, '');
  }
  return '';
}

/**
 * Enrich a single library. Returns the merged icon list ready to persist.
 * Does not mutate the input.
 */
export async function enrichLibrary(
  library: { name: string; description?: string | null; icons: BrandIconography[] },
  opts: EnrichOptions = {},
): Promise<EnrichResult> {
  const perCategory = opts.perCategory ?? 12;
  const maxAdded = opts.maxAdded ?? 80;
  const industry = opts.industry ?? inferIndustry(library.name, library.description);
  const baseCategories = categoriesForIndustry(industry || library.name);
  // Merge industry + extras, preserving order and deduping.
  const seen = new Set<IconCategory>();
  const categories: IconCategory[] = [];
  for (const c of [...baseCategories, ...(opts.extraCategories ?? [])]) {
    if (!seen.has(c)) { seen.add(c); categories.push(c); }
  }

  // Existing icon id lookup so we never duplicate.
  const existingIds = new Set(library.icons.map((i) => i.id));
  const added: BrandIconography[] = [];

  for (const cat of categories) {
    if (added.length >= maxAdded) break;
    const packs = CATEGORY_PACKS[cat] ?? CATEGORY_PACKS.misc;
    let pulledForCat = 0;
    for (const packId of packs) {
      if (pulledForCat >= perCategory || added.length >= maxAdded) break;
      let index;
      try {
        index = await loadPackIndex(packId);
      } catch {
        continue;
      }
      const candidates = index.filter((e) => e.c === cat);
      for (const entry of candidates) {
        if (pulledForCat >= perCategory || added.length >= maxAdded) break;
        const id = `${packId}/${entry.n}`;
        if (existingIds.has(id)) continue;
        try {
          const bi = await materializeAsBrandIconography(packId, entry.n, cat);
          existingIds.add(id);
          added.push(bi);
          pulledForCat += 1;
        } catch {
          // skip broken icons
        }
      }
    }
  }

  return {
    icons: [...library.icons, ...added],
    added: added.length,
    categories,
  };
}
