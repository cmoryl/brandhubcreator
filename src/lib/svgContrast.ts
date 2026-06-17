// Lightweight client-side detector for SVGs that are "mostly light on transparent".
// Heuristic: fetch the SVG source, collect color tokens from common color-bearing
// attributes (fill, stroke, stop-color, color, and inline style), filter out
// transparent / "none", and compute the mean perceived luminance. If the SVG has
// no background rect (transparent canvas) and the mean luminance is high, we
// flag it as needing a dark background for contrast.

export type SvgContrastResult = {
  /** Mean perceived luminance of color tokens (0 = black, 1 = white). */
  lightness: number;
  /** True when the artwork is light and the canvas has no opaque background. */
  isLightOnTransparent: boolean;
  /** Number of color tokens analyzed. */
  sampleCount: number;
};

const cache = new Map<string, Promise<SvgContrastResult | null>>();

// CSS named colors we care about (the common ones used in logos).
const NAMED: Record<string, [number, number, number]> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
};

function parseColor(raw: string): [number, number, number] | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === 'none' || v === 'transparent' || v === 'currentcolor' || v === 'inherit') {
    return null;
  }
  if (v.startsWith('#')) {
    let hex = v.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].every((n) => Number.isFinite(n))) return [r, g, b];
    }
    return null;
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  if (NAMED[v]) return NAMED[v];
  return null;
}

// Perceived luminance per Rec. 709.
function luminance([r, g, b]: [number, number, number]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function extractColors(svg: string): string[] {
  const out: string[] = [];
  // Attribute form: fill="#fff", stroke='white', stop-color="rgb(...)"
  const attrRe = /(?:fill|stroke|stop-color|color)\s*=\s*"([^"]*)"|(?:fill|stroke|stop-color|color)\s*=\s*'([^']*)'/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(svg))) {
    const v = m[1] ?? m[2];
    if (v) out.push(v);
  }
  // Inline styles: style="fill:#fff; stroke: rgb(...)"
  const styleRe = /(?:fill|stroke|stop-color|color)\s*:\s*([^;"'}]+)/gi;
  while ((m = styleRe.exec(svg))) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

// Detect whether the SVG has an opaque rect or other shape that covers the
// whole canvas, which would make the "transparent" assumption wrong.
function hasOpaqueBackground(svg: string): boolean {
  // Look for a <rect> that fills 100%/full viewBox with a non-none fill.
  const rectRe = /<rect\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = rectRe.exec(svg))) {
    const tag = m[0];
    const widthFull = /\b(?:width)\s*=\s*"(100%|\d{3,5})"/.test(tag);
    const heightFull = /\b(?:height)\s*=\s*"(100%|\d{3,5})"/.test(tag);
    const fillMatch = tag.match(/\bfill\s*=\s*"([^"]+)"/);
    const fill = fillMatch?.[1]?.toLowerCase();
    if (widthFull && heightFull && fill && fill !== 'none' && fill !== 'transparent') {
      return true;
    }
  }
  return false;
}

export function analyzeSvgContrast(url: string): Promise<SvgContrastResult | null> {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;

  const p = (async (): Promise<SvgContrastResult | null> => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!text || (!ct.includes('svg') && !text.includes('<svg'))) return null;

      const tokens = extractColors(text);
      const lums: number[] = [];
      for (const t of tokens) {
        const c = parseColor(t);
        if (!c) continue;
        lums.push(luminance(c));
      }
      if (!lums.length) {
        return { lightness: 0, isLightOnTransparent: false, sampleCount: 0 };
      }
      const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
      const opaqueBg = hasOpaqueBackground(text);
      return {
        lightness: mean,
        sampleCount: lums.length,
        // Threshold tuned to flag near-white artwork (mean > 0.85) with no bg.
        isLightOnTransparent: !opaqueBg && mean > 0.85,
      };
    } catch {
      return null;
    }
  })();

  cache.set(url, p);
  return p;
}
