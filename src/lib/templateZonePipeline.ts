/**
 * Shared template-zone pipeline.
 *
 * Pure helpers extracted from SocialAssetsSection so they can power the same
 * logo-matching, transparency-aware, original-resolution export pipeline on
 * other single-page templated sections (case studies, brochures, digital
 * collateral, event print collateral, etc.).
 *
 * These helpers are deliberately framework-agnostic and operate on a generic
 * zone shape (`TemplateZoneLike`) so any section can adopt them without
 * dragging in social-media-specific types.
 */

import type { BrandLogo } from '@/types/brand';

// ---------------------------------------------------------------------------
// Generic zone shape used by every templated section
// ---------------------------------------------------------------------------

export type TemplateZoneType = 'image' | 'text' | 'logo' | 'cta';

export interface TemplateZoneLike {
  type: TemplateZoneType;
  /** % of canvas width (0–100) */
  x: number;
  /** % of canvas height (0–100) */
  y: number;
  /** % of canvas width (0–100) */
  width: number;
  /** % of canvas height (0–100) */
  height: number;
  mediaUrl?: string;
  mediaFit?: {
    fit: 'cover' | 'contain';
    focusX: number;
    focusY: number;
  };
  /** Marker set when a logo zone was auto-applied by the background matcher. */
  autoMatchedLogoId?: string;
}

export const defaultTemplatePreviewFit = { fit: 'cover' as const, focusX: 50, focusY: 50 };

export const getZoneMediaFit = (zone: TemplateZoneLike) =>
  zone.mediaFit || defaultTemplatePreviewFit;

// ---------------------------------------------------------------------------
// URL classification
// ---------------------------------------------------------------------------

export const looksLikeSvgUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.split('?')[0].split('#')[0].toLowerCase();
  if (lower.endsWith('.svg')) return true;
  if (url.startsWith('data:image/svg')) return true;
  return false;
};

export const looksLikeAlphaCapableRaster = (url: string): boolean => {
  if (!url) return false;
  const lower = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    lower.endsWith('.png')
    || lower.endsWith('.webp')
    || lower.endsWith('.gif')
    || lower.endsWith('.avif')
    || url.startsWith('data:image/png')
    || url.startsWith('data:image/webp')
    || url.startsWith('data:image/gif')
    || url.startsWith('data:image/avif')
  );
};

// ---------------------------------------------------------------------------
// Asset transparency detection (cached)
// ---------------------------------------------------------------------------

const assetTransparencyCache = new Map<string, boolean>();
const assetTransparencyPending = new Map<string, Promise<boolean>>();

/**
 * Detect whether the given image URL has any transparent pixels. SVGs are
 * always treated as transparent; rasters with no alpha channel (JPEG) are
 * always opaque. PNG/WebP/GIF/AVIF are sampled on a 32×32 canvas.
 */
