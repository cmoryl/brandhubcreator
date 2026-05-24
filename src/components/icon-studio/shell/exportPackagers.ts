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
