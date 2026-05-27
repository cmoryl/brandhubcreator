/**
 * QA Scoring Engine
 *
 * Pure client-side checks that score an icon's SVG against its recipe.
 * No AI calls — these run instantly so the UI can surface a score badge
 * the moment an icon lands.
 *
 * Score categories (0–100 each):
 *   - brandFit          Matches the recipe's style/color rules
 *   - svgHealth         Clean structure, no raster, no excessive paths
 *   - smallSizeReadable Likely to remain legible at 16px
 *   - exportReady       Has everything needed to ship
 *
 * All checks are best-effort; missing fields don't crash, they just dock
 * a few points and add a finding.
 */

import type { BrandIconography } from '@/types/brand';
import type { IconRecipe } from './recipe';
import { readRecipe } from './recipe';
import { buildSvgString } from '@/lib/svgUtils';
import { apcaContrast } from '@/lib/apcaContrast';


export type QASeverity = 'pass' | 'warn' | 'fail';

export type BrainAxis =
  | 'gridIntegrity'
  | 'strokeConsistency'
  | 'opticalBalance'
  | 'squintTest'
  | 'metaphorClarity'
  | 'culturalNeutrality';

export const BRAIN_AXIS_LABELS: Record<BrainAxis, string> = {
  gridIntegrity: 'Grid integrity',
  strokeConsistency: 'Stroke consistency',
  opticalBalance: 'Optical balance',
  squintTest: 'Squint test (16px)',
  metaphorClarity: 'Metaphor clarity',
  culturalNeutrality: 'Cultural neutrality',
};

/**
 * Iconography Brain → QA citations.
 * Maps a finding id to the brain axis it violates plus a short principle
 * citation that traces back to the iconography reference (Panofsky form,
 * Lucide/Tabler stroke DNA, Isotype clarity, etc.).
 */
const BRAIN_CITATIONS: Record<string, { axis: BrainAxis; principle: string }> = {
  'svg-missing':            { axis: 'metaphorClarity',     principle: 'No glyph = no Panofsky pre-iconographic read.' },
  'viewbox-invalid':        { axis: 'gridIntegrity',        principle: 'Modern grid systems (Material, Lucide) require a valid viewBox.' },
  'viewbox-non-square':     { axis: 'gridIntegrity',        principle: 'Icon grids are square — Olympic pictograms onward.' },
  'viewbox-nonstandard':    { axis: 'gridIntegrity',        principle: 'Lucide/Tabler standardise on 0 0 24 24 for a shared visual DNA.' },
  'raster-embedded':        { axis: 'squintTest',           principle: 'Pure vector is the icon-font / SVG sprite contract.' },
  'non-path-primitives':    { axis: 'gridIntegrity',        principle: 'Paths-only keeps the system bake-clean at every scale.' },
  'has-transform':          { axis: 'gridIntegrity',        principle: 'Bake transforms — half-pixel snapping is part of the grid contract.' },
  'path-count-high':        { axis: 'metaphorClarity',      principle: 'Isotype/Lucide: minimum strokes for maximum read.' },
  'path-count-above-target':{ axis: 'metaphorClarity',      principle: 'Aim ≤3 paths — Lucide-grade clarity.' },
  'precision-high':         { axis: 'gridIntegrity',        principle: 'Snap to .0/.5 grid — high precision = tracing artefact.' },
  'precision-stray':        { axis: 'gridIntegrity',        principle: 'Off-grid coordinates break the shared visual DNA.' },
  'oversized':              { axis: 'squintTest',           principle: 'Under 2KB per glyph (modern variable icon-font budget).' },
  'stroke-inconsistent':    { axis: 'strokeConsistency',    principle: 'Single-weight stroke across the set (Lucide/Tabler DNA).' },
  'linecap-inconsistent':   { axis: 'strokeConsistency',    principle: 'One terminal style per family (rounded, butt, or square).' },
  'linejoin-inconsistent':  { axis: 'strokeConsistency',    principle: 'One join style per family.' },
  'too-dense-16px':         { axis: 'squintTest',           principle: 'Must read at 16px — the squint test from SF Symbols.' },
  'stroke-too-thin':        { axis: 'squintTest',           principle: 'Stroke weight must survive 16px raster.' },
  'no-brand-color':         { axis: 'opticalBalance',       principle: 'Brand palette is part of the system DNA.' },
  'unapproved-color':       { axis: 'opticalBalance',       principle: 'Off-palette colours break the system DNA.' },
  'style-mismatch':         { axis: 'strokeConsistency',    principle: 'Style family (line/filled/duotone) must match the recipe.' },
  'no-recipe':              { axis: 'metaphorClarity',      principle: 'Without a recipe, brand fit cannot be scored.' },
  'name-missing':           { axis: 'metaphorClarity',      principle: 'Naming = the third Panofsky layer (iconographic identity).' },
  'name-not-kebab':         { axis: 'metaphorClarity',      principle: 'Kebab-case slugs match Lucide/Tabler conventions.' },
  'category-missing':       { axis: 'metaphorClarity',      principle: 'Category drives semantic search and the brand taxonomy.' },
};

