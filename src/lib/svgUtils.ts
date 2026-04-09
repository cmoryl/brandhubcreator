/**
 * svgUtils.ts — Production-grade SVG manipulation utilities
 * 
 * Uses DOMParser for accurate, spec-compliant SVG processing.
 * Replaces fragile regex-based approaches across the codebase.
 */

import DOMPurify from 'dompurify';

// ── Sanitization ──

/** Sanitize SVG markup for safe rendering */
export const sanitizeSvg = (raw: string): string =>
  DOMPurify.sanitize(raw.trim(), {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
  });

// ── ViewBox Extraction ──

/** Extract viewBox from SVG markup. Falls back to width/height, then default. */
export const extractViewBox = (svg: string, fallback = '0 0 24 24'): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return fallback;

  const viewBox = svgEl.getAttribute('viewBox');
  if (viewBox && viewBox.trim()) return viewBox.trim();

  // Derive from width/height
  const w = parseFloat(svgEl.getAttribute('width') || '');
  const h = parseFloat(svgEl.getAttribute('height') || '');
  if (w > 0 && h > 0) return `0 0 ${w} ${h}`;

  return fallback;
};

// ── fillMode Detection ──

/** Auto-detect whether SVG is stroke-based or fill-based */
export const detectFillMode = (svg: string): 'fill' | 'stroke' | 'auto' => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return 'auto';

  const elements = svgEl.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse');
  let strokeCount = 0;
  let fillCount = 0;

  elements.forEach(el => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (stroke && stroke !== 'none') strokeCount++;
    if (fill && fill !== 'none') fillCount++;
    // If fill is absent (defaults to black in SVG spec), count as fill
    if (!fill && !stroke) fillCount++;
  });

  // Check root SVG attributes too
  const rootFill = svgEl.getAttribute('fill');
  const rootStroke = svgEl.getAttribute('stroke');
  if (rootFill === 'none' && rootStroke && rootStroke !== 'none') return 'stroke';
  if (rootStroke === 'none' && rootFill && rootFill !== 'none') return 'fill';

  if (strokeCount > 0 && fillCount === 0) return 'stroke';
  if (fillCount > 0 && strokeCount === 0) return 'fill';
  return 'auto';
};

// ── SVG Cleanup ──

/** Clean SVG markup: strip editor metadata, empty groups, XML declarations, unused defs, hardcoded dimensions */
export const cleanSvg = (svg: string, iconName?: string): string => {
  // Strip XML declaration and comments
  let cleaned = svg
    .replace(/<\?xml[^?]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return cleaned;

  // Ensure xmlns
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // Remove hardcoded width/height (preserve viewBox for scaling)
  if (svgEl.getAttribute('viewBox')) {
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
  }

  // Strip editor metadata attributes
  const metadataAttrs = ['data-name', 'data-old-hPosition', 'data-old-vPosition', 'xml:space', 'enable-background'];
  metadataAttrs.forEach(attr => {
    svgEl.querySelectorAll(`[${attr}]`).forEach(el => el.removeAttribute(attr));
    svgEl.removeAttribute(attr);
  });

  // Remove Illustrator/Sketch metadata elements
  svgEl.querySelectorAll('metadata, sodipodi\\:namedview, inkscape\\:grid').forEach(el => el.remove());

  // Remove empty <g> groups (no children after cleanup)
  const removeEmptyGroups = (parent: Element) => {
    parent.querySelectorAll('g').forEach(g => {
      removeEmptyGroups(g);
      if (g.children.length === 0 && !g.textContent?.trim()) {
        g.remove();
      }
    });
  };
  removeEmptyGroups(svgEl);

  // Remove unused <defs> (empty after cleanup)
  svgEl.querySelectorAll('defs').forEach(defs => {
    if (defs.children.length === 0) defs.remove();
  });

  // Add accessibility: role="img" and <title>
  svgEl.setAttribute('role', 'img');
  if (iconName) {
    svgEl.setAttribute('aria-label', iconName);
    // Add or update <title>
    const existingTitle = svgEl.querySelector('title');
    if (existingTitle) {
      existingTitle.textContent = iconName;
    } else {
      const newTitle = doc.createElementNS('http://www.w3.org/2000/svg', 'title');
      newTitle.textContent = iconName;
      svgEl.insertBefore(newTitle, svgEl.firstChild);
    }
  }

  return new XMLSerializer().serializeToString(svgEl);
};

// ── DOM-based Recoloring ──

/** Recolor SVG using DOM manipulation — handles attributes, inline styles, and preserves gradients/currentColor */
export const recolorSvg = (svg: string, color: string): string => {
  if (!color || !svg) return svg;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return svg;

  const recolorElement = (el: Element) => {
    // Handle fill attribute
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none' && !fill.startsWith('url(') && fill !== 'currentColor') {
      el.setAttribute('fill', color);
    }

    // Handle stroke attribute
    const stroke = el.getAttribute('stroke');
    if (stroke && stroke !== 'none' && !stroke.startsWith('url(') && stroke !== 'currentColor') {
      el.setAttribute('stroke', color);
    }

    // Handle inline style
    const style = el.getAttribute('style');
    if (style) {
      let newStyle = style;
      // Replace fill in style (not none, not url())
      newStyle = newStyle.replace(
        /fill\s*:\s*(?!none|url\()([^;}"]+)/gi,
        `fill: ${color}`
      );
      newStyle = newStyle.replace(
        /stroke\s*:\s*(?!none|url\()([^;}"]+)/gi,
        `stroke: ${color}`
      );
      el.setAttribute('style', newStyle);
    }
  };

  // Recolor root SVG element
  recolorElement(svgEl);

  // Recolor all child elements with fill/stroke
  svgEl.querySelectorAll('*').forEach(recolorElement);

  // Handle <style> blocks with CSS rules
  svgEl.querySelectorAll('style').forEach(styleEl => {
    if (styleEl.textContent) {
      let css = styleEl.textContent;
      css = css.replace(
        /fill\s*:\s*(?!none|url\()([^;}"]+)/gi,
        `fill: ${color}`
      );
      css = css.replace(
        /stroke\s*:\s*(?!none|url\()([^;}"]+)/gi,
        `stroke: ${color}`
      );
      styleEl.textContent = css;
    }
  });

  return new XMLSerializer().serializeToString(svgEl);
};

// ── Ensure Attributes ──

/** Ensure SVG has required attributes for external use (xmlns, viewBox) */
export const ensureAttributes = (svg: string, viewBox?: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return svg;

  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!svgEl.getAttribute('viewBox') && viewBox) {
    svgEl.setAttribute('viewBox', viewBox);
  }

  return new XMLSerializer().serializeToString(svgEl);
};
