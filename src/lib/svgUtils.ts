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

// ── Multi-Color Extraction & Mapping ──

/** Extract all unique colors used in an SVG (fills and strokes, excluding none/currentColor/url) */
export const extractSvgColors = (svg: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return [];

  const colors = new Set<string>();

  const extractFromElement = (el: Element) => {
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none' && !fill.startsWith('url(') && fill !== 'currentColor') {
      colors.add(fill.toLowerCase());
    }
    const stroke = el.getAttribute('stroke');
    if (stroke && stroke !== 'none' && !stroke.startsWith('url(') && stroke !== 'currentColor') {
      colors.add(stroke.toLowerCase());
    }
    // Check inline styles
    const style = el.getAttribute('style');
    if (style) {
      const fillMatch = style.match(/fill\s*:\s*(?!none|url\()([^;}"]+)/i);
      if (fillMatch) colors.add(fillMatch[1].trim().toLowerCase());
      const strokeMatch = style.match(/stroke\s*:\s*(?!none|url\()([^;}"]+)/i);
      if (strokeMatch) colors.add(strokeMatch[1].trim().toLowerCase());
    }
  };

  extractFromElement(svgEl);
  svgEl.querySelectorAll('*').forEach(extractFromElement);

  // Also check <style> blocks
  svgEl.querySelectorAll('style').forEach(styleEl => {
    if (styleEl.textContent) {
      const fillMatches = styleEl.textContent.matchAll(/fill\s*:\s*(?!none|url\()([^;}"]+)/gi);
      for (const m of fillMatches) colors.add(m[1].trim().toLowerCase());
      const strokeMatches = styleEl.textContent.matchAll(/stroke\s*:\s*(?!none|url\()([^;}"]+)/gi);
      for (const m of strokeMatches) colors.add(m[1].trim().toLowerCase());
    }
  });

  return Array.from(colors);
};

/** Recolor SVG with a color map: { oldColor → newColor } for multi-color replacement */
export const recolorSvgMulti = (svg: string, colorMap: Record<string, string>): string => {
  if (!svg || Object.keys(colorMap).length === 0) return svg;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return svg;

  const normalizeColor = (c: string) => c.toLowerCase().trim();
  const map = new Map(Object.entries(colorMap).map(([k, v]) => [normalizeColor(k), v]));

  const remapElement = (el: Element) => {
    const fill = el.getAttribute('fill');
    if (fill && !fill.startsWith('url(') && fill !== 'none' && fill !== 'currentColor') {
      const mapped = map.get(normalizeColor(fill));
      if (mapped) el.setAttribute('fill', mapped);
    }
    const stroke = el.getAttribute('stroke');
    if (stroke && !stroke.startsWith('url(') && stroke !== 'none' && stroke !== 'currentColor') {
      const mapped = map.get(normalizeColor(stroke));
      if (mapped) el.setAttribute('stroke', mapped);
    }
    const style = el.getAttribute('style');
    if (style) {
      let newStyle = style;
      for (const [from, to] of map.entries()) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newStyle = newStyle.replace(new RegExp(escaped, 'gi'), to);
      }
      el.setAttribute('style', newStyle);
    }
  };

  remapElement(svgEl);
  svgEl.querySelectorAll('*').forEach(remapElement);

  // Handle <style> blocks
  svgEl.querySelectorAll('style').forEach(styleEl => {
    if (styleEl.textContent) {
      let css = styleEl.textContent;
      for (const [from, to] of map.entries()) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        css = css.replace(new RegExp(escaped, 'gi'), to);
      }
      styleEl.textContent = css;
    }
  });

  return new XMLSerializer().serializeToString(svgEl);
};

// ── SVG Validation & Quality Scoring ──

export interface SvgValidationResult {
  anchorPoints: number;
  fileSize: number; // bytes
  hasViewBox: boolean;
  hasXmlns: boolean;
  hasAccessibility: boolean; // role="img" or aria-label or <title>
  fillMode: 'fill' | 'stroke' | 'auto';
  viewBox: string;
  colorCount: number;
  elementCount: number;
  score: number; // 0-100
  issues: SvgIssue[];
}

export interface SvgIssue {
  severity: 'pass' | 'warn' | 'fail';
  label: string;
  detail: string;
}

/** Validate and score an SVG for production quality */
export const validateSvg = (svg: string): SvgValidationResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  const fileSize = new Blob([svg]).size;
  const issues: SvgIssue[] = [];
  let score = 100;

  if (!svgEl) {
    return {
      anchorPoints: 0, fileSize, hasViewBox: false, hasXmlns: false,
      hasAccessibility: false, fillMode: 'auto', viewBox: '', colorCount: 0,
      elementCount: 0, score: 0,
      issues: [{ severity: 'fail', label: 'Invalid SVG', detail: 'No <svg> element found' }],
    };
  }

  // Count anchor points (path commands)
  let anchorPoints = 0;
  svgEl.querySelectorAll('path').forEach(path => {
    const d = path.getAttribute('d') || '';
    // Count command letters (M, L, C, Q, A, S, T, H, V, Z)
    anchorPoints += (d.match(/[MLCQASTHVZ]/gi) || []).length;
  });

  const hasViewBox = !!svgEl.getAttribute('viewBox');
  const hasXmlns = !!svgEl.getAttribute('xmlns');
  const hasTitle = !!svgEl.querySelector('title');
  const hasAriaLabel = !!svgEl.getAttribute('aria-label');
  const hasRole = svgEl.getAttribute('role') === 'img';
  const hasAccessibility = hasTitle || hasAriaLabel || hasRole;

  const elements = svgEl.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse, text, use');
  const elementCount = elements.length;

  const fillMode = detectFillMode(svg);
  const viewBox = extractViewBox(svg);
  const colors = extractSvgColors(svg);

  // Scoring
  if (!hasViewBox) { score -= 15; issues.push({ severity: 'fail', label: 'Missing viewBox', detail: 'SVG needs a viewBox for proper scaling' }); }
  else { issues.push({ severity: 'pass', label: 'viewBox present', detail: viewBox }); }

  if (!hasXmlns) { score -= 10; issues.push({ severity: 'warn', label: 'Missing xmlns', detail: 'Required for standalone SVG use' }); }
  else { issues.push({ severity: 'pass', label: 'xmlns present', detail: '' }); }

  if (!hasAccessibility) { score -= 10; issues.push({ severity: 'warn', label: 'No accessibility', detail: 'Add role="img" and <title> for screen readers' }); }
  else { issues.push({ severity: 'pass', label: 'Accessible', detail: hasTitle ? 'Has <title>' : 'Has aria-label' }); }

  if (anchorPoints > 200) { score -= 20; issues.push({ severity: 'fail', label: 'Too complex', detail: `${anchorPoints} anchor points (target: <50)` }); }
  else if (anchorPoints > 100) { score -= 10; issues.push({ severity: 'warn', label: 'High complexity', detail: `${anchorPoints} anchor points (target: <50)` }); }
  else if (anchorPoints > 50) { score -= 5; issues.push({ severity: 'warn', label: 'Moderate complexity', detail: `${anchorPoints} anchor points` }); }
  else { issues.push({ severity: 'pass', label: 'Clean paths', detail: `${anchorPoints} anchor points` }); }

  if (fileSize > 10240) { score -= 15; issues.push({ severity: 'fail', label: 'Large file', detail: `${(fileSize / 1024).toFixed(1)}KB (target: <2KB)` }); }
  else if (fileSize > 4096) { score -= 5; issues.push({ severity: 'warn', label: 'File size', detail: `${(fileSize / 1024).toFixed(1)}KB` }); }
  else { issues.push({ severity: 'pass', label: 'Compact', detail: `${(fileSize / 1024).toFixed(1)}KB` }); }

  if (elementCount === 0) { score -= 10; issues.push({ severity: 'fail', label: 'Empty SVG', detail: 'No drawable elements found' }); }

  return {
    anchorPoints, fileSize, hasViewBox, hasXmlns, hasAccessibility,
    fillMode, viewBox, colorCount: colors.length, elementCount,
    score: Math.max(0, score), issues,
  };
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

// ── Build full SVG string from icon data ──

/** Generate a complete SVG string from a BrandIconography object */
export const buildSvgString = (icon: { svgPath: string; viewBox?: string; fillMode?: string; name?: string }): string => {
  const viewBox = icon.viewBox || '0 0 24 24';
  const isFullSvg = icon.svgPath.trim().startsWith('<');
  const isComplete = isFullSvg && icon.svgPath.trim().startsWith('<svg');

  if (isComplete) {
    return sanitizeSvg(icon.svgPath);
  }

  if (isFullSvg) {
    const inner = sanitizeSvg(icon.svgPath);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${inner}</svg>`;
  }

  const fill = icon.fillMode === 'fill' ? 'currentColor' : 'none';
  const stroke = icon.fillMode === 'stroke' ? 'currentColor' : 'none';
  const strokeWidth = icon.fillMode === 'stroke' ? ' stroke-width="2"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${fill}" stroke="${stroke}"${strokeWidth}><path d="${icon.svgPath}"/></svg>`;
};
