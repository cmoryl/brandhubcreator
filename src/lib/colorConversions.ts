/**
 * Color Conversion Utilities for Color Lab
 * 
 * HEX → RGB, HSL, CMYK, OKLCH + nearest Pantone matching
 */

import { hexToRgbArray } from './oklchAccessibility';

// ── RGB ────────────────────────────────────────────────────────────

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const [r, g, b] = hexToRgbArray(hex);
  return { r, g, b };
};

export const rgbToString = (r: number, g: number, b: number): string =>
  `rgb(${r}, ${g}, ${b})`;

// ── HSL ────────────────────────────────────────────────────────────

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToString = (h: number, s: number, l: number): string =>
  `hsl(${h}, ${s}%, ${l}%)`;

// ── CMYK ───────────────────────────────────────────────────────────

export const hexToCmyk = (hex: string): { c: number; m: number; y: number; k: number } => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
};

export const cmykToString = (c: number, m: number, y: number, k: number): string =>
  `C${c} M${m} Y${y} K${k}`;

// ── Pantone Nearest Match ──────────────────────────────────────────
// Subset of common Pantone colors for nearest-match approximation

const PANTONE_REFERENCE: Array<{ name: string; hex: string }> = [
  { name: 'PMS 185 C', hex: '#E4002B' },
  { name: 'PMS 186 C', hex: '#C8102E' },
  { name: 'PMS 200 C', hex: '#BA0C2F' },
  { name: 'PMS 201 C', hex: '#9B2335' },
  { name: 'PMS 032 C', hex: '#EF3340' },
  { name: 'PMS 021 C', hex: '#FE5000' },
  { name: 'PMS 151 C', hex: '#FF8200' },
  { name: 'PMS 137 C', hex: '#FFA300' },
  { name: 'PMS 116 C', hex: '#FFCD00' },
  { name: 'PMS 109 C', hex: '#FFD100' },
  { name: 'PMS 102 C', hex: '#FCE300' },
  { name: 'PMS 382 C', hex: '#C4D600' },
  { name: 'PMS 376 C', hex: '#7AB800' },
  { name: 'PMS 361 C', hex: '#43B02A' },
  { name: 'PMS 355 C', hex: '#009639' },
  { name: 'PMS 348 C', hex: '#00843D' },
  { name: 'PMS 341 C', hex: '#007A53' },
  { name: 'PMS 3278 C', hex: '#009B77' },
  { name: 'PMS 3262 C', hex: '#00BFB3' },
  { name: 'PMS 320 C', hex: '#009CA6' },
  { name: 'PMS 313 C', hex: '#0092BC' },
  { name: 'PMS 306 C', hex: '#00B5E2' },
  { name: 'PMS 299 C', hex: '#00A3E0' },
  { name: 'PMS 2925 C', hex: '#009CDE' },
  { name: 'PMS 285 C', hex: '#0076A8' },
  { name: 'PMS 286 C', hex: '#0033A0' },
  { name: 'PMS 072 C', hex: '#10069F' },
  { name: 'PMS 2685 C', hex: '#56368A' },
  { name: 'PMS 2627 C', hex: '#702F8A' },
  { name: 'PMS 2612 C', hex: '#892B64' },
  { name: 'PMS 2405 C', hex: '#A51890' },
  { name: 'PMS 239 C', hex: '#DB3EB1' },
  { name: 'PMS 232 C', hex: '#F277C6' },
  { name: 'PMS 189 C', hex: '#F8A3BC' },
  { name: 'PMS Black C', hex: '#2D2926' },
  { name: 'PMS Cool Gray 11 C', hex: '#53565A' },
  { name: 'PMS Cool Gray 7 C', hex: '#97999B' },
  { name: 'PMS Cool Gray 3 C', hex: '#C8C9C7' },
  { name: 'PMS Cool Gray 1 C', hex: '#D9D9D6' },
  { name: 'PMS White', hex: '#FFFFFF' },
  { name: 'PMS 7548 C', hex: '#FFC72C' },
  { name: 'PMS 7406 C', hex: '#F1BE48' },
  { name: 'PMS 7502 C', hex: '#DBB68F' },
  { name: 'PMS 7526 C', hex: '#8B634B' },
  { name: 'PMS 484 C', hex: '#9A3324' },
  { name: 'PMS 7621 C', hex: '#8C2318' },
  { name: 'PMS 7427 C', hex: '#A4343A' },
  { name: 'PMS 7462 C', hex: '#1B365D' },
  { name: 'PMS 289 C', hex: '#003057' },
  { name: 'PMS 302 C', hex: '#004B87' },
  { name: 'PMS 7700 C', hex: '#006269' },
  { name: 'PMS 7483 C', hex: '#275D38' },
  { name: 'PMS 7490 C', hex: '#6B9F37' },
  { name: 'PMS 7536 C', hex: '#A8A99E' },
  { name: 'PMS 7543 C', hex: '#98A4AE' },
];

