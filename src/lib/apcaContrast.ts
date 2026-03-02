/**
 * APCA (Accessible Perceptual Contrast Algorithm) implementation
 * Based on APCA-W3 0.1.9 — the successor to WCAG 2.x contrast ratios
 * 
 * APCA provides perceptually uniform contrast values that better predict
 * readability than the WCAG 2.x luminance ratio method.
 */

import { hexToRgbArray } from './oklchAccessibility';

// sRGB to Y (luminance) using APCA coefficients
const sRGBtoY = (rgb: [number, number, number]): number => {
  const [r, g, b] = rgb.map(c => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
};

// Soft clamp for very low luminances
const softClamp = (y: number): number => {
  if (y < 0.022) return y + Math.pow(0.022 - y, 1.414);
  return y;
};

/**
 * Calculate APCA contrast value (Lc)
 * Returns a value roughly -108 to +106
 * Positive = light text on dark bg
 * Negative = dark text on light bg
 */
export const apcaContrast = (textHex: string, bgHex: string): number => {
  const txtY = softClamp(sRGBtoY(hexToRgbArray(textHex)));
  const bgY = softClamp(sRGBtoY(hexToRgbArray(bgHex)));

  // Determine polarity
  const outputScale = 0.56;
  const loBoWfactor = 0.001;
  const loBoWoffset = 0.027;

  let contrast: number;

  if (bgY > txtY) {
    // Dark text on light bg (negative Lc)
    const SAPC = (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * 1.14;
    contrast = SAPC < loBoWfactor ? 0 : SAPC - loBoWoffset;
  } else {
    // Light text on dark bg (positive Lc)
    const SAPC = (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * 1.14;
    contrast = Math.abs(SAPC) < loBoWfactor ? 0 : SAPC + loBoWoffset;
  }

  return Math.round(contrast * 100);
};

/**
 * APCA conformance levels based on Lc value
 */
export type ApcaLevel = 'Preferred' | 'Minimum' | 'Non-Text' | 'Fail';

export const apcaLevel = (lc: number): ApcaLevel => {
  const abs = Math.abs(lc);
  if (abs >= 75) return 'Preferred';    // Body text, all sizes
  if (abs >= 60) return 'Minimum';      // 18px+ or 14px bold
  if (abs >= 30) return 'Non-Text';     // Large non-text, icons
  return 'Fail';
};

export const apcaLevelColor = (level: ApcaLevel): string => {
  switch (level) {
    case 'Preferred': return 'text-green-600 dark:text-green-400';
    case 'Minimum': return 'text-amber-600 dark:text-amber-400';
    case 'Non-Text': return 'text-blue-600 dark:text-blue-400';
    case 'Fail': return 'text-destructive';
  }
};

export const apcaBadgeBg = (level: ApcaLevel): string => {
  switch (level) {
    case 'Preferred': return 'bg-green-100 dark:bg-green-900/30';
    case 'Minimum': return 'bg-amber-100 dark:bg-amber-900/30';
    case 'Non-Text': return 'bg-blue-100 dark:bg-blue-900/30';
    case 'Fail': return 'bg-red-100 dark:bg-red-900/30';
  }
};

/**
 * Font size recommendations based on APCA Lc value
 */
export const apcaFontRecommendation = (lc: number): string => {
  const abs = Math.abs(lc);
  if (abs >= 90) return '12px+ body text, all weights';
  if (abs >= 75) return '14px+ normal weight, 12px+ bold';
  if (abs >= 60) return '18px+ normal, 14px+ bold';
  if (abs >= 45) return '24px+ normal, 18px+ bold (headlines)';
  if (abs >= 30) return 'Non-text elements, large icons only';
  return 'Insufficient contrast for any text use';
};

/**
 * Color harmony analysis
 */
export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic' | 'none';

export interface HarmonyResult {
  type: HarmonyType;
  label: string;
  description: string;
  score: number; // 0-100 how strong the harmony is
}

export const analyzeHarmony = (hues: number[]): HarmonyResult => {
  if (hues.length < 2) return { type: 'none', label: 'N/A', description: 'Need 2+ colors', score: 0 };
  
  // Check monochromatic (all hues within 15°)
  const hueRange = Math.max(...hues) - Math.min(...hues);
  if (hueRange < 15 || hueRange > 345) {
    return { type: 'monochromatic', label: 'Monochromatic', description: 'Colors share the same hue family — elegant and cohesive', score: 85 };
  }

  // Check for complementary pairs (hues ~180° apart)
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j]);
      const angularDiff = Math.min(diff, 360 - diff);
      if (angularDiff >= 150 && angularDiff <= 210) {
        return { type: 'complementary', label: 'Complementary', description: 'High contrast opposing hues — bold and vibrant', score: 90 };
      }
    }
  }

  // Check analogous (hues within 60°)
  const sorted = [...hues].sort((a, b) => a - b);
  const maxGap = Math.max(...sorted.map((h, i) => i > 0 ? h - sorted[i - 1] : 0));
  if (maxGap <= 60) {
    return { type: 'analogous', label: 'Analogous', description: 'Neighboring hues — harmonious and serene', score: 80 };
  }

  // Check triadic (three hues ~120° apart)
  if (hues.length >= 3) {
    const diffs = [];
    for (let i = 0; i < Math.min(3, hues.length); i++) {
      for (let j = i + 1; j < Math.min(3, hues.length); j++) {
        const diff = Math.abs(hues[i] - hues[j]);
        diffs.push(Math.min(diff, 360 - diff));
      }
    }
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    if (avgDiff >= 100 && avgDiff <= 140) {
      return { type: 'triadic', label: 'Triadic', description: 'Three equidistant hues — balanced and dynamic', score: 85 };
    }
  }

  return { type: 'split-complementary', label: 'Mixed', description: 'Diverse hue distribution — eclectic palette', score: 60 };
};

/**
 * Color psychology associations
 */
export const colorPsychology = (hue: number, saturation: number, lightness: number): string[] => {
  const associations: string[] = [];
  
  if (saturation < 10) {
    associations.push('Neutral', 'Professional', 'Timeless');
    return associations;
  }

  if (hue < 15 || hue >= 345) associations.push('Energy', 'Passion', 'Urgency');
  else if (hue < 45) associations.push('Warmth', 'Optimism', 'Creativity');
  else if (hue < 70) associations.push('Joy', 'Confidence', 'Attention');
  else if (hue < 150) associations.push('Growth', 'Health', 'Sustainability');
  else if (hue < 195) associations.push('Trust', 'Clarity', 'Calm');
  else if (hue < 255) associations.push('Trust', 'Stability', 'Security');
  else if (hue < 285) associations.push('Luxury', 'Wisdom', 'Creativity');
  else associations.push('Romance', 'Care', 'Femininity');

  if (lightness < 30) associations.push('Sophistication', 'Power');
  if (lightness > 70) associations.push('Softness', 'Accessibility');
  if (saturation > 80) associations.push('Vibrancy', 'Bold');
  
  return associations.slice(0, 4);
};
