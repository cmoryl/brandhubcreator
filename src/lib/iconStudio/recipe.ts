/**
 * Icon Recipe System
 *
 * Every generated icon should be produced from a reusable, versionable recipe.
 * Recipes are the spine of the Icon Studio production system — they power
 * regeneration, variant history, QA scoring (ground truth), brand training,
 * library reuse, and the export manifest.
 *
 * A recipe is a fully-specified, deterministic description of an icon's
 * visual rules. Two icons with the same recipe (+ same metaphor) should look
 * indistinguishable to the eye.
 */

import type { BrandIconography } from '@/types/brand';

export type IconStyle = 'outlined' | 'filled' | 'duotone' | 'soft' | 'sharp';
export type CornerRadius = 'sharp' | 'soft' | 'rounded';
export type EndCaps = 'butt' | 'round' | 'square';
export type DetailLevel = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
export type ColorMode = 'single-color' | 'two-tone' | 'duotone' | 'monochrome';
export type BackgroundMode = 'transparent' | 'tinted' | 'solid';

export interface IconRecipe {
  /** Recipe schema version — bump when shape changes. */
  version: 1;
  /** Brand the icon belongs to (display name). */
  brand: string;
  /** Industry (display name). Drives metaphor library. */
  industry: string;
  /** Visual style. */
  style: IconStyle;
  /** Canvas grid size — almost always 24. */
  grid: 16 | 20 | 24 | 32;
  /** Stroke width in grid units. */
  strokeWidth: number;
  /** Corner treatment. */
  cornerRadius: CornerRadius;
  /** Line end caps. */
  endCaps: EndCaps;
  /** Detail density. */
  detailLevel: DetailLevel;
  /** Color treatment. */
  colorMode: ColorMode;
  /** Primary hex color. */
  primaryColor: string;
  /** Secondary hex color (for duotone / two-tone). */
  secondaryColor?: string;
  /** Background treatment. */
  backgroundMode: BackgroundMode;
  /** What the icon should represent (1 short phrase). */
  metaphor: string;
  /** Things the AI must avoid. */
  avoid: string[];
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_AVOID = [
  'generic cloud shapes',
  'random circuit lines',
  'overly detailed scenes',
  'text or letters inside the icon',
  'photo-realistic rendering',
  'drop shadows or gradients (unless duotone)',
];

export const TRANSPERFECT_BLUE = '#139DD8';

/** Build a sensible default recipe for a brand + style + metaphor. */
export const buildRecipe = (input: {
  brand: string;
  industry: string;
  style?: IconStyle;
  primaryColor?: string;
  secondaryColor?: string;
  metaphor: string;
  avoid?: string[];
}): IconRecipe => {
  const style = input.style ?? 'outlined';
  return {
    version: 1,
    brand: input.brand,
    industry: input.industry,
    style,
    grid: 24,
    strokeWidth: style === 'filled' ? 0 : 1.75,
    cornerRadius: 'soft',
    endCaps: 'round',
    detailLevel: 'medium-low',
    colorMode:
      style === 'duotone' ? 'duotone' : style === 'filled' ? 'monochrome' : 'single-color',
    primaryColor: input.primaryColor ?? TRANSPERFECT_BLUE,
    secondaryColor: input.secondaryColor,
    backgroundMode: 'transparent',
    metaphor: input.metaphor,
    avoid: input.avoid ?? DEFAULT_AVOID,
  };
};

/* -------------------------------------------------------------------------- */
/* Recipe → prompt                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Render a recipe into a prompt fragment that's appended to the system prompt
 * used by the generate-icon-set edge function. Keep it terse and unambiguous
 * — the edge function already has its own master prompt.
 */
export const recipeToPrompt = (r: IconRecipe): string => {
  const lines = [
    `Brand: ${r.brand} (${r.industry})`,
    `Style: ${r.style}, ${r.detailLevel} detail, ${r.cornerRadius} corners, ${r.endCaps} caps`,
    `Grid: ${r.grid}x${r.grid}, stroke ${r.strokeWidth}`,
    `Color: ${r.colorMode}, primary ${r.primaryColor}${
      r.secondaryColor ? `, secondary ${r.secondaryColor}` : ''
    }`,
    `Background: ${r.backgroundMode}`,
    `Subject: ${r.metaphor}`,
  ];
  if (r.avoid.length) lines.push(`AVOID: ${r.avoid.join('; ')}`);
  return lines.join('\n');
};

/* -------------------------------------------------------------------------- */
/* Hashing & mutation                                                          */
/* -------------------------------------------------------------------------- */

/** Stable string hash of a recipe — used for variant deduplication. */
export const hashRecipe = (r: IconRecipe): string => {
  const str = JSON.stringify(r, Object.keys(r).sort());
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return `r${(h >>> 0).toString(36)}`;
};

/** Pre-built recipe mutations for the "Remix this system" feature. */
export const REMIX_MUTATIONS: Record<
  string,
  { label: string; mutate: (r: IconRecipe) => IconRecipe }
> = {
  filled: {
    label: 'Filled version',
    mutate: (r) => ({ ...r, style: 'filled', strokeWidth: 0, colorMode: 'monochrome' }),
  },
  duotone: {
    label: 'Duotone version',
    mutate: (r) => ({
      ...r,
      style: 'duotone',
      colorMode: 'duotone',
      secondaryColor: r.secondaryColor ?? '#0B6B96',
    }),
  },
  softer: {
    label: 'Softer',
    mutate: (r) => ({
      ...r,
      cornerRadius: 'rounded',
      strokeWidth: Math.max(1.25, r.strokeWidth - 0.25),
    }),
  },
  sharper: {
    label: 'Sharper',
    mutate: (r) => ({ ...r, cornerRadius: 'sharp', strokeWidth: r.strokeWidth + 0.25 }),
  },
  marketing: {
    label: 'Marketing version',
    mutate: (r) => ({ ...r, detailLevel: 'medium-high', backgroundMode: 'tinted' }),
  },
  ui: {
    label: 'UI version',
    mutate: (r) => ({ ...r, detailLevel: 'low', grid: 24, strokeWidth: 1.5 }),
  },
  presentation: {
    label: 'Presentation version',
    mutate: (r) => ({ ...r, detailLevel: 'high', grid: 32 }),
  },
};

/* -------------------------------------------------------------------------- */
/* Icon ↔ recipe attachment                                                    */
/* -------------------------------------------------------------------------- */

/** Store a recipe on a BrandIconography (best-effort — uses optional meta). */
export const attachRecipe = (
  icon: BrandIconography,
  recipe: IconRecipe,
): BrandIconography & { recipe: IconRecipe; recipeHash: string } => ({
  ...icon,
  recipe,
  recipeHash: hashRecipe(recipe),
});

/** Read the recipe from an icon, if previously attached. */
export const readRecipe = (icon: BrandIconography): IconRecipe | null =>
  (icon as any).recipe ?? null;
