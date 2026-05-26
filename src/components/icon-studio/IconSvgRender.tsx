import { useEffect, useMemo, useState } from 'react';
import type { BrandIconography } from '@/types/brand';
import { buildSvgString, detectFillMode, sanitizeSvg } from '@/lib/svgUtils';

type IconPresentation = 'auto' | 'outlined' | 'filled' | 'duotone';

interface IconSvgRenderProps {
  icon: BrandIconography;
  size: number;
  color?: string;
  presentation?: IconPresentation;
  strokeWidth?: number;
  className?: string;
  /** Force-enable debug overlay for this tile. Otherwise reads ?iconDebug=1 / localStorage.iconDebug */
  debug?: boolean;
}

const DRAWABLE_SELECTOR = 'path,circle,rect,line,polyline,polygon,ellipse,text';
const LINE_DRAWABLES = new Set(['line', 'polyline']);

const hasPaintStyle = (style: string | null, prop: 'fill' | 'stroke') =>
  Boolean(style && new RegExp(`${prop}\\s*:`, 'i').test(style));

const upsertStyle = (style: string | null, prop: string, value: string) => {
  if (!style?.trim()) return `${prop}: ${value};`;
  const rule = new RegExp(`${prop}\\s*:\\s*[^;]+`, 'i');
  if (rule.test(style)) return style.replace(rule, `${prop}: ${value}`);
  return `${style.trim().replace(/;?$/, ';')} ${prop}: ${value};`;
};

const normalizeToSvgMarkup = (icon: BrandIconography) => {
  const raw = (icon.svgPath || '').trim();
  if (!raw) return '';

  return buildSvgString({
    svgPath: raw,
    viewBox: icon.viewBox || '0 0 24 24',
    fillMode: icon.fillMode,
    name: icon.name,
  });
};

interface DiagnosticReport {
  ok: boolean;
  reasons: string[];
  drawableCount: number;
  hasViewBox: boolean;
  detectedMode: string;
  rawLength: number;
}

const diagnoseIcon = (icon: BrandIconography, finalMarkup: string): DiagnosticReport => {
  const reasons: string[] = [];
  const raw = (icon.svgPath || '').trim();
  if (!raw) reasons.push('missing svgPath');
  if (!icon.viewBox) reasons.push('missing viewBox (fallback 0 0 24 24)');

  let drawableCount = 0;
  let detectedMode = 'unknown';

  if (finalMarkup && typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(finalMarkup, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) {
        reasons.push('no <svg> root after sanitize');
      } else {
        const drawables = svg.querySelectorAll(DRAWABLE_SELECTOR);
        drawableCount = drawables.length;
        if (drawableCount === 0) reasons.push('zero drawable elements');

        // Check for invisible paint
        let visibleCount = 0;
        drawables.forEach((el) => {
          const fill = el.getAttribute('fill');
          const stroke = el.getAttribute('stroke');
          const sw = el.getAttribute('stroke-width');
          const hasFill = fill && fill !== 'none';
          const hasStroke = stroke && stroke !== 'none';
          if (hasFill || (hasStroke && sw && Number(sw) > 0)) visibleCount += 1;
        });
        if (drawableCount > 0 && visibleCount === 0) {
          reasons.push('all paint=none (bad stroke/fill props)');
        }
      }
      detectedMode = icon.fillMode ?? detectFillMode(raw) ?? 'unknown';
    } catch (err) {
      reasons.push(`parse error: ${(err as Error).message}`);
    }
  } else if (!finalMarkup) {
    reasons.push('null render result');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    drawableCount,
    hasViewBox: Boolean(icon.viewBox),
    detectedMode,
    rawLength: raw.length,
  };
};

const useDebugFlag = (forced?: boolean) => {
  const [enabled, setEnabled] = useState(forced ?? false);
  useEffect(() => {
    if (forced) {
      setEnabled(true);
      return;
    }
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('iconDebug') === '1';
    const fromStorage = window.localStorage?.getItem('iconDebug') === '1';
    setEnabled(fromUrl || fromStorage);
  }, [forced]);
  return enabled;
};

