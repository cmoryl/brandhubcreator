/**
 * Advanced SVG structural lint.
 *
 * Catches quality / portability problems that aren't security issues but
 * silently break logos in real-world rendering:
 *
 *   - missing viewBox / hardcoded pixel dims (no responsive scaling)
 *   - preserveAspectRatio="none" (distortion)
 *   - embedded raster <image> data: URIs (defeats vector)
 *   - external <image> / <use> / fill="url(http…)" references
 *   - <text> using non-generic fonts with no <defs><font-face> (font-dep render)
 *   - heavy <filter> usage (feGaussianBlur, feColorMatrix) — may fail in
 *     low-fidelity renderers (PDF export, social previews)
 *   - inline CSS <style> blocks (theme leaks across documents)
 *   - duplicate element IDs
 *   - empty viewBox / zero area
 *
 * Returns findings + a sanitized SVG string (sanitization is conservative —
 * only safe-to-strip nodes are removed).
 */

export type LintSeverity = 'pass' | 'warn' | 'fail';

export interface LintFinding {
  id: string;
  label: string;
  severity: LintSeverity;
  detail?: string;
  /** How sanitization handled this finding, if at all. */
  remediation?: 'stripped' | 'kept' | 'blocked';
}

export interface SvgLintResult {
  ok: boolean; // false if any 'fail' finding
  findings: LintFinding[];
  sanitized: string;
  counts: { pass: number; warn: number; fail: number };
}

const RASTER_DATA_URI = /^data:image\/(png|jpe?g|webp|gif|bmp|tiff?)\b/i;
const EXTERNAL_HREF = /^(https?:|\/\/|ftp:)/i;
const GENERIC_FONTS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'cursive',
  'fantasy',
  '-apple-system',
  'blinkmacsystemfont',
  'inherit',
  'initial',
  'unset',
  'currentcolor',
]);
const HEAVY_FILTER_PRIMS = new Set([
  'fegaussianblur',
  'fecolormatrix',
  'feconvolvematrix',
  'fedisplacementmap',
  'feturbulence',
  'fediffuselighting',
  'fespecularlighting',
  'femorphology',
  'fedropshadow',
]);

function getAllElements(doc: Document): Element[] {
  const out: Element[] = [];
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
  let n: Node | null = doc.documentElement;
  while (n) {
    out.push(n as Element);
    n = walker.nextNode();
  }
  return out;
}

function getHrefAttr(el: Element): string | null {
  return (
    el.getAttribute('href') ??
    el.getAttribute('xlink:href') ??
    el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ??
    null
  );
}

function familiesFromFontFamily(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
    .filter(Boolean);
}

/**
 * Run structural lint against an SVG document. The document may be mutated
 * during sanitization (safe nodes removed). Caller serializes after.
 */