/**
 * Heuristic cultural-sensitivity flag. The model-driven pass (auto-tagging)
 * will refine this; for now we flag obvious metaphor families that need
 * human review per the brain's "Cultural Fluency" principle.
 */
const CULTURALLY_SENSITIVE_TERMS = [
  'hand', 'handshake', 'fist', 'finger', 'point', 'pray', 'praying', 'ok',
  'thumbs', 'thumb', 'face', 'gender', 'flag', 'cross', 'star-of-david',
  'crescent', 'religion', 'church', 'mosque', 'temple', 'gun', 'weapon',
];

export interface QAFinding {
  id: string;
  category: 'brandFit' | 'svgHealth' | 'smallSizeReadable' | 'exportReady';
  severity: QASeverity;
  message: string;
  /** Iconography Brain axis this violates (when mappable). */
  brainAxis?: BrainAxis;
  /** Short citation from the iconography knowledge base. */
  brainPrinciple?: string;
}

export type BrainRubric = Record<BrainAxis, number>;

export interface QAScores {
  brandFit: number;
  svgHealth: number;
  smallSizeReadable: number;
  exportReady: number;
  overall: number;
  /** Six sub-scores from the Iconography Brain rubric (0–100 each). */
  brainRubric: BrainRubric;
}

export interface QAReport {
  scores: QAScores;
  findings: QAFinding[];
  exportReady: boolean;
}

const emptyRubric = (): BrainRubric => ({
  gridIntegrity: 100,
  strokeConsistency: 100,
  opticalBalance: 100,
  squintTest: 100,
  metaphorClarity: 100,
  culturalNeutrality: 100,
});

/** Dock per-axis points based on finding severity. */
const BRAIN_AXIS_DOCK = { fail: 35, warn: 12, pass: 0 } as const;


/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const getSvgString = (icon: BrandIconography): string => {
  if (!icon.svgPath) return '';
  return buildSvgString({
    svgPath: icon.svgPath,
    viewBox: icon.viewBox || '0 0 24 24',
    fillMode: icon.fillMode,
    name: icon.name,
  });
};

const countOccurrences = (s: string, re: RegExp): number =>
  (s.match(re) || []).length;

const parseViewBox = (svg: string): [number, number, number, number] | null => {
  const m = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (!m) return null;
  const parts = m[1].split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as [number, number, number, number];
};

const isKebabCase = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

const colorIsClose = (a: string, b: string): boolean => {
  const norm = (c: string) => c.replace('#', '').toLowerCase();
  return norm(a) === norm(b);
};

/* -------------------------------------------------------------------------- */
/* Main scoring                                                                */
/* -------------------------------------------------------------------------- */

