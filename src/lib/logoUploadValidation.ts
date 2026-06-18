/**
 * Strict validation for user-uploaded logo files (SVG + PNG).
 * - Verifies MIME / extension consistency
 * - Enforces per-format size limits
 * - Validates PNG magic bytes
 * - Parses SVG as XML and strips/rejects unsafe constructs
 *   (scripts, event handlers, javascript:/data: URIs, external refs, foreignObject, etc.)
 *
 * On success returns { ok: true, format, blob } where `blob` is the file to upload
 * (for SVGs this is the sanitized re-serialized version, not the raw upload).
 */

export type LogoFormat = 'svg' | 'png';

export interface LogoValidationOk {
  ok: true;
  format: LogoFormat;
  blob: Blob;
  filename: string;
  contentType: string;
  warnings: string[];
}

export interface LogoValidationErr {
  ok: false;
  error: string;
}

export type LogoValidationResult = LogoValidationOk | LogoValidationErr;

const MAX_SVG_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_PNG_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SVG_DECLARED_DIM = 8192; // refuse absurd width/height

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// SVG attributes/tags that can execute scripts or pull remote resources.
const FORBIDDEN_SVG_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'audio',
  'video',
  'animate', // SMIL animations can carry handlers
  'animatetransform',
  'set',
  'handler',
]);

const URL_BEARING_ATTRS = new Set([
  'href',
  'xlink:href',
  'src',
  'data',
  'action',
  'formaction',
  'background',
  'poster',
  'cursor',
  'filter',
  'mask',
  'clip-path',
  'fill',
  'stroke',
]);

function detectFormat(file: File): { format: LogoFormat | null; reason?: string } {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();

  if (ext === 'svg' || mime === 'image/svg+xml') {
    if (ext && ext !== 'svg') {
      return { format: null, reason: `Extension .${ext} does not match SVG MIME type` };
    }
    if (mime && mime !== 'image/svg+xml' && mime !== 'text/xml' && mime !== 'application/xml' && mime !== '') {
      return { format: null, reason: `MIME type "${mime}" does not match an SVG file` };
    }
    return { format: 'svg' };
  }

  if (ext === 'png' || mime === 'image/png') {
    if (ext && ext !== 'png') {
      return { format: null, reason: `Extension .${ext} does not match PNG MIME type` };
    }
    if (mime && mime !== 'image/png' && mime !== '') {
      return { format: null, reason: `MIME type "${mime}" does not match a PNG file` };
    }
    return { format: 'png' };
  }

  return { format: null, reason: 'Only SVG or PNG files are supported' };
}

async function validatePng(file: File): Promise<LogoValidationResult> {
  if (file.size === 0) return { ok: false, error: 'PNG file is empty' };
  if (file.size > MAX_PNG_BYTES) {
    return { ok: false, error: `PNG exceeds ${(MAX_PNG_BYTES / 1024 / 1024).toFixed(0)}MB limit` };
  }
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (header[i] !== PNG_MAGIC[i]) {
      return { ok: false, error: 'File is not a valid PNG (header signature mismatch)' };
    }
  }
  return {
    ok: true,
    format: 'png',
    blob: file,
    filename: file.name,
    contentType: 'image/png',
    warnings: [],
  };
}

