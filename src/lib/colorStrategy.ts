/**
 * Advanced Color Strategy Utilities
 * 
 * Helmholtz-Kohlrausch perceived brightness correction,
 * Tonal harmony analysis (OKLCH hue geometry),
 * Cultural color geometry for global markets.
 */

import { hexToOklch, hexToRgbArray, relativeLuminance, type OklchColor } from './oklchAccessibility';

// ── Helmholtz-Kohlrausch Effect ─────────────────────────────────────
// Chromatic colors appear brighter than achromatic ones at the same luminance.
// The H-K correction factor adjusts perceived lightness based on chroma and hue.

/**
 * Nayatani (1997) H-K correction factor.
 * K_HK ≈ 1 + C * f(h) where f(h) peaks at ~blue (270°) and red (0°/360°).
 * Returns a multiplier > 1 for chromatic colors.
 */
export const helmholtzKohlrauschFactor = (oklch: OklchColor): number => {
  if (oklch.C < 0.01) return 1.0; // Achromatic — no H-K effect

  const hRad = (oklch.H * Math.PI) / 180;
  // Nayatani model: sensitivity peaks at ~blue and red
  // f(h) = 0.116 * |sin((h - 90)/2)| + 0.085
  const fH = 0.116 * Math.abs(Math.sin((hRad - Math.PI / 2) / 2)) + 0.085;
  const kHK = 1 + oklch.C * 2.5 * fH; // Scale by 2.5 for perceptual significance
  return Math.round(kHK * 1000) / 1000;
};

/**
 * Perceived lightness after H-K correction.
 * A saturated blue at L=0.5 may appear as L_perceived=0.58.
 */
export const perceivedLightness = (oklch: OklchColor): number => {
  const factor = helmholtzKohlrauschFactor(oklch);
  return Math.min(1, Math.round(oklch.L * factor * 1000) / 1000);
};

export interface HKAnalysis {
  originalL: number;
  perceivedL: number;
  correctionFactor: number;
  perceptionShift: number; // percentage shift
  severity: 'none' | 'low' | 'moderate' | 'high';
  description: string;
}

export const analyzeHelmholtzKohlrausch = (hex: string): HKAnalysis => {
  const oklch = hexToOklch(hex);
  const factor = helmholtzKohlrauschFactor(oklch);
  const perceived = perceivedLightness(oklch);
  const shift = oklch.L > 0 ? ((perceived - oklch.L) / oklch.L) * 100 : 0;
  const absShift = Math.abs(shift);

  let severity: HKAnalysis['severity'] = 'none';
  let description = 'No perceptual brightness shift — achromatic or very low chroma.';

  if (absShift > 15) {
    severity = 'high';
    description = `Strong H-K effect: appears ${shift > 0 ? 'brighter' : 'darker'} than measured. Contrast may be misleading.`;
  } else if (absShift > 8) {
    severity = 'moderate';
    description = `Moderate H-K effect: perceptual brightness differs from WCAG luminance calculation.`;
  } else if (absShift > 3) {
    severity = 'low';
    description = `Mild H-K effect: slight perceived brightness shift, generally acceptable.`;
  }

  return {
    originalL: oklch.L,
    perceivedL: perceived,
    correctionFactor: factor,
    perceptionShift: Math.round(shift * 10) / 10,
    severity,
    description,
  };
};

// ── Tonal Harmony Analysis ──────────────────────────────────────────
// Uses OKLCH hue angles to detect palette harmony types.

export type HarmonyType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'custom';

export interface HarmonyAnalysis {
  type: HarmonyType;
  confidence: number; // 0-100
  description: string;
  hueAngles: number[];
  chromaRange: { min: number; max: number; spread: number };
  lightnessRange: { min: number; max: number; spread: number };
  tonalBalance: 'warm' | 'cool' | 'neutral' | 'mixed';
  suggestions: string[];
}

const hueDiff = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const avgHue = (hues: number[]): number => {
  // Circular mean
  const sinSum = hues.reduce((s, h) => s + Math.sin((h * Math.PI) / 180), 0);
  const cosSum = hues.reduce((s, h) => s + Math.cos((h * Math.PI) / 180), 0);
  let avg = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  if (avg < 0) avg += 360;
  return avg;
};