export const detectAssetTransparency = (url: string): Promise<boolean> => {
  if (!url) return Promise.resolve(false);
  if (assetTransparencyCache.has(url)) {
    return Promise.resolve(assetTransparencyCache.get(url) as boolean);
  }
  if (looksLikeSvgUrl(url)) {
    assetTransparencyCache.set(url, true);
    return Promise.resolve(true);
  }
  if (!looksLikeAlphaCapableRaster(url)) {
    assetTransparencyCache.set(url, false);
    return Promise.resolve(false);
  }
  const pending = assetTransparencyPending.get(url);
  if (pending) return pending;

  const promise = new Promise<boolean>((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 32;
          const h = 32;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(false);
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let transparentPixels = 0;
          const totalPixels = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 250) {
              transparentPixels += 1;
              if (transparentPixels / totalPixels > 0.02) break;
            }
          }
          const isTransparent = transparentPixels / totalPixels > 0.02;
          assetTransparencyCache.set(url, isTransparent);
          resolve(isTransparent);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    } catch {
      resolve(false);
    }
  }).finally(() => {
    assetTransparencyPending.delete(url);
  });

  assetTransparencyPending.set(url, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// SVG intrinsic size resolution
// ---------------------------------------------------------------------------

/**
 * Try to determine an SVG's intrinsic pixel dimensions by parsing the source.
 * Browsers report unreliable defaults (Chrome falls back to 300×150) for SVGs
 * that lack explicit width/height attributes — this returns the real numbers
 * from the viewBox / size attrs so canvas rasterisation is accurate.
 */
export const resolveSvgIntrinsicSize = async (
  url: string,
): Promise<{ width: number; height: number } | null> => {
  try {
    let svgText: string;
    if (url.startsWith('data:image/svg')) {
      const commaIdx = url.indexOf(',');
      const payload = url.slice(commaIdx + 1);
      svgText = url.includes(';base64,') ? atob(payload) : decodeURIComponent(payload);
    } else {
      const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
      if (!res.ok) return null;
      svgText = await res.text();
    }
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
    const widthAttr = svg.getAttribute('width');
    const heightAttr = svg.getAttribute('height');
    const parsePx = (v: string | null): number | null => {
      if (!v) return null;
      const num = parseFloat(v);
      if (Number.isNaN(num) || num <= 0) return null;
      if (/^\s*[\d.]+(px)?\s*$/i.test(v)) return num;
      return null;
    };
    let w = parsePx(widthAttr);
    let h = parsePx(heightAttr);
    if (!w || !h) {
      const vb = svg.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
          if (!w) w = parts[2];
          if (!h) h = parts[3];
        }
      }
    }
    if (!w || !h || w <= 0 || h <= 0) return null;
    return { width: w, height: h };
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Background luminance sampling (cached)
// ---------------------------------------------------------------------------

const backgroundLuminanceCache = new Map<string, number>();
const backgroundLuminancePending = new Map<string, Promise<number | null>>();

/**
 * Load an image cross-origin and return a perceived-brightness score (0–1).
 * Sampling is downscaled for speed and cached for the lifetime of the tab.
 */
export const sampleImageLuminance = (url: string): Promise<number | null> => {
  if (!url) return Promise.resolve(null);
  if (backgroundLuminanceCache.has(url)) {
    return Promise.resolve(backgroundLuminanceCache.get(url) ?? null);
  }
  const pending = backgroundLuminancePending.get(url);
  if (pending) return pending;

  const promise = new Promise<number | null>((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 24;
          const h = 24;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let total = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255;
            if (a < 0.1) continue;
            const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
            total += lum * a;
            count += a;
          }
          const avg = count > 0 ? total / count : null;
          if (avg !== null) backgroundLuminanceCache.set(url, avg);
          resolve(avg);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  }).finally(() => {
    backgroundLuminancePending.delete(url);
  });

  backgroundLuminancePending.set(url, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// Logo selection + background-aware auto-matching
// ---------------------------------------------------------------------------

/**
 * Pick a sensible default logo URL from the brand library to seed an empty
 * logo zone. Prefers `primary`, then `wordmark`, then any usable URL.
 */
export const pickDefaultBrandLogoUrl = (brandLogos?: BrandLogo[]): string | undefined => {
  if (!brandLogos?.length) return undefined;
  const order: BrandLogo['variant'][] = ['primary', 'wordmark', 'secondary', 'reversed', 'monochrome', 'icon'];
  for (const variant of order) {
    const match = brandLogos.find((logo) => logo.variant === variant && logo.url);
    if (match?.url) return match.url;
  }
  return brandLogos.find((logo) => !!logo.url)?.url;
};

export const pickDefaultBrandLogo = (brandLogos?: BrandLogo[]): BrandLogo | undefined => {
  if (!brandLogos?.length) return undefined;
  const order: BrandLogo['variant'][] = ['primary', 'wordmark', 'secondary', 'reversed', 'monochrome', 'icon'];
  for (const variant of order) {
    const match = brandLogos.find((logo) => logo.variant === variant && logo.url);
    if (match) return match;
  }
  return brandLogos.find((logo) => !!logo.url);
};

/**
 * Score a logo variant for legibility on a background of the given luminance.
 * Higher score = better fit. Returns 0–1.
 */
export const scoreLogoForBackground = (
  variant: BrandLogo['variant'],
  bgLuminance: number,
): number => {
  const isDarkBg = bgLuminance < 0.5;
  const lightBgAffinity: Record<BrandLogo['variant'], number> = {
    primary: 0.95,
    secondary: 0.85,
    wordmark: 0.8,
    icon: 0.75,
    monochrome: 0.7,
    reversed: 0.15,
  };
  const darkBgAffinity: Record<BrandLogo['variant'], number> = {
    reversed: 0.98,
    monochrome: 0.7,
    icon: 0.55,
    wordmark: 0.5,
    secondary: 0.35,
    primary: 0.2,
  };
  return isDarkBg ? darkBgAffinity[variant] : lightBgAffinity[variant];
};

export const describeBackgroundTone = (lum: number): 'dark' | 'mid' | 'light' => {
  if (lum < 0.35) return 'dark';
  if (lum > 0.65) return 'light';
  return 'mid';
};

/**
 * Pick the brand logo whose variant best matches a background luminance.
 */
export const pickBestBrandLogoForLuminance = (
  brandLogos: BrandLogo[] | undefined,
  bgLuminance: number,
): BrandLogo | undefined => {
  if (!brandLogos?.length) return undefined;
  const usable = brandLogos.filter((logo) => !!logo.url);
  if (!usable.length) return undefined;
  let best: { logo: BrandLogo; score: number } | null = null;
  for (const logo of usable) {
    const score = scoreLogoForBackground(logo.variant, bgLuminance);
    if (!best || score > best.score) best = { logo, score };
  }
  return best?.logo;
};

/**
 * Find the image zone that visually sits behind the given logo zone — i.e. the
 * largest image zone that overlaps the logo's footprint. Used to decide which
 * logo variant reads best on top.
 */
export const findBackgroundZoneForLogo = <Z extends TemplateZoneLike>(
  logoZone: Z,
  zones: Z[],
): Z | null => {
  const logoCx = logoZone.x + logoZone.width / 2;
  const logoCy = logoZone.y + logoZone.height / 2;
  let best: { zone: Z; area: number } | null = null;
  for (const zone of zones) {
    if (zone === logoZone) continue;
    if (zone.type !== 'image') continue;
    if (!zone.mediaUrl) continue;
    if (
      logoCx < zone.x ||
      logoCx > zone.x + zone.width ||
      logoCy < zone.y ||
      logoCy > zone.y + zone.height
    ) continue;
    const area = zone.width * zone.height;
    if (!best || area > best.area) best = { zone, area };
  }
  return best?.zone ?? null;
};

/**
 * Walk every logo zone, look up the image zone behind it, and — if that logo
 * zone is still flagged as auto-matched — swap its mediaUrl to whichever
 * brand-logo variant scores highest against the background's sampled luminance.
 * Returns a new array (or the input unchanged if nothing needed to move).
 */
export const autoMatchLogosForZones = async <Z extends TemplateZoneLike>(
  zones: Z[],
  brandLogos: BrandLogo[] | undefined,
): Promise<{ zones: Z[]; changed: boolean; swapped: number }> => {
  if (!brandLogos?.length) return { zones, changed: false, swapped: 0 };
  let changed = false;
  let swapped = 0;
  const next = await Promise.all(zones.map(async (zone) => {
    if (zone.type !== 'logo') return zone;
    if (!zone.autoMatchedLogoId) return zone; // user has taken manual control
    const bgZone = findBackgroundZoneForLogo(zone, zones);
    if (!bgZone?.mediaUrl) return zone;
    const lum = await sampleImageLuminance(bgZone.mediaUrl);
    if (lum === null) return zone;
    const best = pickBestBrandLogoForLuminance(brandLogos, lum);
    if (!best?.url) return zone;
    if (best.id === zone.autoMatchedLogoId && zone.mediaUrl === best.url) {
      return zone;
    }
    changed = true;
    swapped += 1;
    return { ...zone, mediaUrl: best.url, autoMatchedLogoId: best.id };
  }));
  return { zones: next, changed, swapped };
};

// ---------------------------------------------------------------------------
// Image loading helper
// ---------------------------------------------------------------------------

export const loadImageElement = (src: string): Promise<HTMLImageElement> => (
  new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  })
);

