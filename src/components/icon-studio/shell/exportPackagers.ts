/**
 * Phase 7 — Export & Distribution: aggregated emit helpers.
 * Builds SVG symbol sheets, React component packages, and matching CSS
 * utility classes from a flat list of styled icons.
 */

export interface EmitIcon {
  /** kebab-case slug, unique within the bundle (e.g. "navigation/arrow-left"). */
  slug: string;
  /** Display name, used as the React component name fallback. */
  name: string;
  /** SVG path "d" attribute or full inner SVG markup. */
  svgPath: string;
  viewBox: string;
}

const sanitizeId = (s: string) => s.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

const toPascalCase = (s: string) =>
  s
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('') || 'Icon';

const innerSvgFor = (icon: EmitIcon): string => {
  const path = icon.svgPath || '';
  // Heuristic: if the path already contains markup (<path>, <g> …) keep as-is.
  return path.includes('<') ? path : `<path d="${path}" />`;
};

/**
 * SVG symbol sheet — single file containing all icons as <symbol id="...">.
 * Consume with <svg><use href="sprite.svg#slug" /></svg>.
 */
export function buildSymbolSheet(icons: EmitIcon[]): string {
  const symbols = icons
    .map(
      (ic) =>
        `  <symbol id="${sanitizeId(ic.slug)}" viewBox="${ic.viewBox}">${innerSvgFor(ic)}</symbol>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
${symbols}
</svg>
`;
}

/**
 * Plain CSS sprite — utility classes using the symbol sheet as a background.
 * Each class maps to `background: url(sprite.svg#slug) no-repeat center/contain`.
 */
export function buildSpriteCss(icons: EmitIcon[], spritePath = 'sprite.svg'): string {
  const lines = icons.map((ic) => {
    const id = sanitizeId(ic.slug);
    return `.icon-${id}{background:url(${spritePath}#${id}) no-repeat center/contain;}`;
  });
  return `/* Generated icon utility classes — pair with sprite.svg */
.icon{display:inline-block;width:1em;height:1em;vertical-align:-.125em;color:currentColor;}
${lines.join('\n')}
`;
}

/**
 * README snippet for the sprite + CSS bundle.
 */
export function buildSpriteReadme(spritePath = 'sprite.svg'): string {
  return `# SVG sprite

Reference an icon by its symbol id:

\`\`\`html
<svg width="24" height="24" aria-hidden="true">
  <use href="${spritePath}#arrow-left" />
</svg>
\`\`\`

Or use the bundled utility classes:

\`\`\`html
<i class="icon icon-arrow-left" style="font-size:24px"></i>
\`\`\`
`;
}

/**
 * React component package — emits one .tsx file per icon plus a barrel index.
 * Components forward refs and accept all standard SVG props.
 */
export function buildReactPackage(icons: EmitIcon[]): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const seen = new Map<string, number>();

  const uniqueName = (raw: string) => {
    let name = toPascalCase(raw);
    const n = seen.get(name) ?? 0;
    seen.set(name, n + 1);
    return n === 0 ? name : `${name}${n + 1}`;
  };

  const exports: string[] = [];
  for (const ic of icons) {
    const componentName = uniqueName(ic.name || ic.slug);
    const fileName = `${componentName}.tsx`;
    const inner = innerSvgFor(ic).replace(/stroke-width/g, 'strokeWidth')
      .replace(/stroke-linecap/g, 'strokeLinecap')
      .replace(/stroke-linejoin/g, 'strokeLinejoin')
      .replace(/fill-rule/g, 'fillRule')
      .replace(/clip-rule/g, 'clipRule');
    const tsx = `import { forwardRef, type SVGProps } from 'react';

export const ${componentName} = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ width = 24, height = 24, fill = 'currentColor', ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${ic.viewBox}"
      width={width}
      height={height}
      fill={fill}
      aria-hidden="true"
      {...rest}
    >
      ${inner}
    </svg>
  ),
);
${componentName}.displayName = '${componentName}';

export default ${componentName};
`;
    files.push({ path: `react/${fileName}`, content: tsx });
    exports.push(`export { ${componentName} } from './${componentName}';`);
  }

  files.push({ path: 'react/index.ts', content: exports.join('\n') + '\n' });
  files.push({
    path: 'react/package.json',
    content: JSON.stringify(
      {
        name: '@brand/icons',
        version: '0.1.0',
        description: 'Brand icon React components',
        main: 'index.ts',
        types: 'index.ts',
        sideEffects: false,
        peerDependencies: { react: '>=18' },
      },
      null,
      2,
    ),
  });
  files.push({
    path: 'react/README.md',
    content: `# Brand icons (React)

\`\`\`tsx
import { ArrowLeft } from '@brand/icons';

<ArrowLeft className="text-primary" width={20} height={20} />
\`\`\`

Every component forwards refs and accepts all standard \`SVGProps<SVGSVGElement>\`.
`,
  });

  return files;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Phase 8 — Figma frames, SVG icon font, favicons                          */
/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Figma frame export — one SVG per icon, named with the convention
 * `Frame_<slug>.svg` recognised by popular Figma import plugins
 * (e.g. "SVG to Code", "Figma Icons"). Adds a manifest with frame names
 * so designers can rebuild a page of named 24×24 frames.
 */
export function buildFigmaPackage(
  icons: EmitIcon[],
  styledSvgFor: (ic: EmitIcon) => string,
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const frames: Array<{ name: string; file: string }> = [];
  for (const ic of icons) {
    const id = sanitizeId(ic.slug);
    const file = `figma/Frame_${id}.svg`;
    files.push({ path: file, content: styledSvgFor(ic) });
    frames.push({ name: `Frame_${id}`, file: `Frame_${id}.svg` });
  }
  files.push({
    path: 'figma/frames.json',
    content: JSON.stringify({ format: 'figma-frames', size: 24, frames }, null, 2),
  });
  files.push({
    path: 'figma/README.md',
    content: `# Figma frame export

Each SVG is a self-contained 24×24 frame. To rebuild a Figma page:

1. In Figma, install the **"Figma Icons"** or **"SVG Importer"** plugin.
2. Select the destination page, then run the plugin and drop the entire
   \`figma/\` folder (or select all \`Frame_*.svg\` files) onto it.
3. The plugin uses the file name as the frame name — frames will appear
   as \`Frame_<slug>\`, ready to publish as components.

\`frames.json\` lists every frame name + filename for scripted imports.
`,
  });
  return files;
}

/**
 * SVG icon font — single self-contained SVG font file mapping each icon
 * to a Private Use Area codepoint (U+E000+). Pair with the emitted CSS
 * to use as \`<i class="ico ico-<slug>"></i>\`. WOFF2 can be derived from
 * this source via fontforge/icomoon (see README).
 */
export function buildSvgIconFont(
  icons: EmitIcon[],
  fontFamily = 'BrandIcons',
): Array<{ path: string; content: string }> {
  const PUA_START = 0xe000;
  const glyphs: string[] = [];
  const cssRules: string[] = [];
  icons.forEach((ic, i) => {
    const cp = PUA_START + i;
    const id = sanitizeId(ic.slug);
    // SVG-font path data is rendered upside-down vs SVG; consumers usually
    // re-export via a font tool, so we emit the raw `d` and let the tool
    // handle the y-flip. This file is a portable source, not the final WOFF2.
    const d = ic.svgPath.includes('<')
      ? ic.svgPath.replace(/.*?d="([^"]+)".*/s, '$1')
      : ic.svgPath;
    glyphs.push(
      `    <glyph glyph-name="${id}" unicode="&#x${cp.toString(16)};" d="${d}" />`,
    );
    cssRules.push(
      `.ico-${id}::before{content:"\\${cp.toString(16)}";}`,
    );
  });

  const font = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${fontFamily}" horiz-adv-x="1024">
      <font-face font-family="${fontFamily}" units-per-em="1024" ascent="896" descent="-128" />
      <missing-glyph horiz-adv-x="1024" />
${glyphs.join('\n')}
    </font>
  </defs>
</svg>
`;

  const css = `@font-face{
  font-family:"${fontFamily}";
  src:url("./${fontFamily}.woff2") format("woff2"),
      url("./${fontFamily}.svg#${fontFamily}") format("svg");
  font-weight:normal;font-style:normal;font-display:swap;
}
.ico{font-family:"${fontFamily}";font-style:normal;font-weight:normal;
  display:inline-block;line-height:1;vertical-align:-.125em;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
${cssRules.join('\n')}
`;

  const readme = `# Icon font (${fontFamily})

This package contains the **source** \`${fontFamily}.svg\` font + matching
\`icons.css\`. Most browsers no longer render SVG fonts directly — convert
to WOFF2 in one of two ways:

**Option A — fontforge (CLI):**
\`\`\`bash
fontforge -lang=ff -c 'Open($1); Generate($2)' ${fontFamily}.svg ${fontFamily}.woff2
\`\`\`

**Option B — icomoon.io:** Import \`${fontFamily}.svg\`, then download the
generated WOFF2 and drop it next to \`icons.css\`.

Each icon is mapped to a Private Use Area codepoint starting at U+E000.
Usage:

\`\`\`html
<link rel="stylesheet" href="icons.css" />
<i class="ico ico-arrow-left" aria-hidden="true"></i>
\`\`\`
`;

  return [
    { path: `font/${fontFamily}.svg`, content: font },
    { path: 'font/icons.css', content: css },
    { path: 'font/README.md', content: readme },
  ];
}

/**
 * Favicon bundle — rasterizes a single "brand mark" icon at the standard
 * favicon sizes (16/32/48/180/192/512), plus a site.webmanifest and the
 * matching <link>/<meta> snippet for index.html. Caller supplies the
 * already-styled SVG to keep this function pure-string after rasterization.
 */
export async function buildFavicons(
  styledSvg: string,
  rasterize: (svg: string, size: number) => Promise<Blob>,
): Promise<Array<{ path: string; content: string | Blob }>> {
  const sizes = [16, 32, 48, 180, 192, 512];
  const files: Array<{ path: string; content: string | Blob }> = [];

  for (const px of sizes) {
    try {
      const blob = await rasterize(styledSvg, px);
      const name =
        px === 180
          ? 'apple-touch-icon.png'
          : px === 192
          ? 'android-chrome-192x192.png'
          : px === 512
          ? 'android-chrome-512x512.png'
          : `favicon-${px}x${px}.png`;
      files.push({ path: `favicons/${name}`, content: blob });
    } catch {
      // Skip individual size failures.
    }
  }

  files.push({ path: 'favicons/favicon.svg', content: styledSvg });

  files.push({
    path: 'favicons/site.webmanifest',
    content: JSON.stringify(
      {
        name: 'Brand',
        short_name: 'Brand',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
      },
      null,
      2,
    ),
  });

  files.push({
    path: 'favicons/README.md',
    content: `# Favicons

Drop the contents of this folder into your site root, then add to \`<head>\`:

\`\`\`html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
\`\`\`
`,
  });

  return files;
}

