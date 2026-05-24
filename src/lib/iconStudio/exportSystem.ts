/**
 * Full icon system export.
 *
 * Bundles an entire set/library into a single ZIP containing:
 *   /svg/<name>.svg                      — optimised vector source
 *   /png/<size>/<name>.png               — transparent PNGs at multiple sizes
 *   contact-sheet.svg                    — visual overview of every icon
 *   manifest.json                        — full machine-readable index
 *   tokens.json                          — design tokens (grid, colors, stroke)
 *   README.md                            — import & usage notes (Figma-ready)
 *   qa-report.json                       — per-icon QA scores + findings
 */

import JSZip from 'jszip';
import type { BrandIconography } from '@/types/brand';
import { buildSvgString, sanitizeSvg } from '@/lib/svgUtils';
import { svgToTransparentPng, DEFAULT_PNG_SIZES, sanitizeFileName } from './exportIcon';
import { scoreLibrary, type QAReport } from './qa';
import { readRecipe, type IconRecipe } from './recipe';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toSvgString = (icon: BrandIconography): string => {
  const built = buildSvgString({
    svgPath: icon.svgPath || '',
    viewBox: icon.viewBox || '0 0 24 24',
    fillMode: icon.fillMode,
    name: icon.name,
  });
  return sanitizeSvg(built);
};

/* -------------------------------------------------------------------------- */
/* Contact sheet                                                               */
/* -------------------------------------------------------------------------- */

