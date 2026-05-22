/**
 * styleSvgExporter — bakes a style system recipe (variant + radius + stroke +
 * accent + accent2) into a self-contained SVG string so exports actually carry
 * the look & feel users see in the Style System cards (duotone, neon, sticker,
 * glass, etc.) instead of emitting raw line icons.
 *
 * Inputs:
 *   - svgPath: the raw path data (BrandIconography.svgPath) or a full <path>
 *   - viewBox: optional viewBox override (default 24x24, lucide standard)
 *   - style:   BaseStyle.preview (variant + radius + strokeWidth + accent2)
 *   - accent:  resolved hex/hsl string for the primary brand color
 *   - accent2: optional resolved hex/hsl string for the secondary color
 *   - size:    pixel size of the final SVG square
 */

import type { BaseStyle } from './studioData';

export interface StyledSvgOptions {
  svgPath: string;
  viewBox?: string;
  style: BaseStyle;
  accent: string;
  accent2?: string;
  size?: number;
  /** Add an XML declaration for standalone file downloads. */
  standalone?: boolean;
}

/** Resolve an `hsl(var(--token))` to a concrete color by reading the DOM. */
export const resolveCssColor = (input: string): string => {
  if (typeof document === 'undefined') return input;
  if (!input.includes('var(')) return input;
  const probe = document.createElement('span');
  probe.style.color = input;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return resolved || input;
};

/**
 * Generate a self-contained styled SVG string for a single icon.
 * The wrapper (rect / gradient / filters) matches `IconSetPreview` variants 1:1.
 */
