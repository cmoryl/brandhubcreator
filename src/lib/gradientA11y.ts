/**
 * Gradient accessibility utilities.
 *
 * - Parse hex/rgb/hsl strings to RGB
 * - WCAG 2.1 relative luminance + contrast ratio
 * - Sample colors along a gradient (linear/radial/conic/mesh) and report
 *   the worst-case contrast against light and dark text.
 * - Generate every 2-color combination (ordered) from a palette and score it.
 */

import {
  StudioGradient,
  createStudioGradient,
} from "./gradientStudio";

/* ----------------------------- Color parsing ------------------------------ */

export interface RGB { r: number; g: number; b: number }

const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, n));

export function parseColor(input: string): RGB {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 8) hex = hex.slice(0, 6);
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const rgbMatch = s.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: clamp(parts[0]), g: clamp(parts[1]), b: clamp(parts[2]) };
  }
  const hslMatch = s.match(/hsla?\(([^)]+)\)/);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[,\s/]+/).filter(Boolean);
    const h = parseFloat(parts[0]);
    const sat = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    return hslToRgb(h, sat, l);
  }
  return { r: 0, g: 0, b: 0 };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
    case gn: h = (bn - rn) / d + 2; break;
    case bn: h = (rn - gn) / d + 4; break;
  }
  return { h: h * 60, s, l };
}

export function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("");
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/* ----------------------------- WCAG contrast ------------------------------ */

