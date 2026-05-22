/**
 * Per-icon export utilities — SVG and transparent PNG at multiple sizes.
 *
 * Used by the Icon Studio wizard preflight/export step. PNGs are rendered with
 * a fully transparent background by drawing the SVG into a canvas without
 * filling it first.
 */

import JSZip from 'jszip';
import { BrandIconography } from '@/types/brand';
import { buildSvgString, sanitizeSvg } from '@/lib/svgUtils';

export const DEFAULT_PNG_SIZES = [24, 48, 64, 128, 256, 512] as const;

const sanitizeFileName = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'icon';

const toSvgString = (icon: BrandIconography): string => {
  const built = buildSvgString({
    svgPath: icon.svgPath || '',
    viewBox: (icon as any).viewBox || '0 0 24 24',
    fillMode: (icon as any).fillMode,
    name: icon.name,
  });
  return sanitizeSvg(built);
};

/** Trigger a browser download for a Blob. */
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick to let the browser kick off the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Render an SVG string to a transparent-background PNG Blob at `size` px. */
export const svgToTransparentPng = (svg: string, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      // No fillRect — keep alpha = 0 for true transparency
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(
        (out) => {
          URL.revokeObjectURL(url);
          if (!out) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }
          resolve(out);
        },
        'image/png',
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err instanceof Event ? new Error('Failed to load SVG') : (err as Error));
    };
    img.src = url;
  });
};

/** Download a single icon as an .svg file. */
export const downloadIconSvg = (icon: BrandIconography) => {
  const svg = toSvgString(icon);
  downloadBlob(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    `${sanitizeFileName(icon.name)}.svg`,
  );
};

/** Download a single icon as a transparent PNG at the requested size. */
export const downloadIconPng = async (icon: BrandIconography, size = 256) => {
  const svg = toSvgString(icon);
  const png = await svgToTransparentPng(svg, size);
  downloadBlob(png, `${sanitizeFileName(icon.name)}-${size}.png`);
};

/**
 * Download a single icon as a ZIP containing the SVG + transparent PNGs at
 * every requested size.
 */
export const downloadIconBundle = async (
  icon: BrandIconography,
  sizes: readonly number[] = DEFAULT_PNG_SIZES,
) => {
  const zip = new JSZip();
  const base = sanitizeFileName(icon.name);
  const svg = toSvgString(icon);
  zip.file(`${base}.svg`, svg);
  const pngFolder = zip.folder('png');
  await Promise.all(
    sizes.map(async (size) => {
      try {
        const png = await svgToTransparentPng(svg, size);
        pngFolder?.file(`${base}-${size}.png`, png);
      } catch {
        /* skip failing sizes */
      }
    }),
  );
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${base}.zip`);
};

export interface BatchExportOptions {
  /** Logical grouping name → list of icons to bundle into that folder. */
  groups: Record<string, BrandIconography[]>;
  /** ZIP file name (no extension). */
  zipName: string;
  /** PNG sizes per icon. */
  sizes?: readonly number[];
  /** Optional progress callback (0..1). */
  onProgress?: (ratio: number) => void;
}

/**
 * Bulk export: builds a single ZIP that contains, for each group, an `svg/`
 * folder and a `png/<size>/` folder of transparent PNGs.
 */
export const downloadBatchBundle = async ({
  groups,
  zipName,
  sizes = DEFAULT_PNG_SIZES,
  onProgress,
}: BatchExportOptions) => {
  const zip = new JSZip();
  const allEntries: Array<{ groupName: string; icon: BrandIconography }> = [];
  Object.entries(groups).forEach(([groupName, icons]) => {
    icons.forEach((icon) => allEntries.push({ groupName, icon }));
  });

  const total = allEntries.length * (1 + sizes.length);
  let done = 0;
  const bump = () => {
    done += 1;
    onProgress?.(Math.min(1, done / Math.max(1, total)));
  };

  for (const { groupName, icon } of allEntries) {
    const folder = zip.folder(sanitizeFileName(groupName)) ?? zip;
    const svgFolder = folder.folder('svg') ?? folder;
    const pngFolder = folder.folder('png') ?? folder;
    const base = sanitizeFileName(icon.name);
    const svg = toSvgString(icon);
    svgFolder.file(`${base}.svg`, svg);
    bump();

    for (const size of sizes) {
      try {
        const png = await svgToTransparentPng(svg, size);
        const sizeFolder = pngFolder.folder(String(size)) ?? pngFolder;
        sizeFolder.file(`${base}.png`, png);
      } catch {
        /* skip */
      }
      bump();
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${sanitizeFileName(zipName)}.zip`);
};

export { sanitizeFileName };
