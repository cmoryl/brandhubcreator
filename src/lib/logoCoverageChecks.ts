/**
 * Brand-level coverage and governance helpers used by the audit page:
 *  - filename convention enforcement
 *  - icon/wordmark × color/black/white slot completeness matrix
 *  - dark-mode pairing completeness
 *  - print-format availability (EPS, PDF)
 *  - app-icon / favicon coverage
 */

import type {
  ClientLogoFile,
  ClientLogoLockup,
  ClientLogoVariant,
} from '@/types/brand';

export const REQUIRED_LOCKUPS: ClientLogoLockup[] = ['icon', 'wordmark'];
export const REQUIRED_VARIANTS: ClientLogoVariant[] = ['color', 'black', 'white'];

const slugifyBrand = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.'’]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const basenameOf = (url: string): string => {
  try {
    const p = new URL(url).pathname;
    return p.split('/').pop()?.toLowerCase() ?? '';
  } catch {
    return url.toLowerCase().split('/').pop() ?? '';
  }
};

const extOf = (url: string, fallback?: string): string => {
  const base = basenameOf(url);
  const m = base.match(/\.([a-z0-9]+)$/);
  return (m ? m[1] : fallback || '').toLowerCase();
};

/* ------------------------------ Naming ------------------------------ */

export interface NameConventionResult {
  file: ClientLogoFile;
  conforms: boolean;
  expected: string;
  actual: string;
  reason?: string;
}

/** Expect `{brand}-{lockup}-{variant}.{ext}` (also accept `{brand}_{lockup}_{variant}`). */
export function checkNamingConvention(
  brandName: string,
  files: ClientLogoFile[],
): NameConventionResult[] {
  const slug = slugifyBrand(brandName);
  return files.map((file) => {
    const base = basenameOf(file.url);
    const ext = extOf(file.url, file.format);
    const lockup = file.lockup || 'icon';
    const expected = `${slug}-${lockup}-${file.variant}.${ext}`;
    const norm = base.replace(/[_]/g, '-');
    // Tolerant match: brand slug somewhere, plus lockup + variant tokens, plus correct extension.
    const hasSlug = slug.length > 0 && norm.startsWith(slug);
    const tokens = norm.replace(/\.[a-z0-9]+$/, '').split('-');
    const hasLockup = tokens.includes(lockup);
    const hasVariant = tokens.includes(file.variant);
    const hasExt = norm.endsWith(`.${ext}`);
    const conforms = hasSlug && hasLockup && hasVariant && hasExt;
    const reasonParts: string[] = [];
    if (!hasSlug) reasonParts.push(`missing brand slug "${slug}"`);
    if (!hasLockup) reasonParts.push(`missing lockup token "${lockup}"`);
    if (!hasVariant) reasonParts.push(`missing variant token "${file.variant}"`);
    if (!hasExt) reasonParts.push(`extension ".${ext}" missing`);
    return {
      file,
      conforms,
      expected,
      actual: base,
      reason: reasonParts.length ? reasonParts.join(', ') : undefined,
    };
  });
}

/* ----------------------------- Slot matrix ----------------------------- */

export interface SlotCell {
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  files: ClientLogoFile[];
  hasSvg: boolean;
  hasRaster: boolean;
}

export interface SlotMatrix {
  cells: SlotCell[];
  totalSlots: number;
  filledSlots: number;
  coveragePercent: number;
  svgCoverage: number;
  missing: Array<{ lockup: ClientLogoLockup; variant: ClientLogoVariant }>;
}

export function buildSlotMatrix(files: ClientLogoFile[]): SlotMatrix {
  const cells: SlotCell[] = [];
  for (const lockup of REQUIRED_LOCKUPS) {
    for (const variant of REQUIRED_VARIANTS) {
      const inSlot = files.filter(
        (f) => (f.lockup || 'icon') === lockup && f.variant === variant,
      );
      cells.push({
        lockup,
        variant,
        files: inSlot,
        hasSvg: inSlot.some((f) => f.format === 'svg'),
        hasRaster: inSlot.some((f) => f.format !== 'svg'),
      });
    }
  }
  const totalSlots = cells.length;
  const filledSlots = cells.filter((c) => c.files.length > 0).length;
  const withSvg = cells.filter((c) => c.hasSvg).length;
  return {
    cells,
    totalSlots,
    filledSlots,
    coveragePercent: Math.round((filledSlots / totalSlots) * 100),
    svgCoverage: Math.round((withSvg / totalSlots) * 100),
    missing: cells
      .filter((c) => c.files.length === 0)
      .map((c) => ({ lockup: c.lockup, variant: c.variant })),
  };
}