export const scoreIcon = (icon: BrandIconography, recipe?: IconRecipe | null): QAReport => {
  const findings: QAFinding[] = [];
  const r = recipe ?? readRecipe(icon);
  const svg = getSvgString(icon);

  // Start each category at 100 and dock for issues.
  let brandFit = 100;
  let svgHealth = 100;
  let smallSizeReadable = 100;
  let exportReady = 100;

  /* ----- SVG Health ----- */
  if (!svg) {
    svgHealth = 0;
    findings.push({
      id: 'svg-missing',
      category: 'svgHealth',
      severity: 'fail',
      message: 'Icon has no SVG path data.',
    });
  } else {
    const vb = parseViewBox(svg);
    if (!vb) {
      svgHealth -= 30;
      findings.push({
        id: 'viewbox-invalid',
        category: 'svgHealth',
        severity: 'fail',
        message: 'Missing or malformed viewBox attribute.',
      });
    } else if (vb[2] !== vb[3]) {
      svgHealth -= 10;
      findings.push({
        id: 'viewbox-non-square',
        category: 'svgHealth',
        severity: 'warn',
        message: `Non-square viewBox (${vb[2]}×${vb[3]}). Icons should be square.`,
      });
    } else if (vb[2] !== 24 || vb[0] !== 0 || vb[1] !== 0) {
      svgHealth -= 5;
      findings.push({
        id: 'viewbox-nonstandard',
        category: 'svgHealth',
        severity: 'warn',
        message: `Non-standard viewBox "${vb.join(' ')}". Lucide/Tabler standard is "0 0 24 24".`,
      });
    }

    // Raster embedded?
    if (/<image\b/i.test(svg) || /data:image\/(png|jpe?g|gif|webp)/i.test(svg)) {
      svgHealth -= 50;
      findings.push({
        id: 'raster-embedded',
        category: 'svgHealth',
        severity: 'fail',
        message: 'SVG embeds a raster image. Icons must be pure vector.',
      });
    }

    // Forbidden primitives — modern pipeline outputs paths only.
    const forbidden = ['circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g', 'use', 'defs', 'mask', 'clipPath', 'filter', 'text', 'style'];
    const foundForbidden = forbidden.filter((tag) =>
      new RegExp(`<${tag}\\b`, 'i').test(svg),
    );
    if (foundForbidden.length > 0) {
      svgHealth -= 25;
      findings.push({
        id: 'non-path-primitives',
        category: 'svgHealth',
        severity: 'warn',
        message: `Contains non-path primitives: <${foundForbidden.join('>, <')}>. Paths-only is preferred for clean scaling.`,
      });
    }

    // Transform attributes break grid alignment.
    if (/\btransform\s*=/i.test(svg)) {
      svgHealth -= 10;
      findings.push({
        id: 'has-transform',
        category: 'svgHealth',
        severity: 'warn',
        message: 'Uses transform="…". Bake transforms into coordinates for grid alignment.',
      });
    }

    // Path count — Lucide-grade aims for 1–3.
    const pathCount = countOccurrences(svg, /<path\b/gi);
    if (pathCount > 8) {
      svgHealth -= 15;
      findings.push({
        id: 'path-count-high',
        category: 'svgHealth',
        severity: 'warn',
        message: `High path count (${pathCount}). Aim for ≤3 for Lucide-grade clarity.`,
      });
    } else if (pathCount > 3) {
      svgHealth -= 5;
      findings.push({
        id: 'path-count-above-target',
        category: 'svgHealth',
        severity: 'warn',
        message: `${pathCount} paths. Target ≤3 — merge collinear segments where possible.`,
      });
    }

    // Coordinate precision: .0 / .5 grid only.
    const pathData = Array.from(svg.matchAll(/<path\b[^>]*\bd\s*=\s*"([^"]+)"/gi))
      .map((m) => m[1])
      .join(' ');
    if (pathData) {
      const highPrecision = pathData.match(/\d+\.\d{2,}/g);
      if (highPrecision && highPrecision.length > 0) {
        const sample = highPrecision.slice(0, 3).join(', ');
        const allNums = pathData.match(/\d+(\.\d+)?/g) || [];
        const ratio = highPrecision.length / Math.max(1, allNums.length);
        if (ratio > 0.25) {
          svgHealth -= 12;
          findings.push({
            id: 'precision-high',
            category: 'svgHealth',
            severity: 'warn',
            message: `Many high-precision coordinates (e.g. ${sample}). Snap to .0/.5 grid.`,
          });
        } else {
          svgHealth -= 4;
          findings.push({
            id: 'precision-stray',
            category: 'svgHealth',
            severity: 'warn',
            message: `${highPrecision.length} off-grid coordinate${highPrecision.length === 1 ? '' : 's'} (e.g. ${sample}).`,
          });
        }
      }
    }

    // File size proxy (string length is a fair stand-in pre-gzip)
    if (svg.length > 4000) {
      svgHealth -= 10;
      findings.push({
        id: 'oversized',
        category: 'svgHealth',
        severity: 'warn',
        message: `Source larger than 4KB (${svg.length}b). Consider simplifying paths.`,
      });
    }

    // Stroke consistency: if recipe asks for stroke style, every stroke should match
    if (r && r.strokeWidth > 0) {
      const widths = Array.from(svg.matchAll(/stroke-width\s*=\s*"([0-9.]+)"/g)).map((m) =>
        Number(m[1]),
      );
      const inconsistent = widths.length > 1 && new Set(widths.map((w) => w.toFixed(2))).size > 1;
      if (inconsistent) {
        svgHealth -= 12;
        brandFit -= 10;
        findings.push({
          id: 'stroke-inconsistent',
          category: 'svgHealth',
          severity: 'warn',
          message: `Inconsistent stroke widths: ${widths.join(', ')}.`,
        });
      }

      // Linecap/linejoin consistency for stroked icons.
      const caps = Array.from(svg.matchAll(/stroke-linecap\s*=\s*"([^"]+)"/g)).map((m) => m[1]);
      const joins = Array.from(svg.matchAll(/stroke-linejoin\s*=\s*"([^"]+)"/g)).map((m) => m[1]);
      if (caps.length > 1 && new Set(caps).size > 1) {
        svgHealth -= 6;
        findings.push({
          id: 'linecap-inconsistent',
          category: 'svgHealth',
          severity: 'warn',
          message: `Mixed stroke-linecap values: ${Array.from(new Set(caps)).join(', ')}.`,
        });
      }
      if (joins.length > 1 && new Set(joins).size > 1) {
        svgHealth -= 6;
        findings.push({
          id: 'linejoin-inconsistent',
          category: 'svgHealth',
          severity: 'warn',
          message: `Mixed stroke-linejoin values: ${Array.from(new Set(joins)).join(', ')}.`,
        });
      }
    }
  }

  /* ----- Small-size readability ----- */
  if (svg) {
    const vb = parseViewBox(svg) ?? [0, 0, 24, 24];
    const gridSize = vb[2];
    const pathCount = countOccurrences(svg, /<path\b/gi);
    // Heuristic: more than 1 path per 6 grid units → likely too dense at 16px
    if (pathCount / gridSize > 1 / 6) {
      smallSizeReadable -= 25;
      findings.push({
        id: 'too-dense-16px',
        category: 'smallSizeReadable',
        severity: 'warn',
        message: 'Likely too dense to read at 16px. Reduce path count or grid.',
      });
    }
    if (r && r.strokeWidth > 0 && r.strokeWidth < 1.25) {
      smallSizeReadable -= 15;
      findings.push({
        id: 'stroke-too-thin',
        category: 'smallSizeReadable',
        severity: 'warn',
        message: `Stroke width ${r.strokeWidth} is thin — may disappear at 16px.`,
      });
    }
    if (svg.length > 5000) {
      smallSizeReadable -= 15;
    }
  } else {
    smallSizeReadable = 0;
  }

  /* ----- Brand fit ----- */
  if (r) {
    // Color match
    const colorsInSvg = Array.from(
      svg.matchAll(/(?:fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8})"/g),
    ).map((m) => m[1]);
    const usedApproved = colorsInSvg.some(
      (c) =>
        colorIsClose(c, r.primaryColor) ||
        (r.secondaryColor && colorIsClose(c, r.secondaryColor)),
    );
    const usedUnapproved = colorsInSvg.some(
      (c) =>
        c.toLowerCase() !== '#000000' &&
        c.toLowerCase() !== '#fff' &&
        c.toLowerCase() !== '#ffffff' &&
        c.toLowerCase() !== 'currentcolor' &&
        !colorIsClose(c, r.primaryColor) &&
        !(r.secondaryColor && colorIsClose(c, r.secondaryColor)),
    );
    if (colorsInSvg.length && !usedApproved) {
      brandFit -= 20;
      findings.push({
        id: 'no-brand-color',
        category: 'brandFit',
        severity: 'warn',
        message: 'Uses no approved brand colors.',
      });
    }
    if (usedUnapproved) {
      brandFit -= 15;
      findings.push({
        id: 'unapproved-color',
        category: 'brandFit',
        severity: 'warn',
        message: 'Uses colors outside the approved palette.',
      });
    }
    // Style match
    const hasFills = /fill\s*=\s*"(?!none)/.test(svg);
    const hasStrokes = /stroke\s*=\s*"(?!none)/.test(svg);
    if (r.style === 'outlined' && hasFills && !hasStrokes) {
      brandFit -= 20;
      findings.push({
        id: 'style-mismatch',
        category: 'brandFit',
        severity: 'warn',
        message: 'Recipe says outlined but icon is filled.',
      });
    }
    if (r.style === 'filled' && hasStrokes && !hasFills) {
      brandFit -= 20;
      findings.push({
        id: 'style-mismatch',
        category: 'brandFit',
        severity: 'warn',
        message: 'Recipe says filled but icon is stroked.',
      });
    }
  } else {
    brandFit -= 10;
    findings.push({
      id: 'no-recipe',
      category: 'brandFit',
      severity: 'warn',
      message: 'No recipe attached — brand fit cannot be fully scored.',
    });
  }

  /* ----- Export ready ----- */
  if (!icon.name?.trim()) {
    exportReady -= 30;
    findings.push({
      id: 'name-missing',
      category: 'exportReady',
      severity: 'fail',
      message: 'Icon has no name.',
    });
  } else {
    const slug = icon.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!isKebabCase(slug)) {
      exportReady -= 10;
      findings.push({
        id: 'name-not-kebab',
        category: 'exportReady',
        severity: 'warn',
        message: 'Name does not slugify cleanly to kebab-case.',
      });
    }
  }
  if (!icon.category?.trim()) {
    exportReady -= 15;
    findings.push({
      id: 'category-missing',
      category: 'exportReady',
      severity: 'warn',
      message: 'Icon is uncategorised.',
    });
  }
  if (!svg) exportReady = 0;

  /* ----- Clamp + aggregate ----- */
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  brandFit = clamp(brandFit);
  svgHealth = clamp(svgHealth);
  smallSizeReadable = clamp(smallSizeReadable);
  exportReady = clamp(exportReady);
  const overall = Math.round(
    (brandFit * 0.3 + svgHealth * 0.3 + smallSizeReadable * 0.2 + exportReady * 0.2),
  );

  /* ----- Brain rubric: annotate findings & derive sub-scores ----- */
  const brainRubric = emptyRubric();
  for (const f of findings) {
    const cite = BRAIN_CITATIONS[f.id];
    if (cite) {
      f.brainAxis = cite.axis;
      f.brainPrinciple = cite.principle;
      brainRubric[cite.axis] = Math.max(0, brainRubric[cite.axis] - BRAIN_AXIS_DOCK[f.severity]);
    }
  }
  // Heuristic cultural-neutrality flag (model pass will refine later).
  const slug = (icon.name ?? '').toLowerCase();
  const culturalHit = CULTURALLY_SENSITIVE_TERMS.find((t) => slug.includes(t));
  if (culturalHit) {
    brainRubric.culturalNeutrality = Math.min(brainRubric.culturalNeutrality, 70);
    findings.push({
      id: 'cultural-review',
      category: 'brandFit',
      severity: 'warn',
      message: `Metaphor "${culturalHit}" varies by culture — flag for human review.`,
      brainAxis: 'culturalNeutrality',
      brainPrinciple: 'Cultural Fluency: gestures/symbols read differently across regions.',
    });
  }
  // Optical balance: penalise paths-out-of-grid as a proxy for visual weight drift.
  if (findings.some((f) => f.id === 'precision-high' || f.id === 'has-transform')) {
    brainRubric.opticalBalance = Math.max(0, brainRubric.opticalBalance - 10);
  }

  return {
    scores: { brandFit, svgHealth, smallSizeReadable, exportReady, overall, brainRubric },
    findings,
    exportReady: exportReady >= 70 && svgHealth >= 70,
  };
};