export const buildContactSheetSvg = (
  icons: BrandIconography[],
  options: { columns?: number; tile?: number; accent?: string; title?: string } = {},
): string => {
  const { columns = 8, tile = 96, accent = '#139DD8', title = 'Icon System' } = options;
  const rows = Math.ceil(icons.length / columns);
  const padding = 32;
  const headerH = 64;
  const labelH = 22;
  const cellH = tile + labelH;
  const width = columns * tile + padding * 2;
  const height = headerH + padding + rows * cellH + padding;

  const cells = icons
    .map((icon, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = padding + col * tile;
      const y = headerH + padding + row * cellH;
      const vb = icon.viewBox || '0 0 24 24';
      const fill = icon.fillMode === 'fill' ? accent : 'none';
      const stroke = icon.fillMode === 'fill' ? 'none' : accent;
      const safeName = (icon.name || 'icon').replace(/[<>&"']/g, '');
      return `
  <g transform="translate(${x},${y})">
    <rect width="${tile}" height="${tile}" rx="10" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.18"/>
    <svg x="${(tile - 48) / 2}" y="${(tile - 48) / 2}" width="48" height="48" viewBox="${vb}" fill="${fill}" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="${(icon.svgPath || '').replace(/"/g, '&quot;')}"/>
    </svg>
    <text x="${tile / 2}" y="${tile + 14}" text-anchor="middle" font-family="-apple-system,Segoe UI,Inter,sans-serif" font-size="10" fill="#666">${safeName.slice(0, 20)}</text>
  </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white"/>
  <text x="${padding}" y="42" font-family="-apple-system,Segoe UI,Inter,sans-serif" font-size="22" font-weight="600" fill="#111">${title}</text>
  <text x="${padding}" y="58" font-family="-apple-system,Segoe UI,Inter,sans-serif" font-size="11" fill="#666">${icons.length} icons</text>
  ${cells}
</svg>`;
};

/* -------------------------------------------------------------------------- */
/* Manifest + tokens                                                           */
/* -------------------------------------------------------------------------- */

interface ManifestIcon {
  id: string;
  name: string;
  slug: string;
  category?: string;
  files: { svg: string; png: Record<string, string> };
  recipe: IconRecipe | null;
  qa: QAReport['scores'] | null;
}

export interface SystemManifest {
  schema: 'icon-system/v1';
  name: string;
  brand: string;
  industry?: string;
  generatedAt: string;
  iconCount: number;
  recipe: IconRecipe | null;
  icons: ManifestIcon[];
  qaSummary: ReturnType<typeof scoreLibrary>['average'];
}

const buildTokens = (recipe: IconRecipe | null) => ({
  grid: { size: recipe?.grid ?? 24, unit: 'px' },
  stroke: { width: recipe?.strokeWidth ?? 1.75, caps: recipe?.endCaps ?? 'round' },
  corner: recipe?.cornerRadius ?? 'soft',
  color: {
    primary: recipe?.primaryColor ?? '#139DD8',
    secondary: recipe?.secondaryColor,
  },
  style: recipe?.style ?? 'outlined',
});

const buildReadme = (m: SystemManifest): string =>
  `# ${m.name}

> ${m.iconCount} icons · generated ${new Date(m.generatedAt).toLocaleString()}

## Contents

- \`/svg\` — optimised vector source
- \`/png/<size>\` — transparent PNGs at 24/48/64/128/256/512px
- \`contact-sheet.svg\` — visual index of every icon
- \`manifest.json\` — machine-readable index with recipes + QA per icon
- \`tokens.json\` — design tokens (grid, stroke, color, corners)
- \`qa-report.json\` — full per-icon QA findings

## Average QA scores

| Brand Fit | SVG Health | Small Size | Export Ready | Overall |
|---|---|---|---|---|
| ${m.qaSummary.brandFit} | ${m.qaSummary.svgHealth} | ${m.qaSummary.smallSizeReadable} | ${m.qaSummary.exportReady} | **${m.qaSummary.overall}** |

## Figma import

1. In Figma → Plugins → "Import SVG", select the \`/svg\` folder.
2. Apply the design tokens from \`tokens.json\` to your local styles.
3. Use \`manifest.json\` to keep names + categories aligned.

Generated by **BrandHub · Icon Studio**.
`;

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

export interface SystemExportOptions {
  name: string;
  brand: string;
  industry?: string;
  icons: BrandIconography[];
  recipe?: IconRecipe | null;
  accent?: string;
  sizes?: readonly number[];
  onProgress?: (ratio: number, label?: string) => void;
}

export const exportIconSystem = async ({
  name,
  brand,
  industry,
  icons,
  recipe = null,
  accent = '#139DD8',
  sizes = DEFAULT_PNG_SIZES,
  onProgress,
}: SystemExportOptions): Promise<void> => {
  const zip = new JSZip();
  const total = icons.length * (1 + sizes.length) + 3;
  let done = 0;
  const bump = (label?: string) => {
    done += 1;
    onProgress?.(Math.min(1, done / total), label);
  };

  // Per-icon recipe falls back to system recipe
  const iconRecipe = (icon: BrandIconography) => readRecipe(icon) ?? recipe ?? null;

  // QA pass first so manifest can include scores
  const qa = scoreLibrary(icons, recipe);

  const manifestIcons: ManifestIcon[] = [];
  const svgFolder = zip.folder('svg')!;
  const pngFolder = zip.folder('png')!;

  for (const icon of icons) {
    const slug = sanitizeFileName(icon.name);
    const svg = toSvgString(icon);
    svgFolder.file(`${slug}.svg`, svg);
    bump(`svg ${slug}`);

    const pngMap: Record<string, string> = {};
    for (const size of sizes) {
      try {
        const png = await svgToTransparentPng(svg, size);
        const sizeFolder = pngFolder.folder(String(size))!;
        sizeFolder.file(`${slug}.png`, png);
        pngMap[String(size)] = `png/${size}/${slug}.png`;
      } catch {
        /* skip failing sizes */
      }
      bump(`png ${slug} ${size}`);
    }

    const r = iconRecipe(icon);
    const report = qa.reports.find((x) => x.icon.id === icon.id)?.report;
    manifestIcons.push({
      id: icon.id,
      name: icon.name,
      slug,
      category: icon.category,
      files: { svg: `svg/${slug}.svg`, png: pngMap },
      recipe: r,
      qa: report?.scores ?? null,
    });
  }

  const manifest: SystemManifest = {
    schema: 'icon-system/v1',
    name,
    brand,
    industry,
    generatedAt: new Date().toISOString(),
    iconCount: icons.length,
    recipe,
    icons: manifestIcons,
    qaSummary: qa.average,
  };

  // Contact sheet
  const contactSheet = buildContactSheetSvg(icons, {
    accent,
    title: `${brand} · ${name}`,
  });
  zip.file('contact-sheet.svg', contactSheet);
  bump('contact sheet');

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('tokens.json', JSON.stringify(buildTokens(recipe), null, 2));
  zip.file('qa-report.json', JSON.stringify(qa.reports.map(({ icon, report }) => ({
    id: icon.id,
    name: icon.name,
    ...report,
  })), null, 2));
  zip.file('README.md', buildReadme(manifest));
  bump('manifest + readme');

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${sanitizeFileName(name)}-system.zip`);
  onProgress?.(1, 'done');
};