export const buildStyledSvg = ({
  svgPath,
  viewBox = '0 0 24 24',
  style,
  accent,
  accent2,
  size = 64,
  standalone = false,
}: StyledSvgOptions): string => {
  const v = style.preview.variant;
  const radius = style.preview.radius ?? 10;
  const stroke = style.preview.strokeWidth ?? 1.75;
  const a = resolveCssColor(accent);
  const a2 = resolveCssColor(accent2 ?? mix(a, '#ffffff', 0.4));

  // Inner icon canvas is inset 18% for visual breathing room.
  const pad = size * 0.18;
  const inner = size - pad * 2;
  const scale = inner / 24;
  const cornerR = Math.min(radius, size / 2);

  // Compose per-variant background + filters.
  let rectAttrs = '';
  let defs = '';
  let iconColor = a;
  let extraIcon = '';
  let iconStroke = stroke;
  let outerExtras = '';

  const idBase = `s${Math.random().toString(36).slice(2, 8)}`;

  switch (v) {
    case 'tile':
      rectAttrs = `fill="${mix(a, 'transparent', 0.1)}" stroke="${mix(a, 'transparent', 0.22)}" stroke-width="1"`;
      break;
    case 'glass':
      defs = `<linearGradient id="${idBase}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}" stop-opacity="0.22"/><stop offset="100%" stop-color="${a}" stop-opacity="0.04"/></linearGradient>`;
      rectAttrs = `fill="url(#${idBase}-g)" stroke="${mix(a, 'transparent', 0.32)}" stroke-width="1"`;
      break;
    case 'outline':
      rectAttrs = `fill="none" stroke="${mix(a, 'transparent', 0.5)}" stroke-width="1.5"`;
      break;
    case 'neon':
      defs = `<filter id="${idBase}-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${size * 0.04}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      rectAttrs = `fill="#0d1320" stroke="${a}" stroke-width="1"`;
      extraIcon = `filter="url(#${idBase}-glow)"`;
      iconColor = a;
      break;
    case 'duotone':
      defs = `<linearGradient id="${idBase}-dt" x1="0" y1="0" x2="1" y2="1"><stop offset="50%" stop-color="${a}" stop-opacity="0.26"/><stop offset="50%" stop-color="${a2}" stop-opacity="0.22"/></linearGradient>`;
      rectAttrs = `fill="url(#${idBase}-dt)" stroke="${mix(a, 'transparent', 0.28)}" stroke-width="1"`;
      break;
    case 'soft':
      rectAttrs = `fill="${mix(a, 'transparent', 0.14)}"`;
      break;
    case 'sharp':
      rectAttrs = `fill="${mix(a, 'transparent', 0.18)}"`;
      break;
    case 'badge':
      defs = `<radialGradient id="${idBase}-bd" cx="0.3" cy="0.3"><stop offset="0%" stop-color="${a}" stop-opacity="0.4"/><stop offset="100%" stop-color="${a}" stop-opacity="0.12"/></radialGradient>`;
      rectAttrs = `fill="url(#${idBase}-bd)" stroke="${a}" stroke-width="1.5"`;
      break;
    case 'gradient':
      defs = `<linearGradient id="${idBase}-gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${a2}"/></linearGradient>`;
      rectAttrs = `fill="url(#${idBase}-gr)"`;
      iconColor = '#ffffff';
      break;
    case 'sticker':
      rectAttrs = `fill="#ffffff" stroke="${a}" stroke-width="2"`;
      outerExtras = `<rect x="${size * 0.04}" y="${size * 0.04}" width="${size - 4}" height="${size - 4}" rx="${cornerR}" ry="${cornerR}" fill="${a}" opacity="0.55"/>`;
      break;
    case 'neumorphic':
      defs = `<filter id="${idBase}-nm"><feGaussianBlur in="SourceGraphic" stdDeviation="0"/></filter>`;
      rectAttrs = `fill="#1c2030"`;
      outerExtras = `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${cornerR}" ry="${cornerR}" fill="none" stroke="#2a2f44" stroke-width="1"/>`;
      iconColor = mix(a, '#ffffff', 0.2);
      break;
    case 'flat':
      rectAttrs = `fill="${a}"`;
      iconColor = '#ffffff';
      break;
    case 'chip':
      rectAttrs = `fill="${mix(a, 'transparent', 0.12)}" stroke="${mix(a, 'transparent', 0.3)}" stroke-width="1"`;
      break;
    case 'ring':
      rectAttrs = `fill="none" stroke="${mix(a, 'transparent', 0.5)}" stroke-width="1.5"`;
      outerExtras = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${mix(a, 'transparent', 0.25)}" stroke-width="3"/>`;
      break;
    case 'dotted':
      rectAttrs = `fill="none" stroke="${mix(a, 'transparent', 0.55)}" stroke-width="1.5" stroke-dasharray="3 2"`;
      break;
    case 'shadow':
      defs = `<filter id="${idBase}-sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${size * 0.06}" in="SourceAlpha"/><feOffset dy="${size * 0.06}" result="o"/><feFlood flood-color="${a}" flood-opacity="0.5"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      rectAttrs = `fill="${mix(a, 'transparent', 0.12)}" filter="url(#${idBase}-sh)"`;
      break;
    case 'mono':
      rectAttrs = `fill="#33384a"`;
      iconColor = '#c5cad9';
      break;
    case 'hatched':
      defs = `<pattern id="${idBase}-ht" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="${mix(a, 'transparent', 0.22)}"/></pattern>`;
      rectAttrs = `fill="url(#${idBase}-ht)" stroke="${mix(a, 'transparent', 0.35)}" stroke-width="1"`;
      break;
    case 'sketch':
      rectAttrs = `fill="none" stroke="${a}" stroke-width="1.5" stroke-dasharray="4 3"`;
      extraIcon = `transform="rotate(2 ${size / 2} ${size / 2})"`;
      break;
    case 'pixel':
      rectAttrs = `fill="${mix(a, 'transparent', 0.18)}" stroke="${a}" stroke-width="2"`;
      iconStroke = 2.25;
      break;
    case 'embossed':
      defs = `<linearGradient id="${idBase}-em" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${a}" stop-opacity="0.18"/><stop offset="100%" stop-color="${a}" stop-opacity="0.04"/></linearGradient>`;
      rectAttrs = `fill="url(#${idBase}-em)"`;
      outerExtras = `<rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="${cornerR}" ry="${cornerR}" fill="none" stroke="#ffffff" stroke-opacity="0.4"/>`;
      break;
    case 'inverse':
      rectAttrs = `fill="${a}" stroke="${mix(a, '#000000', 0.8)}" stroke-width="1"`;
      iconColor = '#ffffff';
      break;
    case 'paper':
      rectAttrs = `fill="#faf6ee"`;
      outerExtras = `<rect x="3" y="3" width="${size}" height="${size}" rx="${cornerR}" ry="${cornerR}" fill="${mix(a, 'transparent', 0.7)}"/>`;
      iconColor = mix(a, '#000000', 0.7);
      break;
    case 'risograph':
      rectAttrs = `fill="${mix(a, 'transparent', 0.22)}"`;
      extraIcon = `filter="url(#${idBase}-ri)"`;
      defs = `<filter id="${idBase}-ri"><feOffset dx="2" dy="2" result="o"/><feFlood flood-color="${a2}"/><feComposite in2="o" operator="in" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      break;
  }

  const iconSvg = `<g transform="translate(${pad} ${pad}) scale(${scale})" ${extraIcon}>
      <g fill="none" stroke="${iconColor}" stroke-width="${iconStroke}" stroke-linecap="round" stroke-linejoin="round">
        ${normalizePath(svgPath)}
      </g>
    </g>`;

  const header = standalone ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
  return `${header}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${defs ? `<defs>${defs}</defs>` : ''}
  ${outerExtras}
  <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerR}" ry="${cornerR}" ${rectAttrs}/>
  ${iconSvg}
</svg>`;
}; // viewBox arg silenced

/** Convert a path string to safe SVG path markup (supports full <path> too). */
const normalizePath = (svgPath: string): string => {
  if (!svgPath) return '';
  const trimmed = svgPath.trim();
  if (trimmed.startsWith('<')) return trimmed; // already markup
  return `<path d="${trimmed.replace(/"/g, '&quot;')}"/>`;
};

/**
 * Lightweight color mixer for `color-mix(in oklab, A X%, B)` parity in static
 * SVG output. Returns an `rgba()` string for any combination of hex/rgb input.
 */
export const mix = (a: string, b: string, ratio: number): string => {
  const A = parseColor(a);
  const B = b === 'transparent' ? { r: A.r, g: A.g, b: A.b, a: 0 } : parseColor(b);
  const t = Math.max(0, Math.min(1, 1 - ratio));
  const r = Math.round(A.r * ratio + B.r * t);
  const g = Math.round(A.g * ratio + B.g * t);
  const bl = Math.round(A.b * ratio + B.b * t);
  const al = +(A.a * ratio + B.a * t).toFixed(3);
  return `rgba(${r}, ${g}, ${bl}, ${al})`;
};

const parseColor = (c: string): { r: number; g: number; b: number; a: number } => {
  const x = c.trim();
  // rgba(...) / rgb(...)
  const rgbMatch = x.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 };
  }
  // #hex
  if (x.startsWith('#')) {
    const h = x.slice(1);
    const full = h.length === 3 ? h.split('').map((c2) => c2 + c2).join('') : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
};

/** Convert an SVG string to a PNG data URL at a target pixel size. */
export const svgToPng = (svg: string, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Canvas 2D not available'));
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

/** Slugify icon names for safe file paths. */
export const slugify = (s: string): string =>
  (s || 'icon')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
