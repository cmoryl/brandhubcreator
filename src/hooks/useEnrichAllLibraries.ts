/**
 * useEnrichAllLibraries — runs `enrichLibrary` across every editable saved
 * library in the org, then persists each one via `updateLibrary`. Reports
 * progress + per-library counts so the UI can surface a toast/progress bar.
 *
 * Sequential by design: keeps memory + Supabase writes predictable, and the
 * loader's pack cache means later libraries reuse the same in-memory JSON.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useIconLibraries, type IconLibrary } from './useIconLibraries';
import { enrichLibrary } from '@/lib/iconLibrary/enrichLibrary';
import { logger } from '@/lib/logger';

export interface EnrichProgress {
  total: number;
  done: number;
  current?: string;
  running: boolean;
  totalAdded: number;
}

export function useEnrichAllLibraries(organizationId: string | undefined) {
  const { libraries, updateLibrary } = useIconLibraries(organizationId);
  const [progress, setProgress] = useState<EnrichProgress>({
    total: 0,
    done: 0,
    running: false,
    totalAdded: 0,
  });

  const enrichAll = useCallback(
    async (opts?: { perCategory?: number; maxAdded?: number }) => {
      const targets = libraries.filter((l) => l.is_active);
      if (!targets.length) {
        toast.info('No libraries to enrich');
        return;
      }
      setProgress({ total: targets.length, done: 0, running: true, totalAdded: 0 });
      const id = toast.loading(`Enriching ${targets.length} libraries…`);
      let totalAdded = 0;
      try {
        for (let i = 0; i < targets.length; i++) {
          const lib = targets[i];
          setProgress((p) => ({ ...p, current: lib.name, done: i }));
          try {
            const result = await enrichLibrary(lib, opts);
            if (result.added > 0) {
              await updateLibrary.mutateAsync({ id: lib.id, updates: { icons: result.icons } });
              totalAdded += result.added;
            }
          } catch (e) {
            logger.debug('[enrichAll] failed', lib.name, e);
          }
          setProgress((p) => ({ ...p, done: i + 1, totalAdded }));
        }
        toast.success(`Added ${totalAdded} industry icons across ${targets.length} libraries`, { id });
      } catch (e) {
        logger.debug('[enrichAll] aborted', e);
        toast.error('Enrichment failed', { id });
      } finally {
        setProgress((p) => ({ ...p, running: false, current: undefined }));
      }
    },
    [libraries, updateLibrary],
  );

  /**
   * Brand repository builder — for every brand-level library, append a
   * deep industry-specific set (multiple sub-areas × 150 icons each) so each
   * brand ends up with a fully-stocked working icon repository.
   */
  const enrichBrandRepositories = useCallback(
    async (opts?: { perCategory?: number; maxAdded?: number }) => {
      const targets = libraries.filter((l) => l.is_active && l.level === 'brand');
      if (!targets.length) {
        toast.info('No brand libraries to enrich');
        return;
      }
      const perCategory = opts?.perCategory ?? 150;
      const maxAdded = opts?.maxAdded ?? 1200;
      setProgress({ total: targets.length, done: 0, running: true, totalAdded: 0 });
      const id = toast.loading(`Building brand repositories (${targets.length})…`);
      let totalAdded = 0;
      try {
        for (let i = 0; i < targets.length; i++) {
          const lib = targets[i];
          setProgress((p) => ({ ...p, current: lib.name, done: i }));
          try {
            const result = await enrichLibrary(lib, {
              perCategory,
              maxAdded,
              // Guarantee coverage of generic working areas on every brand
              // library in addition to whatever the industry inference picks.
              extraCategories: ['ui', 'arrows', 'communication', 'business', 'files', 'media', 'security'],
            });
            if (result.added > 0) {
              await updateLibrary.mutateAsync({ id: lib.id, updates: { icons: result.icons } });
              totalAdded += result.added;
            }
          } catch (e) {
            logger.debug('[enrichBrand] failed', lib.name, e);
          }
          setProgress((p) => ({ ...p, done: i + 1, totalAdded }));
        }
        toast.success(`Added ${totalAdded} icons across ${targets.length} brand libraries`, { id });
      } catch (e) {
        logger.debug('[enrichBrand] aborted', e);
        toast.error('Brand enrichment failed', { id });
      } finally {
        setProgress((p) => ({ ...p, running: false, current: undefined }));
      }
    },
    [libraries, updateLibrary],
  );

  const enrichOne = useCallback(
    async (library: IconLibrary, opts?: { perCategory?: number; maxAdded?: number }) => {
      const id = toast.loading(`Enriching ${library.name}…`);
      try {
        // Default to a meaningful batch so users always see icons added.
        const effective = {
          perCategory: opts?.perCategory ?? 40,
          maxAdded: opts?.maxAdded ?? 300,
          ...opts,
        };
        const result = await enrichLibrary(library, effective);
        logger.debug('[enrichOne] result', {
          lib: library.name,
          added: result.added,
          categories: result.categories,
          existingCount: library.icons.length,
          nextCount: result.icons.length,
        });
        if (result.added > 0) {
          await updateLibrary.mutateAsync({ id: library.id, updates: { icons: result.icons } });
          toast.success(`Added ${result.added} icons to ${library.name}`, { id });
        } else {
          toast.info(
            `No new industry icons found for ${library.name}. Categories tried: ${result.categories.join(', ') || 'none'}.`,
            { id },
          );
        }
        return result;
      } catch (e) {
        logger.debug('[enrichOne] failed', e);
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`Enrichment failed: ${msg}`, { id });
      }
    },
    [updateLibrary],
  );

  return { progress, enrichAll, enrichOne, enrichBrandRepositories };
}
