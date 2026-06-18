import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';

export const AUDIT_LOCKUPS: ClientLogoLockup[] = ['icon', 'wordmark'];
export const AUDIT_VARIANTS: ClientLogoVariant[] = ['color', 'black', 'white'];

export interface CheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}

export interface FileAudit {
  file: ClientLogoFile;
  checks: CheckResult[];
  passCount: number;
  failCount: number;
  warnCount: number;
  status: 'pass' | 'fail' | 'warn';
}

export interface SlotAudit {
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  files: FileAudit[];
  checks: CheckResult[];
  status: 'pass' | 'fail' | 'warn';
}

export interface BrandAudit {
  slots: SlotAudit[];
  checks: CheckResult[];
  totals: {
    fileChecks: number;
    filePass: number;
    fileFail: number;
    fileWarn: number;
    slotPass: number;
    slotFail: number;
    slotWarn: number;
    brandPass: number;
    brandFail: number;
    brandWarn: number;
  };
  overall: 'pass' | 'fail' | 'warn';
  passRate: number; // 0–100
}

const extOf = (url: string, fallback?: string): string => {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (m) return m[1].toLowerCase();
  } catch { /* noop */ }
  return (fallback || '').toLowerCase();
};

const isHttps = (url: string) => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

const rollup = (results: CheckResult[]): 'pass' | 'fail' | 'warn' => {
  if (results.some((r) => r.status === 'fail')) return 'fail';
  if (results.some((r) => r.status === 'warn')) return 'warn';
  return 'pass';
};

function auditFile(file: ClientLogoFile): FileAudit {
  const ext = extOf(file.url, file.format);
  const declaredVariant = file.variant;
  const declaredFormat = file.format;
  const declaredLockup = file.lockup || 'icon';
  const filename = (() => {
    try {
      return new URL(file.url).pathname.toLowerCase();
    } catch {
      return file.url.toLowerCase();
    }
  })();

  const checks: CheckResult[] = [];

  // 1. URL parseable
  let urlOk = false;
  try {
    new URL(file.url);
    urlOk = true;
  } catch { /* noop */ }
  checks.push({
    id: 'url-valid',
    label: 'URL is valid',
    status: urlOk ? 'pass' : 'fail',
    detail: urlOk ? undefined : 'URL could not be parsed',
  });

  // 2. HTTPS
  checks.push({
    id: 'https',
    label: 'Served over HTTPS',
    status: isHttps(file.url) ? 'pass' : 'fail',
    detail: isHttps(file.url) ? undefined : 'URL must use https://',
  });

  // 3. Extension matches declared format
  const extMatches = !ext || ext === declaredFormat;
  checks.push({
    id: 'ext-match',
    label: 'Extension matches format',
    status: extMatches ? 'pass' : 'warn',
    detail: extMatches
      ? undefined
      : `Declared "${declaredFormat}" but file extension is ".${ext}"`,
  });

  // 4. Variant labelling vs filename hints
  const hintsBlack = /(^|[\/\-_])(black|dark|onlight)(\.|[\/\-_])/i.test(filename);
  const hintsWhite = /(^|[\/\-_])(white|light|ondark|reverse|inverse|inverted|knockout)(\.|[\/\-_])/i.test(filename);
  let variantWarn: string | null = null;
  if (declaredVariant === 'color' && (hintsBlack || hintsWhite)) {
    variantWarn = `Filename suggests ${hintsWhite ? 'white' : 'black'} but declared "color"`;
  } else if (declaredVariant === 'black' && hintsWhite) {
    variantWarn = 'Filename suggests white but declared "black"';
  } else if (declaredVariant === 'white' && hintsBlack) {
    variantWarn = 'Filename suggests black but declared "white"';
  }
  checks.push({
    id: 'variant-label',
    label: 'Variant label looks correct',
    status: variantWarn ? 'warn' : 'pass',
    detail: variantWarn || undefined,
  });

  // 5. Lockup label vs filename hints
  const hintsWordmark = /(wordmark|logotype|full|horizontal|lockup)/i.test(filename);
  const hintsIcon = /(icon|symbol|mark|logomark|favicon|glyph)/i.test(filename);
  let lockupWarn: string | null = null;
  if (declaredLockup === 'icon' && hintsWordmark && !hintsIcon) {
    lockupWarn = 'Filename suggests wordmark but declared "icon"';
  } else if (declaredLockup === 'wordmark' && hintsIcon && !hintsWordmark) {
    lockupWarn = 'Filename suggests icon but declared "wordmark"';
  }
  checks.push({
    id: 'lockup-label',
    label: 'Lockup label looks correct',
    status: lockupWarn ? 'warn' : 'pass',
    detail: lockupWarn || undefined,
  });

  // 6. Vector preferred
  checks.push({
    id: 'vector',
    label: 'Vector format (SVG)',
    status: declaredFormat === 'svg' ? 'pass' : 'warn',
    detail: declaredFormat === 'svg' ? undefined : `Raster (${declaredFormat}) — SVG preferred`,
  });

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  return {
    file,
    checks,
    passCount,
    failCount,
    warnCount,
    status: rollup(checks),
  };
}

