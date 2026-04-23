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
  RevenueChartColors,
  ChartThemeSettings,
  BrandTypography,
  BrandTemplate,
  BrandBrochure,
  StatisticItem,
  BrandWebinar,
  BrandAward,
  ImageAsset,
  ClientLogo,
  SponsorLogo,
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
// Linked guides normalization (critical for suite hierarchies)
// ============================================================

/**
 * Normalizes legacy/restored linkedGuides formats to a consistent shape.
 *
 * Supported inputs:
 * - { id, type, name, slug }
 * - legacy: { guideId, guideType } (optionally with name/slug)
 * - legacy snake_case: { guide_id, guide_type }
 * - string ids (treated as id)
 */
export type NormalizedLinkedGuide = {
  id: string;
  type?: string;
  name?: string;
  slug?: string;
  coverImage?: string;
  accentColor?: string;
  region?: string;
  location?: string;
  dates?: string;
  venue?: string;
  attendees?: number;
  cardImage?: string;
};

export const normalizeLinkedGuides = (linkedGuides: unknown): NormalizedLinkedGuide[] => {
  const arr = safeArray<any>(linkedGuides);

  return arr
    .map((g: any): NormalizedLinkedGuide | null => {
      if (!g) return null;
      if (typeof g === 'string') {
        const id = g.trim();
        return id ? { id } : null;
      }

      if (typeof g !== 'object' || Array.isArray(g)) return null;

      const id = safeString(g.id ?? g.guideId ?? g.guide_id).trim();
      if (!id) return null;

      const type = safeString(g.type ?? g.guideType ?? g.guide_type, undefined as any);
      const name = safeString(g.name, undefined as any);
      const slug = safeString(g.slug, undefined as any);

      // Preserve rich metadata for sub-event/sub-product card rendering
      const result: NormalizedLinkedGuide = { id };
      if (type) result.type = type;
      if (name) result.name = name;
      if (slug) result.slug = slug;
      if (g.coverImage) result.coverImage = String(g.coverImage);
      if (g.cardImage) result.cardImage = String(g.cardImage);
      if (g.accentColor) result.accentColor = String(g.accentColor);
      if (g.region) result.region = String(g.region);
      if (g.location) result.location = String(g.location);
      if (g.dates) result.dates = String(g.dates);
      if (g.venue) result.venue = String(g.venue);
      if (g.attendees != null) result.attendees = Number(g.attendees);

      return result;
    })
    .filter((x): x is NormalizedLinkedGuide => Boolean(x));
};

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
    // Explicitly preserve optional fields that may be lost during normalization
    previewText: t.previewText || undefined,
    downloadUrl: t.downloadUrl || undefined,
    role: t.role || undefined,
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

import { BrandGradient } from '@/types/brand';

/** 
 * Normalize legacy gradients data (angle + colors array -> css string).
 * Legacy format: { id, name, angle: 135, colors: ['#fff', '#000'] }
 * New format: { id, name, css: 'linear-gradient(135deg, #fff 0%, #000 100%)' }
 */