/** Score a whole library and return aggregate stats. */
export const scoreLibrary = (
  icons: BrandIconography[],
  recipe?: IconRecipe | null,
): {
  reports: Array<{ icon: BrandIconography; report: QAReport }>;
  average: QAScores;
  failing: number;
  passing: number;
} => {
  const reports = icons.map((icon) => ({ icon, report: scoreIcon(icon, recipe) }));
  if (reports.length === 0) {
    return {
      reports,
      average: { brandFit: 0, svgHealth: 0, smallSizeReadable: 0, exportReady: 0, overall: 0 },
      failing: 0,
      passing: 0,
    };
  }
  const sum = reports.reduce(
    (acc, { report }) => ({
      brandFit: acc.brandFit + report.scores.brandFit,
      svgHealth: acc.svgHealth + report.scores.svgHealth,
      smallSizeReadable: acc.smallSizeReadable + report.scores.smallSizeReadable,
      exportReady: acc.exportReady + report.scores.exportReady,
      overall: acc.overall + report.scores.overall,
    }),
    { brandFit: 0, svgHealth: 0, smallSizeReadable: 0, exportReady: 0, overall: 0 },
  );
  const n = reports.length;
  const average: QAScores = {
    brandFit: Math.round(sum.brandFit / n),
    svgHealth: Math.round(sum.svgHealth / n),
    smallSizeReadable: Math.round(sum.smallSizeReadable / n),
    exportReady: Math.round(sum.exportReady / n),
    overall: Math.round(sum.overall / n),
  };
  return {
    reports,
    average,
    failing: reports.filter((r) => !r.report.exportReady).length,
    passing: reports.filter((r) => r.report.exportReady).length,
  };
};

