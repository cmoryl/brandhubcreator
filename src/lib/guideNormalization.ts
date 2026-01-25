/**
 * Centralized guide data normalization utilities.
 * 
 * Legacy/public fetch paths can provide partial or malformed guide data.
 * These utilities ensure all guide fields have safe defaults to prevent
 * "Cannot read properties of undefined" crashes during render.
 */

import { 
  BaseGuide, 
  BrandGuide, 
  ProductGuide,
  SectionId, 
  DEFAULT_SECTION_ORDER, 
  DEFAULT_PAGE_SETTINGS,
  BrandSocialAssetSpec,
  BrandDisplayBannerSpec,
  TemplateSpec,
  RevenueDataPoint,
  BrandTypography,
  BrandTemplate,
  BrandBrochure,
  StatisticItem,
} from '@/types/brand';
import { 
  EventGuide, 
  EventSectionId, 
  DEFAULT_EVENT_SECTION_ORDER,
  DEFAULT_EVENT_DETAILS,
} from '@/types/event';

// ============================================================
// Core helper functions
// ============================================================

/** Safely convert any value to an array, returning fallback if not an array */
export const safeArray = <T>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

/** Safely convert any value to an object, returning fallback if not an object */
export const safeObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

/** Safely get a string value with fallback */
export const safeString = (value: unknown, fallback: string = ''): string =>
  typeof value === 'string' ? value : fallback;

// ============================================================
// Legacy field normalization
// ============================================================

/** Normalize legacy typography data (family -> fontFamily, role -> usage) */
export const normalizeTypography = (typography: unknown[]): BrandTypography[] =>
  safeArray(typography).map((t: any) => ({
    ...t,
    id: t.id || crypto.randomUUID(),
    name: t.name || t.role || 'Typography',
    fontFamily: t.fontFamily || t.family || 'Inter, sans-serif',
    weight: t.weight || '400',
    usage: t.usage || t.role || 'General',
  }));

/** Normalize legacy templates data (category -> fileType) */
export const normalizeTemplates = (templates: unknown[]): BrandTemplate[] =>
  safeArray(templates).map((t: any) => ({
    ...t,
    id: t.id || crypto.randomUUID(),
    name: t.name || 'Template',
    fileType: t.fileType || t.category || 'other',
    fileSize: t.fileSize || '',
  }));

/** Normalize legacy brochures data (imageUrl -> previewUrl, name -> title) */
export const normalizeBrochures = (brochures: unknown[]): BrandBrochure[] =>
  safeArray(brochures).map((b: any) => ({
    ...b,
    id: b.id || crypto.randomUUID(),
    title: b.title || b.name || 'Untitled',
    previewUrl: b.previewUrl || b.imageUrl || '',
    description: b.description || '',
  }));

// ============================================================
// Full guide normalization
// ============================================================

/** Default values for hero section */
const DEFAULT_HERO = { name: '', tagline: '', coverImage: '', logoUrl: '' };

/** Default values for tagline section */
const DEFAULT_TAGLINE = { primary: '', secondary: '', variations: [] };

/** Default values for identity section */
const DEFAULT_IDENTITY = { missionStatement: '', archetype: '', toneOfVoice: [] };