/* ------------------------ Dark-mode pairing ------------------------ */

export interface DarkModePairing {
  lockup: ClientLogoLockup;
  hasBlack: boolean;
  hasWhite: boolean;
  /** Both variants present (paired). */
  paired: boolean;
}

export function checkDarkModePairing(files: ClientLogoFile[]): DarkModePairing[] {
  return REQUIRED_LOCKUPS.map((lockup) => {
    const inLockup = files.filter((f) => (f.lockup || 'icon') === lockup);
    const hasBlack = inLockup.some((f) => f.variant === 'black');
    const hasWhite = inLockup.some((f) => f.variant === 'white');
    return { lockup, hasBlack, hasWhite, paired: hasBlack && hasWhite };
  });
}

/* ---------------------- Print-format availability ---------------------- */

export interface PrintFormatCoverage {
  hasEps: boolean;
  hasPdf: boolean;
  epsCount: number;
  pdfCount: number;
}

export function checkPrintFormats(files: ClientLogoFile[]): PrintFormatCoverage {
  const epsCount = files.filter(
    (f) => f.format === 'eps' || extOf(f.url, f.format) === 'eps',
  ).length;
  const pdfCount = files.filter(
    (f) => extOf(f.url, f.format) === 'pdf' || /\.pdf(\?|$)/i.test(f.url),
  ).length;
  return {
    hasEps: epsCount > 0,
    hasPdf: pdfCount > 0,
    epsCount,
    pdfCount,
  };
}

/* -------------------------- App-icon coverage -------------------------- */

export interface AppIconRequirement {
  id: string;
  label: string;
  hint: RegExp;
  /** Optional dimension pixel size we look for in the filename. */
  size?: number;
  required: boolean;
  notes?: string;
}

export const APP_ICON_REQUIREMENTS: AppIconRequirement[] = [
  { id: 'favicon-16', label: 'favicon 16×16', hint: /(favicon[-_]?16|16x16)/i, size: 16, required: true },
  { id: 'favicon-32', label: 'favicon 32×32', hint: /(favicon[-_]?32|32x32)/i, size: 32, required: true },
  { id: 'apple-180', label: 'Apple touch icon 180×180', hint: /(apple[-_]?touch|180x180|apple[-_]?icon)/i, size: 180, required: true },
  { id: 'pwa-192', label: 'PWA 192×192', hint: /(192x192|android[-_]?192|pwa[-_]?192)/i, size: 192, required: true },
  { id: 'pwa-512', label: 'PWA 512×512', hint: /(512x512|android[-_]?512|pwa[-_]?512)/i, size: 512, required: true },
  { id: 'maskable', label: 'Maskable PNG', hint: /maskable/i, required: true, notes: 'Adaptive icon for Android/PWA' },
  { id: 'safari-mono', label: 'Safari pinned-tab mono SVG', hint: /(safari[-_]?pinned|mask[-_]?icon|monochrome)/i, required: false, notes: 'Monochrome SVG for Safari pinned tab' },
];

export interface AppIconCoverage {
  requirement: AppIconRequirement;
  matched: ClientLogoFile[];
}

export function checkAppIconCoverage(files: ClientLogoFile[]): AppIconCoverage[] {
  return APP_ICON_REQUIREMENTS.map((req) => ({
    requirement: req,
    matched: files.filter((f) => {
      const base = basenameOf(f.url);
      if (req.hint.test(base)) return true;
      if (req.id === 'safari-mono' && f.format === 'svg' && f.variant === 'black') return true;
      return false;
    }),
  }));
}
