/**
 * useProjectImages
 * Provides a list of image URLs that are bundled with the app (src/assets).
 * This covers images uploaded/added during the build.
 */

import { useMemo } from 'react';

export interface ProjectImageAsset {
  name: string;
  url: string;
  path: string;
}

// Vite will turn these into URLs at build time
const ASSET_IMAGES = import.meta.glob(
  [
    '../assets/**/*.{png,jpg,jpeg,webp,svg}',
  ],
  {
    eager: true,
    import: 'default',
  }
) as unknown as Record<string, string>;

function fileNameFromPath(path: string) {
  const base = path.split('/').pop() || path;
  return base.replace(/\.[^.]+$/, '');
}

export function useProjectImages(searchTerm?: string) {
  return useMemo<ProjectImageAsset[]>(() => {
    const all = Object.entries(ASSET_IMAGES)
      .map(([path, url]) => ({
        path,
        url,
        name: fileNameFromPath(path),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return all;
    return all.filter((img) => img.name.toLowerCase().includes(q));
  }, [searchTerm]);
}