/** Default values for QR section */
const DEFAULT_QR = { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' };

/** Default values for atmosphere section */
const DEFAULT_ATMOSPHERE = { style: 'gradient' as const, animate: true, opacity: 0.5, blur: 0 };

/**
 * Normalize a raw guide object to ensure all fields have safe defaults.
 * Use this when loading guide data from any source (context, direct fetch, public endpoint).
 */
export function normalizeGuide(rawGuide: unknown): BaseGuide {
  const g: any = rawGuide ?? {};
  
  return {
    // Core fields
    id: g.id || '',
    type: g.type || 'brand',
    slug: g.slug || undefined,
    organizationId: g.organizationId ?? g.organization_id ?? null,
    isFavorite: g.isFavorite ?? g.is_favorite ?? false,
    isPublic: g.isPublic ?? g.is_public ?? false,
    
    // Section ordering
    sectionOrder: safeArray<SectionId>(g.sectionOrder).length > 0 
      ? g.sectionOrder 
      : DEFAULT_SECTION_ORDER,
    hiddenSections: safeArray<SectionId>(g.hiddenSections),
    sectionSubtitles: safeObject(g.sectionSubtitles, {}),
    sectionLayouts: safeObject(g.sectionLayouts, {}),
    pageSettings: safeObject(g.pageSettings, DEFAULT_PAGE_SETTINGS),
    
    // Core content
    hero: safeObject(g.hero, DEFAULT_HERO),
    tagline: safeObject(g.tagline, DEFAULT_TAGLINE),
    identity: safeObject(g.identity, DEFAULT_IDENTITY),
    
    // Arrays - normalized for legacy field names
    values: safeArray(g.values),
    logos: safeArray(g.logos),
    brandIcons: safeArray(g.brandIcons),
    colors: safeArray(g.colors),
    colorCombinations: safeArray(g.colorCombinations),
    gradients: safeArray(g.gradients),
    patterns: safeArray(g.patterns),
    typography: normalizeTypography(g.typography),
    textStyles: safeArray(g.textStyles),
    iconography: safeArray(g.iconography),
    socialIcons: safeArray(g.socialIcons),
    imagery: safeArray(g.imagery),
    social: safeArray(g.social),
    websites: safeArray(g.websites),
    signatures: safeArray(g.signatures),
    emailBanners: safeArray(g.emailBanners),
    videos: safeArray(g.videos),
    assets: safeArray(g.assets),
    misuse: safeArray(g.misuse),
    caseStudies: safeArray(g.caseStudies),
    brochures: normalizeBrochures(g.brochures),
    templates: normalizeTemplates(g.templates),
    services: safeArray(g.services),
    
    // Optional arrays with typed defaults
    socialAssets: safeArray<BrandSocialAssetSpec>(g.socialAssets),
    displayBanners: safeArray<BrandDisplayBannerSpec>(g.displayBanners),
    linkedGuides: safeArray(g.linkedGuides),
    templateSpecs: safeArray<TemplateSpec>(g.templateSpecs),
    revenueData: safeArray<RevenueDataPoint>(g.revenueData),
    statistics: safeArray<StatisticItem>(g.statistics),
    
    // Objects
    qr: safeObject(g.qr, DEFAULT_QR),
    atmosphere: safeObject(g.atmosphere, DEFAULT_ATMOSPHERE),
    
    // Misc
    infographicLayout: g.infographicLayout || 'infographic',
    defaultIconColor: g.defaultIconColor,
    
    // Timestamps
    createdAt: g.createdAt instanceof Date ? g.createdAt : (g.createdAt ? new Date(g.createdAt) : new Date()),
    updatedAt: g.updatedAt instanceof Date ? g.updatedAt : (g.updatedAt ? new Date(g.updatedAt) : new Date()),
    
    // Product-specific
    parentBrandId: g.parentBrandId ?? g.parent_brand_id ?? undefined,
  } as BaseGuide;
}

/**
 * Normalize a brand guide specifically
 */
export function normalizeBrandGuide(rawGuide: unknown): BrandGuide {
  const normalized = normalizeGuide(rawGuide);
  return { ...normalized, type: 'brand' } as BrandGuide;
}

/**
 * Normalize a product guide specifically
 */
export function normalizeProductGuide(rawGuide: unknown): ProductGuide {
  const normalized = normalizeGuide(rawGuide);
  return { ...normalized, type: 'product' } as ProductGuide;
}

/** Default event location */
const DEFAULT_EVENT_LOCATION = {
  venueName: '',
  address: '',
  city: '',
  country: '',
  venueMaps: [],
};

/**
 * Normalize an event guide specifically.
 * Ensures all event-specific fields have safe defaults.
 */
export function normalizeEventGuide(rawGuide: unknown): EventGuide {
  const g: any = rawGuide ?? {};
  const base = normalizeGuide(g);
  
  return {
    ...base,
    type: 'event',
    
    // Section ordering - use event-specific defaults
    sectionOrder: safeArray<EventSectionId>(g.sectionOrder).length > 0 
      ? g.sectionOrder 
      : DEFAULT_EVENT_SECTION_ORDER,
    hiddenSections: safeArray<EventSectionId>(g.hiddenSections),
    
    // Event-specific fields
    eventDetails: safeObject(g.eventDetails, { 
      ...DEFAULT_EVENT_DETAILS, 
      eventName: g.hero?.name || g.name || '' 
    }),
    eventLogos: safeArray(g.eventLogos),
    eventSignage: safeArray(g.eventSignage),
    eventBanners: safeArray(g.eventBanners),
    eventDigitalMaterials: safeArray(g.eventDigitalMaterials),
    eventSchedule: safeArray(g.eventSchedule),
    eventSpeakers: safeArray(g.eventSpeakers),
    eventSponsors: safeArray(g.eventSponsors),
    eventHistory: safeArray(g.eventHistory),
    eventVideos: safeArray(g.eventVideos),
    eventLocation: safeObject(g.eventLocation, DEFAULT_EVENT_LOCATION),
    
    // Parent reference for sub-events
    parentBrandId: g.parentBrandId ?? g.parent_brand_id ?? undefined,
  } as EventGuide;
}