function auditSlot(
  lockup: ClientLogoLockup,
  variant: ClientLogoVariant,
  files: ClientLogoFile[],
): SlotAudit {
  const inSlot = files.filter(
    (f) => (f.lockup || 'icon') === lockup && f.variant === variant,
  );
  const order: Record<string, number> = { svg: 0, png: 1, eps: 2 };
  const sorted = [...inSlot].sort(
    (a, b) => (order[a.format] ?? 9) - (order[b.format] ?? 9),
  );
  const fileAudits = sorted.map(auditFile);

  const checks: CheckResult[] = [];
  checks.push({
    id: 'slot-present',
    label: 'Slot has at least one file',
    status: fileAudits.length > 0 ? 'pass' : 'fail',
    detail: fileAudits.length > 0 ? undefined : 'No file uploaded for this slot',
  });
  const hasSvg = fileAudits.some((f) => f.file.format === 'svg');
  checks.push({
    id: 'slot-svg',
    label: 'Slot has an SVG',
    status: fileAudits.length === 0 ? 'fail' : hasSvg ? 'pass' : 'warn',
    detail:
      fileAudits.length === 0
        ? 'Add an SVG to this slot'
        : hasSvg
          ? undefined
          : 'Only raster file present — add SVG for scalability',
  });

  // Propagate worst file status as a single check
  if (fileAudits.length > 0) {
    const worst = fileAudits.reduce<'pass' | 'warn' | 'fail'>((acc, f) => {
      if (acc === 'fail' || f.status === 'fail') return 'fail';
      if (acc === 'warn' || f.status === 'warn') return 'warn';
      return 'pass';
    }, 'pass');
    checks.push({
      id: 'slot-file-checks',
      label: 'All file checks pass',
      status: worst,
      detail:
        worst === 'pass'
          ? undefined
          : `One or more files have ${worst === 'fail' ? 'failing' : 'warning'} checks`,
    });
  }

  return {
    lockup,
    variant,
    files: fileAudits,
    checks,
    status: rollup(checks),
  };
}

export function auditBrand(files: ClientLogoFile[]): BrandAudit {
  const slots = AUDIT_LOCKUPS.flatMap((lk) =>
    AUDIT_VARIANTS.map((v) => auditSlot(lk, v, files)),
  );

  const brandChecks: CheckResult[] = [];
  const missingSlots = slots.filter((s) => s.files.length === 0);
  brandChecks.push({
    id: 'brand-all-slots',
    label: 'All 6 slots present (icon + wordmark × color/black/white)',
    status: missingSlots.length === 0 ? 'pass' : 'fail',
    detail:
      missingSlots.length === 0
        ? undefined
        : `Missing: ${missingSlots.map((s) => `${s.lockup}/${s.variant}`).join(', ')}`,
  });

  const slotsWithoutSvg = slots.filter(
    (s) => s.files.length > 0 && !s.files.some((f) => f.file.format === 'svg'),
  );
  brandChecks.push({
    id: 'brand-all-svg',
    label: 'Every slot has an SVG',
    status: slotsWithoutSvg.length === 0 ? 'pass' : 'warn',
    detail:
      slotsWithoutSvg.length === 0
        ? undefined
        : `Raster-only: ${slotsWithoutSvg.map((s) => `${s.lockup}/${s.variant}`).join(', ')}`,
  });

  for (const v of AUDIT_VARIANTS) {
    const present = slots.some((s) => s.variant === v && s.files.length > 0);
    brandChecks.push({
      id: `brand-variant-${v}`,
      label: `Has ${v} variant`,
      status: present ? 'pass' : 'fail',
    });
  }
  for (const lk of AUDIT_LOCKUPS) {
    const present = slots.some((s) => s.lockup === lk && s.files.length > 0);
    brandChecks.push({
      id: `brand-lockup-${lk}`,
      label: `Has ${lk} lockup`,
      status: present ? 'pass' : 'fail',
    });
  }

  // Totals
  const fileAudits = slots.flatMap((s) => s.files);
  const fileChecks = fileAudits.reduce((n, f) => n + f.checks.length, 0);
  const filePass = fileAudits.reduce((n, f) => n + f.passCount, 0);
  const fileFail = fileAudits.reduce((n, f) => n + f.failCount, 0);
  const fileWarn = fileAudits.reduce((n, f) => n + f.warnCount, 0);

  const slotPass = slots.filter((s) => s.status === 'pass').length;
  const slotFail = slots.filter((s) => s.status === 'fail').length;
  const slotWarn = slots.filter((s) => s.status === 'warn').length;

  const brandPass = brandChecks.filter((c) => c.status === 'pass').length;
  const brandFail = brandChecks.filter((c) => c.status === 'fail').length;
  const brandWarn = brandChecks.filter((c) => c.status === 'warn').length;

  const overall = rollup([...brandChecks, ...slots.flatMap((s) => s.checks)]);

  const totalChecks = fileChecks + slots.length * 2 + brandChecks.length;
  const totalPass = filePass + slotPass + brandPass;
  const passRate = totalChecks === 0 ? 0 : Math.round((totalPass / totalChecks) * 100);

  return {
    slots,
    checks: brandChecks,
    totals: {
      fileChecks,
      filePass,
      fileFail,
      fileWarn,
      slotPass,
      slotFail,
      slotWarn,
      brandPass,
      brandFail,
      brandWarn,
    },
    overall,
    passRate,
  };
}
