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

export interface QAFinding {
  id: string;
  category: 'brandFit' | 'svgHealth' | 'smallSizeReadable' | 'exportReady';
  severity: QASeverity;
  message: string;
}

export interface QAScores {
  brandFit: number;
  svgHealth: number;
  smallSizeReadable: number;
  exportReady: number;
  overall: number;
}

export interface QAReport {
  scores: QAScores;
  findings: QAFinding[];
  exportReady: boolean;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const getSvgString = (icon: BrandIconography): string => {
  if (!icon.svgPath) return '';
  return buildSvgString({
    svgPath: icon.svgPath,
    viewBox: (icon as any).viewBox || '0 0 24 24',
    fillMode: (icon as any).fillMode,
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

    // Excessive path count
    const pathCount = countOccurrences(svg, /<path\b/gi);
    if (pathCount > 8) {
      svgHealth -= 15;
      findings.push({
        id: 'path-count-high',
        category: 'svgHealth',
        severity: 'warn',
        message: `High path count (${pathCount}). Aim for ≤8 for clean rendering.`,
      });
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

  return {
    scores: { brandFit, svgHealth, smallSizeReadable, exportReady, overall },
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