const prepareSvgMarkup = (
  icon: BrandIconography,
  size: number,
  presentation: IconPresentation,
  strokeWidth: number,
) => {
  const base = normalizeToSvgMarkup(icon);
  if (!base) return '';

  if (typeof DOMParser === 'undefined') {
    return sanitizeSvg(base);
  }

  const doc = new DOMParser().parseFromString(base, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return sanitizeSvg(base);

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', icon.name || 'Icon');
  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', icon.viewBox || '0 0 24 24');

  // Detect the icon's native presentation. Filled icons designed at 256/512
  // user units have complex shapes that look like a wire-mess if forcibly
  // rendered as outlines, so we always respect their native fill in that case.
  const baseMarkup = normalizeToSvgMarkup(icon);
  const nativeMode = icon.fillMode ?? (detectFillMode(baseMarkup) === 'stroke' ? 'stroke' : 'fill');
  const effectivePresentation: IconPresentation =
    presentation === 'outlined' && nativeMode === 'fill' ? 'auto' : presentation;

  // Scale stroke-width to the icon's viewBox so packs authored at 24, 32, 256
  // or 512 user units render with comparable visual weight. The configured
  // strokeWidth is treated as the target weight in a 24-unit canvas. We only
  // apply scaling to stroke-native icons — filled icons keep their fills and
  // don't need (and would be harmed by) a giant stroke-width.
  const vbParts = (svg.getAttribute('viewBox') || '0 0 24 24').trim().split(/[\s,]+/).map(Number);
  const vbW = Number.isFinite(vbParts[2]) && vbParts[2] > 0 ? vbParts[2] : 24;
  const vbH = Number.isFinite(vbParts[3]) && vbParts[3] > 0 ? vbParts[3] : 24;
  const vbScale = nativeMode === 'stroke' ? Math.max(vbW, vbH) / 24 : 1;
  const uniformStroke = +(strokeWidth * vbScale).toFixed(3);
  svg.setAttribute('stroke-width', String(uniformStroke));
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  // Strip per-element / per-group stroke-width so the root value wins.
  svg.querySelectorAll('[stroke-width]').forEach((el) => {
    if (el !== svg) el.removeAttribute('stroke-width');
  });
  svg.querySelectorAll('[style]').forEach((el) => {
    const s = el.getAttribute('style');
    if (!s) return;
    const cleaned = s.replace(/stroke-width\s*:\s*[^;]+;?/gi, '').trim();
    if (cleaned) el.setAttribute('style', cleaned); else el.removeAttribute('style');
  });

  let rootStyle = svg.getAttribute('style');
  rootStyle = upsertStyle(rootStyle, 'display', 'block');
  rootStyle = upsertStyle(rootStyle, 'width', '100%');
  rootStyle = upsertStyle(rootStyle, 'height', '100%');
  rootStyle = upsertStyle(rootStyle, 'color', 'currentColor');
  rootStyle = upsertStyle(rootStyle, 'overflow', 'visible');
  svg.setAttribute('style', rootStyle);

  const drawables = Array.from(svg.querySelectorAll(DRAWABLE_SELECTOR));
  const forcedMode = presentation !== 'auto';
  const detectedMode = icon.fillMode ?? (detectFillMode(base) === 'stroke' ? 'stroke' : 'fill');

  // Resolve fill/stroke by walking up ancestor <g> elements so paths inside
  // <g fill="none" stroke="currentColor"> are recognised as outline strokes
  // instead of being force-filled by the auto branch.
  const inheritedAttr = (el: Element, attr: 'fill' | 'stroke'): string | null => {
    let cur: Element | null = el;
    while (cur) {
      const v = cur.getAttribute(attr);
      if (v) return v;
      if (cur === svg) break;
      cur = cur.parentElement;
    }
    return null;
  };

  drawables.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const isLine = LINE_DRAWABLES.has(tag);
    const style = el.getAttribute('style');
    const ownFill = el.getAttribute('fill');
    const ownStroke = el.getAttribute('stroke');
    const fill = inheritedAttr(el, 'fill');
    const stroke = inheritedAttr(el, 'stroke');
    const hasFillPaint = Boolean(fill && fill !== 'none' && !fill.startsWith('url('));
    const hasStrokePaint = Boolean(stroke && stroke !== 'none' && !stroke.startsWith('url('));

    if (presentation === 'outlined') {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('stroke-width', String(uniformStroke));
    } else if (presentation === 'filled') {
      el.setAttribute('fill', isLine ? 'none' : 'currentColor');
      el.setAttribute('stroke', isLine ? 'currentColor' : 'none');
      if (isLine) el.setAttribute('stroke-width', String(uniformStroke));
    } else if (presentation === 'duotone') {
      el.setAttribute('fill', isLine ? 'none' : 'currentColor');
      if (!isLine) el.setAttribute('fill-opacity', '0.28');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('stroke-width', String(uniformStroke));
    } else {
      // auto: respect inherited paint. Outlined icons (fill=none + stroke on
      // an ancestor <g>) must stay outlines — never override with a fill.
      if (hasStrokePaint && !hasFillPaint) {
        // clean outline inherited from ancestor; leave element untouched
      } else {
        if (hasFillPaint && ownFill) el.setAttribute('fill', 'currentColor');
        if (hasStrokePaint && ownStroke) el.setAttribute('stroke', 'currentColor');
        if (!fill && !stroke && !hasPaintStyle(style, 'fill') && !hasPaintStyle(style, 'stroke')) {
          if (detectedMode === 'stroke') {
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', 'currentColor');
            el.setAttribute('stroke-width', String(uniformStroke));
          } else {
            el.setAttribute('fill', isLine ? 'none' : 'currentColor');
            if (isLine) {
              el.setAttribute('stroke', 'currentColor');
              el.setAttribute('stroke-width', String(uniformStroke));
            }
          }
        }
      }
    }

    const nextStyle = el.getAttribute('style');
    if (nextStyle) {
      el.setAttribute(
        'style',
        forcedMode
          ? upsertStyle(
              upsertStyle(nextStyle, 'fill', presentation === 'outlined' || isLine ? 'none' : 'currentColor'),
              'stroke',
              presentation === 'filled' && !isLine ? 'none' : 'currentColor',
            )
          : nextStyle
              .replace(/fill\s*:\s*(?!none|url\(|currentColor)([^;}]+)/gi, 'fill: currentColor')
              .replace(/stroke\s*:\s*(?!none|url\(|currentColor)([^;}]+)/gi, 'stroke: currentColor'),
      );
    }
  });

  svg.querySelectorAll('style').forEach((styleEl) => {
    if (!styleEl.textContent) return;
    styleEl.textContent = styleEl.textContent
      .replace(/fill\s*:\s*(?!none|url\(|currentColor)([^;}]+)/gi, 'fill: currentColor')
      .replace(/stroke\s*:\s*(?!none|url\(|currentColor)([^;}]+)/gi, 'stroke: currentColor');
  });

  return sanitizeSvg(new XMLSerializer().serializeToString(svg));
};

