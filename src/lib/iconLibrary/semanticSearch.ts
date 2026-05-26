/**
 * Phase 3 — AI-powered semantic icon search.
 *
 * 1. Calls the `icon-semantic-search` edge function which expands the user's
 *    natural-language query into search tokens + suggested categories via
 *    Gemini Flash Lite.
 * 2. Intersects those tokens against the local per-pack icon index.
 * 3. Scores hits (token-frequency + category bonus + pack priority).
 *
 * No precomputed embeddings — pragmatic semantic search over 111k icons
 * without the cost of indexing them all in pgvector.
 */
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadManifest, loadPackIndex } from './loader';
import type { IconIndexEntry } from './types';
import { categoriesForIndustry } from './categorization';

export interface SemanticIconHit {
  pack: string;
  packName: string;
  name: string;
  category: string;
  tags: string[];
  license: string;
  score: number;
}

export interface SemanticSearchInput {
  query: string;
  industry?: string | null;
  brandKeywords?: string[];
  sectionId?: string;
  limit?: number;
}

interface ExpandedSearch {
  tokens: string[];
  categories: string[];
  reasoning: string;
}

async function expandQuery(input: SemanticSearchInput): Promise<ExpandedSearch> {
  const { data, error } = await supabase.functions.invoke('icon-semantic-search', {
    body: {
      query: input.query,
      industry: input.industry ?? undefined,
      brandKeywords: input.brandKeywords ?? [],
      sectionId: input.sectionId,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return {
    tokens: Array.isArray(data?.tokens) ? data.tokens : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    reasoning: typeof data?.reasoning === 'string' ? data.reasoning : '',
  };
}

/** Score a single entry against expanded tokens & preferred categories. */
function scoreEntry(
  entry: IconIndexEntry,
  tokens: Set<string>,
  preferredCats: Set<string>,
  packPriority: number,
): number {
  let score = 0;
  // Token hits on name (highest weight)
  for (const t of tokens) {
    if (entry.n === t) score += 12;
    else if (entry.n.includes(t)) score += 5;
  }
  // Token hits on tags
  for (const tag of entry.t) {
    if (tokens.has(tag)) score += 3;
  }
  // Category bonus
  if (preferredCats.has(entry.c)) score += 4;
  // Pack priority (lower number = higher quality pack)
  score += Math.max(0, 3 - packPriority);
  return score;
}

export async function semanticIconSearch(
  input: SemanticSearchInput,
): Promise<{ hits: SemanticIconHit[]; expansion: ExpandedSearch }> {
  const expansion = await expandQuery(input);
  const tokens = new Set<string>(expansion.tokens);
  // Always include the raw query terms (split on whitespace) as fallback.
  for (const w of input.query.toLowerCase().split(/\s+/)) {
    const norm = w.replace(/[^a-z0-9]/g, '');
    if (norm.length >= 2) tokens.add(norm);
  }
  if (tokens.size === 0) return { hits: [], expansion };

  const preferredCats = new Set<string>([
    ...expansion.categories,
    ...categoriesForIndustry(input.industry),
  ]);

  const manifest = await loadManifest();
  // Search top-priority packs that hold at least one preferred category.
  const packs = manifest.packs
    .slice()
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    .slice(0, 12);

  const perPack = await Promise.all(
    packs.map(async (pack) => {
      try {
        const idx = await loadPackIndex(pack.id);
        const hits: SemanticIconHit[] = [];
        for (const e of idx) {
          const s = scoreEntry(e, tokens, preferredCats, pack.priority ?? 99);
          if (s <= 0) continue;
          hits.push({
            pack: pack.id,
            packName: pack.name,
            name: e.n,
            category: e.c,
            tags: e.t,
            license: pack.license,
            score: s,
          });
        }
        // Keep top 80 per pack so global sort can interleave fairly.
        hits.sort((a, b) => b.score - a.score);
        return hits.slice(0, 80);
      } catch {
        return [] as SemanticIconHit[];
      }
    }),
  );

  const all = perPack.flat().sort((a, b) => b.score - a.score);
  return { hits: all.slice(0, input.limit ?? 48), expansion };
}

export function useSemanticIconSearch() {
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SemanticIconHit[]>([]);
  const [expansion, setExpansion] = useState<ExpandedSearch | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (input: SemanticSearchInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await semanticIconSearch(input);
      setHits(result.hits);
      setExpansion(result.expansion);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      setHits([]);
      setExpansion(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHits([]);
    setExpansion(null);
    setError(null);
  }, []);

  return { search, reset, loading, hits, expansion, error };
}
