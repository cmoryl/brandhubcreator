/**
 * Deep SVG quality analyzer — runs after the structural lint and after
 * the server-side render snapshot. Catches the "looks fine but is fragile"
 * cases:
 *
 *  - Path coordinates with excessive decimal precision (un-cleaned exports)
 *  - Stroke-based art that will scale unpredictably across renderers
 *  - Open paths that rely on stroke instead of fill (causes holes in some renderers)
 *  - Fill-rule (`nonzero` vs `evenodd`) inconsistencies
 *  - Gradients / masks / filters that may not be supported in every embed target
 *  - SMIL `<animate*>` and CSS `@keyframes` (motion concerns)
 *  - "SVGO opportunity" — bytes that could be saved with a simple
 *    minify-equivalent pass (whitespace + comment stripping)
 */

export interface SvgQualityIssue {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail?: string;
}

export interface SvgQualityReport {
  fetched: boolean;
  bytes: number;
  bytesMinified: number;
  /** 0–100, how much smaller a basic minify pass would make this. */
  optimizableRatio: number;
  /** Largest decimal-precision found in any path data (count of decimals). */
  maxDecimalPrecision: number;
  /** Count of decimals across all path-data, useful for size heuristic. */
  highPrecisionTokens: number;
  hasStrokes: boolean;
  strokeCount: number;
  openPaths: number;
  fillRules: { nonzero: number; evenodd: number };
  hasGradient: boolean;
  hasMask: boolean;
  hasClipPath: boolean;
  hasFilter: boolean;
  hasSmilAnimation: boolean;
  hasCssAnimation: boolean;
  issues: SvgQualityIssue[];
  error?: string;
}

const DECIMAL_RE = /-?\d+\.(\d+)/g;
const PATH_D_RE = /\bd="([^"]+)"/g;
const PATH_TAG_RE = /<path\b[^>]*>/gi;

function minifySvg(text: string): string {
  return text
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([=,;:])\s*/g, '$1')
    .trim();
}

export async function fetchSvgQuality(url: string, signal?: AbortSignal): Promise<SvgQualityReport> {
  const empty: SvgQualityReport = {
    fetched: false,
    bytes: 0,
    bytesMinified: 0,
    optimizableRatio: 0,
    maxDecimalPrecision: 0,
    highPrecisionTokens: 0,
    hasStrokes: false,
    strokeCount: 0,
    openPaths: 0,
    fillRules: { nonzero: 0, evenodd: 0 },
    hasGradient: false,
    hasMask: false,
    hasClipPath: false,
    hasFilter: false,
    hasSmilAnimation: false,
    hasCssAnimation: false,
    issues: [],
  };

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      return { ...empty, error: `HTTP ${res.status}` };
    }
    const text = await res.text();
    if (!/<svg[\s>]/i.test(text)) {
      return { ...empty, error: 'Response is not SVG markup' };
    }
    return analyzeSvgText(text);
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'fetch failed' };
  }
}