export const analyzeTonalHarmony = (hexColors: string[]): HarmonyAnalysis => {
  const oklchVals = hexColors.map(h => hexToOklch(h));
  const chromatic = oklchVals.filter(o => o.C > 0.02);
  const hues = chromatic.map(o => o.H);
  const allC = oklchVals.map(o => o.C);
  const allL = oklchVals.map(o => o.L);

  const chromaRange = {
    min: Math.min(...allC),
    max: Math.max(...allC),
    spread: Math.max(...allC) - Math.min(...allC),
  };
  const lightnessRange = {
    min: Math.min(...allL),
    max: Math.max(...allL),
    spread: Math.max(...allL) - Math.min(...allL),
  };

  // Determine tonal temperature
  const warmHues = hues.filter(h => (h >= 0 && h <= 90) || h >= 330);
  const coolHues = hues.filter(h => h >= 150 && h <= 300);
  let tonalBalance: HarmonyAnalysis['tonalBalance'] = 'neutral';
  if (hues.length > 0) {
    const warmRatio = warmHues.length / hues.length;
    const coolRatio = coolHues.length / hues.length;
    if (warmRatio > 0.6) tonalBalance = 'warm';
    else if (coolRatio > 0.6) tonalBalance = 'cool';
    else if (warmRatio > 0.3 && coolRatio > 0.3) tonalBalance = 'mixed';
  }

  const suggestions: string[] = [];
  let type: HarmonyType = 'custom';
  let confidence = 0;
  let description = '';

  if (chromatic.length === 0) {
    type = 'monochromatic';
    confidence = 100;
    description = 'Fully achromatic palette — all colors are near-neutral.';
    suggestions.push('Consider adding a single accent hue for emphasis and wayfinding.');
  } else if (chromatic.length === 1) {
    type = 'monochromatic';
    confidence = 90;
    description = 'Single-hue palette with neutral companions.';
  } else {
    // Check all pair distances
    const pairDists: number[] = [];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        pairDists.push(hueDiff(hues[i], hues[j]));
      }
    }

    const maxDist = Math.max(...pairDists);
    const avgDist = pairDists.reduce((a, b) => a + b, 0) / pairDists.length;

    if (maxDist < 30) {
      type = 'analogous';
      confidence = Math.round(Math.max(0, 100 - maxDist * 2));
      description = 'Analogous: colors sit within a narrow hue arc, creating natural cohesion.';
    } else if (chromatic.length === 2 && Math.abs(pairDists[0] - 180) < 30) {
      type = 'complementary';
      confidence = Math.round(Math.max(0, 100 - Math.abs(pairDists[0] - 180) * 3));
      description = 'Complementary: opposing hues create maximum vibrancy and tension.';
      suggestions.push('Ensure one complement dominates (60-70%) to avoid visual competition.');
    } else if (chromatic.length >= 3) {
      // Check triadic (120° apart)
      const triadicError = pairDists.map(d => Math.abs(d - 120)).reduce((a, b) => a + b, 0) / pairDists.length;
      // Check split-complementary
      const sorted = [...hues].sort((a, b) => a - b);

      if (triadicError < 20) {
        type = 'triadic';
        confidence = Math.round(Math.max(0, 100 - triadicError * 4));
        description = 'Triadic: three hues at ~120° intervals for vibrant, balanced energy.';
        suggestions.push('Use one dominant hue and the other two as accents to prevent overwhelming visuals.');
      } else if (chromatic.length >= 4) {
        const tetradicError = pairDists.map(d => Math.min(Math.abs(d - 90), Math.abs(d - 180))).reduce((a, b) => a + b, 0) / pairDists.length;
        if (tetradicError < 20) {
          type = 'tetradic';
          confidence = Math.round(Math.max(0, 100 - tetradicError * 4));
          description = 'Tetradic: four hues in rectangular arrangement for rich variety.';
          suggestions.push('Choose a clear dominant color to anchor the palette.');
        }
      }

      if (type === 'custom') {
        // Check split-complementary: one hue + two flanking its complement
        if (chromatic.length >= 3) {
          for (let i = 0; i < hues.length; i++) {
            const complement = (hues[i] + 180) % 360;
            const others = hues.filter((_, idx) => idx !== i);
            const flanking = others.filter(h => hueDiff(h, complement) < 40);
            if (flanking.length >= 2) {
              type = 'split-complementary';
              confidence = 75;
              description = 'Split-complementary: one hue against two flanking its opposite — vibrant but balanced.';
              break;
            }
          }
        }
      }
    }

    if (type === 'custom') {
      confidence = 40;
      description = 'Free-form hue distribution — intentional but unconventional.';
      suggestions.push('Verify intentional hue choices with brand narrative to ensure coherence.');
    }
  }

  // Lightness spread advice
  if (lightnessRange.spread < 0.25) {
    suggestions.push('Low lightness contrast — consider adding a darker or lighter anchor for hierarchy.');
  }
  if (chromaRange.spread > 0.15) {
    suggestions.push('Wide chroma spread — ensure high-chroma colors are used sparingly as accents.');
  }

  return {
    type,
    confidence,
    description,
    hueAngles: hues,
    chromaRange,
    lightnessRange,
    tonalBalance,
    suggestions,
  };
};