export const IconSvgRender = ({
  icon,
  size,
  color = 'currentColor',
  presentation = 'outlined',
  strokeWidth = 2,
  className,
  debug,
}: IconSvgRenderProps) => {
  const safeMarkup = useMemo(
    () => prepareSvgMarkup(icon, size, presentation, strokeWidth),
    [icon, presentation, size, strokeWidth],
  );

  const debugEnabled = useDebugFlag(debug);
  const report = useMemo(
    () => (debugEnabled ? diagnoseIcon(icon, safeMarkup) : null),
    [debugEnabled, icon, safeMarkup],
  );

  const tile = !safeMarkup ? (
    <span
      className={className}
      style={{ width: size, height: size, color }}
      aria-label={`${icon.name || 'Icon'} unavailable`}
      role="img"
    >
      ?
    </span>
  ) : (
    <span
      className={className}
      style={{ width: size, height: size, color, display: 'inline-flex', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: safeMarkup }}
    />
  );

  if (!debugEnabled || !report) return tile;

  const tone = report.ok
    ? 'rgba(34,197,94,0.9)'
    : 'rgba(239,68,68,0.95)';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        outline: `1px dashed ${tone}`,
        outlineOffset: 1,
      }}
      title={
        report.ok
          ? `OK · ${report.drawableCount} drawables · mode=${report.detectedMode}`
          : `BLANK: ${report.reasons.join('; ')}\nname=${icon.name}\nid=${icon.id}\nrawLen=${report.rawLength} · drawables=${report.drawableCount} · viewBox=${report.hasViewBox} · mode=${report.detectedMode}`
      }
    >
      {tile}
      {!report.ok && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: tone,
            color: 'white',
            fontSize: 9,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontWeight: 700,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          !{report.reasons.length}
        </span>
      )}
    </span>
  );
};
