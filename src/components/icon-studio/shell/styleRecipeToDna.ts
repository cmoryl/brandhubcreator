/**
 * styleRecipeToDna — projects a `BaseStyle` recipe + preview hint onto the
 * `BrandRestyleDNA` shape used by `applyBrandDnaToSvg` / `restyleBundledIcon`.
 *
 * Also declares the *preferred source* for each style:
 *   - Which packs render this style most natively (e.g. Phosphor for duotone,
 *     Material Symbols for rounded/sharp, Heroicons for outline/solid pairs).
 *   - Which variant suffixes to look for inside an icon name (outline, filled,
 *     duotone, …) so previews pull from native variants rather than always
 *     synthesizing from one source.
 *
 * Resolution order at render time:
 *   exact slug in preferred pack
 *   → slug + preferred-variant suffix in preferred pack
 *   → exact slug in fallback packs
 *   → slug + variant suffix in fallback packs
 *   → first hit in any preferred pack (so a tile is never empty).
 */

import type { BaseStyle } from './studioData';
import type { BrandRestyleDNA } from '@/lib/iconLibrary/restyle';

/** Universally-present icon slugs across most packs. */
export const BASE_SAMPLE_SLUGS = [
  'home',
  'search',
  'user',
  'settings',
  'heart',
  'star',
  'bell',
  'download',
] as const;

/** Packs whose SVGs ship multi-color art — unusable for monochrome styles. */
export const MULTICOLOR_PACK_IDS = new Set([
  'twemoji',
  'openmoji',
  'flag',
  'devicon',
  'cryptocurrency',
  'meteocons',
]);

export interface StyleSource {
  /** Ordered list of pack ids to try first. */
  packs: string[];
  /** Ordered list of variant tokens to prefer inside the icon name. */
  variants: string[];
  /** Plain-English label for "Sourced from {x}" captions. */
  label: string;
}

/**
 * Per-style source preferences. Anything not listed falls back to
 * `DEFAULT_SOURCE` so new BASE_STYLES still render real icons.
 */
const DEFAULT_SOURCE: StyleSource = {
  packs: ['lucide', 'heroicons', 'ph', 'tabler'],
  variants: [],
  label: 'Lucide · outline',
};

