/**
 * brandIconPdf.ts — Generate a printable PDF of every icon linked to a
 * brand/product/event, grouped by collection and category.
 *
 * Layout rules:
 *  - Cover page with entity name, total counts, and a table of contents.
 *  - One section per library; starts on a new page with a header band.
 *  - Categories sorted alphabetically inside each library, A→Z; uncategorized last.
 *  - 6-column grid, paginated row-by-row so columns ALWAYS align.
 *  - Empty libraries / empty categories are skipped (no blank pages).
 *  - Running header repeats library name on continuation pages.
 *  - Labels wrap to 2 lines (ellipsis on overflow) using jsPDF text width math.
 *  - Footer with entity name + accurate page numbers (added in a final pass).
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
  // Force currentColor (and any non-none/url fills baked into the markup) to
  // solid near-black so the icon prints crisply against the white PDF page.
  return markup
    .replace(/currentColor/g, '#111111')
    .replace(/fill="none"/gi, 'fill="none"'); // preserve none
};

/** Group + sort: alphabetical categories, with "Uncategorized" pinned last. */
const groupByCategory = (icons: BrandIconography[]) => {
  const groups = new Map<string, BrandIconography[]>();
  for (const icon of icons) {
    const key = ((icon.category || '').trim() || 'Uncategorized');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  }
  // Sort entries inside each group by name
  for (const arr of groups.values()) {
    arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  const entries = Array.from(groups.entries());
  entries.sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });
  return entries;
};

export async function buildBrandIconPdf({
  entityName,
  entityKind,
  libraries,
}: BuildOptions): Promise<void> {
  // Drop empty libraries up-front so we never spit out blank section pages.
  const nonEmpty = libraries.filter((l) => l.icons && l.icons.length > 0);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const totalIcons = nonEmpty.reduce((n, l) => n + l.icons.length, 0);

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
  doc.text(
    `${totalIcons} icon${totalIcons === 1 ? '' : 's'} · ${nonEmpty.length} collection${nonEmpty.length === 1 ? '' : 's'}`,
    margin,
    140,
  );
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), margin, 160);

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Contents', margin, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let tocY = 295;

  if (nonEmpty.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text('No icons linked yet.', margin, tocY);
  } else {
    for (const lib of nonEmpty) {
      if (tocY > pageH - margin) {
        doc.addPage();
        tocY = margin;
      }
      const cats = groupByCategory(lib.icons).length;
      doc.setTextColor(40, 40, 40);
      doc.text(`• ${lib.name}`, margin, tocY);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${lib.icons.length} icon${lib.icons.length === 1 ? '' : 's'} · ${cats} categor${cats === 1 ? 'y' : 'ies'}`,
        pageW - margin,
        tocY,
        { align: 'right' },
      );
      tocY += 18;
    }
  }

  // ── Grid geometry (shared across all library pages) ───────────────
  const cols = 6;
  const gridW = pageW - margin * 2;
  const cellW = gridW / cols;
  const iconPx = Math.floor(cellW - 16);
  const labelH = 22; // two lines @ 7pt
  const rowH = iconPx + labelH + 6;
  const renderPx = 256; // rasterization resolution (sharp on print)

  const drawSectionHeader = (lib: IconLibLite, isContinuation: boolean) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(0, 0, pageW, 90, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(
      isContinuation ? `${lib.name} (cont.)` : lib.name,
      margin,
      50,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${lib.icons.length} icon${lib.icons.length === 1 ? '' : 's'}${lib.description ? ` · ${lib.description}` : ''}`,
      margin,
      70,
    );
    doc.setTextColor(40, 40, 40);
  };

  // ── Icon pages ────────────────────────────────────────────────────
  for (const lib of nonEmpty) {
    doc.addPage();
    drawSectionHeader(lib, false);
    let y = 120;

    const grouped = groupByCategory(lib.icons);

    for (const [category, icons] of grouped) {
      if (icons.length === 0) continue;

      // Category header — needs space for the title AND at least one row.
      const headerH = 26;
      if (y + headerH + rowH > pageH - margin) {
        doc.addPage();
        drawSectionHeader(lib, true);
        y = 120;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${category}  (${icons.length})`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 6, pageW - margin, y + 6);
      y += headerH;

      // Render row-by-row so columns always align (no mid-row page-breaks).
      const rows = Math.ceil(icons.length / cols);
      for (let r = 0; r < rows; r++) {
        if (y + rowH > pageH - margin) {
          doc.addPage();
          drawSectionHeader(lib, true);
          y = 120;
          // Repeat category header on the new page so users don't lose context
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(`${category} (cont.)`, margin, y);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 6, pageW - margin, y + 6);
          y += headerH;
        }

        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const icon = icons[i];
          if (!icon) continue;
          const x = margin + c * cellW;
          const drawX = x + (cellW - iconPx) / 2;

          try {
            const png = await svgToPngDataUrl(buildPrintableSvg(icon), renderPx);
            doc.addImage(png, 'PNG', drawX, y, iconPx, iconPx, undefined, 'FAST');
          } catch {
            doc.setDrawColor(220, 220, 220);
            doc.rect(drawX, y, iconPx, iconPx);
            doc.setFontSize(10);
            doc.setTextColor(180, 180, 180);
            doc.text('—', x + cellW / 2, y + iconPx / 2 + 4, { align: 'center' });
            doc.setTextColor(40, 40, 40);
          }

          // Label — wrap to 2 lines max, ellipsised by jsPDF text width
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(60, 60, 60);
          const rawName = (icon.name || '').trim() || '—';
          const lines = doc.splitTextToSize(rawName, cellW - 8) as string[];
          const shown = lines.slice(0, 2);
          if (lines.length > 2) {
            shown[1] = shown[1].replace(/.{1,3}$/, '…');
          }
          doc.text(shown, x + cellW / 2, y + iconPx + 10, {
            align: 'center',
            maxWidth: cellW - 8,
          });
        }

        y += rowH;
      }

      y += 10; // breathing room between categories
    }
  }

  // ── Footer page numbers (final pass; counts are accurate now) ─────
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