export function lintSvgDocument(doc: Document): SvgLintResult {
  const findings: LintFinding[] = [];
  const root = doc.documentElement;

  if (!root || root.tagName.toLowerCase() !== 'svg') {
    findings.push({
      id: 'root',
      label: 'Root element is <svg>',
      severity: 'fail',
      detail: `Got <${root?.tagName ?? 'none'}>`,
      remediation: 'blocked',
    });
    return {
      ok: false,
      findings,
      sanitized: '',
      counts: { pass: 0, warn: 0, fail: 1 },
    };
  }

  // 1. viewBox present + non-degenerate
  const viewBox = root.getAttribute('viewBox');
  if (!viewBox) {
    findings.push({
      id: 'viewbox-missing',
      label: 'viewBox attribute present',
      severity: 'fail',
      detail: 'Logo will not scale responsively without viewBox.',
      remediation: 'kept',
    });
  } else {
    const parts = viewBox.trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
      findings.push({
        id: 'viewbox-malformed',
        label: 'viewBox is well-formed',
        severity: 'fail',
        detail: `Got "${viewBox}"`,
        remediation: 'kept',
      });
    } else if (parts[2] <= 0 || parts[3] <= 0) {
      findings.push({
        id: 'viewbox-zero',
        label: 'viewBox has non-zero area',
        severity: 'fail',
        detail: `width=${parts[2]} height=${parts[3]}`,
        remediation: 'kept',
      });
    } else {
      findings.push({ id: 'viewbox-ok', label: 'viewBox present and valid', severity: 'pass' });
    }
  }

  // 2. width/height hardcoded in px without unitless viewBox match
  for (const dim of ['width', 'height'] as const) {
    const raw = root.getAttribute(dim);
    if (raw && /^\d+(\.\d+)?(px)?$/i.test(raw.trim())) {
      findings.push({
        id: `dim-${dim}-hardcoded`,
        label: `Root ${dim} is not hardcoded`,
        severity: 'warn',
        detail: `${dim}="${raw}" — prefer omitting or using percentage.`,
        remediation: 'kept',
      });
    }
  }

  // 3. preserveAspectRatio
  const par = root.getAttribute('preserveAspectRatio');
  if (par && par.trim().toLowerCase().startsWith('none')) {
    findings.push({
      id: 'par-none',
      label: 'preserveAspectRatio is not "none"',
      severity: 'fail',
      detail: 'Logo will be stretched/distorted by the renderer.',
      remediation: 'kept',
    });
  }

  // Walk every element for the per-tag checks.
  const elements = getAllElements(doc);

  // 4. embedded raster <image> + external image references
  const rasterEmbeds: Element[] = [];
  const externalImages: Element[] = [];
  for (const el of elements) {
    if (el.tagName.toLowerCase() === 'image') {
      const href = getHrefAttr(el) || '';
      if (RASTER_DATA_URI.test(href)) rasterEmbeds.push(el);
      else if (EXTERNAL_HREF.test(href)) externalImages.push(el);
    }
  }
  if (rasterEmbeds.length > 0) {
    findings.push({
      id: 'raster-embed',
      label: 'No embedded raster <image>',
      severity: 'fail',
      detail: `${rasterEmbeds.length} embedded raster image(s) found — defeats the purpose of SVG.`,
      remediation: 'blocked',
    });
  }
  if (externalImages.length > 0) {
    findings.push({
      id: 'external-image',
      label: 'No external <image href="http…">',
      severity: 'fail',
      detail: `${externalImages.length} external image reference(s).`,
      remediation: 'blocked',
    });
  }

  // 5. external href on <use>, fill/stroke url(http…), etc.
  const externalRefs: string[] = [];
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'use') {
      const href = getHrefAttr(el) || '';
      if (EXTERNAL_HREF.test(href)) externalRefs.push(`<use href="${href.slice(0, 40)}…">`);
    }
    for (const attr of Array.from(el.attributes)) {
      const val = attr.value;
      if (/url\(\s*['"]?(https?:|\/\/)/i.test(val)) {
        externalRefs.push(`${tag}[${attr.name}]`);
      }
    }
  }
  if (externalRefs.length > 0) {
    findings.push({
      id: 'external-ref',
      label: 'No external resource references',
      severity: 'fail',
      detail: externalRefs.slice(0, 3).join(', ') + (externalRefs.length > 3 ? '…' : ''),
      remediation: 'blocked',
    });
  }

  // 6. <text> + font dependencies
  const textNodes = elements.filter((e) => e.tagName.toLowerCase() === 'text');
  const fontDeps = new Set<string>();
  for (const el of elements) {
    const ff = el.getAttribute('font-family');
    if (ff) {
      for (const family of familiesFromFontFamily(ff)) {
        if (!GENERIC_FONTS.has(family)) fontDeps.add(family);
      }
    }
    const style = el.getAttribute('style');
    if (style) {
      const m = style.match(/font-family\s*:\s*([^;]+)/i);
      if (m) {
        for (const family of familiesFromFontFamily(m[1])) {
          if (!GENERIC_FONTS.has(family)) fontDeps.add(family);
        }
      }
    }
  }
  const hasFontFace = elements.some(
    (e) => e.tagName.toLowerCase() === 'font-face' || e.tagName.toLowerCase() === '@font-face',
  );
  if (textNodes.length > 0) {
    findings.push({
      id: 'text-nodes',
      label: '<text> converted to paths (no <text> nodes)',
      severity: 'warn',
      detail: `${textNodes.length} <text> node(s) — text will render font-dependent unless outlined.`,
      remediation: 'kept',
    });
  }
  if (fontDeps.size > 0 && !hasFontFace) {
    findings.push({
      id: 'font-deps',
      label: 'No external font dependencies',
      severity: 'warn',
      detail: `Depends on: ${[...fontDeps].slice(0, 3).join(', ')}${fontDeps.size > 3 ? '…' : ''}`,
      remediation: 'kept',
    });
  }

  // 7. heavy filters
  const heavyFilters: string[] = [];
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (HEAVY_FILTER_PRIMS.has(tag)) heavyFilters.push(`<${tag}>`);
  }
  if (heavyFilters.length > 0) {
    findings.push({
      id: 'heavy-filters',
      label: 'No heavy SVG filter primitives',
      severity: 'warn',
      detail: `${heavyFilters.length} filter primitive(s): ${[...new Set(heavyFilters)].slice(0, 3).join(', ')} — may not render in PDF/social previews.`,
      remediation: 'kept',
    });
  }

  // 8. inline <style> blocks
  const styleBlocks = elements.filter((e) => e.tagName.toLowerCase() === 'style');
  if (styleBlocks.length > 0) {
    let leak = false;
    for (const s of styleBlocks) {
      const css = s.textContent || '';
      // global selectors / @import / url(http…) are the dangerous patterns
      if (/@import/i.test(css) || /url\(\s*['"]?https?:/i.test(css)) leak = true;
      if (/(^|\s)(html|body|\*)\s*[{,]/i.test(css)) leak = true;
    }
    findings.push({
      id: 'style-block',
      label: 'No inline <style> blocks',
      severity: leak ? 'fail' : 'warn',
      detail: leak
        ? 'Contains @import or global selectors — leaks across documents.'
        : `${styleBlocks.length} <style> block(s) — prefer presentation attributes.`,
      remediation: leak ? 'stripped' : 'kept',
    });
    if (leak) for (const s of styleBlocks) s.remove();
  }

  // 9. duplicate IDs
  const idCounts = new Map<string, number>();
  for (const el of elements) {
    const id = el.getAttribute('id');
    if (id) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  const dupes = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dupes.length > 0) {
    findings.push({
      id: 'dup-ids',
      label: 'Element IDs are unique',
      severity: 'warn',
      detail: `Duplicates: ${dupes.slice(0, 3).join(', ')}${dupes.length > 3 ? '…' : ''}`,
      remediation: 'kept',
    });
  }

  // 10. xmlns sanity
  const xmlns = root.getAttribute('xmlns');
  if (!xmlns || xmlns !== 'http://www.w3.org/2000/svg') {
    findings.push({
      id: 'xmlns',
      label: 'Correct SVG xmlns declared',
      severity: 'warn',
      detail: `xmlns="${xmlns ?? '(missing)'}"`,
      remediation: 'kept',
    });
    if (!xmlns) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // 11. Strip embedded raster + external refs from the sanitized output.
  for (const el of [...rasterEmbeds, ...externalImages]) el.remove();

  // Serialize
  const serialized = new XMLSerializer().serializeToString(doc);
  const sanitized = serialized.startsWith('<?xml')
    ? serialized
    : `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;

  const counts = findings.reduce(
    (acc, f) => {
      acc[f.severity] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 } as { pass: number; warn: number; fail: number },
  );

  return {
    ok: counts.fail === 0,
    findings,
    sanitized,
    counts,
  };
}

export function lintSvgString(text: string): SvgLintResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const parseErr = doc.querySelector('parsererror');
  if (parseErr) {
    return {
      ok: false,
      findings: [
        { id: 'parse', label: 'SVG is well-formed XML', severity: 'fail', detail: 'Parse error' },
      ],
      sanitized: '',
      counts: { pass: 0, warn: 0, fail: 1 },
    };
  }
  return lintSvgDocument(doc);
}
