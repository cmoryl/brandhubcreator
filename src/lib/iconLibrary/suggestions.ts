// Phase 2: section + industry → suggested icons across the bundled library.
// Cross-pack curated suggestions, deduped, capped, ranked by pack priority.

import { loadManifest, loadPackIndex } from './loader';
import { categoriesForIndustry, categoriesForSection, type IconCategory } from './categorization';
import type { IconIndexEntry, IconPackMeta } from './types';

export interface SuggestedIcon {
  pack: string;
  packName: string;
  name: string;
  category: string;
  tags: string[];
  license: string;
}

interface SuggestOptions {
  sectionId?: string;
  industry?: string | null;
  /** Override categories explicitly (skips section/industry derivation). */
  categories?: IconCategory[];
  /** Free-text keyword filter applied to name + tags. */
  query?: string;
  /** Max total icons to return. */
  limit?: number;
  /** Max icons per pack (keeps the rail diverse). */
  perPack?: number;
}

/**
 * Resolve a curated set of suggested icons for a brand section.
 * Pulls from all packs, scored by industry/section relevance.
 */
export async function getSuggestedIcons(opts: SuggestOptions): Promise<SuggestedIcon[]> {
  const { sectionId, industry, query, limit = 48, perPack = 8 } = opts;

  const sectionCats = sectionId ? categoriesForSection(sectionId) : [];
  const industryCats = opts.categories ?? categoriesForIndustry(industry);

  // Union of both signals — section narrows, industry broadens.
  const wantedCats = Array.from(new Set<IconCategory>([...sectionCats, ...industryCats]));
  if (wantedCats.length === 0) return [];

  const manifest = await loadManifest();
  // Pick packs that contain at least one of the wanted categories; prefer priority 1.
  const candidatePacks = manifest.packs
    .filter((p) => wantedCats.some((c) => p.categories[c] > 0))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    .slice(0, 8);

  const term = query?.trim().toLowerCase() ?? '';

  const perPackResults = await Promise.all(
    candidatePacks.map(async (pack) => {
      try {
        const idx = await loadPackIndex(pack.id);
        const matches: SuggestedIcon[] = [];
        for (const entry of idx) {
          if (!wantedCats.includes(entry.c as IconCategory)) continue;
          if (term) {
            const hit = entry.n.includes(term) || entry.t.some((t) => t.includes(term));
            if (!hit) continue;
          }
          matches.push(toSuggested(pack, entry));
          if (matches.length >= perPack) break;
        }
        return matches;
      } catch {
        return [] as SuggestedIcon[];
      }
    }),
  );

  // Interleave packs so the rail isn't dominated by one source.
  const interleaved: SuggestedIcon[] = [];
  const maxLen = Math.max(...perPackResults.map((r) => r.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of perPackResults) {
      if (bucket[i]) interleaved.push(bucket[i]);
      if (interleaved.length >= limit) return interleaved;
    }
  }
  return interleaved;
}

function toSuggested(pack: IconPackMeta, entry: IconIndexEntry): SuggestedIcon {
  return {
    pack: pack.id,
    packName: pack.name,
    name: entry.n,
    category: entry.c,
    tags: entry.t,
    license: pack.license,
  };
}