// ── Cultural Color Geometry ─────────────────────────────────────────
// Maps colors to cultural associations, risks, and opportunities per market.

export interface CulturalColorMeaning {
  region: string;
  regionCode: string;
  positive: string[];
  negative: string[];
  context: string;
  riskLevel: 'safe' | 'caution' | 'high-risk';
}

export interface CulturalColorAnalysis {
  hex: string;
  name: string;
  dominantHueFamily: string;
  culturalMeanings: CulturalColorMeaning[];
  overallRisk: 'safe' | 'caution' | 'high-risk';
  recommendations: string[];
}

type HueFamily = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'brown' | 'white' | 'black' | 'gray';

const getHueFamily = (oklch: OklchColor, hex: string): HueFamily => {
  // Handle achromatic
  if (oklch.C < 0.03) {
    if (oklch.L > 0.9) return 'white';
    if (oklch.L < 0.15) return 'black';
    return 'gray';
  }
  // Low chroma + medium lightness = brown
  if (oklch.C < 0.08 && oklch.L < 0.55 && oklch.L > 0.2 && oklch.H >= 30 && oklch.H <= 90) return 'brown';

  const h = oklch.H;
  if (h < 25 || h >= 345) return 'red';
  if (h >= 25 && h < 55) return 'orange';
  if (h >= 55 && h < 95) return 'yellow';
  if (h >= 95 && h < 165) return 'green';
  if (h >= 165 && h < 265) return 'blue';
  if (h >= 265 && h < 310) return 'purple';
  if (h >= 310 && h < 345) return 'pink';
  return 'red';
};