export const scoreColor = (score: number): string => {
  if (score >= 85) return 'hsl(var(--tp-green, 142 71% 45%))';
  if (score >= 70) return 'hsl(var(--tp-orange, 35 92% 55%))';
  return 'hsl(var(--destructive, 0 84% 60%))';
};

/* -------------------------------------------------------------------------- */
/* Real preflight: APCA contrast + 16px raster coverage                        */
/* -------------------------------------------------------------------------- */

const LIGHT_BG = '#FFFFFF';
const DARK_BG = '#0B0B0F';
// Lc 45 = non-text threshold for large glyphs; lower = fails.
const APCA_MIN = 45;

export interface ContrastCheck {
  ok: boolean;
  lcLight: number;
  lcDark: number;
  color: string;
}

const pickIconColor = (icon: BrandIconography, recipe?: IconRecipe | null): string => {
  const svg = getSvgString(icon);
  const m = svg.match(/(?:fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8})"/);
  if (m && m[1].toLowerCase() !== '#ffffff' && m[1].toLowerCase() !== '#fff') return m[1];
  if (recipe?.primaryColor) return recipe.primaryColor;
  return '#111111';
};

export const checkIconContrast = (
  icon: BrandIconography,
  recipe?: IconRecipe | null,
): ContrastCheck => {
  const color = pickIconColor(icon, recipe);
  let lcLight = 0;
  let lcDark = 0;
  try {
    lcLight = Math.abs(apcaContrast(color, LIGHT_BG));
    lcDark = Math.abs(apcaContrast(color, DARK_BG));
  } catch {
    /* ignore parse errors */
  }
  return { color, lcLight, lcDark, ok: lcLight >= APCA_MIN && lcDark >= APCA_MIN };
};

