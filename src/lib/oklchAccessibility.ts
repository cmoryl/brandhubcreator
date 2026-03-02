/**
 * OKLCH Color Accessibility Utilities
 * 
 * Provides WCAG contrast ratio calculation, OKLCH conversion,
 * colorblind simulation (Protanopia, Deuteranopia, Tritanopia),
 * and dark mode 2.0 compliance checking.
 */

// ── Hex ↔ RGB helpers ──────────────────────────────────────────────

export const hexToRgbArray = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};

// ── sRGB linearization ─────────────────────────────────────────────

const srgbToLinear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const linearToSrgb = (c: number): number => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
};

// ── Relative luminance (WCAG 2.x) ──────────────────────────────────

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgbArray(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

// ── WCAG Contrast Ratio ─────────────────────────────────────────────

export const contrastRatio = (hex1: string, hex2: string): number => {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'Fail';

export const wcagLevel = (ratio: number): WcagLevel => {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'Fail';
};

export const wcagLevelColor = (level: WcagLevel): string => {
  switch (level) {
    case 'AAA': return 'text-green-600 dark:text-green-400';
    case 'AA': return 'text-emerald-600 dark:text-emerald-400';
    case 'AA-large': return 'text-amber-600 dark:text-amber-400';
    case 'Fail': return 'text-red-600 dark:text-red-400';
  }
};

export const wcagBadgeBg = (level: WcagLevel): string => {
  switch (level) {
    case 'AAA': return 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700';
    case 'AA': return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700';
    case 'AA-large': return 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700';
    case 'Fail': return 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700';
  }
};

// ── Hex → OKLCH ─────────────────────────────────────────────────────

const rgbToOklab = (r: number, g: number, b: number): [number, number, number] => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
};

export interface OklchColor {
  L: number;  // Lightness 0-1
  C: number;  // Chroma 0-0.4+
  H: number;  // Hue 0-360
}

export const hexToOklch = (hex: string): OklchColor => {
  const [r, g, b] = hexToRgbArray(hex);
  const [L, a, bVal] = rgbToOklab(r, g, b);
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;
  return { L: Math.round(L * 1000) / 1000, C: Math.round(C * 1000) / 1000, H: Math.round(H * 10) / 10 };
};

export const formatOklch = (oklch: OklchColor): string => {
  return `oklch(${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.H.toFixed(1)})`;
};

// ── Auto-fix: suggest accessible color ──────────────────────────────

/**
 * Attempt to adjust a foreground color's OKLCH lightness so it meets
 * the target contrast ratio against a given background.
 * Returns the suggested hex, or null if no fix is possible.
 */
export const suggestAccessibleColor = (
  fgHex: string,
  bgHex: string,
  targetRatio: number = 4.5,
): string | null => {
  const bgLum = relativeLuminance(bgHex);
  const fgOklch = hexToOklch(fgHex);

  // Try darkening first (lower L), then lightening
  for (const direction of ['darken', 'lighten'] as const) {
    let lo = direction === 'darken' ? 0 : fgOklch.L;
    let hi = direction === 'darken' ? fgOklch.L : 1;

    // Binary search for the closest L that meets targetRatio
    let bestHex: string | null = null;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const candidateHex = oklchToHex({ L: mid, C: fgOklch.C, H: fgOklch.H });
      const ratio = contrastRatio(candidateHex, bgHex);
      if (ratio >= targetRatio) {
        bestHex = candidateHex;
        if (direction === 'darken') lo = mid; else hi = mid;
      } else {
        if (direction === 'darken') hi = mid; else lo = mid;
      }
    }
    if (bestHex) return bestHex;
  }
  return null;
};

// ── OKLCH → Hex (reverse conversion) ───────────────────────────────

export const oklchToHex = (oklch: OklchColor): string => {
  const { L, C, H } = oklch;
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Oklab → linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const lr = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const lg = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const lb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return rgbToHex(linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb));
};

// ── Colorblind Simulation (Brettel/Viénot matrices) ─────────────────

export type ColorblindType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// Simplified simulation matrices (Viénot 1999)
const cbMatrices: Record<Exclude<ColorblindType, 'achromatopsia'>, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900],
  ],
};