function isUnsafeUrlValue(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  if (!v) return false;
  if (v.startsWith('javascript:')) return true;
  if (v.startsWith('vbscript:')) return true;
  if (v.startsWith('data:text/html')) return true;
  if (v.startsWith('data:application/')) return true;
  // Allow internal refs (#id), and same-document fragment refs.
  if (v.startsWith('#')) return false;
  // Allow url(#id) wrappers
  if (v.startsWith('url(#') && v.endsWith(')')) return false;
  // Block any external http(s)/ftp references — keeps SVG self-contained.
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('//') || v.startsWith('ftp:')) {
    return true;
  }
  // Block url(http...) wrappers
  if (v.startsWith('url(') && /url\(\s*['"]?(https?:|\/\/|javascript:|data:text|ftp:)/i.test(v)) {
    return true;
  }
  return false;
}

async function validateSvg(file: File): Promise<LogoValidationResult> {
  if (file.size === 0) return { ok: false, error: 'SVG file is empty' };
  if (file.size > MAX_SVG_BYTES) {
    return { ok: false, error: `SVG exceeds ${(MAX_SVG_BYTES / 1024 / 1024).toFixed(0)}MB limit` };
  }

  const text = await file.text();
  if (!/<svg[\s>]/i.test(text)) {
    return { ok: false, error: 'File does not contain an <svg> root element' };
  }

  // Quick byte-level rejects before DOM parsing
  if (/<!doctype\s+[^>]*entity/i.test(text) || /<!entity/i.test(text)) {
    return { ok: false, error: 'SVG contains DTD entity declarations (XXE risk)' };
  }
  if (/<\?xml-stylesheet/i.test(text)) {
    return { ok: false, error: 'SVG contains processing instructions that are not allowed' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { ok: false, error: 'SVG is not well-formed XML' };
  }
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    return { ok: false, error: 'Root element must be <svg>' };
  }

  // Enforce sane declared dimensions when present.
  for (const dim of ['width', 'height'] as const) {
    const v = root.getAttribute(dim);
    if (v) {
      const n = parseFloat(v);
      if (Number.isFinite(n) && n > MAX_SVG_DECLARED_DIM) {
        return { ok: false, error: `SVG ${dim} (${n}) exceeds ${MAX_SVG_DECLARED_DIM}px limit` };
      }
    }
  }

  const warnings: string[] = [];

  // Walk every element and validate / sanitize.
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT);
  const offenders: string[] = [];
  const removedAttrs: string[] = [];
  const toRemove: Element[] = [];

  // include root in iteration
  let node: Element | null = doc.documentElement;
  const elements: Element[] = [];
  while (node) {
    elements.push(node);
    node = walker.nextNode() as Element | null;
  }

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (FORBIDDEN_SVG_TAGS.has(tag)) {
      offenders.push(`<${tag}>`);
      toRemove.push(el);
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      // 1. Strip event handlers
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        removedAttrs.push(`${tag}@${name}`);
        continue;
      }
      // 2. Block javascript:/external URLs on url-bearing attributes
      if (URL_BEARING_ATTRS.has(name) && isUnsafeUrlValue(value)) {
        offenders.push(`${tag}[${name}=${value.slice(0, 40)}…]`);
        el.removeAttribute(attr.name);
        continue;
      }
      // 3. Inline styles with url(...) or expression(...)
      if (name === 'style') {
        if (/expression\s*\(/i.test(value) || /url\(\s*['"]?(javascript:|data:text|https?:|\/\/)/i.test(value)) {
          offenders.push(`${tag}[style]`);
          el.removeAttribute(attr.name);
          continue;
        }
      }
    }
  }

  // Hard-reject if any executable / external content found — don't quietly upload.
  if (offenders.length > 0) {
    return {
      ok: false,
      error: `SVG contains unsafe content: ${offenders.slice(0, 4).join(', ')}${offenders.length > 4 ? '…' : ''}`,
    };
  }

  // Remove benign-but-disallowed nodes after the offender check (in case any slipped through).
  for (const el of toRemove) el.remove();

  if (removedAttrs.length > 0) {
    warnings.push(`Stripped ${removedAttrs.length} inline event handler(s)`);
  }

  const serialized = new XMLSerializer().serializeToString(doc);
  const sanitized = serialized.startsWith('<?xml')
    ? serialized
    : `<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`;

  const blob = new Blob([sanitized], { type: 'image/svg+xml' });
  if (blob.size > MAX_SVG_BYTES) {
    return { ok: false, error: 'Sanitized SVG still exceeds size limit' };
  }

  // Force .svg extension on filename
  const cleanName = file.name.toLowerCase().endsWith('.svg') ? file.name : `${file.name}.svg`;

  return {
    ok: true,
    format: 'svg',
    blob,
    filename: cleanName,
    contentType: 'image/svg+xml',
    warnings,
  };
}

export async function validateLogoUpload(file: File): Promise<LogoValidationResult> {
  if (!file) return { ok: false, error: 'No file provided' };
  const { format, reason } = detectFormat(file);
  if (!format) return { ok: false, error: reason || 'Unsupported file type' };
  if (format === 'png') return validatePng(file);
  return validateSvg(file);
}

export const LOGO_UPLOAD_LIMITS = {
  MAX_SVG_BYTES,
  MAX_PNG_BYTES,
};
