import type { ClientLogoVariant } from '@/types/brand';

export type UploadValidationStatus = 'pass' | 'warn' | 'fail';

export interface UploadValidationResult {
  status: UploadValidationStatus;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  // px size at which the asset would fit inside the standard preview cell
  fittedWidth: number;
  fittedHeight: number;
  willCrop: boolean; // false when object-contain is honored (always false here, but exposed for clarity)
  messages: string[]; // human-readable diagnostics
}

const MIN_WORDMARK_RATIO = 1.5; // width:height ratio below this looks square / icon-y
const IDEAL_WORDMARK_RATIO = 2.5;
const MIN_DIMENSION_PX = 96;
const MAX_DIMENSION_PX = 4096;

// 4:3 preview cell used in the admin Logo Hub
const PREVIEW_CELL_W = 320;
const PREVIEW_CELL_H = 240;

/**
 * Load an image file in the browser and inspect its pixel dimensions + average luminance.
 * Returns null if the file can't be decoded (e.g. EPS).
 */
async function inspectImage(file: File): Promise<{ width: number; height: number; avgLuminance: number | null } | null> {
  // SVG / vector: parse viewBox to get an aspect ratio. Luminance is unknown.
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    const text = await file.text();
    const viewBox = text.match(/viewBox\s*=\s*"([\d.\s-]+)"/i);
    const widthAttr = text.match(/<svg[^>]*\swidth\s*=\s*"([\d.]+)/i);
    const heightAttr = text.match(/<svg[^>]*\sheight\s*=\s*"([\d.]+)/i);
    let width = widthAttr ? parseFloat(widthAttr[1]) : 0;
    let height = heightAttr ? parseFloat(heightAttr[1]) : 0;
    if ((!width || !height) && viewBox) {
      const parts = viewBox[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }
    if (!width || !height) return null;
    return { width, height, avgLuminance: null };
  }

  // EPS / unknown raster: can't decode in browser.
  if (file.type === 'application/postscript' || file.name.toLowerCase().endsWith('.eps')) {
    return null;
  }

  // Raster: decode via Image + canvas to read dims and average pixel brightness.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    const { naturalWidth: width, naturalHeight: height } = img;
    // Downsample to a 32px canvas so the luminance scan is cheap.
    const sampleW = 32;
    const sampleH = Math.max(1, Math.round((height / width) * sampleW));
    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    let avgLuminance: number | null = null;
    if (ctx) {
      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      try {
        const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
        let total = 0;
        let weighted = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 16) continue; // skip transparent pixels
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          weighted += lum;
          total += 1;
        }
        avgLuminance = total > 0 ? weighted / total / 255 : null; // 0..1
      } catch {
        // CORS-tainted canvas, etc.
        avgLuminance = null;
      }
    }
    return { width, height, avgLuminance };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function validateWordmarkUpload(
  file: File,
  variant: ClientLogoVariant,
  lockup: 'icon' | 'wordmark',
): Promise<UploadValidationResult> {
  const messages: string[] = [];
  let status: UploadValidationStatus = 'pass';

  const inspected = await inspectImage(file);
  if (!inspected) {
    // Vector/EPS we can't decode — accept it, can't validate.
    return {
      status: 'pass',
      width: 0,
      height: 0,
      aspectRatio: 0,
      fittedWidth: PREVIEW_CELL_W,
      fittedHeight: PREVIEW_CELL_H,
      willCrop: false,
      messages: ['Vector / EPS file — dimensions assumed correct.'],
    };
  }

  const { width, height, avgLuminance } = inspected;
  const aspectRatio = width / height;

  // Compute fitted size inside the 4:3 preview cell (mirrors `object-contain`).
  const cellRatio = PREVIEW_CELL_W / PREVIEW_CELL_H;
  let fittedWidth: number, fittedHeight: number;
  if (aspectRatio >= cellRatio) {
    fittedWidth = PREVIEW_CELL_W;
    fittedHeight = Math.round(PREVIEW_CELL_W / aspectRatio);
  } else {
    fittedHeight = PREVIEW_CELL_H;
    fittedWidth = Math.round(PREVIEW_CELL_H * aspectRatio);
  }

  // Dimension floor / ceiling
  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    status = 'warn';
    messages.push(`Low resolution (${width}×${height}px) — may look pixelated.`);
  }
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    status = 'warn';
    messages.push(`Oversized (${width}×${height}px) — consider downscaling.`);
  }

  // Wordmark-specific aspect ratio check
  if (lockup === 'wordmark') {
    if (aspectRatio < 1) {
      status = 'fail';
      messages.push(`Aspect ratio ${aspectRatio.toFixed(2)}:1 looks like an icon, not a wordmark.`);
    } else if (aspectRatio < MIN_WORDMARK_RATIO) {
      status = status === 'fail' ? 'fail' : 'warn';
      messages.push(`Aspect ratio ${aspectRatio.toFixed(2)}:1 is square-ish — wordmarks usually run 2:1 or wider.`);
    } else if (aspectRatio < IDEAL_WORDMARK_RATIO) {
      // acceptable, no message
    }
  } else {
    // icon: warn if extremely wide (probably a wordmark uploaded into the icon slot)
    if (aspectRatio > 2.5) {
      status = status === 'fail' ? 'fail' : 'warn';
      messages.push(`Aspect ratio ${aspectRatio.toFixed(2)}:1 is wide — this looks like a wordmark, not an icon.`);
    }
  }

  // Color-variant sanity check via average luminance
  if (avgLuminance !== null) {
    if (variant === 'white' && avgLuminance < 0.55) {
      status = status === 'fail' ? 'fail' : 'warn';
      messages.push('Image looks dark — the "White" variant should be light/white pixels on transparent.');
    }
    if (variant === 'black' && avgLuminance > 0.45) {
      status = status === 'fail' ? 'fail' : 'warn';
      messages.push('Image looks light — the "Black" variant should be dark/black pixels on transparent.');
    }
  }

  if (status === 'pass' && messages.length === 0) {
    messages.push(`Fits cell at ${fittedWidth}×${fittedHeight}px — no cropping (object-contain).`);
  }

  return {
    status,
    width,
    height,
    aspectRatio,
    fittedWidth,
    fittedHeight,
    willCrop: false,
    messages,
  };
}