const STYLE_SOURCES: Record<string, StyleSource> = {
  outline: {
    packs: ['heroicons', 'lucide', 'tabler', 'iconoir'],
    variants: ['outline', 'outlined', 'thin', 'light'],
    label: 'Heroicons · outline',
  },
  filled: {
    packs: ['ph', 'material-symbols', 'fa6-solid', 'mingcute'],
    variants: ['fill', 'filled', 'solid'],
    label: 'Phosphor · fill',
  },
  duotone: {
    packs: ['ph', 'solar', 'hugeicons'],
    variants: ['duotone', 'two-tone', 'twotone'],
    label: 'Phosphor · duotone',
  },
  'mono-glyph': {
    packs: ['ph', 'material-symbols', 'fa6-solid'],
    variants: ['fill', 'filled', 'solid'],
    label: 'Phosphor · fill',
  },
  'soft-filled': {
    packs: ['ph', 'mingcute', 'solar'],
    variants: ['fill', 'filled'],
    label: 'Phosphor · fill',
  },
  glass: {
    packs: ['ph', 'solar', 'hugeicons'],
    variants: ['duotone', 'fill'],
    label: 'Phosphor · duotone',
  },
  'neon-line': {
    packs: ['lucide', 'tabler', 'iconoir'],
    variants: ['outline', 'thin'],
    label: 'Lucide · outline',
  },
  'enterprise-line': {
    packs: ['carbon', 'lucide', 'tabler'],
    variants: ['outline'],
    label: 'Carbon · outline',
  },
  'rounded-ui': {
    packs: ['material-symbols', 'ph', 'fluent'],
    variants: ['rounded', 'regular'],
    label: 'Material Symbols · rounded',
  },
  'sharp-ui': {
    packs: ['material-symbols', 'carbon', 'tabler'],
    variants: ['sharp', 'outline'],
    label: 'Material Symbols · sharp',
  },
  marketing: {
    packs: ['ph', 'solar', 'fa6-solid'],
    variants: ['fill', 'duotone'],
    label: 'Phosphor · fill',
  },
  presentation: {
    packs: ['ph', 'material-symbols'],
    variants: ['fill', 'filled'],
    label: 'Phosphor · fill',
  },
  'system-utility': {
    packs: ['lucide', 'tabler', 'radix-icons'],
    variants: ['outline'],
    label: 'Lucide · outline',
  },
  badge: {
    packs: ['ph', 'fa6-solid', 'material-symbols'],
    variants: ['fill', 'filled', 'solid'],
    label: 'Phosphor · fill',
  },
  micro: {
    packs: ['radix-icons', 'lucide', 'bytesize'],
    variants: ['outline'],
    label: 'Radix · outline',
  },
  data: {
    packs: ['lucide', 'tabler', 'carbon'],
    variants: ['outline'],
    label: 'Lucide · outline',
  },
  'ai-tech': {
    packs: ['ph', 'solar', 'hugeicons'],
    variants: ['duotone'],
    label: 'Phosphor · duotone',
  },
  compliance: {
    packs: ['ph', 'fa6-solid', 'material-symbols'],
    variants: ['fill', 'filled'],
    label: 'Phosphor · fill',
  },
  sticker: {
    packs: ['ph', 'mingcute'],
    variants: ['bold', 'fill'],
    label: 'Phosphor · bold',
  },
  neumorphic: {
    packs: ['ph', 'solar'],
    variants: ['fill', 'duotone'],
    label: 'Phosphor · fill',
  },
  chip: {
    packs: ['lucide', 'tabler'],
    variants: ['outline'],
    label: 'Lucide · outline',
  },
  ring: {
    packs: ['lucide', 'tabler', 'ph'],
    variants: ['outline', 'thin'],
    label: 'Lucide · outline',
  },
  paper: {
    packs: ['ph', 'solar'],
    variants: ['duotone', 'fill'],
    label: 'Phosphor · duotone',
  },
  embossed: {
    packs: ['ph', 'tabler'],
    variants: ['bold', 'outline'],
    label: 'Phosphor · bold',
  },
  risograph: {
    packs: ['ph', 'solar'],
    variants: ['duotone'],
    label: 'Phosphor · duotone',
  },
  pixel: {
    packs: ['pixelarticons'],
    variants: [],
    label: 'Pixelart · pixel',
  },
  sketch: {
    packs: ['hugeicons', 'iconoir', 'lucide'],
    variants: ['outline', 'thin'],
    label: 'Hugeicons · outline',
  },
  inverse: {
    packs: ['ph', 'material-symbols'],
    variants: ['fill', 'filled'],
    label: 'Phosphor · fill',
  },
  hatched: {
    packs: ['lucide', 'tabler'],
    variants: ['outline'],
    label: 'Lucide · outline',
  },
  aurora: {
    packs: ['ph', 'solar'],
    variants: ['duotone', 'fill'],
    label: 'Phosphor · duotone',
  },
  cyber: {
    packs: ['tabler', 'lucide'],
    variants: ['outline'],
    label: 'Tabler · outline',
  },
  'soft-shadow': {
    packs: ['ph', 'solar'],
    variants: ['fill', 'duotone'],
    label: 'Phosphor · fill',
  },
  ghost: {
    packs: ['lucide', 'iconoir', 'tabler'],
    variants: ['thin', 'light', 'outline'],
    label: 'Iconoir · thin',
  },
  editorial: {
    packs: ['ph', 'fa6-solid'],
    variants: ['bold'],
    label: 'Phosphor · bold',
  },
  'minimal-dot': {
    packs: ['radix-icons', 'lucide'],
    variants: ['outline'],
    label: 'Radix · outline',
  },
};

export function getStyleSource(style: BaseStyle): StyleSource {
  const src = STYLE_SOURCES[style.id] ?? DEFAULT_SOURCE;
  // Strip multicolor packs defensively — they would render unstyled.
  const packs = src.packs.filter((p) => !MULTICOLOR_PACK_IDS.has(p));
  return { ...src, packs: packs.length ? packs : DEFAULT_SOURCE.packs };
}

/**
 * Build a `BrandRestyleDNA` for a style + accent.
 *
 * The recipe's `stroke` / `fill` / `mono` flags drive `fillMode`. `accent`
 * (any CSS color string) is applied as the primary paint. `strokeWidth` is
 * lifted directly from `preview.strokeWidth` when present so the on-screen
 * weight matches the badge displayed below the tile.
 */
export function styleRecipeToDna(style: BaseStyle, accent: string): BrandRestyleDNA {
  const r = style.recipe;
  // Mono and filled styles project to fill. Pure-line styles stay stroke.
  // Combination styles (sticker = stroke + fill) prefer 'preserve' so each
  // source variant keeps its native paint distribution.
  let fillMode: BrandRestyleDNA['fillMode'];
  if (r.stroke && r.fill) fillMode = 'preserve';
  else if (r.fill || r.mono) fillMode = 'fill';
  else if (r.stroke) fillMode = 'stroke';
  else fillMode = 'preserve';

  return {
    strokeWidth: style.preview.strokeWidth ?? 1.75,
    strokeLinecap: style.id === 'sharp-ui' || style.id === 'editorial' ? 'square' : 'round',
    strokeLinejoin: style.id === 'sharp-ui' ? 'miter' : 'round',
    primaryColor: accent,
    fillMode,
  };
}
