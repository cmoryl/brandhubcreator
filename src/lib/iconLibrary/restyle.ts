/**
 * Phase 4 — Brand DNA restyling for bundled library icons.
 * Pulls an SVG from the icon library (via loader), applies the parent brand's
 * DNA rules (stroke/cap/join/colors) and an optional primary color,
 * and returns a brand-consistent SVG + data URL.
 *
 * Restyling is deterministic, so results are memoized in-memory and persisted
 * to localStorage keyed by (packId, iconName, dnaHash) for cross-session reuse.
 */
import DOMPurify from 'dompurify';
import { materializeSvg, loadManifest } from './loader';
import { logger } from '@/lib/logger';

export interface BrandRestyleDNA {
  /** Stroke width in viewBox units (e.g. 1.5). */
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'square' | 'butt';
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  /** Primary color applied to stroke/fill (any CSS color). */
  primaryColor?: string;
  /** Force fill mode. `preserve` = leave the icon's native mode. */
  fillMode?: 'preserve' | 'stroke' | 'fill';
}

export interface RestyledIcon {
  svg: string;
  dataUrl: string;
  skipped: boolean; // true if multicolor pack
}

const memoryCache = new Map<string, RestyledIcon>();
const STORAGE_PREFIX = 'iconDna:';
const STORAGE_MAX_ENTRIES = 500;

let multicolorPacks: Set<string> | null = null;
async function getMulticolorPacks(): Promise<Set<string>> {
  if (multicolorPacks) return multicolorPacks;
  try {
    const m = await loadManifest();
    multicolorPacks = new Set(m.packs.filter((p) => p.multicolor).map((p) => p.id));
  } catch {
    multicolorPacks = new Set();
  }
  return multicolorPacks;
}

/** Short stable hash of the DNA spec — used as cache key segment. */
function hashDna(dna: BrandRestyleDNA): string {
  const s = JSON.stringify([
    dna.strokeWidth ?? '',
    dna.strokeLinecap ?? '',
    dna.strokeLinejoin ?? '',
    dna.primaryColor ?? '',
    dna.fillMode ?? '',
  ]);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function readLocal(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    // Cheap eviction: if we have too many keys, drop the oldest seen prefix.
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
    if (keys.length > STORAGE_MAX_ENTRIES) {
      keys.slice(0, keys.length - STORAGE_MAX_ENTRIES).forEach((k) => {
        try { window.localStorage.removeItem(k); } catch { /* noop */ }
      });
    }
  } catch (e) {
    logger.debug('[iconDna] localStorage write failed', e);
  }
}

/**
 * Restyle a single SVG string using DOMParser (spec-compliant) — applies
 * stroke/cap/join/color uniformly across drawable nodes.
 */
export function applyBrandDnaToSvg(svg: string, dna: BrandRestyleDNA): string {
  if (!svg) return svg;
  const sanitized = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
  });

  const doc = new DOMParser().parseFromString(sanitized, 'image/svg+xml');
  const root = doc.querySelector('svg');
  if (!root) return sanitized;

  const color = dna.primaryColor && dna.primaryColor.trim() !== '' ? dna.primaryColor : 'currentColor';
  const drawables = root.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon');

  drawables.forEach((el) => {
    const currentFill = (el.getAttribute('fill') || '').toLowerCase();
    const currentStroke = (el.getAttribute('stroke') || '').toLowerCase();
    const hasExplicitFill = currentFill && currentFill !== 'none';
    const hasExplicitStroke = currentStroke && currentStroke !== 'none';

    // Determine effective fill mode:
    let mode: 'stroke' | 'fill' = hasExplicitStroke && !hasExplicitFill ? 'stroke' : 'fill';
    if (dna.fillMode === 'stroke') mode = 'stroke';
    else if (dna.fillMode === 'fill') mode = 'fill';

    if (mode === 'stroke') {
      el.setAttribute('stroke', color);
      el.setAttribute('fill', 'none');
      if (dna.strokeWidth != null) el.setAttribute('stroke-width', String(dna.strokeWidth));
      if (dna.strokeLinecap) el.setAttribute('stroke-linecap', dna.strokeLinecap);
      if (dna.strokeLinejoin) el.setAttribute('stroke-linejoin', dna.strokeLinejoin);
    } else {
      // fill mode: recolor any existing fill, remove stray strokes
      if (hasExplicitFill || !hasExplicitStroke) {
        el.setAttribute('fill', color);
      }
      if (hasExplicitStroke) el.setAttribute('stroke', color);
    }
  });

  // Apply group-level defaults too
  if (dna.fillMode === 'stroke') {
    root.setAttribute('fill', 'none');
    root.setAttribute('stroke', color);
    if (dna.strokeWidth != null) root.setAttribute('stroke-width', String(dna.strokeWidth));
    if (dna.strokeLinecap) root.setAttribute('stroke-linecap', dna.strokeLinecap);
    if (dna.strokeLinejoin) root.setAttribute('stroke-linejoin', dna.strokeLinejoin);
  }

  return new XMLSerializer().serializeToString(root);
}

/**
 * Fetch a bundled-library icon and return it restyled to brand DNA.
 * Multicolor packs are returned untouched (with `skipped: true`).
 */
export async function restyleBundledIcon(
  packId: string,
  iconName: string,
  dna: BrandRestyleDNA,
): Promise<RestyledIcon> {
  const dnaKey = hashDna(dna);
  const cacheKey = `${packId}/${iconName}@${dnaKey}`;
  const mem = memoryCache.get(cacheKey);
  if (mem) return mem;

  const storageKey = `${STORAGE_PREFIX}${cacheKey}`;
  const stored = readLocal(storageKey);
  if (stored) {
    const result: RestyledIcon = { svg: stored, dataUrl: svgToDataUrl(stored), skipped: false };
    memoryCache.set(cacheKey, result);
    return result;
  }

  const multicolor = await getMulticolorPacks();
  const original = await materializeSvg(packId, iconName);

  if (multicolor.has(packId)) {
    const result: RestyledIcon = { svg: original, dataUrl: svgToDataUrl(original), skipped: true };
    memoryCache.set(cacheKey, result);
    return result;
  }

  const restyled = applyBrandDnaToSvg(original, dna);
  const result: RestyledIcon = { svg: restyled, dataUrl: svgToDataUrl(restyled), skipped: false };
  memoryCache.set(cacheKey, result);
  writeLocal(storageKey, restyled);
  return result;
}

/** Clear restyle caches (e.g. when brand DNA changes globally). */
export function clearRestyleCache() {
  memoryCache.clear();
  try {
    if (typeof window === 'undefined') return;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