export function analyzeSvgText(text: string): SvgQualityReport {
  const bytes = new TextEncoder().encode(text).length;
  const minified = minifySvg(text);
  const bytesMinified = new TextEncoder().encode(minified).length;
  const optimizableRatio = bytes ? Math.round(((bytes - bytesMinified) / bytes) * 100) : 0;

  // Decimal precision across all `d=` attributes (most informative).
  let maxDecimalPrecision = 0;
  let highPrecisionTokens = 0;
  for (const m of text.matchAll(PATH_D_RE)) {
    const d = m[1];
    for (const dm of d.matchAll(DECIMAL_RE)) {
      const len = dm[1].length;
      if (len > maxDecimalPrecision) maxDecimalPrecision = len;
      if (len >= 4) highPrecisionTokens += 1;
    }
  }

  // Stroke usage
  const strokeAttrCount = (text.match(/\bstroke\s*=\s*"(?!none")/gi) || []).length;
  const cssStrokeCount = (text.match(/[;{\s]stroke\s*:\s*(?!none)/gi) || []).length;
  const strokeCount = strokeAttrCount + cssStrokeCount;
  const hasStrokes = strokeCount > 0;

  // "Open path" heuristic: path with `stroke` set but no `fill` (or fill=none)
  // and whose d= does not end with z/Z.
  let openPaths = 0;
  const pathTags = text.match(PATH_TAG_RE) || [];
  for (const tag of pathTags) {
    const hasStroke = /\bstroke\s*=\s*"(?!none)/i.test(tag) || /[;{\s]stroke\s*:\s*(?!none)/i.test(tag);
    const fillNone = /\bfill\s*=\s*"none"/i.test(tag) || /[;{\s]fill\s*:\s*none/i.test(tag);
    if (!hasStroke && !fillNone) continue;
    const dMatch = tag.match(/\bd="([^"]+)"/i);
    if (!dMatch) continue;
    const d = dMatch[1].trim();
    if (!/[zZ]\s*$/.test(d)) openPaths += 1;
  }

  // Fill rule split
  const fillRules = {
    nonzero: (text.match(/fill-rule\s*[=:]\s*["']?nonzero/gi) || []).length,
    evenodd: (text.match(/fill-rule\s*[=:]\s*["']?evenodd/gi) || []).length,
  };

  const hasGradient = /<(linearGradient|radialGradient)\b/i.test(text);
  const hasMask = /<mask\b/i.test(text);
  const hasClipPath = /<clipPath\b/i.test(text);
  const hasFilter = /<filter\b/i.test(text);

  // Animation
  const hasSmilAnimation =
    /<animate(Transform|Motion)?\b/i.test(text) || /<set\b/i.test(text);
  const hasCssAnimation = /@keyframes\b/i.test(text) || /\banimation\s*:/i.test(text);

  // Build issue list
  const issues: SvgQualityIssue[] = [];

  issues.push({
    id: 'svg-size',
    label: 'File size',
    status: bytes > 50_000 ? 'warn' : bytes > 200_000 ? 'fail' : 'pass',
    detail: `${(bytes / 1024).toFixed(1)} KB`,
  });

  issues.push({
    id: 'svg-optimizable',
    label: 'Minify opportunity',
    status: optimizableRatio >= 30 ? 'warn' : optimizableRatio >= 50 ? 'fail' : 'pass',
    detail:
      optimizableRatio > 0
        ? `~${optimizableRatio}% savings possible (${(bytesMinified / 1024).toFixed(1)} KB minified)`
        : 'Already minified',
  });

  issues.push({
    id: 'svg-decimal-precision',
    label: 'Coordinate precision',
    status: maxDecimalPrecision >= 6 ? 'warn' : maxDecimalPrecision >= 8 ? 'fail' : 'pass',
    detail:
      maxDecimalPrecision === 0
        ? 'Integer coords'
        : `Up to ${maxDecimalPrecision} decimals (${highPrecisionTokens} high-precision values)${
            maxDecimalPrecision >= 6 ? ' — likely un-cleaned export' : ''
          }`,
  });

  issues.push({
    id: 'svg-strokes',
    label: 'Strokes vs outlined paths',
    status: hasStrokes ? 'warn' : 'pass',
    detail: hasStrokes
      ? `${strokeCount} stroke(s) — outline to paths for predictable scaling`
      : 'All shapes are filled paths',
  });

  issues.push({
    id: 'svg-open-paths',
    label: 'Open paths',
    status: openPaths > 0 ? 'warn' : 'pass',
    detail:
      openPaths > 0
        ? `${openPaths} path(s) appear unclosed — may render with holes`
        : 'All paths closed or explicitly stroked',
  });

  if (fillRules.nonzero > 0 && fillRules.evenodd > 0) {
    issues.push({
      id: 'svg-fill-rule-mixed',
      label: 'Fill-rule mix',
      status: 'warn',
      detail: `Mixes nonzero (${fillRules.nonzero}) and evenodd (${fillRules.evenodd}) — renderer drift risk`,
    });
  } else {
    issues.push({
      id: 'svg-fill-rule',
      label: 'Fill-rule consistency',
      status: 'pass',
      detail:
        fillRules.evenodd > 0
          ? `${fillRules.evenodd} evenodd path(s)`
          : fillRules.nonzero > 0
            ? `${fillRules.nonzero} nonzero path(s)`
            : 'Default fill-rule',
    });
  }

  issues.push({
    id: 'svg-gradient-mask',
    label: 'Gradient / mask / filter usage',
    status: hasFilter ? 'warn' : hasMask || hasClipPath ? 'info' : hasGradient ? 'info' : 'pass',
    detail: [
      hasGradient && 'gradient',
      hasMask && 'mask',
      hasClipPath && 'clipPath',
      hasFilter && 'filter (heavy)',
    ]
      .filter(Boolean)
      .join(', ') || 'No advanced compositing',
  });

  issues.push({
    id: 'svg-animation',
    label: 'Motion / animation',
    status: hasSmilAnimation || hasCssAnimation ? 'warn' : 'pass',
    detail:
      hasSmilAnimation && hasCssAnimation
        ? 'Both SMIL and CSS animation present — provide a static fallback'
        : hasSmilAnimation
          ? 'SMIL <animate> — not supported everywhere; honor prefers-reduced-motion'
          : hasCssAnimation
            ? '@keyframes / animation — honor prefers-reduced-motion'
            : 'Static SVG',
  });

  return {
    fetched: true,
    bytes,
    bytesMinified,
    optimizableRatio,
    maxDecimalPrecision,
    highPrecisionTokens,
    hasStrokes,
    strokeCount,
    openPaths,
    fillRules,
    hasGradient,
    hasMask,
    hasClipPath,
    hasFilter,
    hasSmilAnimation,
    hasCssAnimation,
    issues,
  };
}