const channelLum = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export function relativeLuminance(rgb: RGB): number {
  return 0.2126 * channelLum(rgb.r) + 0.7152 * channelLum(rgb.g) + 0.0722 * channelLum(rgb.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA-Large" | "FAIL";

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-Large";
  return "FAIL";
}

/* --------------------------- Gradient sampling ---------------------------- */

const SAMPLE_COUNT = 9;

export function sampleGradientColors(g: StudioGradient): RGB[] {
  if (g.type === "mesh") {
    // For mesh, sample each mesh point + naive blend of all points center.
    const pts = g.meshPoints.map((p) => parseColor(p.color));
    if (!pts.length) return [{ r: 0, g: 0, b: 0 }];
    const avg: RGB = pts.reduce(
      (acc, p) => ({ r: acc.r + p.r / pts.length, g: acc.g + p.g / pts.length, b: acc.b + p.b / pts.length }),
      { r: 0, g: 0, b: 0 },
    );
    return [...pts, avg];
  }
  // linear/radial/conic: sample along sorted stops at uniform t values.
  const stops = [...g.stops].sort((a, b) => a.position - b.position);
  if (!stops.length) return [{ r: 0, g: 0, b: 0 }];
  const colors = stops.map((s) => ({ p: s.position / 100, c: parseColor(s.color) }));
  const samples: RGB[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / (SAMPLE_COUNT - 1);
    // find segment
    let a = colors[0], b = colors[colors.length - 1];
    for (let k = 0; k < colors.length - 1; k++) {
      if (t >= colors[k].p && t <= colors[k + 1].p) { a = colors[k]; b = colors[k + 1]; break; }
    }
    const span = b.p - a.p || 1;
    const local = (t - a.p) / span;
    samples.push(mixRgb(a.c, b.c, Math.max(0, Math.min(1, local))));
  }
  return samples;
}

/* ---------------------- Per-gradient a11y score --------------------------- */

export interface A11yScore {
  /** worst (min) contrast ratio anywhere on the gradient vs the test color */
  minRatioWhite: number;
  minRatioDark: number;
  /** sample colors as hex (for inspection / chip rendering) */
  samples: string[];
  /** WCAG level for worst case */
  whiteLevel: WcagLevel;
  darkLevel: WcagLevel;
  /** Which text color is better here */
  recommendedText: "light" | "dark";
}

export const TEXT_LIGHT: RGB = { r: 255, g: 255, b: 255 };
export const TEXT_DARK: RGB = { r: 17, g: 17, b: 17 };

export function scoreGradient(
  g: StudioGradient,
  lightText: RGB = TEXT_LIGHT,
  darkText: RGB = TEXT_DARK,
): A11yScore {
  const samples = sampleGradientColors(g);
  let minWhite = Infinity;
  let minDark = Infinity;
  for (const s of samples) {
    minWhite = Math.min(minWhite, contrastRatio(s, lightText));
    minDark = Math.min(minDark, contrastRatio(s, darkText));
  }
  return {
    minRatioWhite: minWhite,
    minRatioDark: minDark,
    samples: samples.map(rgbToHex),
    whiteLevel: wcagLevel(minWhite),
    darkLevel: wcagLevel(minDark),
    recommendedText: minWhite >= minDark ? "light" : "dark",
  };
}

/* --------------------- Combination matrix from palette -------------------- */

export interface PaletteCombo {
  id: string;
  from: string;
  to: string;
  type: "linear" | "radial";
  angle: number;
  gradient: StudioGradient;
  score: A11yScore;
}

export interface ComboOptions {
  includeRadial?: boolean;
  angles?: number[];          // default [135]
  skipSameColor?: boolean;    // default true
  ordered?: boolean;          // default false (treat A→B and B→A as one)
}

export function generateCombinations(palette: string[], opts: ComboOptions = {}): PaletteCombo[] {
  const angles = opts.angles ?? [135];
  const ordered = opts.ordered ?? false;
  const skipSame = opts.skipSameColor ?? true;
  const result: PaletteCombo[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < palette.length; i++) {
    for (let j = 0; j < palette.length; j++) {
      const from = palette[i];
      const to = palette[j];
      if (skipSame && from.toLowerCase() === to.toLowerCase()) continue;
      if (!ordered) {
        const key = [from, to].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
      }
      for (const angle of angles) {
        const g = createStudioGradient({
          name: `${from} → ${to}`,
          type: "linear",
          angle,
          stops: [
            { id: crypto.randomUUID(), color: from, position: 0 },
            { id: crypto.randomUUID(), color: to, position: 100 },
          ],
        });
        result.push({
          id: `${from}-${to}-${angle}-lin`,
          from, to,
          type: "linear",
          angle,
          gradient: g,
          score: scoreGradient(g),
        });
        if (opts.includeRadial) {
          const r = createStudioGradient({
            name: `${from} ◉ ${to}`,
            type: "radial",
            stops: [
              { id: crypto.randomUUID(), color: from, position: 0 },
              { id: crypto.randomUUID(), color: to, position: 100 },
            ],
          });
          result.push({
            id: `${from}-${to}-rad`,
            from, to,
            type: "radial",
            angle: 0,
            gradient: r,
            score: scoreGradient(r),
          });
        }
      }
    }
  }
  return result;
}

/* ------------------------------- Defaults --------------------------------- */

/** TransPerfect Master Brand palette from the uploaded color guide. */
export const DEFAULT_BRAND_PALETTE: { name: string; hex: string; group: string }[] = [
  { name: "Blue 500",   hex: "#003FC7", group: "Primary" },
  { name: "Blue 800",   hex: "#03002C", group: "Primary" },
  { name: "Aqua",       hex: "#A1FBF9", group: "Secondary" },
  { name: "Lavender",   hex: "#C2A3FF", group: "Secondary" },
  { name: "Yellow",     hex: "#FFEB66", group: "Tertiary" },
  { name: "Green",      hex: "#A6FA87", group: "Tertiary" },
  { name: "Peach",      hex: "#FF9B70", group: "Tertiary" },
  { name: "Pink",       hex: "#EC388A", group: "Tertiary" },
  { name: "Red",        hex: "#E53D2E", group: "Tertiary" },
  { name: "Dark Gray",  hex: "#666666", group: "Neutral" },
  { name: "Light Gray", hex: "#F2F2F2", group: "Neutral" },
  { name: "Blue White", hex: "#E0E8F5", group: "Neutral" },
];
