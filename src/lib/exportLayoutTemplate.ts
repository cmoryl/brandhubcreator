/**
 * Export a rendered brand layout template node as PNG or PDF.
 * Uses html-to-image to rasterize a hidden DOM node, then optionally wraps in jsPDF.
 */
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export interface ExportLayoutOptions {
  fileName: string;
  /** Output pixel scale (e.g. 2 → retina). */
  pixelRatio?: number;
}

const triggerDownload = (dataUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportLayoutAsPng = async (node: HTMLElement, opts: ExportLayoutOptions) => {
  const dataUrl = await toPng(node, {
    pixelRatio: opts.pixelRatio ?? 2,
    cacheBust: true,
    skipFonts: false,
  });
  triggerDownload(dataUrl, opts.fileName.endsWith('.png') ? opts.fileName : `${opts.fileName}.png`);
  return dataUrl;
};

export const exportLayoutAsPdf = async (
  node: HTMLElement,
  opts: ExportLayoutOptions & { aspectRatio: number },
) => {
  const dataUrl = await toPng(node, {
    pixelRatio: opts.pixelRatio ?? 2,
    cacheBust: true,
  });

  // Size PDF page to match aspect ratio (landscape if AR >= 1).
  const widthMm = 280;
  const heightMm = widthMm / opts.aspectRatio;
  const orientation = opts.aspectRatio >= 1 ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm);
  pdf.save(opts.fileName.endsWith('.pdf') ? opts.fileName : `${opts.fileName}.pdf`);
};