export const simulateColorblind = (hex: string, type: ColorblindType): string => {
  const [r, g, b] = hexToRgbArray(hex);

  if (type === 'achromatopsia') {
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return rgbToHex(gray, gray, gray);
  }

  const m = cbMatrices[type];
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  return rgbToHex(
    linearToSrgb(m[0][0] * lr + m[0][1] * lg + m[0][2] * lb),
    linearToSrgb(m[1][0] * lr + m[1][1] * lg + m[1][2] * lb),
    linearToSrgb(m[2][0] * lr + m[2][1] * lg + m[2][2] * lb),
  );
};

export const colorblindLabels: Record<ColorblindType, string> = {
  protanopia: 'Protanopia (Red-blind)',
  deuteranopia: 'Deuteranopia (Green-blind)',
  tritanopia: 'Tritanopia (Blue-blind)',
  achromatopsia: 'Achromatopsia (Monochrome)',
};

// ── Colorblind Safety Score ─────────────────────────────────────────

/** 
 * Check if a palette is "colorblind-safe" by ensuring all pairs
 * maintain distinguishable contrast under each CVD simulation.
 * Returns a 0-100 score.
 */
export const colorblindSafetyScore = (hexColors: string[]): number => {
  if (hexColors.length < 2) return 100;
  const types: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia'];
  let totalPairs = 0;
  let passingPairs = 0;

  for (const type of types) {
    const simulated = hexColors.map(h => simulateColorblind(h, type));
    for (let i = 0; i < simulated.length; i++) {
      for (let j = i + 1; j < simulated.length; j++) {
        totalPairs++;
        const ratio = contrastRatio(simulated[i], simulated[j]);
        if (ratio >= 2.5) passingPairs++; // Distinguishable threshold
      }
    }
  }

  return totalPairs === 0 ? 100 : Math.round((passingPairs / totalPairs) * 100);
};

// ── Dark Mode 2.0 Compliance ────────────────────────────────────────

