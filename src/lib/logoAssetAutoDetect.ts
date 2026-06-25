import type { ClientLogoLockup, ClientLogoVariant } from '@/types/brand';

export interface DetectedAssetMeta {
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

const ICON_HINTS = /\b(icon|symbol|mark|glyph|favicon|emblem|avatar|app[\s_-]?icon|isotype|isotipo)\b/i;
const WORDMARK_HINTS = /\b(wordmark|word[\s_-]?mark|logotype|lettermark|wm)\b/i;

const BLACK_HINTS = /\b(black|dark|onlight|on[\s_-]?light|negative|noir|k100|mono(chrome)?[\s_-]?(black|dark)?|inverse[\s_-]?dark)\b/i;
const WHITE_HINTS = /\b(white|light|onwhite|on[\s_-]?dark|reverse|reversed|blanc|negative[\s_-]?white|mono(chrome)?[\s_-]?(white|light)|knockout)\b/i;
const COLOR_HINTS = /\b(color|colour|full[\s_-]?color|fullcolour|rgb|cmyk|brand|primary|official|standard)\b/i;

const FILL_NONE = /fill\s*=\s*"(?:none|transparent)"/gi;
const FILL_ATTR = /fill\s*=\s*"([^"]+)"/gi;
const FILL_STYLE = /fill\s*:\s*([^;"']+)/gi;
const STOP_COLOR_ATTR = /stop-color\s*=\s*"([^"]+)"/gi;
const STOP_COLOR_STYLE = /stop-color\s*:\s*([^;"']+)/gi;

function normColor(c: string): string | null {
  const v = c.trim().toLowerCase();
  if (!v || v === 'none' || v === 'transparent' || v === 'currentcolor') return null;
  return v;
}

function isBlackish(c: string): boolean {
  if (c === '#000' || c === '#000000' || c === 'black') return true;
  const m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r < 24 && g < 24 && b < 24;
  }
  const rgb = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return +rgb[1] < 24 && +rgb[2] < 24 && +rgb[3] < 24;
  return false;
}

function isWhitish(c: string): boolean {
  if (c === '#fff' || c === '#ffffff' || c === 'white') return true;
  const m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r > 232 && g > 232 && b > 232;
  }
  const rgb = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return +rgb[1] > 232 && +rgb[2] > 232 && +rgb[3] > 232;
  return false;
}

interface SvgColorStats {
  total: number;
  black: number;
  white: number;
  uniqueNonBW: Set<string>;
  hasGradient: boolean;
}

function analyzeSvgColors(svg: string): SvgColorStats {
  const stats: SvgColorStats = { total: 0, black: 0, white: 0, uniqueNonBW: new Set(), hasGradient: false };
  if (/<(linear|radial)Gradient\b/i.test(svg)) stats.hasGradient = true;

  const collect = (regex: RegExp) => {
    const local = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = local.exec(svg)) !== null) {
      const c = normColor(m[1]);
      if (!c) continue;
      stats.total++;
      if (isBlackish(c)) stats.black++;
      else if (isWhitish(c)) stats.white++;
      else stats.uniqueNonBW.add(c);
    }
  };
  collect(FILL_ATTR);
  collect(FILL_STYLE);
  collect(STOP_COLOR_ATTR);
  collect(STOP_COLOR_STYLE);
  return stats;
}

async function readPngDominantTone(file: File): Promise<'black' | 'white' | 'color' | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    URL.revokeObjectURL(url);

    let opaque = 0;
    let black = 0;
    let white = 0;
    let chroma = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 32) continue;
      opaque++;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min > 24) chroma++;
      else if (max < 32) black++;
      else if (min > 224) white++;
    }
    if (opaque < 32) return null;
    if (chroma / opaque > 0.15) return 'color';
    if (black / opaque > 0.4) return 'black';
    if (white / opaque > 0.4) return 'white';
    return null;
  } catch {
    return null;
  }
}

export async function detectAssetMeta(
  file: File,
  fallback: { lockup: ClientLogoLockup; variant: ClientLogoVariant },
): Promise<DetectedAssetMeta> {
  const reasons: string[] = [];
  const name = file.name;
  const lower = name.toLowerCase();

  // Lockup detection
  let lockup: ClientLogoLockup = fallback.lockup;
  let lockupConfident = false;
  if (ICON_HINTS.test(lower)) {
    lockup = 'icon';
    lockupConfident = true;
    reasons.push('name contains icon/symbol');
  } else if (WORDMARK_HINTS.test(lower)) {
    lockup = 'wordmark';
    lockupConfident = true;
    reasons.push('name contains wordmark/logotype');
  }

  // Variant detection from filename first
  let variant: ClientLogoVariant = fallback.variant;
  let variantConfident = false;
  // Order matters: color wins over white if both appear (e.g. "fullcolor")
  if (COLOR_HINTS.test(lower)) {
    variant = 'color';
    variantConfident = true;
    reasons.push('name suggests color');
  } else if (WHITE_HINTS.test(lower)) {
    variant = 'white';
    variantConfident = true;
    reasons.push('name suggests white');
  } else if (BLACK_HINTS.test(lower)) {
    variant = 'black';
    variantConfident = true;
    reasons.push('name suggests black');
  }

  const isSvg = /\.svg$/i.test(lower) || file.type === 'image/svg+xml';
  const isPng = /\.png$/i.test(lower) || file.type === 'image/png';

  if (!variantConfident && isSvg) {
    try {
      const text = await file.text();
      const stats = analyzeSvgColors(text.replace(FILL_NONE, ''));
      if (stats.hasGradient || stats.uniqueNonBW.size > 0) {
        variant = 'color';
        variantConfident = true;
        reasons.push(
          stats.hasGradient ? 'svg uses gradient' : `svg has ${stats.uniqueNonBW.size} non-B/W colors`,
        );
      } else if (stats.total > 0 && stats.white > 0 && stats.black === 0) {
        variant = 'white';
        variantConfident = true;
        reasons.push('svg fills are all white');
      } else if (stats.total > 0 && stats.black > 0 && stats.white === 0) {
        variant = 'black';
        variantConfident = true;
        reasons.push('svg fills are all black');
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!variantConfident && isPng && typeof window !== 'undefined') {
    const tone = await readPngDominantTone(file);
    if (tone) {
      variant = tone;
      variantConfident = true;
      reasons.push(`png pixels look ${tone}`);
    }
  }

  const confidence: DetectedAssetMeta['confidence'] =
    lockupConfident && variantConfident ? 'high' : lockupConfident || variantConfident ? 'medium' : 'low';

  return { lockup, variant, confidence, reasons };
}