// ---------------------------------------------------------------------------
// Original-resolution per-zone rendering
// ---------------------------------------------------------------------------

/**
 * Render a single zone from its source media at the media's native resolution,
 * replicating object-fit: cover/contain + focus point cropping so the output
 * matches what the canvas previews on-screen.
 *
 * Logo zones with intrinsically transparent assets always export with
 * transparency preserved regardless of the requested `transparent` flag —
 * flattening them onto a white plate would defeat the point.
 */
export const renderZoneAtOriginalResolution = async (
  zone: TemplateZoneLike,
  transparent: boolean,
): Promise<string | null> => {
  if (!zone.mediaUrl) return null;
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(zone.mediaUrl);
  } catch (err) {
    console.warn('Failed to load zone media for original-resolution export', err);
    return null;
  }

  let effectiveTransparent = transparent;
  if (zone.type === 'logo') {
    try {
      const assetIsTransparent = await detectAssetTransparency(zone.mediaUrl);
      if (assetIsTransparent) effectiveTransparent = true;
    } catch {
      // Fall through with the requested setting.
    }
  }

  const fit = getZoneMediaFit(zone);
  const isSvg = looksLikeSvgUrl(zone.mediaUrl);

  let mediaW = img.naturalWidth || img.width;
  let mediaH = img.naturalHeight || img.height;
  if (isSvg) {
    const intrinsic = await resolveSvgIntrinsicSize(zone.mediaUrl);
    if (intrinsic) {
      mediaW = intrinsic.width;
      mediaH = intrinsic.height;
    }
    const SVG_TARGET = 2048;
    const longSide = Math.max(mediaW, mediaH);
    if (longSide > 0 && longSide < SVG_TARGET) {
      const scale = SVG_TARGET / longSide;
      mediaW = Math.round(mediaW * scale);
      mediaH = Math.round(mediaH * scale);
    }
  }
  if (mediaW === 0 || mediaH === 0) return null;

  let drawSource: CanvasImageSource = img;
  if (isSvg) {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = mediaW;
    sourceCanvas.height = mediaH;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return null;
    sourceCtx.imageSmoothingEnabled = true;
    sourceCtx.imageSmoothingQuality = 'high';
    sourceCtx.clearRect(0, 0, mediaW, mediaH);
    sourceCtx.drawImage(img, 0, 0, mediaW, mediaH);
    drawSource = sourceCanvas;
  }

  const zoneAspect = zone.width / zone.height;
  const mediaAspect = mediaW / mediaH;

  let outW: number;
  let outH: number;
  let sx = 0;
  let sy = 0;
  let sw = mediaW;
  let sh = mediaH;
  let dx = 0;
  let dy = 0;
  let dw: number;
  let dh: number;

  if (fit.fit === 'cover') {
    if (mediaAspect > zoneAspect) {
      sh = mediaH;
      sw = Math.round(mediaH * zoneAspect);
      const focusPx = ((fit.focusX ?? 50) / 100) * mediaW;
      sx = Math.round(Math.max(0, Math.min(mediaW - sw, focusPx - sw / 2)));
      sy = 0;
    } else {
      sw = mediaW;
      sh = Math.round(mediaW / zoneAspect);
      const focusPy = ((fit.focusY ?? 50) / 100) * mediaH;
      sy = Math.round(Math.max(0, Math.min(mediaH - sh, focusPy - sh / 2)));
      sx = 0;
    }
    outW = sw;
    outH = sh;
    dw = outW;
    dh = outH;
  } else {
    if (mediaAspect > zoneAspect) {
      outW = mediaW;
      outH = Math.round(mediaW / zoneAspect);
    } else {
      outH = mediaH;
      outW = Math.round(mediaH * zoneAspect);
    }
    dw = mediaW;
    dh = mediaH;
    const focusPx = ((fit.focusX ?? 50) / 100) * (outW - dw);
    const focusPy = ((fit.focusY ?? 50) / 100) * (outH - dh);
    dx = Math.round(Math.max(0, Math.min(outW - dw, focusPx)));
    dy = Math.round(Math.max(0, Math.min(outH - dh, focusPy)));
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, outW);
  canvas.height = Math.max(1, outH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (effectiveTransparent) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(drawSource, sx, sy, sw, sh, dx, dy, dw, dh);
  return canvas.toDataURL('image/png');
};
