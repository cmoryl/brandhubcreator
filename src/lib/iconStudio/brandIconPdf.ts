/**
 * brandIconPdf.ts — Generate a printable, presentation-grade PDF of every
 * icon linked to a brand/product/event.
 *
 * Advanced features:
 *  - Branded cover (accent bar, optional logo, color swatch strip)
 *  - PDF metadata (title, author, subject, keywords)
 *  - Two-pass rendering with a real Table of Contents that includes accurate
 *    page numbers (cover → render icons → insertPage for TOC at page 2)
 *  - Per-library spec page (description, category breakdown, density legend,
 *    sample row rendered on light AND dark backgrounds for contrast proof)
 *  - 6-column grid, row-by-row pagination so columns always align
 *  - Continuation headers ("Library (cont.)", "Category (cont.)") on overflow
 *  - Alphabetical index appendix (icon → library → page)
 *  - PDF outline / bookmarks for library + category navigation
 *  - Footer with entity name + accurate "page N of M" in the final pass
 *  - Empty libraries skipped, "Uncategorized" pinned last, icons A→Z
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

export interface PdfBranding {
  /** Show a running header (logo + text) on every content page (skips cover). Default: true. */
  showHeader?: boolean;
  /** Show a running footer (text + page numbers) on every content page (skips cover). Default: true. */
  showFooter?: boolean;
  /** Override the left-hand text in the header. Defaults to entity name. */
  headerText?: string;
  /** Override the left-hand text in the footer. Defaults to "{entityName} · {entityKind} icon system". */
  footerText?: string;
  /** Header background color (hex). Defaults to accentColor. */
  headerBgColor?: string;
  /** Footer text color (hex). Defaults to a muted grey. */
  footerTextColor?: string;
  /** Include the brand logo (if provided) in the running header. Default: true. */
  showLogoInHeader?: boolean;
  /** Include the brand logo (if provided) on the cover. Default: true. */
  showLogoOnCover?: boolean;
}

interface BuildOptions {
  entityName: string;
  entityKind: 'Brand' | 'Product' | 'Event';
  libraries: IconLibLite[];
  /** Optional brand accent color (hex, e.g. "#0ea5e9") used on cover + headers */
  accentColor?: string;
  /** Optional palette of brand colors (hex strings) rendered as swatch strip */
  palette?: string[];
  /** Optional logo URL (raster or SVG) shown on the cover */
  logoUrl?: string;
  /** Optional tagline shown under the entity name on the cover */
  tagline?: string;
  /** Configurable header/footer branding applied to content pages. */
  branding?: PdfBranding;
}

/* ─────────────────────────── helpers ─────────────────────────── */

const sanitizeFileName = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'brand';

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [15, 23, 42];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
};

/** Pick black/white text that's readable on the given hex bg. */
const readableOn = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  // Perceived luminance
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? [15, 23, 42] : [255, 255, 255];
};

/** Rasterize an SVG string to a PNG dataURL, with optional fg color. */
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

/** Fetch an external image (raster or svg) and return a {dataUrl, w, h}. */
const fetchImageToDataUrl = async (
  src: string,
): Promise<{ dataUrl: string; w: number; h: number; mime: 'PNG' | 'JPEG' } | null> => {
  try {
    const resp = await fetch(src, { mode: 'cors' });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const isSvg = blob.type.includes('svg') || src.toLowerCase().endsWith('.svg');
    if (isSvg) {
      const txt = await blob.text();
      const dataUrl = await svgToPngDataUrl(txt, 512);
      return { dataUrl, w: 512, h: 512, mime: 'PNG' };
    }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
    // Probe natural size
    const dims = await new Promise<{ w: number; h: number }>((res) => {
      const im = new Image();
      im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => res({ w: 256, h: 256 });
      im.src = dataUrl;
    });
    const mime: 'PNG' | 'JPEG' = blob.type.includes('png') ? 'PNG' : 'JPEG';
    return { dataUrl, ...dims, mime };
  } catch {
    return null;
  }
};

/** Build SVG markup that prints crisply — currentColor → near-black. */
const buildPrintableSvg = (icon: BrandIconography, color = '#111111'): string => {
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
  return markup
    .replace(/currentColor/g, color)
    .replace(/fill="none"/gi, 'fill="none"');
};

