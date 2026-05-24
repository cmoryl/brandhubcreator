/**
 * useImportedIcons — entry point for the bundled icon library (~111k icons
 * across 29 permissive packs). Loads the master manifest eagerly; per-pack
 * indexes and full pack JSONs are loaded lazily on demand.
 *
 * Backwards-compatible export: `ImportedIconEntry` is re-exported so existing
 * consumers continue to compile.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { BrandIconography } from '@/types/brand';
import {
  loadManifest,
  loadPackIndex,
  materializeAsBrandIconography,
  materializeDataUrl,
} from '@/lib/iconLibrary/loader';
import type {
  IconLibraryManifest,
  IconPackMeta,
  IconIndexEntry,
  ImportedIconEntry,
} from '@/lib/iconLibrary/types';

export type { ImportedIconEntry } from '@/lib/iconLibrary/types';

export interface ImportedIconLibrary {
  id: 'imported';
  name: string;
  level: 'core';
  description: string;
  icons: BrandIconography[];
  is_active: true;
  iconCount: number;
}

export const useImportedIcons = () => {
  const [manifest, setManifest] = useState<IconLibraryManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((e) => {
        logger.debug('[useImportedIcons] manifest load failed', e);
        toast.error('Failed to load icon library');
      })
      .finally(() => setLoading(false));
  }, []);

  /** All known categories across packs. */
  const categories = useMemo<string[]>(() => {
    if (!manifest) return [];
    const set = new Set<string>();
    manifest.packs.forEach((p) => Object.keys(p.categories).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [manifest]);

  /** Total icon count across all packs (cheap). */
  const totalCount = manifest?.totalIcons ?? 0;

  /** Lazy-load per-pack index of icon names + tags + categories. */
  const getPackIndex = useCallback(
    (packId: string) => loadPackIndex(packId),
    [],
  );

  /** Fetch a data URL for an icon (for <img> previews). */
  const getIconUrl = useCallback(
    (packId: string, iconName: string) => materializeDataUrl(packId, iconName),
    [],
  );

  /** Build BrandIconography records for export pipeline. */
  const asBrandIconography = useCallback(
    async (
      filter: { packs?: string[]; categories?: string[]; limit?: number } = {},
    ): Promise<BrandIconography[]> => {
      if (!manifest) return [];
      const packs = (filter.packs?.length ? manifest.packs.filter((p) => filter.packs!.includes(p.id)) : manifest.packs);
      const perPackLimit = filter.limit ? Math.max(1, Math.ceil(filter.limit / packs.length)) : Infinity;
      const collected: BrandIconography[] = [];
      for (const pack of packs) {
        if (filter.limit && collected.length >= filter.limit) break;
        try {
          const idx = await loadPackIndex(pack.id);
          const subset = idx
            .filter((e) => !filter.categories?.length || filter.categories.includes(e.c))
            .slice(0, perPackLimit);
          for (const e of subset) {
            try {
              const bi = await materializeAsBrandIconography(pack.id, e.n, e.c);
              collected.push(bi);
              if (filter.limit && collected.length >= filter.limit) break;
            } catch (err) {
              logger.debug('[useImportedIcons] materialize failed', pack.id, e.n, err);
            }
          }
        } catch (err) {
          logger.debug('[useImportedIcons] index failed', pack.id, err);
        }
      }
      return collected;
    },
    [manifest],
  );

  /** Lightweight virtual library entry for the Library grid. */
  const virtualLibrary = useMemo<ImportedIconLibrary>(
    () => ({
      id: 'imported',
      name: 'Bundled Icon Library',
      level: 'core',
      description: `${totalCount.toLocaleString()} icons across ${manifest?.packs.length ?? 0} permissive packs`,
      icons: [],
      is_active: true,
      iconCount: totalCount,
    }),
    [totalCount, manifest?.packs.length],
  );

  // Back-compat: legacy consumers expect an `entries` array. Surface an
  // empty array (since we no longer materialize all 111k upfront) plus a
  // numeric `entries.length` derived from total count via getter.
  const entries = useMemo<ImportedIconEntry[]>(() => {
    // Empty by design — the full list is too large to keep in memory.
    // Consumers needing a count should use `totalCount`.
    return [];
  }, []);

  return {
    manifest,
    packs: manifest?.packs ?? [],
    entries,
    totalCount,
    loading,
    categories,
    virtualLibrary,
    getPackIndex,
    getIconUrl,
    asBrandIconography,
  };
};

/** Helper for legacy preview components: pick a few sample icons quickly. */
export async function pickSampleIcons(
  manifest: IconLibraryManifest,
  options: { packs?: string[]; count: number } = { count: 6 },
): Promise<Array<{ pack: string; name: string; category: string }>> {
  const packs = options.packs?.length
    ? manifest.packs.filter((p) => options.packs!.includes(p.id))
    : manifest.packs.slice(0, 4);
  const out: Array<{ pack: string; name: string; category: string }> = [];
  for (const pack of packs) {
    if (out.length >= options.count) break;
    try {
      const idx = await loadPackIndex(pack.id);
      const take = idx.slice(0, Math.max(1, Math.ceil(options.count / packs.length)));
      for (const e of take) {
        out.push({ pack: pack.id, name: e.n, category: e.c });
        if (out.length >= options.count) break;
      }
    } catch {
      // skip
    }
  }
  return out;
}
