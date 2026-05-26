/**
 * useBundledIconLibraries — synthesizes IconLibrary-shaped objects for each
 * bundled icon pack so the bundled library appears alongside generated
 * icon sets in LibraryView / IconSetsView (Core level, read-only).
 *
 * Each pack becomes one synthetic library with id `bundled:<packId>`.
 * Sample icons (6) are lazily materialized for preview tiles.
 */
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type { IconLibrary } from './useIconLibraries';
import type { BrandIconography } from '@/types/brand';
import { useImportedIcons } from './useImportedIcons';
import { loadPackIndex, materializeAsBrandIconography } from '@/lib/iconLibrary/loader';

export const BUNDLED_LIB_PREFIX = 'bundled:';
export const isBundledLibraryId = (id: string) => id.startsWith(BUNDLED_LIB_PREFIX);
export const bundledLibraryPackId = (id: string) =>
  isBundledLibraryId(id) ? id.slice(BUNDLED_LIB_PREFIX.length) : null;

const SAMPLE_PER_PACK = 6;

export function useBundledIconLibraries(organizationId: string | undefined): {
  bundledLibraries: IconLibrary[];
  loading: boolean;
} {
  const { packs, loading: manifestLoading } = useImportedIcons();
  const [samples, setSamples] = useState<Record<string, BrandIconography[]>>({});

  useEffect(() => {
    if (!packs.length) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, BrandIconography[]> = {};
      // Load samples for every pack in parallel, but cap concurrency to
      // avoid hammering the network on first paint.
      const batchSize = 6;
      for (let i = 0; i < packs.length; i += batchSize) {
        const batch = packs.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (pack) => {
            try {
              const idx = await loadPackIndex(pack.id);
              const slice = idx.slice(0, SAMPLE_PER_PACK);
              const icons = await Promise.all(
                slice.map((e) =>
                  materializeAsBrandIconography(pack.id, e.n, e.c).catch(() => null),
                ),
              );
              next[pack.id] = icons.filter(Boolean) as BrandIconography[];
            } catch (e) {
              logger.debug('[bundledLibraries] sample failed', pack.id, e);
              next[pack.id] = [];
            }
          }),
        );
        if (cancelled) return;
        setSamples((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [packs]);

  const now = new Date().toISOString();
  const bundledLibraries: IconLibrary[] = packs.map((pack) => ({
    id: `${BUNDLED_LIB_PREFIX}${pack.id}`,
    organization_id: organizationId ?? '',
    name: pack.name,
    level: 'core',
    description: `${pack.count.toLocaleString()} icons · ${pack.license} · ${pack.author}`,
    icons: samples[pack.id] ?? [],
    parent_library_id: null,
    is_active: true,
    display_order: 9000 + pack.count, // sort after generated sets
    created_at: now,
    updated_at: now,
    created_by: null,
  }));

  return {
    bundledLibraries,
    loading: manifestLoading,
  };
}