/** Group + sort: alphabetical categories, with "Uncategorized" pinned last. */
const groupByCategory = (icons: BrandIconography[]) => {
  const groups = new Map<string, BrandIconography[]>();
  for (const icon of icons) {
    const key = (icon.category || '').trim() || 'Uncategorized';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  }
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

/* ─────────────────────────── main builder ─────────────────────────── */

export interface BuildBrandIconPdfResult {
  blob: Blob;
  url: string;
  filename: string;
}

export async function buildBrandIconPdf({
  entityName,
  entityKind,
  libraries,
  accentColor = '#0f172a',
  palette = [],
  logoUrl,
  tagline,
  autoDownload = true,
  branding = {},
}: BuildOptions & { autoDownload?: boolean }): Promise<BuildBrandIconPdfResult> {
  const {
    showHeader = true,
    showFooter = true,
    headerText,
    footerText,
    headerBgColor,
    footerTextColor,
    showLogoInHeader = true,
    showLogoOnCover = true,
  } = branding;
  const headerLeft = headerText ?? entityName;
  const footerLeft = footerText ?? `${entityName} · ${entityKind} icon system`;
  const headerBgRgb = hexToRgb(headerBgColor ?? accentColor);
  const headerFgRgb = readableOn(headerBgColor ?? accentColor);
  const footerFgRgb = footerTextColor ? hexToRgb(footerTextColor) : [150, 150, 150] as [number, number, number];
  const nonEmpty = libraries.filter((l) => l.icons && l.icons.length > 0);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const totalIcons = nonEmpty.reduce((n, l) => n + l.icons.length, 0);
  const accentRgb = hexToRgb(accentColor);
  const onAccent = readableOn(accentColor);
  const generatedAt = new Date();

  doc.setProperties({
    title: `${entityName} — Icon System`,
    subject: `${entityKind} icon library export`,
    author: 'BrandHub',
    keywords: `icons, ${entityKind.toLowerCase()}, ${entityName}, brand system`,
    creator: 'BrandHub Icon Studio',
  });

  /* ──────── Cover page ──────── */
  // Accent header band
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, pageW, 260, 'F');

  // Optional logo (top-right)
  let logoData: Awaited<ReturnType<typeof fetchImageToDataUrl>> = null;
  if (logoUrl) logoData = await fetchImageToDataUrl(logoUrl);
  if (logoData && showLogoOnCover) {
    const maxW = 90;
    const maxH = 60;
    const ratio = Math.min(maxW / logoData.w, maxH / logoData.h);
    const w = logoData.w * ratio;
    const h = logoData.h * ratio;
    doc.addImage(
      logoData.dataUrl,
      logoData.mime,
      pageW - margin - w,
      40,
      w,
      h,
      undefined,
      'FAST',
    );
  }

  doc.setTextColor(onAccent[0], onAccent[1], onAccent[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${entityKind.toUpperCase()} ICON SYSTEM`, margin, 80);
  doc.setFontSize(30);
  doc.text(entityName, margin, 130, { maxWidth: pageW - margin * 2 - 110 });
  if (tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(tagline, margin, 158, { maxWidth: pageW - margin * 2 - 110 });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    `${totalIcons} icon${totalIcons === 1 ? '' : 's'} · ${nonEmpty.length} collection${nonEmpty.length === 1 ? '' : 's'}`,
    margin,
    200,
  );
  doc.setFontSize(9);
  doc.text(`Generated ${generatedAt.toLocaleDateString()}`, margin, 218);

  // Palette swatch strip
  if (palette.length > 0) {
    const swatchY = 240;
    const swW = Math.min(40, (pageW - margin * 2) / Math.max(palette.length, 1));
    palette.slice(0, 12).forEach((hex, i) => {
      const [r, g, b] = hexToRgb(hex);
      doc.setFillColor(r, g, b);
      doc.rect(margin + i * (swW + 4), swatchY, swW, 14, 'F');
    });
  }

  // Cover footer note
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text(
    'Open digitally for clickable bookmarks (Library + Category) — or print on A4.',
    margin,
    pageH - 30,
  );

  /* ──────── Grid geometry ──────── */
  const cols = 6;
  const gridW = pageW - margin * 2;
  const cellW = gridW / cols;
  const iconPx = Math.floor(cellW - 16);
  const labelH = 22;
  const rowH = iconPx + labelH + 6;
  const renderPx = 256;

  const drawSectionHeader = (lib: IconLibLite, isContinuation: boolean) => {
    doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.rect(0, 0, pageW, 6, 'F');
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 6, pageW, 84, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(isContinuation ? `${lib.name} (cont.)` : lib.name, margin, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${lib.icons.length} icon${lib.icons.length === 1 ? '' : 's'}${lib.description ? ` · ${lib.description}` : ''}`,
      margin,
      70,
    );
    doc.setTextColor(40, 40, 40);
  };

  /* ──────── Per-library spec + grid pages ──────── */
  // Track: { lib, startPage, iconPages: Map<iconId, page> }
  const libStartPages: { lib: IconLibLite; page: number; catBookmarks: Array<{ name: string; page: number }> }[] = [];
  const iconIndex: Array<{ name: string; library: string; category: string; page: number }> = [];

  for (const lib of nonEmpty) {
    /* Library spec page */
    doc.addPage();
    const libStartPage = doc.getNumberOfPages();
    libStartPages.push({ lib, page: libStartPage, catBookmarks: [] });

    drawSectionHeader(lib, false);
    let y = 120;

    const grouped = groupByCategory(lib.icons);

    // Library description block
    if (lib.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const desc = doc.splitTextToSize(lib.description, pageW - margin * 2);
      doc.text(desc, margin, y);
      y += (desc as string[]).length * 13 + 10;
    }

    // Category breakdown card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Category breakdown', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const maxBar = pageW - margin * 2 - 180;
    const maxCount = Math.max(...grouped.map(([, ic]) => ic.length), 1);
    for (const [cat, ic] of grouped) {
      if (y > pageH - margin - 80) break;
      doc.setTextColor(60, 60, 60);
      doc.text(cat, margin, y + 8, { maxWidth: 140 });
      const barW = (ic.length / maxCount) * maxBar;
      doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      doc.rect(margin + 150, y + 2, barW, 8, 'F');
      doc.setTextColor(100, 116, 139);
      doc.text(String(ic.length), margin + 150 + maxBar + 8, y + 8);
      y += 14;
    }

    y += 10;

    // Contrast proof — sample row on light + dark backgrounds
    const samples = lib.icons.slice(0, 6);
    if (samples.length > 0 && y < pageH - margin - 160) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Contrast preview', margin, y);
      y += 12;

      const sampleSize = 36;
      const gap = 14;
      const rowWidth = samples.length * (sampleSize + gap) - gap;

      // Light row
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, rowWidth + 24, sampleSize + 24, 'FD');
      for (let i = 0; i < samples.length; i++) {
        try {
          const png = await svgToPngDataUrl(buildPrintableSvg(samples[i], '#111111'), 128);
          doc.addImage(png, 'PNG', margin + 12 + i * (sampleSize + gap), y + 12, sampleSize, sampleSize);
        } catch { /* skip */ }
      }

      // Dark row
      const darkY = y + sampleSize + 32;
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, darkY, rowWidth + 24, sampleSize + 24, 'F');
      for (let i = 0; i < samples.length; i++) {
        try {
          const png = await svgToPngDataUrl(buildPrintableSvg(samples[i], '#ffffff'), 128);
          doc.addImage(png, 'PNG', margin + 12 + i * (sampleSize + gap), darkY + 12, sampleSize, sampleSize);
        } catch { /* skip */ }
      }
      y = darkY + sampleSize + 36;
    }

    // Specs strip
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Grid · 24×24  ·  Stroke 1.5px  ·  Format SVG  ·  Categories ${grouped.length}  ·  Total ${lib.icons.length}`,
      margin,
      pageH - 50,
    );

    /* Icon grid pages */
    for (const [category, icons] of grouped) {
      if (icons.length === 0) continue;

      doc.addPage();
      drawSectionHeader(lib, true);
      let gy = 120;

      // Category header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`${category}  (${icons.length})`, margin, gy);
      doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      doc.setLineWidth(1.2);
      doc.line(margin, gy + 6, margin + 60, gy + 6);
      doc.setLineWidth(0.2);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin + 64, gy + 6, pageW - margin, gy + 6);
      gy += 26;

      libStartPages[libStartPages.length - 1].catBookmarks.push({
        name: category,
        page: doc.getNumberOfPages(),
      });

      const rows = Math.ceil(icons.length / cols);
      for (let r = 0; r < rows; r++) {
        if (gy + rowH > pageH - margin) {
          doc.addPage();
          drawSectionHeader(lib, true);
          gy = 120;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(15, 23, 42);
          doc.text(`${category} (cont.)`, margin, gy);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, gy + 6, pageW - margin, gy + 6);
          gy += 26;
        }

        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const icon = icons[i];
          if (!icon) continue;
          const x = margin + c * cellW;
          const drawX = x + (cellW - iconPx) / 2;

          try {
            const png = await svgToPngDataUrl(buildPrintableSvg(icon), renderPx);
            doc.addImage(png, 'PNG', drawX, gy, iconPx, iconPx, undefined, 'FAST');
          } catch {
            doc.setDrawColor(220, 220, 220);
            doc.rect(drawX, gy, iconPx, iconPx);
            doc.setFontSize(10);
            doc.setTextColor(180, 180, 180);
            doc.text('—', x + cellW / 2, gy + iconPx / 2 + 4, { align: 'center' });
            doc.setTextColor(40, 40, 40);
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(60, 60, 60);
          const rawName = (icon.name || '').trim() || '—';
          const lines = doc.splitTextToSize(rawName, cellW - 8) as string[];
          const shown = lines.slice(0, 2);
          if (lines.length > 2) shown[1] = shown[1].replace(/.{1,3}$/, '…');
          doc.text(shown, x + cellW / 2, gy + iconPx + 10, {
            align: 'center',
            maxWidth: cellW - 8,
          });

          iconIndex.push({
            name: rawName,
            library: lib.name,
            category,
            page: doc.getNumberOfPages(),
          });
        }

        gy += rowH;
      }
    }
  }

  /* ──────── Alphabetical index appendix ──────── */
  if (iconIndex.length > 0) {
    doc.addPage();
    const indexStart = doc.getNumberOfPages();
    doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.rect(0, 0, pageW, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('Alphabetical Index', margin, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${iconIndex.length} entries across ${nonEmpty.length} collection${nonEmpty.length === 1 ? '' : 's'}`, margin, 74);

    const sorted = [...iconIndex].sort((a, b) => a.name.localeCompare(b.name));
    const colCount = 2;
    const colW = (pageW - margin * 2 - 20) / colCount;
    let iy = 100;
    let ix = margin;
    let colIdx = 0;
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    for (const entry of sorted) {
      if (iy > pageH - margin) {
        colIdx++;
        if (colIdx >= colCount) {
          doc.addPage();
          doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.rect(0, 0, pageW, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text('Alphabetical Index (cont.)', margin, 40);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(40, 40, 40);
          iy = 70;
          colIdx = 0;
        } else {
          iy = 100;
        }
        ix = margin + colIdx * (colW + 20);
      }
      const left = `${entry.name}  ·  ${entry.library}`;
      const truncLeft = doc.splitTextToSize(left, colW - 30)[0] as string;
      doc.text(truncLeft, ix, iy);
      doc.setTextColor(100, 116, 139);
      doc.text(String(entry.page), ix + colW - 4, iy, { align: 'right' });
      doc.setTextColor(40, 40, 40);
      iy += 12;
    }

    // Bookmark for index
    try {
      (doc as unknown as { outline: { add: (p: unknown, t: string, o: unknown) => unknown } }).outline.add(null, 'Alphabetical Index', { pageNumber: indexStart });
    } catch { /* ignore */ }
  }

  /* ──────── Insert TOC at page 2 (now that we know page numbers) ──────── */
  doc.insertPage(2);
  doc.setPage(2);
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, pageW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Contents', margin, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${nonEmpty.length} collection${nonEmpty.length === 1 ? '' : 's'} · ${totalIcons} icons`, margin, 74);

  let tocY = 110;
  doc.setFontSize(11);

  if (nonEmpty.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.text('No icons linked yet.', margin, tocY);
  } else {
    for (const entry of libStartPages) {
      if (tocY > pageH - margin - 30) {
        doc.addPage();
        doc.setPage(doc.getNumberOfPages());
        tocY = margin;
      }
      // Library row — TOC page (2) inserted before icon pages, so shift +1
      const shiftedPage = entry.page + 1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(entry.lib.name, margin, tocY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(shiftedPage), pageW - margin, tocY, { align: 'right' });
      // Dotted leader
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([1, 2], 0);
      const nameW = doc.getTextWidth(entry.lib.name);
      const pageNumW = doc.getTextWidth(String(shiftedPage));
      doc.line(margin + nameW + 6, tocY - 2, pageW - margin - pageNumW - 4, tocY - 2);
      doc.setLineDashPattern([], 0);
      tocY += 16;

      doc.setFontSize(9);
      for (const cat of entry.catBookmarks) {
        if (tocY > pageH - margin - 20) {
          doc.addPage();
          tocY = margin;
        }
        const shifted = cat.page + 1;
        doc.setTextColor(80, 80, 80);
        doc.text(`  ${cat.name}`, margin + 12, tocY);
        doc.setTextColor(120, 120, 120);
        doc.text(String(shifted), pageW - margin, tocY, { align: 'right' });
        tocY += 12;
      }
      tocY += 6;
      doc.setFontSize(11);
    }
  }

  /* ──────── Bookmarks (outline) — built last so page numbers are final ──────── */
  try {
    const outline = (doc as unknown as { outline: { add: (parent: unknown, title: string, opts: unknown) => unknown } }).outline;
    for (const entry of libStartPages) {
      const libNode = outline.add(null, entry.lib.name, { pageNumber: entry.page + 1 });
      for (const cat of entry.catBookmarks) {
        outline.add(libNode, cat.name, { pageNumber: cat.page + 1 });
      }
    }
  } catch { /* ignore */ }

  /* ──────── Footers (final pass — accurate page counts) ──────── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    if (p > 1) {
      doc.text(`${entityName} · ${entityKind} icon system`, margin, pageH - 18);
      doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 18, { align: 'right' });
    }
  }

  const filename = `${sanitizeFileName(entityName)}-icon-system.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  if (autoDownload) {
    doc.save(filename);
  }
  return { blob, url, filename };
}
