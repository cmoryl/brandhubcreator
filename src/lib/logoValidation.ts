import type { ClientLogoFile, ClientLogoFormat, ClientLogoVariant } from '@/types/brand';

export type LogoFileIssue =
  | 'missing-url'
  | 'format-mismatch'      // file says .png but content is svg (or vice versa)
  | 'unparseable-svg'
  | 'load-failed'
  | 'too-small'            // png natural size below MIN_PX
  | 'not-transparent'      // png with opaque corner pixels
  | 'fill-not-applied'     // svg variant didn't end up white/black
  | 'forced-stroke-outline' // svg forces stroke paint onto filled artwork
  | 'svg-text-nodes';      // svg depends on live text/font rendering

export interface LogoFileValidation {
  variant: ClientLogoVariant;
  format: ClientLogoFormat;
  url: string;
  ok: boolean;
  issues: LogoFileIssue[];
  width?: number;
  height?: number;
}

export interface LogoValidationResult {
  ok: boolean;
  files: LogoFileValidation[];
  /** Aggregated issues across all files. */
  issues: LogoFileIssue[];
}

const MIN_PNG_PX = 128;

const decodeDataUrl = (url: string): string | null => {
  const match = url.match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) return null;
  const [, , isB64, payload] = match;
  try {
    if (isB64) return decodeURIComponent(escape(atob(payload)));
    return decodeURIComponent(payload);
  } catch {
    return null;
  }
};

const sniffMimeFromUrl = async (url: string): Promise<string | null> => {
  if (url.startsWith('data:')) {
    const m = url.match(/^data:([^;,]+)/);
    return m ? m[1].toLowerCase() : null;
  }
  // Read first bytes via fetch (Range) to detect actual type; tolerate CORS failures.
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-127' } });
    if (!res.ok && res.status !== 206) return null;
    const ct = res.headers.get('content-type');
    if (ct) return ct.split(';')[0].trim().toLowerCase();
    const buf = new Uint8Array(await res.arrayBuffer());
    // PNG magic bytes
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    const head = new TextDecoder().decode(buf).trimStart().toLowerCase();
    if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'image/svg+xml';
    return null;
  } catch {
    return null;
  }
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = url;
  });

const hasTransparency = (img: HTMLImageElement): boolean | null => {
  try {
    const w = Math.min(img.naturalWidth, 64);
    const h = Math.min(img.naturalHeight, 64);
    if (!w || !h) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    // Sample every 16th pixel; any alpha < 255 ⇒ transparent.
    for (let i = 3; i < data.length; i += 64) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    // tainted canvas (CORS) or other – inconclusive
    return null;
  }
};

const validateSvgString = (
  svg: string,
  variant: ClientLogoVariant,
): LogoFileIssue[] => {
  const issues: LogoFileIssue[] = [];
  const trimmed = svg.trim().toLowerCase();
  if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) {
    issues.push('unparseable-svg');
    return issues;
  }
  const rootTag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const rootHasFillAndStroke = /\bfill\s*=\s*(["'])(?!none|transparent)[^"']+\1/i.test(rootTag)
    && /\bstroke\s*=\s*(["'])(?!none|transparent)[^"']+\1/i.test(rootTag);
  const globalStrokeStyle = /<style\b[^>]*>[\s\S]*?\*\s*\{[^}]*\bstroke\s*:\s*(?!none|transparent)[^;}]+[\s\S]*?<\/style>/i.test(svg);
  if (rootHasFillAndStroke || globalStrokeStyle) {
    issues.push('forced-stroke-outline');
  }
  if (/<text\b/i.test(svg)) {
    issues.push('svg-text-nodes');
  }
  if (variant === 'white' && !/fill="?#fff(fff)?"?/i.test(svg)) {
    issues.push('fill-not-applied');
  }
  if (variant === 'black' && !/fill="?#000(000)?"?/i.test(svg)) {
    issues.push('fill-not-applied');
  }
  if (variant === 'color') {
    // Brand-color SVG must carry a fill, and it must NOT be pure white/black.
    const fillMatch = svg.match(/fill="(#[0-9a-fA-F]{3,8})"/);
    const fill = fillMatch?.[1]?.toLowerCase();
    const isMonochrome = fill === '#fff' || fill === '#ffffff' || fill === '#000' || fill === '#000000';
    if (!fill || isMonochrome) {
      issues.push('fill-not-applied');
    }
  }
  return issues;
};

export async function validateLogoFile(file: ClientLogoFile): Promise<LogoFileValidation> {
  const result: LogoFileValidation = {
    variant: file.variant,
    format: file.format,
    url: file.url,
    ok: true,
    issues: [],
  };
  if (!file.url) {
    result.ok = false;
    result.issues.push('missing-url');
    return result;
  }

  const mime = await sniffMimeFromUrl(file.url);

  if (file.format === 'svg') {
    let svgText: string | null = null;
    if (file.url.startsWith('data:')) {
      svgText = decodeDataUrl(file.url);
    } else if (mime?.includes('svg')) {
      try {
        svgText = await (await fetch(file.url)).text();
      } catch {
        svgText = null;
      }
    } else if (mime && !mime.includes('svg')) {
      result.issues.push('format-mismatch');
    }
    if (svgText) {
      result.issues.push(...validateSvgString(svgText, file.variant));
    } else if (!result.issues.includes('format-mismatch')) {
      result.issues.push('unparseable-svg');
    }
  } else if (file.format === 'png') {
    // Note: cdn.simpleicons.org returns SVG by default — that's a real mismatch
    // we want to surface for the "png" entries the seeder writes.
    if (mime && !mime.includes('png')) {
      result.issues.push('format-mismatch');
    }
    try {
      const img = await loadImage(file.url);
      result.width = img.naturalWidth;
      result.height = img.naturalHeight;
      if (img.naturalWidth < MIN_PNG_PX || img.naturalHeight < MIN_PNG_PX) {
        result.issues.push('too-small');
      }
      const transparent = hasTransparency(img);
      if (transparent === false) result.issues.push('not-transparent');
    } catch {
      result.issues.push('load-failed');
    }
  }

  result.ok = result.issues.length === 0;
  return result;
}

export async function validateLogoFiles(
  files: ClientLogoFile[],
): Promise<LogoValidationResult> {
  if (!files?.length) {
    return { ok: false, files: [], issues: ['missing-url'] };
  }
  const fileResults = await Promise.all(files.map(validateLogoFile));
  const aggregated = Array.from(new Set(fileResults.flatMap((r) => r.issues)));
  return {
    ok: fileResults.every((r) => r.ok),
    files: fileResults,
    issues: aggregated,
  };
}

export const ISSUE_LABELS: Record<LogoFileIssue, string> = {
  'missing-url': 'No file URL',
  'format-mismatch': 'File type does not match label (e.g. PNG entry serves SVG)',
  'unparseable-svg': 'SVG could not be parsed',
  'load-failed': 'Image failed to load',
  'too-small': `PNG below ${MIN_PNG_PX}px on its shortest edge`,
  'not-transparent': 'PNG has an opaque background',
  'fill-not-applied': 'SVG fill colour does not match its variant',
  'forced-stroke-outline': 'SVG forces strokes onto filled artwork, causing thick outlines',
  'svg-text-nodes': 'SVG contains live text; convert text to paths for consistent logo rendering',
};
