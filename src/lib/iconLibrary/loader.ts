// Runtime icon library loader.
// Pack JSONs live in /public/icon-library/packs/<id>.json (Iconify schema).
// Per-pack search indexes live in /public/icon-library/index/<id>.json.
// SVGs are materialized on demand from the pack's `body` strings.

import { logger } from '@/lib/logger';
import type { IconLibraryManifest, IconIndexEntry, IconPackMeta } from './types';

const MANIFEST_URL = '/icon-library/manifest.json';
const PACK_URL = (id: string) => `/icon-library/packs/${id}.json`;
const INDEX_URL = (id: string) => `/icon-library/index/${id}.json`;

let manifestPromise: Promise<IconLibraryManifest> | null = null;
const indexCache = new Map<string, Promise<IconIndexEntry[]>>();
const packCache = new Map<string, Promise<IconifyPack>>();
const svgCache = new Map<string, string>();
const dataUrlCache = new Map<string, string>();

interface IconifyPack {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number; hidden?: boolean }>;
  aliases?: Record<string, { parent: string }>;
}

export function loadManifest(): Promise<IconLibraryManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      })
      .catch((e) => {
        logger.debug('[iconLibrary] manifest load failed', e);
        manifestPromise = null;
        throw e;
      });
  }
  return manifestPromise;
}

export function loadPackIndex(packId: string): Promise<IconIndexEntry[]> {
  let p = indexCache.get(packId);
  if (!p) {
    p = fetch(INDEX_URL(packId))
      .then((r) => {
        if (!r.ok) throw new Error(`index ${packId} ${r.status}`);
        return r.json();
      })
      .catch((e) => {
        logger.debug('[iconLibrary] index load failed', packId, e);
        indexCache.delete(packId);
        throw e;
      });
    indexCache.set(packId, p);
  }
  return p;
}

export function loadPack(packId: string): Promise<IconifyPack> {
  let p = packCache.get(packId);
  if (!p) {
    p = fetch(PACK_URL(packId))
      .then((r) => {
        if (!r.ok) throw new Error(`pack ${packId} ${r.status}`);
        return r.json();
      })
      .catch((e) => {
        logger.debug('[iconLibrary] pack load failed', packId, e);
        packCache.delete(packId);
        throw e;
      });
    packCache.set(packId, p);
  }
  return p;
}

/** Build an SVG string from pack data. Caches result per id. */
export async function materializeSvg(packId: string, iconName: string): Promise<string> {
  // Synthetic "multicultural" pack: entries encode "<srcPack>__<name>" — delegate
  // to the real source pack so SVGs render without duplicating icon bodies.
  if (packId === 'multicultural' && iconName.includes('__')) {
    const sep = iconName.indexOf('__');
    const srcPack = iconName.slice(0, sep);
    const srcName = iconName.slice(sep + 2);
    return materializeSvg(srcPack, srcName);
  }
  const cacheKey = `${packId}/${iconName}`;
  const cached = svgCache.get(cacheKey);
  if (cached) return cached;
  const pack = await loadPack(packId);
  let icon = pack.icons[iconName];
  if (!icon && pack.aliases?.[iconName]) {
    icon = pack.icons[pack.aliases[iconName].parent];
  }
  if (!icon) throw new Error(`icon not found: ${cacheKey}`);
  const w = icon.width ?? pack.width ?? 24;
  const h = icon.height ?? pack.height ?? 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="currentColor">${icon.body}</svg>`;
  svgCache.set(cacheKey, svg);
  return svg;
}

/** Return a data URL suitable for <img src>. Cached. */
export async function materializeDataUrl(packId: string, iconName: string): Promise<string> {
  const cacheKey = `${packId}/${iconName}`;
  const cached = dataUrlCache.get(cacheKey);
  if (cached) return cached;
  const svg = await materializeSvg(packId, iconName);
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  dataUrlCache.set(cacheKey, url);
  return url;
}

/** Parse SVG → first <path d="..."> or full body for BrandIconography conversion. */
export async function materializeAsBrandIconography(
  packId: string,
  iconName: string,
  category: string,
): Promise<{ id: string; name: string; svgPath: string; category: string; viewBox: string; fillMode: 'stroke' | 'fill' }> {
  const svg = await materializeSvg(packId, iconName);
  const pathMatch = svg.match(/<path[^>]*d="([^"]*)"/);
  const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
  const svgPath = pathMatch ? pathMatch[1] : svg;
  return {
    id: `${packId}/${iconName}`,
    name: iconName.replace(/-/g, ' '),
    svgPath,
    category,
    viewBox: viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24',
    fillMode: 'fill',
  };
}

export function getPackMeta(manifest: IconLibraryManifest, packId: string): IconPackMeta | undefined {
  return manifest.packs.find((p) => p.id === packId);
}
