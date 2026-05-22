/**
 * brandIconPdf.ts — Generate a printable PDF of every icon linked to a
 * brand/product/event, grouped by collection and category.
 *
 * Uses jsPDF + client-side SVG rasterization (Image → canvas → dataURL)
 * so all icons remain crisp and theme-neutral in the final document.
 */

import jsPDF from 'jspdf';
import type { BrandIconography } from '@/types/brand';
import { buildSvgString, sanitizeSvg } from '@/lib/svgUtils';

interface IconLibLite {
  id: string;
  name: string;
  description?: string;
  level?: string;
  icons: BrandIconography[];
}

interface BuildOptions {
  entityName: string;
  entityKind: 'Brand' | 'Product' | 'Event';
  libraries: IconLibLite[];
}

/** Rasterize a single SVG string to a PNG dataURL at the requested pixel size. */
const svgToPngDataUrl = (svgMarkup: string, px: number): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      const safe = sanitizeSvg(svgMarkup);
      const blob = new Blob([safe], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = px;
        canvas.height = px;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('canvas-2d-unavailable'));
        }
        ctx.clearRect(0, 0, px, px);
        ctx.drawImage(img, 0, 0, px, px);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });

const sanitizeFileName = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'brand';

/** Build SVG markup that always renders in solid black for print clarity. */
const buildPrintableSvg = (icon: BrandIconography): string => {
  const raw = (icon.svgPath || '').trim();
  let markup = raw;
  if (!raw.toLowerCase().startsWith('<svg')) {
    markup = buildSvgString({
      svgPath: raw,
      viewBox: icon.viewBox,
      fillMode: icon.fillMode,
      name: icon.name,
    });
  }
  // Force currentColor to black so the icon renders against the white PDF page.
  return markup.replace(/currentColor/g, '#111111');
};

export async function buildBrandIconPdf({
  entityName,
  entityKind,
  libraries,
}: BuildOptions): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const totalIcons = libraries.reduce((n, l) => n + l.icons.length, 0);

  // ── Cover page ────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageW, 220, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${entityKind.toUpperCase()} ICON SYSTEM`, margin, 70);
  doc.setFontSize(28);
  doc.text(entityName, margin, 110, { maxWidth: pageW - margin * 2 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`${totalIcons} icons · ${libraries.length} collections`, margin, 140);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), margin, 160);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Contents', margin, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let tocY = 295;
  for (const lib of libraries) {
    if (tocY > pageH - margin) {
      doc.addPage();
      tocY = margin;
    }
    doc.text(`• ${lib.name}`, margin, tocY);
    doc.text(`${lib.icons.length}`, pageW - margin, tocY, { align: 'right' });
    tocY += 18;
  }

  // ── Icon pages ────────────────────────────────────────────────────
  const cols = 6;
  const cellW = (pageW - margin * 2) / cols;
  const iconPx = Math.floor(cellW - 16);
  const rowH = cellW + 18; // square cell + label area
  const renderPx = 192; // rasterization resolution

  for (const lib of libraries) {
    doc.addPage();
    // Section header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(0, 0, pageW, 90, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(lib.name, margin, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${lib.icons.length} icons${lib.description ? ` · ${lib.description}` : ''}`,
      margin,
      70,
    );
    doc.setTextColor(40, 40, 40);

    // Group by category
    const groups = new Map<string, BrandIconography[]>();
    for (const icon of lib.icons) {
      const key = (icon.category || 'Uncategorized').trim() || 'Uncategorized';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(icon);
    }

    let y = 120;
    for (const [category, icons] of groups) {
      // Category header
      if (y > pageH - margin - rowH) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${category}  (${icons.length})`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 6, pageW - margin, y + 6);
      y += 20;

      // Icon grid
      for (let i = 0; i < icons.length; i++) {
        const col = i % cols;
        if (col === 0 && i > 0) y += rowH;
        if (y + rowH > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        const icon = icons[i];
        const x = margin + col * cellW;
        try {
          const png = await svgToPngDataUrl(buildPrintableSvg(icon), renderPx);
          const drawX = x + (cellW - iconPx) / 2;
          doc.addImage(png, 'PNG', drawX, y, iconPx, iconPx);
        } catch {
          // Fallback placeholder
          doc.setDrawColor(200, 200, 200);
          doc.rect(x + (cellW - iconPx) / 2, y, iconPx, iconPx);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('—', x + cellW / 2, y + iconPx / 2, { align: 'center' });
          doc.setTextColor(40, 40, 40);
        }
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(60, 60, 60);
        const label = (icon.name || '').slice(0, 22);
        doc.text(label, x + cellW / 2, y + iconPx + 10, { align: 'center' });
      }
      y += rowH + 8;
    }
  }

  // ── Footer page numbers ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${entityName} · Icon system`, margin, pageH - 18);
    doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 18, { align: 'right' });
  }

  doc.save(`${sanitizeFileName(entityName)}-icon-system.pdf`);
}
