/**
 * Smart Color Intelligence
 * - Temperature, mood, season detection
 * - Auto-detect harmony type
 * - Generate harmonies (complementary, triadic, analogous, split-complementary)
 * - Generate variants (shades, tints, tones)
 */

export interface HSL { h: number; s: number; l: number }
export interface RGB { r: number; g: number; b: number }

export const hexToRgb2 = (hex: string): RGB => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
};

export const rgbToHex2 = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();

export const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      case bn: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
};

export const hslToRgb = ({ h, s, l }: HSL): RGB => {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

export const hexToHsl2 = (hex: string) => rgbToHsl(hexToRgb2(hex));
export const hslToHex = (hsl: HSL) => {
  const { r, g, b } = hslToRgb(hsl);
  return rgbToHex2(r, g, b);
};

// ── Temperature ───────────────────────────────────────────────────
export type Temperature = 'warm' | 'cool' | 'neutral';

export function paletteTemperature(hexes: string[]): { label: Temperature; score: number; warmCount: number; coolCount: number } {
  let warm = 0, cool = 0, neutral = 0;
  hexes.forEach(hex => {
    const { h, s } = hexToHsl2(hex);
    if (s < 10) { neutral++; return; }
    // Warm: red-orange-yellow (0-60) + magenta (300-360)
    if ((h >= 0 && h <= 60) || h >= 300) warm++;
    // Cool: green-blue-purple (120-300)
    else if (h >= 120 && h < 300) cool++;
    else neutral++;
  });
  const label: Temperature = warm > cool ? 'warm' : cool > warm ? 'cool' : 'neutral';
  const total = hexes.length || 1;
  const score = Math.round((Math.max(warm, cool) / total) * 100);
  return { label, score, warmCount: warm, coolCount: cool };
}

// ── Mood ──────────────────────────────────────────────────────────
export function paletteMood(hexes: string[]): { tags: string[]; description: string } {
  if (!hexes.length) return { tags: [], description: '' };
  const hsls = hexes.map(hexToHsl2);
  const avgL = hsls.reduce((s, c) => s + c.l, 0) / hsls.length;
  const avgS = hsls.reduce((s, c) => s + c.s, 0) / hsls.length;
  const temp = paletteTemperature(hexes).label;
  const tags: string[] = [];

  if (avgS > 65 && avgL > 40 && avgL < 70) tags.push('Vibrant', 'Energetic');
  if (avgS < 25) tags.push('Muted', 'Sophisticated');
  if (avgL > 75) tags.push('Airy', 'Light');
  if (avgL < 25) tags.push('Moody', 'Dramatic');
  if (avgL >= 25 && avgL <= 45 && avgS < 40) tags.push('Serious', 'Professional');
  if (temp === 'warm' && avgS > 50) tags.push('Inviting', 'Bold');
  if (temp === 'cool' && avgS < 50) tags.push('Calm', 'Trustworthy');
  if (temp === 'cool' && avgS > 60) tags.push('Fresh', 'Modern');
  if (avgS > 40 && avgL > 60) tags.push('Playful');
  if (tags.length === 0) tags.push('Balanced');

  const unique = Array.from(new Set(tags)).slice(0, 4);
  const description = `${unique.join(' · ')} — avg lightness ${Math.round(avgL)}%, saturation ${Math.round(avgS)}%`;
  return { tags: unique, description };
}

// ── Season ────────────────────────────────────────────────────────
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function paletteSeason(hexes: string[]): { season: Season; confidence: number; reason: string } {
  if (!hexes.length) return { season: 'spring', confidence: 0, reason: '' };
  const hsls = hexes.map(hexToHsl2);
  const avgL = hsls.reduce((s, c) => s + c.l, 0) / hsls.length;
  const avgS = hsls.reduce((s, c) => s + c.s, 0) / hsls.length;
  const temp = paletteTemperature(hexes).label;

  // Spring: warm, bright, clear (high L, high S, warm)
  // Summer: cool, soft, muted (mid L, low-mid S, cool)
  // Autumn: warm, muted, deep (mid-low L, mid S, warm)
  // Winter: cool, deep, saturated (low L or high contrast, high S, cool)

  const scores = {
    spring: (temp === 'warm' ? 30 : 0) + (avgL > 55 ? 25 : 0) + (avgS > 50 ? 25 : 0) + 10,
    summer: (temp === 'cool' ? 30 : 0) + (avgL > 45 && avgL < 75 ? 25 : 0) + (avgS < 50 ? 25 : 0) + 10,
    autumn: (temp === 'warm' ? 30 : 0) + (avgL < 55 ? 25 : 0) + (avgS < 60 && avgS > 20 ? 25 : 0) + 10,
    winter: (temp === 'cool' ? 30 : 0) + (avgL < 50 ? 20 : 0) + (avgS > 55 ? 30 : 0) + 10,
  };
  const entries = Object.entries(scores) as [Season, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [season, score] = entries[0];
  const reasons: Record<Season, string> = {
    spring: 'Bright, warm, and clear — evokes fresh beginnings',
    summer: 'Soft, cool, and muted — gentle and relaxing',
    autumn: 'Warm, earthy, and grounded — rich and mature',
    winter: 'Cool, deep, and high-contrast — bold and striking',
  };
  return { season, confidence: Math.min(100, score), reason: reasons[season] };
}

// ── Harmony auto-detect ───────────────────────────────────────────
export type HarmonyType =
  | 'monochromatic' | 'analogous' | 'complementary'
  | 'split-complementary' | 'triadic' | 'tetradic' | 'custom';

export function detectHarmony(hexes: string[]): { type: HarmonyType; score: number; description: string } {
  if (hexes.length < 2) return { type: 'custom', score: 0, description: 'Add more colors to detect harmony' };
  const hues = hexes.map(h => hexToHsl2(h).h);
  const sats = hexes.map(h => hexToHsl2(h).s);

  // Monochromatic: all hues within ~15° and similar
  const hueRange = Math.max(...hues) - Math.min(...hues);
  const maxSat = Math.max(...sats);
  if (hueRange < 15 && maxSat > 5) return { type: 'monochromatic', score: 95, description: 'Variations of a single hue — unified and elegant' };

  // Analogous: hues within ~60°
  if (hueRange < 60) return { type: 'analogous', score: 85, description: 'Adjacent hues on the wheel — harmonious and calm' };

  // Complementary: two clusters ~180° apart
  const sortedHues = [...hues].sort((a, b) => a - b);
  if (hexes.length === 2) {
    const diff = Math.abs(hues[0] - hues[1]);
    const normalized = Math.min(diff, 360 - diff);
    if (Math.abs(normalized - 180) < 25) return { type: 'complementary', score: 90, description: 'Opposite hues — maximum contrast and vibrancy' };
  }

  // Triadic: three hues ~120° apart
  if (hexes.length >= 3) {
    const h0 = sortedHues[0], h1 = sortedHues[1], h2 = sortedHues[2];
    const d1 = h1 - h0, d2 = h2 - h1, d3 = 360 - h2 + h0;
    const isTriadic = [d1, d2, d3].every(d => Math.abs(d - 120) < 30);
    if (isTriadic) return { type: 'triadic', score: 88, description: 'Three evenly-spaced hues — balanced and vibrant' };

    // Split-complementary: base + two hues near opposite
    const base = sortedHues[0];
    const opposite = (base + 180) % 360;
    const neighbors = sortedHues.slice(1).filter(h => Math.abs(h - opposite) < 40);
    if (neighbors.length >= 2) return { type: 'split-complementary', score: 80, description: 'Base hue with two neighbors of its opposite — rich yet balanced' };
  }

  // Tetradic: four hues forming a rectangle
  if (hexes.length >= 4) {
    const h0 = sortedHues[0], h1 = sortedHues[1], h2 = sortedHues[2], h3 = sortedHues[3];
    const isTetra = Math.abs((h2 - h0) - 180) < 30 && Math.abs((h3 - h1) - 180) < 30;
    if (isTetra) return { type: 'tetradic', score: 82, description: 'Four hues in a rectangle — bold and diverse' };
  }

  return { type: 'custom', score: 50, description: 'Custom arrangement — no classical harmony detected' };
}

// ── Harmony generators ────────────────────────────────────────────
export function generateComplementary(hex: string): string {
  const hsl = hexToHsl2(hex);
  return hslToHex({ ...hsl, h: (hsl.h + 180) % 360 });
}

export function generateTriadic(hex: string): string[] {
  const hsl = hexToHsl2(hex);
  return [
    hslToHex({ ...hsl, h: (hsl.h + 120) % 360 }),
    hslToHex({ ...hsl, h: (hsl.h + 240) % 360 }),
  ];
}

export function generateAnalogous(hex: string, step = 30): string[] {
  const hsl = hexToHsl2(hex);
  return [
    hslToHex({ ...hsl, h: (hsl.h - step + 360) % 360 }),
    hslToHex({ ...hsl, h: (hsl.h + step) % 360 }),
  ];
}

export function generateSplitComplementary(hex: string): string[] {
  const hsl = hexToHsl2(hex);
  return [
    hslToHex({ ...hsl, h: (hsl.h + 150) % 360 }),
    hslToHex({ ...hsl, h: (hsl.h + 210) % 360 }),
  ];
}

export function generateTetradic(hex: string): string[] {
  const hsl = hexToHsl2(hex);
  return [
    hslToHex({ ...hsl, h: (hsl.h + 90) % 360 }),
    hslToHex({ ...hsl, h: (hsl.h + 180) % 360 }),
    hslToHex({ ...hsl, h: (hsl.h + 270) % 360 }),
  ];
}

// Shades: mix with black (decrease lightness)
export function generateShades(hex: string, count = 5): string[] {
  const hsl = hexToHsl2(hex);
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const l = Math.max(0, hsl.l * (1 - i / (count + 1)));
    result.push(hslToHex({ ...hsl, l }));
  }
  return result;
}

// Tints: mix with white (increase lightness)
export function generateTints(hex: string, count = 5): string[] {
  const hsl = hexToHsl2(hex);
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const l = Math.min(100, hsl.l + (100 - hsl.l) * (i / (count + 1)));
    result.push(hslToHex({ ...hsl, l }));
  }
  return result;
}

// Tones: mix with gray (decrease saturation)
export function generateTones(hex: string, count = 5): string[] {
  const hsl = hexToHsl2(hex);
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const s = Math.max(0, hsl.s * (1 - i / (count + 1)));
    result.push(hslToHex({ ...hsl, s }));
  }
  return result;
}

// Sample a single pixel from a loaded image element
export function pickPixelColor(img: HTMLImageElement, normalizedX: number, normalizedY: number): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const x = Math.floor(normalizedX * canvas.width);
  const y = Math.floor(normalizedY * canvas.height);
  try {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex2(r, g, b);
  } catch {
    return null;
  }
}