export interface DarkModeCompliance {
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

/**
 * Evaluates a color for Dark Mode 2.0 readiness:
 * - Lightness in OKLCH should be adjustable
 * - Colors shouldn't be pure saturated (causes eye strain in dark)
 * - White text on color should have sufficient contrast
 */
export const evaluateDarkModeCompliance = (hex: string): DarkModeCompliance => {
  const oklch = hexToOklch(hex);
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Pure black or pure white are fine
  if (hex === '#000000' || hex === '#FFFFFF' || hex === '#ffffff') {
    return { score: 100, issues: [], suggestions: [] };
  }

  // High chroma + high lightness = eye strain in dark mode
  if (oklch.C > 0.2 && oklch.L > 0.7) {
    issues.push('High saturation + lightness causes eye strain in dark mode');
    suggestions.push(`Reduce lightness to ~${(oklch.L * 0.75 * 100).toFixed(0)}% or chroma to ~${(oklch.C * 0.7).toFixed(3)}`);
    score -= 25;
  }

  // Very high chroma causes vibration on dark backgrounds
  if (oklch.C > 0.25) {
    issues.push('High chroma may cause visual vibration on dark backgrounds');
    suggestions.push('Consider desaturating for dark mode variant');
    score -= 15;
  }

  // Very light colors disappear on white backgrounds
  if (oklch.L > 0.9) {
    issues.push('Too light — invisible on light backgrounds');
    suggestions.push('Create a darker variant for light mode');
    score -= 20;
  }

  // Very dark colors need attention too
  if (oklch.L < 0.2 && oklch.C < 0.05) {
    issues.push('Near-black with low chroma — may lack vibrancy in both modes');
    suggestions.push('Consider slightly higher lightness or chroma for dark mode');
    score -= 10;
  }

  // Check contrast with white and dark backgrounds
  const contrastOnDark = contrastRatio(hex, '#1a1a2e');
  const contrastOnLight = contrastRatio(hex, '#ffffff');

  if (contrastOnDark < 3) {
    issues.push(`Low contrast on dark backgrounds (${contrastOnDark.toFixed(1)}:1)`);
    suggestions.push('Increase lightness for dark mode variant');
    score -= 20;
  }

  if (contrastOnLight < 3) {
    issues.push(`Low contrast on light backgrounds (${contrastOnLight.toFixed(1)}:1)`);
    suggestions.push('Decrease lightness for light mode variant');
    score -= 20;
  }

  return { score: Math.max(0, score), issues, suggestions };
};

// ── Palette-level analysis ──────────────────────────────────────────

export interface PaletteAccessibilityReport {
  overallScore: number;
  wcagPairs: Array<{
    color1: { hex: string; name: string };
    color2: { hex: string; name: string };
    ratio: number;
    level: WcagLevel;
  }>;
  colorblindScore: number;
  darkModeScores: Array<{
    hex: string;
    name: string;
    compliance: DarkModeCompliance;
  }>;
  oklchValues: Array<{
    hex: string;
    name: string;
    oklch: OklchColor;
    formatted: string;
  }>;
}

export const analyzePalette = (
  colors: Array<{ hex: string; name: string }>
): PaletteAccessibilityReport => {
  // WCAG pairs (each color against white and black, plus all pairs)
  const backgrounds = [
    { hex: '#FFFFFF', name: 'White' },
    { hex: '#1A1A2E', name: 'Dark BG' },
  ];

  const wcagPairs: PaletteAccessibilityReport['wcagPairs'] = [];
  for (const color of colors) {
    for (const bg of backgrounds) {
      const ratio = contrastRatio(color.hex, bg.hex);
      wcagPairs.push({
        color1: color,
        color2: bg,
        ratio: Math.round(ratio * 100) / 100,
        level: wcagLevel(ratio),
      });
    }
  }

  // Colorblind safety
  const colorblindScore = colorblindSafetyScore(colors.map(c => c.hex));

  // Dark mode compliance per color
  const darkModeScores = colors.map(c => ({
    hex: c.hex,
    name: c.name,
    compliance: evaluateDarkModeCompliance(c.hex),
  }));

  // OKLCH values
  const oklchValues = colors.map(c => {
    const oklch = hexToOklch(c.hex);
    return { hex: c.hex, name: c.name, oklch, formatted: formatOklch(oklch) };
  });

  // Overall score
  const wcagScore = wcagPairs.length > 0
    ? (wcagPairs.filter(p => p.level !== 'Fail').length / wcagPairs.length) * 100
    : 100;
  const avgDarkMode = darkModeScores.length > 0
    ? darkModeScores.reduce((s, d) => s + d.compliance.score, 0) / darkModeScores.length
    : 100;
  const overallScore = Math.round((wcagScore * 0.4 + colorblindScore * 0.3 + avgDarkMode * 0.3));

  return { overallScore, wcagPairs, colorblindScore, darkModeScores, oklchValues };
};

// ── Gradient accessibility helpers ──────────────────────────────────

/** Extract hex colors from a CSS gradient string */
export const extractGradientColors = (css: string): string[] => {
  if (!css || typeof css !== 'string') return [];
  const hexMatches = css.match(/#[0-9a-fA-F]{3,8}/g) || [];
  // Normalize 3-char hex to 6-char
  return hexMatches.map(h => {
    if (h.length === 4) {
      return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    }
    return h.substring(0, 7).toUpperCase();
  });
};

export interface GradientAccessibility {
  colors: string[];
  minContrast: number;
  maxContrast: number;
  wcagLevel: WcagLevel;
  colorblindSafe: boolean;
  darkModeScore: number;
}

export const analyzeGradient = (css: string): GradientAccessibility => {
  if (!css || typeof css !== 'string') {
    return { colors: [], minContrast: 0, maxContrast: 0, wcagLevel: 'Fail', colorblindSafe: false, darkModeScore: 0 };
  }
  const colors = extractGradientColors(css);
  if (colors.length < 2) {
    return { colors, minContrast: 0, maxContrast: 0, wcagLevel: 'Fail', colorblindSafe: false, darkModeScore: 0 };
  }

  // Contrast between gradient endpoints and white/dark bg
  const bgs = ['#FFFFFF', '#1A1A2E'];
  let minC = Infinity;
  let maxC = 0;

  for (const color of colors) {
    for (const bg of bgs) {
      const r = contrastRatio(color, bg);
      minC = Math.min(minC, r);
      maxC = Math.max(maxC, r);
    }
  }

  const cbSafe = colorblindSafetyScore(colors) >= 70;
  const darkScores = colors.map(c => evaluateDarkModeCompliance(c).score);
  const avgDark = darkScores.reduce((a, b) => a + b, 0) / darkScores.length;

  return {
    colors,
    minContrast: Math.round(minC * 100) / 100,
    maxContrast: Math.round(maxC * 100) / 100,
    wcagLevel: wcagLevel(minC),
    colorblindSafe: cbSafe,
    darkModeScore: Math.round(avgDark),
  };
};