const colorDistance = (hex1: string, hex2: string): number => {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  // Weighted Euclidean distance (perceptual approximation)
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  const rmean = (c1.r + c2.r) / 2;
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
};

export const nearestPantone = (hex: string): { name: string; hex: string; distance: number } => {
  let best = PANTONE_REFERENCE[0];
  let bestDist = Infinity;

  for (const p of PANTONE_REFERENCE) {
    const d = colorDistance(hex, p.hex);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  return { name: best.name, hex: best.hex, distance: Math.round(bestDist) };
};

// ── Print vs Digital recommendations ───────────────────────────────

export interface ColorMediumRecommendation {
  medium: 'print' | 'digital' | 'both';
  score: number; // 0-100
  notes: string[];
}

export const analyzeMediumSuitability = (hex: string): { print: ColorMediumRecommendation; digital: ColorMediumRecommendation } => {
  const cmyk = hexToCmyk(hex);
  const { r, g, b } = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  const printNotes: string[] = [];
  const digitalNotes: string[] = [];
  let printScore = 100;
  let digitalScore = 100;

  // Print: High ink coverage warning
  const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  if (totalInk > 300) {
    printNotes.push(`Total ink coverage ${totalInk}% exceeds 300% — risk of bleeding`);
    printScore -= 30;
  } else if (totalInk > 280) {
    printNotes.push(`Ink coverage ${totalInk}% is near the limit`);
    printScore -= 10;
  }

  // Print: Pure RGB colors don't reproduce well
  if ((r === 255 && g === 0) || (g === 255 && b === 0) || (r === 0 && b === 255)) {
    printNotes.push('Pure RGB primary — will shift significantly in CMYK');
    printScore -= 25;
  }

  // Print: Very vibrant colors lose punch in CMYK
  if (hsl.s > 90 && hsl.l > 40 && hsl.l < 60) {
    printNotes.push('Highly saturated — expect muted CMYK output');
    printScore -= 15;
  }

  // Print: Neon/fluorescent range
  if ((r > 200 && g > 200 && b < 100) || (r < 100 && g > 200 && b > 200)) {
    printNotes.push('Neon range — requires spot color for accurate reproduction');
    printScore -= 20;
  }

  // Digital: Very dark colors hard to distinguish on screens
  if (hsl.l < 5) {
    digitalNotes.push('Near-black — may appear identical to #000 on some screens');
    digitalScore -= 10;
  }

  // Digital: Very light colors
  if (hsl.l > 97) {
    digitalNotes.push('Near-white — low visibility on light backgrounds');
    digitalScore -= 15;
  }

  if (printNotes.length === 0) printNotes.push('Reproduces well in CMYK print');
  if (digitalNotes.length === 0) digitalNotes.push('Renders accurately on digital screens');

  return {
    print: { medium: 'print', score: Math.max(0, printScore), notes: printNotes },
    digital: { medium: 'digital', score: Math.max(0, digitalScore), notes: digitalNotes },
  };
};

// ── Full color analysis ────────────────────────────────────────────

export interface FullColorAnalysis {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  cmyk: { c: number; m: number; y: number; k: number };
  pantone: { name: string; hex: string; distance: number };
  printSuitability: ColorMediumRecommendation;
  digitalSuitability: ColorMediumRecommendation;
}

export const analyzeColor = (hex: string): FullColorAnalysis => {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const rgb = hexToRgb(normalized);
  const hsl = hexToHsl(normalized);
  const cmyk = hexToCmyk(normalized);
  const pantone = nearestPantone(normalized);
  const { print, digital } = analyzeMediumSuitability(normalized);

  return {
    hex: normalized.toUpperCase(),
    rgb,
    hsl,
    cmyk,
    pantone,
    printSuitability: print,
    digitalSuitability: digital,
  };
};
