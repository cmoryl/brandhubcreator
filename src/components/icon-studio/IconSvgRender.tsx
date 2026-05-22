import { useMemo } from 'react';
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

  drawables.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const isLine = LINE_DRAWABLES.has(tag);
    const style = el.getAttribute('style');
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    const hasFillPaint = Boolean(fill && fill !== 'none' && !fill.startsWith('url('));
    const hasStrokePaint = Boolean(stroke && stroke !== 'none' && !stroke.startsWith('url('));

    if (presentation === 'outlined') {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('stroke-width', String(strokeWidth));
    } else if (presentation === 'filled') {
      el.setAttribute('fill', isLine ? 'none' : 'currentColor');
      el.setAttribute('stroke', isLine ? 'currentColor' : 'none');
      if (isLine) el.setAttribute('stroke-width', String(strokeWidth));
    } else if (presentation === 'duotone') {
      el.setAttribute('fill', isLine ? 'none' : 'currentColor');
      if (!isLine) el.setAttribute('fill-opacity', '0.28');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('stroke-width', String(strokeWidth));
    } else {
      if (hasFillPaint) el.setAttribute('fill', 'currentColor');
      if (hasStrokePaint) el.setAttribute('stroke', 'currentColor');
      if (!fill && !stroke && !hasPaintStyle(style, 'fill') && !hasPaintStyle(style, 'stroke')) {
        if (detectedMode === 'stroke') {
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke', 'currentColor');
          el.setAttribute('stroke-width', String(strokeWidth));
        } else {
          el.setAttribute('fill', isLine ? 'none' : 'currentColor');
          if (isLine) {
            el.setAttribute('stroke', 'currentColor');
            el.setAttribute('stroke-width', String(strokeWidth));
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
  presentation = 'auto',
  strokeWidth = 1.75,
  className,
}: IconSvgRenderProps) => {
  const safeMarkup = useMemo(
    () => prepareSvgMarkup(icon, size, presentation, strokeWidth),
    [icon, presentation, size, strokeWidth],
  );

  if (!safeMarkup) {
    return (
      <span
        className={className}
        style={{ width: size, height: size, color }}
        aria-label={`${icon.name || 'Icon'} unavailable`}
        role="img"
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ width: size, height: size, color, display: 'inline-flex', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: safeMarkup }}
    />
  );
};