/**
 * Renders the icon to a 16×16 canvas and counts non-transparent pixels.
 * Returns coverage 0..1; fails below 8% (strokes collapsed away).
 * Browser-only; returns null on server.
 */
export const checkRasterReadability = async (
  icon: BrandIconography,
): Promise<{ ok: boolean; coverage: number } | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const svg = getSvgString(icon);
  if (!svg) return { ok: false, coverage: 0 };

  return new Promise((resolve) => {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = 16;
          c.height = 16;
          const ctx = c.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return resolve({ ok: false, coverage: 0 });
          }
          ctx.clearRect(0, 0, 16, 16);
          ctx.drawImage(img, 0, 0, 16, 16);
          const { data } = ctx.getImageData(0, 0, 16, 16);
          let lit = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 16) lit++;
          URL.revokeObjectURL(url);
          const coverage = lit / 256;
          resolve({ ok: coverage >= 0.08, coverage });
        } catch {
          URL.revokeObjectURL(url);
          resolve({ ok: false, coverage: 0 });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false, coverage: 0 });
      };
      img.src = url;
    } catch {
      resolve({ ok: false, coverage: 0 });
    }
  });
};

export interface PreflightSummary {
  total: number;
  contrastFails: { id: string; name: string; lcLight: number; lcDark: number }[];
  rasterFails: { id: string; name: string; coverage: number }[];
  strokeInconsistentCount: number;
  brandFitFailCount: number;
  exportNotReadyCount: number;
}