// Comprehensive cultural symbolism database
const culturalDatabase: Record<HueFamily, CulturalColorMeaning[]> = {
  red: [
    { region: 'China / East Asia', regionCode: 'CN', positive: ['Luck', 'Prosperity', 'Joy', 'Celebration'], negative: [], context: 'Red is the most auspicious color; dominant in weddings and New Year.', riskLevel: 'safe' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Fertility', 'Love', 'Purity', 'Bridal'], negative: [], context: 'Red sindoor and wedding attire symbolize marital commitment.', riskLevel: 'safe' },
    { region: 'Western Europe', regionCode: 'EU', positive: ['Passion', 'Energy', 'Urgency', 'Love'], negative: ['Danger', 'Debt', 'Aggression'], context: 'Strong emotional pull; effective for CTAs but carries danger connotations.', riskLevel: 'caution' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Strength', 'Courage'], negative: ['Danger', 'Evil in some contexts'], context: 'Generally positive but context-dependent; avoid pairing with political symbols.', riskLevel: 'caution' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Passion', 'Life', 'Religious devotion'], negative: ['Blood', 'Violence'], context: 'Context-dependent — passionate and spiritual but can evoke conflict.', riskLevel: 'caution' },
    { region: 'Sub-Saharan Africa', regionCode: 'NG', positive: ['Life', 'Vitality', 'Spiritual power'], negative: ['Death (some regions)', 'Mourning'], context: 'In South Africa, red can represent mourning; varies by nation.', riskLevel: 'caution' },
    { region: 'Japan', regionCode: 'JP', positive: ['Life', 'Energy', 'Happiness', 'Good fortune'], negative: [], context: 'Red sun motif is deeply national; positive in festivals and celebrations.', riskLevel: 'safe' },
  ],
  orange: [
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Sacredness', 'Purity', 'Spirituality'], negative: [], context: 'Saffron is holy in Hinduism and Buddhism; monks\' robes are orange.', riskLevel: 'safe' },
    { region: 'Western Europe', regionCode: 'EU', positive: ['Creativity', 'Warmth', 'Enthusiasm'], negative: ['Cheapness', 'Caution (traffic)'], context: 'Youthful and energetic; can feel less premium.', riskLevel: 'caution' },
    { region: 'Netherlands', regionCode: 'NL', positive: ['National pride', 'Royal House of Orange'], negative: [], context: 'Strong national identity color; universally positive.', riskLevel: 'safe' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Warmth', 'Desert beauty'], negative: ['Mourning (Egypt)'], context: 'Generally warm; associated with mourning in Egypt specifically.', riskLevel: 'caution' },
    { region: 'East Asia', regionCode: 'CN', positive: ['Happiness', 'Courage', 'Health'], negative: [], context: 'Close to gold — auspicious. Used in temples and celebrations.', riskLevel: 'safe' },
  ],
  yellow: [
    { region: 'China / East Asia', regionCode: 'CN', positive: ['Imperial', 'Power', 'Prestige', 'Earth'], negative: ['Pornography (slang)'], context: 'Historically the Emperor\'s color; conveys supreme authority.', riskLevel: 'caution' },
    { region: 'Western Europe', regionCode: 'EU', positive: ['Optimism', 'Sunshine', 'Clarity'], negative: ['Cowardice', 'Hazard', 'Jealousy'], context: 'Mixed — cheerful in isolation, negative in certain idioms.', riskLevel: 'caution' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Knowledge', 'Learning', 'Commerce'], negative: [], context: 'Turmeric yellow is auspicious; worn during spring festivals.', riskLevel: 'safe' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Warmth', 'Sun'], negative: ['Death', 'Mourning (some regions)'], context: 'In Mexico, marigold yellow marks Día de los Muertos — respectful, not morbid.', riskLevel: 'caution' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Prosperity', 'Gold association'], negative: [], context: 'Gold-toned yellows are universally positive.', riskLevel: 'safe' },
    { region: 'Japan', regionCode: 'JP', positive: ['Courage', 'Prosperity', 'Refinement'], negative: [], context: 'Historically noble; used in imperial court.', riskLevel: 'safe' },
  ],
  green: [
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Islam', 'Paradise', 'Life', 'Fertility'], negative: [], context: 'Deeply sacred in Islam; use respectfully and never in profane contexts.', riskLevel: 'caution' },
    { region: 'Western Europe', regionCode: 'EU', positive: ['Nature', 'Growth', 'Sustainability', 'Health'], negative: ['Envy', 'Inexperience'], context: 'Strong eco and wellness associations; universally approachable.', riskLevel: 'safe' },
    { region: 'China / East Asia', regionCode: 'CN', positive: ['Health', 'Prosperity', 'Harmony'], negative: ['Infidelity (green hat)'], context: 'Avoid green hats in imagery — idiom for cuckoldry. Color itself is fine.', riskLevel: 'caution' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Harvest', 'Fertility', 'Nature'], negative: [], context: 'Positive agricultural and festival associations.', riskLevel: 'safe' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Independence', 'Nature'], negative: [], context: 'Used in national flags; patriotic connotations.', riskLevel: 'safe' },
    { region: 'Sub-Saharan Africa', regionCode: 'NG', positive: ['Life', 'Growth', 'Fertility'], negative: [], context: 'Universally positive across African markets.', riskLevel: 'safe' },
    { region: 'Japan', regionCode: 'JP', positive: ['Nature', 'Freshness', 'Youth', 'Eternity'], negative: [], context: 'Deep cultural ties to nature and tea ceremony.', riskLevel: 'safe' },
  ],
  blue: [
    { region: 'Western World', regionCode: 'US', positive: ['Trust', 'Stability', 'Professionalism', 'Calm'], negative: ['Coldness', 'Sadness'], context: 'Most universally trusted color globally; dominant in tech and finance.', riskLevel: 'safe' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Protection', 'Spirituality', 'Heaven'], negative: [], context: 'Blue tiles in mosques represent paradise; deeply spiritual.', riskLevel: 'safe' },
    { region: 'East Asia', regionCode: 'CN', positive: ['Healing', 'Trust', 'Immortality'], negative: [], context: 'Broadly positive; associated with wood element and spring.', riskLevel: 'safe' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Divinity (Krishna)', 'Truth', 'Heaven'], negative: [], context: 'Blue skin of Krishna — deeply sacred and beloved.', riskLevel: 'safe' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Trust', 'Calm', 'Religious devotion'], negative: [], context: 'Virgin Mary\'s blue mantle; spiritual significance.', riskLevel: 'safe' },
    { region: 'Sub-Saharan Africa', regionCode: 'NG', positive: ['Peace', 'Harmony', 'Love'], negative: [], context: 'Generally positive across Africa; used in textiles.', riskLevel: 'safe' },
  ],
  purple: [
    { region: 'Western Europe', regionCode: 'EU', positive: ['Royalty', 'Luxury', 'Wisdom', 'Mystery'], negative: ['Mourning (some)'], context: 'Historic Tyrian purple dye; strong luxury association.', riskLevel: 'safe' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Spirituality'], negative: ['Death', 'Mourning'], context: 'Associated with mourning in Brazil and parts of Central America.', riskLevel: 'high-risk' },
    { region: 'Thailand', regionCode: 'TH', positive: [], negative: ['Mourning', 'Widows'], context: 'Purple is worn by widows mourning their husbands.', riskLevel: 'high-risk' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Wealth', 'Spirituality'], negative: [], context: 'Generally positive but less common; conveys mystery.', riskLevel: 'safe' },
    { region: 'East Asia', regionCode: 'JP', positive: ['Nobility', 'Spirituality', 'Privilege'], negative: [], context: 'Imperial associations in Japan; highly respected.', riskLevel: 'safe' },
  ],
  pink: [
    { region: 'Western World', regionCode: 'US', positive: ['Femininity', 'Romance', 'Youth', 'Playfulness'], negative: ['Gender stereotyping'], context: 'Strong feminine association; Gen-Z is reclaiming it as gender-neutral.', riskLevel: 'caution' },
    { region: 'Japan', regionCode: 'JP', positive: ['Cherry blossom', 'Spring', 'Beauty', 'Good health'], negative: [], context: 'Sakura pink is beloved and transcends gender.', riskLevel: 'safe' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Joy', 'Femininity', 'Festivity'], negative: [], context: 'Commonly used in wedding and festival decorations.', riskLevel: 'safe' },
    { region: 'Latin America', regionCode: 'MX', positive: ['Celebration', 'Architecture', 'Joy'], negative: [], context: 'Mexican pink (rosa mexicano) is a vibrant cultural icon.', riskLevel: 'safe' },
  ],
  brown: [
    { region: 'Western Europe', regionCode: 'EU', positive: ['Earth', 'Stability', 'Warmth', 'Craft'], negative: ['Dullness', 'Poverty'], context: 'Associated with organic, artisanal, and heritage brands.', riskLevel: 'caution' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Earth', 'Warmth'], negative: ['Mourning'], context: 'Context-dependent; can signal austerity.', riskLevel: 'caution' },
    { region: 'East Asia', regionCode: 'CN', positive: ['Earth element', 'Stability'], negative: [], context: 'Neutral — earth tones are understated but grounded.', riskLevel: 'safe' },
  ],
  white: [
    { region: 'Western World', regionCode: 'US', positive: ['Purity', 'Cleanliness', 'Simplicity', 'Weddings'], negative: [], context: 'Universal bridal and minimal design color.', riskLevel: 'safe' },
    { region: 'East Asia', regionCode: 'CN', positive: [], negative: ['Death', 'Mourning', 'Funerals'], context: 'White is the primary mourning color; avoid in celebratory contexts.', riskLevel: 'high-risk' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Peace'], negative: ['Mourning', 'Widowhood'], context: 'White sarees are worn by widows; sensitive in joyful branding.', riskLevel: 'high-risk' },
    { region: 'Japan', regionCode: 'JP', positive: ['Purity', 'Sacredness'], negative: ['Death', 'Mourning'], context: 'Both sacred and funerary; context is everything.', riskLevel: 'caution' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Purity', 'Peace', 'Cleanliness'], negative: [], context: 'Positive association; used in traditional dress.', riskLevel: 'safe' },
  ],
  black: [
    { region: 'Western World', regionCode: 'US', positive: ['Elegance', 'Power', 'Luxury', 'Sophistication'], negative: ['Death', 'Mourning', 'Evil'], context: 'Dual nature: premium luxury and funeral solemnity.', riskLevel: 'caution' },
    { region: 'East Asia', regionCode: 'CN', positive: ['Water element', 'Power', 'Knowledge'], negative: ['Disaster (archaic)'], context: 'Modern China: sophistication and tech; traditional: mixed.', riskLevel: 'caution' },
    { region: 'India / South Asia', regionCode: 'IN', positive: ['Power', 'Mystery'], negative: ['Evil', 'Negativity', 'Bad luck'], context: 'Black tilak wards off evil eye; but generally avoided in celebrations.', riskLevel: 'caution' },
    { region: 'Middle East / MENA', regionCode: 'AE', positive: ['Power', 'Elegance', 'Formality'], negative: ['Mourning', 'Evil'], context: 'Formal and prestigious but carries mourning weight.', riskLevel: 'caution' },
    { region: 'Sub-Saharan Africa', regionCode: 'NG', positive: ['Maturity', 'Masculinity', 'Spiritual energy'], negative: [], context: 'Generally positive; represents the earth and ancestors.', riskLevel: 'safe' },
  ],
  gray: [
    { region: 'Global', regionCode: 'GLOBAL', positive: ['Neutrality', 'Balance', 'Professionalism', 'Timelessness'], negative: ['Dullness', 'Indecision', 'Depression'], context: 'Universally neutral; safe for global deployment but lacks emotional engagement.', riskLevel: 'safe' },
  ],
};

export const analyzeCulturalColor = (hex: string, name: string): CulturalColorAnalysis => {
  const oklch = hexToOklch(hex);
  const family = getHueFamily(oklch, hex);
  const meanings = culturalDatabase[family] || [];

  const highRiskCount = meanings.filter(m => m.riskLevel === 'high-risk').length;
  const cautionCount = meanings.filter(m => m.riskLevel === 'caution').length;

  let overallRisk: CulturalColorAnalysis['overallRisk'] = 'safe';
  if (highRiskCount > 0) overallRisk = 'high-risk';
  else if (cautionCount >= 2) overallRisk = 'caution';

  const recommendations: string[] = [];
  if (overallRisk === 'high-risk') {
    recommendations.push(`"${name}" has high-risk cultural associations in ${highRiskCount} region(s). Consider regional variants.`);
  }
  if (overallRisk === 'caution') {
    recommendations.push(`"${name}" carries context-dependent meanings — ensure usage aligns with local expectations.`);
  }
  meanings.filter(m => m.riskLevel === 'high-risk').forEach(m => {
    recommendations.push(`${m.region}: ${m.negative.join(', ')} — avoid in celebratory or aspirational contexts.`);
  });

  return {
    hex,
    name,
    dominantHueFamily: family,
    culturalMeanings: meanings,
    overallRisk,
    recommendations,
  };
};

// ── Full Palette Strategy Report ────────────────────────────────────

export interface ColorStrategyReport {
  harmony: HarmonyAnalysis;
  hkAnalyses: Array<{ hex: string; name: string; analysis: HKAnalysis }>;
  culturalAnalyses: CulturalColorAnalysis[];
  overallCulturalRisk: 'safe' | 'caution' | 'high-risk';
  strategicSummary: string[];
}

export const analyzeColorStrategy = (
  colors: Array<{ hex: string; name: string }>
): ColorStrategyReport => {
  const harmony = analyzeTonalHarmony(colors.map(c => c.hex));
  const hkAnalyses = colors.map(c => ({
    hex: c.hex,
    name: c.name,
    analysis: analyzeHelmholtzKohlrausch(c.hex),
  }));
  const culturalAnalyses = colors.map(c => analyzeCulturalColor(c.hex, c.name));

  const highRiskCultures = culturalAnalyses.filter(c => c.overallRisk === 'high-risk');
  const cautionCultures = culturalAnalyses.filter(c => c.overallRisk === 'caution');
  let overallCulturalRisk: ColorStrategyReport['overallCulturalRisk'] = 'safe';
  if (highRiskCultures.length > 0) overallCulturalRisk = 'high-risk';
  else if (cautionCultures.length > 0) overallCulturalRisk = 'caution';

  const strategicSummary: string[] = [];

  // Harmony summary
  strategicSummary.push(`Palette follows ${harmony.type} harmony (${harmony.confidence}% confidence) — ${harmony.tonalBalance} tonal balance.`);

  // H-K summary
  const significantHK = hkAnalyses.filter(h => h.analysis.severity !== 'none' && h.analysis.severity !== 'low');
  if (significantHK.length > 0) {
    strategicSummary.push(`${significantHK.length} color(s) show significant Helmholtz-Kohlrausch effect — perceived brightness differs from measured luminance.`);
  }

  // Cultural summary
  if (overallCulturalRisk === 'high-risk') {
    strategicSummary.push(`⚠ High cultural risk detected: ${highRiskCultures.map(c => c.name).join(', ')} may cause issues in certain markets.`);
  } else if (overallCulturalRisk === 'caution') {
    strategicSummary.push(`Cultural caution: ${cautionCultures.map(c => c.name).join(', ')} have context-dependent meanings in some regions.`);
  } else {
    strategicSummary.push('Color palette is culturally safe across major global markets.');
  }

  return { harmony, hkAnalyses, culturalAnalyses, overallCulturalRisk, strategicSummary };
};
