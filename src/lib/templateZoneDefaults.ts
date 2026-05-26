/**
 * Per-asset-type tailored default zone layouts for the shared
 * `TemplateCanvasEditor`. Each surface seeds with a sensible starter set so
 * new assets render with realistic content/positioning on first paint instead
 * of a blank canvas.
 *
 * All zone coordinates are percentages of the canvas. Callers should run the
 * returned array through `hydrateZoneDefaults` so brand logos + (optionally)
 * AI/lorem demo copy are applied uniformly across surfaces.
 */

import type { SocialTemplateZone, BrandLogo } from '@/types/brand';
import { hydrateZoneDefaults, type CanvasEditorZone } from '@/components/brand/templating/TemplateCanvasEditor';
import type { ZoneSeedMode } from '@/hooks/useZoneSeedMode';
import { safeUUID } from '@/lib/safeUUID';

export type TemplateAssetSurface =
  | 'caseStudy'
  | 'brochure'
  | 'social'
  | 'print'
  | 'banner'
  | 'generic';

interface DefaultsConfig {
  /** Aspect ratio string (e.g. '16 / 9') matching the surface's canvas. */
  aspect: string;
  /** Bare zone defs (no ids); ids are added by the helper below. */
  zones: SocialTemplateZone[];
}

// ---------------------------------------------------------------------------
// Per-surface zone recipes
// ---------------------------------------------------------------------------

const CASE_STUDY: DefaultsConfig = {
  aspect: '16 / 9',
  zones: [
    {
      type: 'logo',
      x: 4, y: 76,
      width: 22, height: 18,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'cta',
      x: 60, y: 6,
      width: 36, height: 12,
      label: 'CTA',
      content: 'Read the full case study',
      align: 'right',
    },
  ],
};

const BROCHURE: DefaultsConfig = {
  aspect: '3 / 4',
  zones: [
    {
      type: 'logo',
      x: 6, y: 5,
      width: 26, height: 12,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'text',
      x: 6, y: 22,
      width: 88, height: 18,
      label: 'Headline',
      align: 'left',
    },
    {
      type: 'text',
      x: 6, y: 44,
      width: 88, height: 36,
      label: 'Body copy',
      align: 'left',
    },
    {
      type: 'cta',
      x: 6, y: 84,
      width: 50, height: 10,
      label: 'CTA',
      align: 'left',
    },
  ],
};

const SOCIAL: DefaultsConfig = {
  aspect: '1 / 1',
  zones: [
    {
      type: 'logo',
      x: 6, y: 6,
      width: 24, height: 14,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'text',
      x: 6, y: 60,
      width: 88, height: 22,
      label: 'Headline',
      align: 'left',
    },
    {
      type: 'cta',
      x: 6, y: 84,
      width: 50, height: 10,
      label: 'CTA',
      align: 'left',
    },
  ],
};

const PRINT: DefaultsConfig = {
  aspect: '4 / 3',
  zones: [
    {
      type: 'logo',
      x: 6, y: 6,
      width: 26, height: 16,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'text',
      x: 6, y: 28,
      width: 88, height: 18,
      label: 'Headline',
      align: 'left',
    },
    {
      type: 'text',
      x: 6, y: 50,
      width: 88, height: 30,
      label: 'Body copy',
      align: 'left',
    },
    {
      type: 'cta',
      x: 6, y: 84,
      width: 50, height: 10,
      label: 'CTA',
      align: 'left',
    },
  ],
};

const BANNER: DefaultsConfig = {
  aspect: '4 / 1',
  zones: [
    {
      type: 'logo',
      x: 3, y: 22,
      width: 14, height: 56,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'text',
      x: 20, y: 24,
      width: 56, height: 52,
      label: 'Headline',
      align: 'left',
    },
    {
      type: 'cta',
      x: 78, y: 30,
      width: 19, height: 40,
      label: 'CTA',
      align: 'center',
    },
  ],
};

const GENERIC: DefaultsConfig = {
  aspect: '16 / 9',
  zones: [
    {
      type: 'logo',
      x: 4, y: 76,
      width: 22, height: 18,
      label: 'Brand mark',
      mediaFit: { fit: 'contain', focusX: 50, focusY: 50 },
    },
    {
      type: 'cta',
      x: 60, y: 6,
      width: 36, height: 12,
      label: 'CTA',
      align: 'right',
    },
  ],
};

const CONFIG_MAP: Record<TemplateAssetSurface, DefaultsConfig> = {
  caseStudy: CASE_STUDY,
  brochure: BROCHURE,
  social: SOCIAL,
  print: PRINT,
  banner: BANNER,
  generic: GENERIC,
};

// ---------------------------------------------------------------------------
// Print-type → surface map. Used by Event Print Collateral to choose between
// `print` (classic flyer / brochure / poster) and `banner` (long stationery,
// wayfinding etc.) when seeding a fresh print material.
// ---------------------------------------------------------------------------
const PRINT_TYPE_SURFACE: Record<string, TemplateAssetSurface> = {
  brochure: 'brochure',
  flyer: 'print',
  poster: 'print',
  catalog: 'brochure',
  postcard: 'print',
  folder: 'brochure',
  letterhead: 'print',
  envelope: 'banner',
  'business-card': 'banner',
  notepad: 'print',
  'with-compliments': 'banner',
  'venue-map': 'print',
  'floor-plan': 'print',
  'wayfinding-map': 'banner',
  'campus-map': 'print',
  'booth-map': 'print',
  'evacuation-map': 'print',
  'other-map': 'print',
  badge: 'social',
  'name-badge': 'social',
  lanyard: 'banner',
  wristband: 'banner',
  ticket: 'banner',
  'gift-box': 'print',
  'gift-bag': 'print',
  'swag-bag': 'print',
  'packaging-sleeve': 'banner',
  'packaging-label': 'social',
  'packaging-other': 'print',
  banner: 'banner',
};

export const surfaceForPrintType = (printType?: string): TemplateAssetSurface => {
  if (!printType) return 'print';
  return PRINT_TYPE_SURFACE[printType] || 'print';
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getDefaultAspectForSurface = (surface: TemplateAssetSurface): string =>
  CONFIG_MAP[surface].aspect;

/**
 * Build a fresh templated-zone array for the given asset surface, with brand
 * logos pre-applied and (per the user's `zoneSeedMode` preference) demo copy
 * seeded into text / CTA zones.
 */
export const buildSurfaceDefaultZones = (
  surface: TemplateAssetSurface,
  brandLogos?: BrandLogo[],
  seedMode: ZoneSeedMode = 'lorem',
): SocialTemplateZone[] => {
  const config = CONFIG_MAP[surface];
  const withIds = config.zones.map((z) => ({ ...z, id: safeUUID() })) as (SocialTemplateZone & {
    id: string;
  })[];
  return hydrateZoneDefaults(withIds as CanvasEditorZone[], brandLogos, seedMode).map(
    ({ id: _id, ...rest }) => rest as SocialTemplateZone,
  );
};