export const runPreflight = async (
  icons: BrandIconography[],
  recipe?: IconRecipe | null,
): Promise<PreflightSummary> => {
  const contrastFails: PreflightSummary['contrastFails'] = [];
  const rasterFails: PreflightSummary['rasterFails'] = [];
  let strokeInconsistentCount = 0;
  let brandFitFailCount = 0;
  let exportNotReadyCount = 0;

  for (const icon of icons) {
    const report = scoreIcon(icon, recipe);
    if (report.findings.some((f) => f.id === 'stroke-inconsistent')) strokeInconsistentCount++;
    if (report.scores.brandFit < 70) brandFitFailCount++;
    if (!report.exportReady) exportNotReadyCount++;

    const cc = checkIconContrast(icon, recipe);
    if (!cc.ok) {
      contrastFails.push({
        id: String(icon.id ?? icon.name ?? ''),
        name: icon.name ?? 'unnamed',
        lcLight: cc.lcLight,
        lcDark: cc.lcDark,
      });
    }
    const rc = await checkRasterReadability(icon);
    if (rc && !rc.ok) {
      rasterFails.push({
        id: String(icon.id ?? icon.name ?? ''),
        name: icon.name ?? 'unnamed',
        coverage: rc.coverage,
      });
    }
  }

  return {
    total: icons.length,
    contrastFails,
    rasterFails,
    strokeInconsistentCount,
    brandFitFailCount,
    exportNotReadyCount,
  };
};

