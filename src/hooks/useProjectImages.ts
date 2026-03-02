/**
 * useProjectImages
 * Provides a resilient list of image URLs bundled with the app (src/assets).
 *
 * IMPORTANT:
 * - Uses lazy import.meta.glob loaders (not eager) so a single stale/missing asset
 *   cannot crash the whole route.
 * - Failed imports are skipped gracefully.
 */

import { useEffect, useMemo, useState } from 'react';

export interface ProjectImageAsset {
  name: string;
  url: string;
  path: string;
}

type AssetModuleLoader = () => Promise<string>;

// Lazy loaders so one broken asset import doesn't block app render
const ASSET_IMAGE_LOADERS = import.meta.glob(
  ['../assets/**/*.{png,jpg,jpeg,webp,svg}'],
  {
    import: 'default',
  }
) as Record<string, AssetModuleLoader>;

let cachedAssets: ProjectImageAsset[] | null = null;
let cacheLoadPromise: Promise<ProjectImageAsset[]> | null = null;

function fileNameFromPath(path: string) {
  const base = path.split('/').pop() || path;
  return base.replace(/\.[^.]+$/, '');
}

async function loadAllAssets(): Promise<ProjectImageAsset[]> {
  if (cachedAssets) return cachedAssets;
  if (cacheLoadPromise) return cacheLoadPromise;

  cacheLoadPromise = (async () => {
    const entries = Object.entries(ASSET_IMAGE_LOADERS);
    const settled = await Promise.allSettled(
      entries.map(async ([path, loader]) => {
        const url = await loader();
        return {
          path,
          url,
          name: fileNameFromPath(path),
        } satisfies ProjectImageAsset;
      })
    );

    const loaded = settled
      .filter((r): r is PromiseFulfilledResult<ProjectImageAsset> => r.status === 'fulfilled')
      .map((r) => r.value)
      .sort((a, b) => a.name.localeCompare(b.name));

    const failedCount = settled.length - loaded.length;
    if (failedCount > 0) {
      console.warn(`[useProjectImages] Skipped ${failedCount} asset import(s) due to load failures.`);
    }

    cachedAssets = loaded;
    return loaded;
  })();

  try {
    return await cacheLoadPromise;
  } finally {
    cacheLoadPromise = null;
  }
}

export function useProjectImages(searchTerm?: string) {
  const [allAssets, setAllAssets] = useState<ProjectImageAsset[]>(cachedAssets ?? []);

  useEffect(() => {
    let active = true;

    if (cachedAssets) {
      setAllAssets(cachedAssets);
      return;
    }

    loadAllAssets()
      .then((assets) => {
        if (!active) return;
        setAllAssets(assets);
      })
      .catch((err) => {
        // Keep UI functional even if some/all module imports fail
        console.error('[useProjectImages] Failed to load project assets:', err);
        if (!active) return;
        setAllAssets([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo<ProjectImageAsset[]>(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter((img) => img.name.toLowerCase().includes(q));
  }, [allAssets, searchTerm]);
}