export const normalizeGradients = (gradients: unknown[]): BrandGradient[] =>
  safeArray(gradients).map((g: any) => {
    // If already has css property, just ensure id exists
    if (g.css) {
      return {
        id: String(g.id || crypto.randomUUID()),
        name: g.name || 'Gradient',
        css: g.css,
      };
    }
    
    // Legacy format: angle + colors array
    if (g.colors && Array.isArray(g.colors) && g.colors.length > 0) {
      const angle = typeof g.angle === 'number' ? g.angle : 135;
      const colorStops = g.colors.map((color: string, index: number) => {
        const position = Math.round((index / (g.colors.length - 1)) * 100);
        return `${color} ${position}%`;
      }).join(', ');
      
      return {
        id: String(g.id || crypto.randomUUID()),
        name: g.name || 'Gradient',
        css: `linear-gradient(${angle}deg, ${colorStops})`,
      };
    }
    
    // Fallback: return with default gradient
    return {
      id: String(g.id || crypto.randomUUID()),
      name: g.name || 'Gradient',
      css: g.css || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
  });

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
    logoDownloadLinks: safeArray(g.logoDownloadLinks),
    brandIcons: safeArray(g.brandIcons),
    colors: safeArray(g.colors),
    colorCombinations: safeArray(g.colorCombinations),
    gradients: normalizeGradients(g.gradients),
    patterns: safeArray(g.patterns),
    typography: normalizeTypography(g.typography),
    textStyles: safeArray(g.textStyles),
    iconography: safeArray(g.iconography),
    socialIcons: safeArray(g.socialIcons),
    imagery: safeArray(g.imagery),
    social: safeArray(g.social),
    websites: safeArray(g.websites).map((w: any) => ({
      ...w,
      // Strip base64 data URIs from screenshots to prevent guide_data bloat
      screenshotUrl: w?.screenshotUrl?.startsWith('data:') ? undefined : w?.screenshotUrl,
    })),
    signatures: safeArray(g.signatures).map((s: any) => ({
      ...s,
      id: s.id || crypto.randomUUID(),
      socialLinks: Array.isArray(s.socialLinks) ? s.socialLinks : undefined,
      style: s.style && typeof s.style === 'object' ? s.style : undefined,
    })),
    emailBanners: safeArray(g.emailBanners),
    videos: safeArray(g.videos),
    assets: safeArray(g.assets),
    imageAssets: safeArray<ImageAsset>(g.imageAssets),
    misuse: safeArray(g.misuse),
    caseStudies: safeArray(g.caseStudies),
    brochures: normalizeBrochures(g.brochures),
    templates: normalizeTemplates(g.templates),
    services: safeArray(g.services),
    
    // Optional arrays with typed defaults
    socialAssets: safeArray<BrandSocialAssetSpec>(g.socialAssets),
    displayBanners: safeArray<BrandDisplayBannerSpec>(g.displayBanners),
    // Critical: suite hierarchy must survive restores/backups even if legacy keys return
    linkedGuides: normalizeLinkedGuides(g.linkedGuides),
    templateSpecs: safeArray<TemplateSpec>(g.templateSpecs),
    revenueData: safeArray<RevenueDataPoint>(g.revenueData),
    revenueChartColors: g.revenueChartColors as RevenueChartColors | undefined,
    chartTheme: g.chartTheme as ChartThemeSettings | undefined,
    statistics: safeArray<StatisticItem>(g.statistics),
    webinars: safeArray<BrandWebinar>(g.webinars),
    awards: safeArray<BrandAward>(g.awards),
    sponsorLogos: safeArray<SponsorLogo>(g.sponsorLogos),
    clientLogos: safeArray<ClientLogo>(g.clientLogos),
    customShapes: safeArray(g.customShapes),
    
    // Objects
    qr: safeObject(g.qr, DEFAULT_QR),
    atmosphere: safeObject(g.atmosphere, DEFAULT_ATMOSPHERE),
    adminCustomStyle: g.adminCustomStyle,
    
    // Misc
    infographicLayout: g.infographicLayout || 'infographic',
    defaultIconColor: g.defaultIconColor,
    shareToken: g.shareToken ?? g.share_token ?? null,
    
    // Insights
    insights: safeArray(g.insights),
    insightsLayout: g.insightsLayout,
    
    // Locations
    locations: safeArray(g.locations),
    locationStats: safeArray(g.locationStats),
    locationsSectionTitle: g.locationsSectionTitle,
    locationsSectionDescription: g.locationsSectionDescription,
    useSharedLocations: g.useSharedLocations ?? false,
    mapTheme: g.mapTheme,
    
    // Event Signage & Presentations
    eventSignage: safeArray(g.eventSignage),
    linkedBooths: safeArray(g.linkedBooths),
    presentationTemplates: safeArray(g.presentationTemplates),
    
    // Studios
    studios: safeArray(g.studios),
    
    // Approved Imagery (curated image library)
    approvedImagery: g.approvedImagery && typeof g.approvedImagery === 'object'
      ? { sections: safeArray((g.approvedImagery as any).sections) }
      : undefined,

    // Brand Visuals bundle (Foundation/Collaborate/Transform static + motion assets)
    brandVisuals: g.brandVisuals && typeof g.brandVisuals === 'object'
      ? {
          staticAssets: safeArray((g.brandVisuals as any).staticAssets),
          motionAssets: safeArray((g.brandVisuals as any).motionAssets),
        }
      : undefined,
    
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
    logoDownloadLinks: safeArray(g.logoDownloadLinks),
    eventSignage: safeArray(g.eventSignage),
    eventBanners: safeArray(g.eventBanners),
    eventDigitalMaterials: safeArray(g.eventDigitalMaterials),
    eventPrintMaterials: safeArray(g.eventPrintMaterials),
    eventSponsorshipMaterials: safeArray(g.eventSponsorshipMaterials),
    eventInfographics: safeArray(g.eventInfographics),
    eventApplications: safeArray(g.eventApplications),
    eventDigitalAssets: safeArray(g.eventDigitalAssets),
    eventSchedule: safeArray(g.eventSchedule),
    eventSpeakers: safeArray(g.eventSpeakers),
    eventSponsors: safeArray(g.eventSponsors).map((s: any) => ({
      ...s,
      logoVariants: safeArray(s.logoVariants),
    })),
    eventHistory: safeArray(g.eventHistory),
    eventVideos: safeArray(g.eventVideos),
    eventLocation: safeObject(g.eventLocation, DEFAULT_EVENT_LOCATION),
    
    // Partner booths & shared assets (master events)
    partnerBooths: safeArray(g.partnerBooths),
    sharedAssets: safeArray(g.sharedAssets),
    
    // Partner assets (shared with brand guides)
    sponsorLogos: safeArray<SponsorLogo>(g.sponsorLogos),
    clientLogos: safeArray<ClientLogo>(g.clientLogos),
    
    // Collateral & presentations
    presentationTemplates: safeArray(g.presentationTemplates),
    presentations: safeArray(g.presentations),
    templateSpecs: safeArray(g.templateSpecs),
    caseStudies: safeArray(g.caseStudies),
    brochures: safeArray(g.brochures),
    templates: safeArray(g.templates),
    services: safeArray(g.services),
    
    // Insights & Updates
    insights: safeArray(g.insights),
    insightsLayout: g.insightsLayout || undefined,
    insightsAccessCode: g.insightsAccessCode || undefined,
    
    // Locations
    locations: safeArray(g.locations),
    locationStats: safeArray(g.locationStats),
    
    // Data & Analytics
    revenueData: safeArray(g.revenueData),
    statistics: safeArray(g.statistics),
    infographicLayout: g.infographicLayout || 'cards',
    
    // Parent reference for sub-events
    parentBrandId: g.parentBrandId ?? g.parent_brand_id ?? undefined,
  } as EventGuide;
}
