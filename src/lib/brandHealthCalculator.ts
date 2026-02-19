/**
 * Brand Health Score Calculator
 * Calculates a completeness/health score based on guide_data content
 * Analyzes ALL sections for comprehensive brand health assessment
 *
 * IMPORTANT: Field names MUST match the actual guide_data JSONB keys
 * stored in the database (see BaseGuideData in src/types/brand.ts).
 */

// All weighted sections with their importance to brand completeness
const SECTION_WEIGHTS: Record<string, { weight: number; label: string }> = {
  // Core Identity (High Weight)
  hero: { weight: 10, label: 'Brand Name & Hero' },
  tagline: { weight: 6, label: 'Tagline' },
  identity: { weight: 8, label: 'Mission & Vision' },
  values: { weight: 8, label: 'Core Values' },
  services: { weight: 8, label: 'Services' },

  // Visual Identity (High Weight)
  colors: { weight: 10, label: 'Color Palette' },
  colorCombinations: { weight: 2, label: 'Color Combinations' },
  typography: { weight: 8, label: 'Typography' },
  logos: { weight: 10, label: 'Logo Assets' },
  brandIcons: { weight: 3, label: 'Brand Icons' },
  gradients: { weight: 2, label: 'Gradients' },
  patterns: { weight: 2, label: 'Patterns' },
  customShapes: { weight: 1, label: 'Custom Shapes' },
  iconography: { weight: 3, label: 'Iconography' },
  textstyles: { weight: 2, label: 'Text Styles' },

  // Digital Presence (Medium Weight)
  social: { weight: 5, label: 'Social Profiles' },
  socialIcons: { weight: 2, label: 'Social Icons' },
  socialAssets: { weight: 2, label: 'Social Assets' },
  socialMetrics: { weight: 2, label: 'Social Metrics' },
  websites: { weight: 3, label: 'Website' },
  qr: { weight: 2, label: 'QR Codes' },
  signatures: { weight: 2, label: 'Email Signatures' },

  // Content & Assets (Medium Weight)
  imagery: { weight: 3, label: 'Visual Direction' },
  imageAssets: { weight: 2, label: 'Image Assets' },
  videos: { weight: 2, label: 'Videos' },
  assets: { weight: 2, label: 'Asset Downloads' },
  misuse: { weight: 2, label: 'Anti-Patterns' },

  // Marketing Materials (Low-Medium Weight)
  templates: { weight: 3, label: 'Templates' },
  templateSpecs: { weight: 2, label: 'Template Specs' },
  presentationTemplates: { weight: 2, label: 'Presentation Templates' },
  brochures: { weight: 3, label: 'Digital Collateral' },
  displayBanners: { weight: 1, label: 'Display Banners' },

  // Business & Events (Low Weight)
  awards: { weight: 2, label: 'Awards & Recognition' },
  caseStudies: { weight: 2, label: 'Case Studies' },
  statistics: { weight: 2, label: 'By the Numbers' },
  revenueData: { weight: 1, label: 'Revenue Metrics' },
  locations: { weight: 2, label: 'Global Locations' },
  webinars: { weight: 2, label: 'Webinar Series' },
  insights: { weight: 2, label: 'Insights & Updates' },
  eventSignage: { weight: 1, label: 'Signage & Banners' },

  // Partnerships (Low Weight)
  clientLogos: { weight: 2, label: 'Client Logos' },
  sponsorLogos: { weight: 2, label: 'Sponsor Logos' },

  // Extended Features (Low Weight)
  linkedGuides: { weight: 1, label: 'Linked Guides' },
  emailBanners: { weight: 1, label: 'Email Banners' },

  // ─── Event-Specific Sections ───
  eventDetails: { weight: 8, label: 'Event Details' },
  eventLogos: { weight: 5, label: 'Event Logos' },
  eventSchedule: { weight: 6, label: 'Event Schedule' },
  eventSpeakers: { weight: 5, label: 'Speakers' },
  eventSponsors: { weight: 5, label: 'Sponsors' },
  eventHistory: { weight: 2, label: 'Event History' },
  eventVideos: { weight: 3, label: 'Event Videos' },
  eventLocation: { weight: 4, label: 'Venue & Location' },
  eventWebsites: { weight: 3, label: 'Event Website' },
  eventBanners: { weight: 2, label: 'Digital Collateral' },
  eventDigitalMaterials: { weight: 3, label: 'Digital Collateral' },
  eventPatterns: { weight: 2, label: 'Event Patterns' },
  subevents: { weight: 3, label: 'Regional Events' },
  sharedAssets: { weight: 2, label: 'Shared Assets' },
  partnerBooths: { weight: 3, label: 'Partner Booths' },
};

export interface SectionScore {
  section: string;
  label: string;
  weight: number;
  earned: number;
  filled: boolean;
  completeness: number; // 0-100 percentage
}

export interface HealthScoreResult {
  overallScore: number;
  filledSections: number;
  totalSections: number;
  breakdown: SectionScore[];
  categoryScores: {
    category: string;
    score: number;
    maxScore: number;
    sections: string[];
  }[];
}

type GuideData = Record<string, unknown>;

/**
 * Safely get an array from guide_data, returns [] if not an array
 */
function safeArray(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

/**
 * Check if an object has meaningful values in the given fields
 */
function countFilledFields(obj: Record<string, unknown> | undefined | null, fields: string[]): number {
  if (!obj) return 0;
  return fields.filter(field => {
    const value = obj[field];
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
}

/**
 * Score for array-based sections: 0 items = 0, 1 = 0.4, 2 = 0.6, 3+ = 1
 */
function scoreArray(arr: unknown[], thresholds: [number, number] = [2, 3]): number {
  if (arr.length === 0) return 0;
  if (arr.length >= thresholds[1]) return 1;
  if (arr.length >= thresholds[0]) return 0.7;
  return 0.4;
}

/**
 * Calculate section completeness (0-1) based on actual guide_data field names
 */
function calculateSectionCompleteness(
  guideData: GuideData,
  section: string
): number {
  switch (section) {
    // ─── Core Identity ───

    case 'hero': {
      const hero = guideData.hero as Record<string, unknown> | undefined;
      if (!hero?.name) return 0;
      const fields = ['name', 'description', 'tagline', 'imageUrl', 'coverImage', 'cardImage'];
      const filled = countFilledFields(hero, fields);
      // name + at least 2 others = full score
      if (filled >= 4) return 1;
      if (filled >= 3) return 0.8;
      if (filled >= 2) return 0.6;
      return 0.3;
    }

    case 'tagline': {
      const hero = guideData.hero as Record<string, unknown> | undefined;
      return hero?.tagline ? 1 : 0;
    }

    case 'identity': {
      const identity = guideData.identity as Record<string, unknown> | undefined;
      if (!identity) return 0;
      const fields = ['missionStatement', 'visionStatement', 'brandPromise', 'personality', 'voiceTone', 'archetype', 'brandStory'];
      const filled = countFilledFields(identity, fields);
      if (filled >= 4) return 1;
      if (filled >= 3) return 0.8;
      if (filled >= 2) return 0.6;
      if (filled >= 1) return 0.3;
      return 0;
    }

    case 'values': {
      const values = safeArray(guideData.values);
      if (values.length === 0) return 0;
      // Check if values have descriptions (depth scoring)
      const withDesc = values.filter((v: any) => v?.description).length;
      const hasDepth = withDesc >= Math.ceil(values.length * 0.5);
      if (values.length >= 4 && hasDepth) return 1;
      if (values.length >= 4) return 0.85;
      if (values.length >= 2) return 0.6;
      return 0.3;
    }

    case 'services': {
      const services = safeArray(guideData.services);
      if (services.length === 0) return 0;
      const withDesc = services.filter((s: any) => s?.description).length;
      const hasDepth = withDesc >= Math.ceil(services.length * 0.5);
      if (services.length >= 4 && hasDepth) return 1;
      if (services.length >= 4) return 0.85;
      if (services.length >= 2) return 0.6;
      return 0.3;
    }

    // ─── Visual Identity ───

    case 'colors': {
      const colors = safeArray(guideData.colors);
      if (colors.length === 0) return 0;
      if (colors.length >= 6) return 1;
      if (colors.length >= 4) return 0.8;
      if (colors.length >= 2) return 0.6;
      return 0.3;
    }

    case 'colorCombinations': {
      const combos = safeArray(guideData.colorCombinations);
      return combos.length > 0 ? 1 : 0;
    }

    case 'typography': {
      const typography = safeArray(guideData.typography);
      if (typography.length === 0) return 0;
      if (typography.length >= 3) return 1;
      if (typography.length >= 2) return 0.7;
      return 0.5;
    }

    case 'logos': {
      // guide_data.logos is an ARRAY of logo objects (not a single object)
      const logos = safeArray(guideData.logos);
      if (logos.length === 0) return 0;
      if (logos.length >= 4) return 1;
      if (logos.length >= 2) return 0.7;
      return 0.4;
    }

    case 'brandIcons': {
      // guide_data.brandIcons is an ARRAY
      const icons = safeArray(guideData.brandIcons);
      return icons.length > 0 ? 1 : 0;
    }

    case 'textstyles': {
      const textStyles = safeArray(guideData.textStyles);
      return textStyles.length > 0 ? 1 : 0;
    }

    case 'iconography': {
      // guide_data.iconography is an array
      const icons = safeArray(guideData.iconography);
      if (icons.length === 0) return 0;
      if (icons.length >= 5) return 1;
      if (icons.length >= 3) return 0.7;
      return 0.4;
    }

    // ─── Digital Presence ───

    case 'social': {
      const social = safeArray(guideData.social);
      if (social.length === 0) return 0;
      if (social.length >= 4) return 1;
      if (social.length >= 2) return 0.7;
      return 0.4;
    }

    case 'websites': {
      // guide_data.websites is an ARRAY of website link objects
      const websites = safeArray(guideData.websites);
      return websites.length > 0 ? 1 : 0;
    }

    case 'qr': {
      // guide_data.qr is an OBJECT with defaultUrl, fgColor, bgColor
      const qr = guideData.qr as Record<string, unknown> | undefined;
      if (!qr) return 0;
      return qr.defaultUrl ? 1 : 0;
    }

    case 'signatures': {
      const sigs = safeArray(guideData.signatures);
      if (sigs.length === 0) return 0;
      // Check signature quality: has style config?
      const withStyle = sigs.filter((s: any) => s?.style).length;
      if (sigs.length >= 2 && withStyle >= 1) return 1;
      if (sigs.length >= 1) return 0.7;
      return 0.4;
    }

    // ─── Content & Assets ───

    case 'imagery': {
      // guide_data.imagery is an ARRAY of imagery items
      const imagery = safeArray(guideData.imagery);
      if (imagery.length === 0) return 0;
      if (imagery.length >= 3) return 1;
      return 0.5;
    }

    case 'misuse': {
      const misuse = safeArray(guideData.misuse);
      return misuse.length > 0 ? 1 : 0;
    }

    // ─── Business & Events ───

    case 'statistics': {
      // was 'bythenumbers' but actual field is 'statistics'
      const stats = safeArray(guideData.statistics);
      if (stats.length === 0) return 0;
      if (stats.length >= 4) return 1;
      if (stats.length >= 2) return 0.6;
      return 0.3;
    }

    case 'revenueData': {
      const revenue = safeArray(guideData.revenueData);
      return revenue.length > 0 ? 1 : 0;
    }

    case 'locations': {
      const locations = safeArray(guideData.locations);
      const useShared = guideData.useSharedLocations;
      if (useShared) return 1;
      return locations.length > 0 ? 1 : 0;
    }

    // ─── Generic array-based sections ───
    // These all follow the same pattern: check the array length
    case 'gradients':
    case 'patterns':
    case 'customShapes':
    case 'socialIcons':
    case 'socialAssets':
    case 'templates':
    case 'templateSpecs':
    case 'presentationTemplates':
    case 'brochures':
    case 'displayBanners':
    case 'caseStudies':
    case 'awards':
    case 'webinars':
    case 'insights':
    case 'eventSignage': {
      const signageArr = safeArray(guideData[section]);
      const linkedBooths = safeArray(guideData.linkedBooths);
      const combined = signageArr.length + linkedBooths.length;
      if (combined === 0) return 0;
      if (combined >= 3) return 1;
      if (combined >= 2) return 0.7;
      return 0.4;
    }
    case 'clientLogos':
    case 'sponsorLogos':
    case 'linkedGuides':
    case 'emailBanners':
    case 'videos':
    case 'assets':
    case 'imageAssets':
    case 'eventLogos':
    case 'eventBanners':
    case 'eventDigitalMaterials':
    case 'eventVideos':
    case 'eventHistory':
    case 'eventPatterns':
    case 'sharedAssets':
    case 'partnerBooths':
    case 'eventWebsites': {
      const arr = safeArray(guideData[section]);
      return scoreArray(arr);
    }

    // ─── Event-Specific Sections ───

    case 'eventDetails': {
      const details = guideData.eventDetails as Record<string, unknown> | undefined;
      if (!details) return 0;
      const fields = ['eventName', 'startDate', 'endDate', 'venue', 'city', 'country', 'description', 'format'];
      const filled = countFilledFields(details, fields);
      if (filled >= 5) return 1;
      if (filled >= 3) return 0.7;
      if (filled >= 1) return 0.3;
      return 0;
    }

    case 'eventSchedule': {
      const schedule = safeArray(guideData.eventSchedule);
      if (schedule.length === 0) return 0;
      if (schedule.length >= 5) return 1;
      if (schedule.length >= 3) return 0.7;
      return 0.4;
    }

    case 'eventSpeakers': {
      const speakers = safeArray(guideData.eventSpeakers);
      if (speakers.length === 0) return 0;
      if (speakers.length >= 4) return 1;
      if (speakers.length >= 2) return 0.7;
      return 0.4;
    }

    case 'eventSponsors': {
      const sponsors = safeArray(guideData.eventSponsors);
      if (sponsors.length === 0) return 0;
      if (sponsors.length >= 3) return 1;
      if (sponsors.length >= 1) return 0.5;
      return 0;
    }

    case 'eventLocation': {
      const loc = guideData.eventLocation as Record<string, unknown> | undefined;
      if (!loc) return 0;
      const fields = ['venue', 'address', 'city', 'country', 'mapUrl', 'directions'];
      const filled = countFilledFields(loc, fields);
      if (filled >= 3) return 1;
      if (filled >= 2) return 0.7;
      if (filled >= 1) return 0.4;
      return 0;
    }

    case 'subevents': {
      const subs = safeArray(guideData.subEvents || guideData.subevents);
      return subs.length > 0 ? 1 : 0;
    }

    case 'socialMetrics': {
      const metrics = guideData.socialMetrics as Record<string, unknown> | undefined;
      const snapshots = safeArray((metrics as any)?.snapshots || guideData.socialMetricsSnapshots);
      return snapshots.length > 0 ? 1 : 0;
    }

    default:
      return 0;
  }
}

/**
 * Maps SectionId values (used in hiddenSections) to SECTION_WEIGHTS keys (guide_data JSONB keys).
 * Only entries where the two differ need to be listed here.
 */
const SECTION_ID_TO_WEIGHT_KEY: Record<string, string> = {
  brandicon: 'brandIcons',
  socialicons: 'socialIcons',
  socialassets: 'socialAssets',
  socialmetrics: 'socialMetrics',
  website: 'websites',
  imageassets: 'imageAssets',
  bythenumbers: 'statistics',
  templatespecs: 'templateSpecs',
  presentations: 'presentationTemplates',
  brochures: 'brochures',
  casestudies: 'caseStudies',
  sponsorlogos: 'sponsorLogos',
  clientlogos: 'clientLogos',
  eventsignage: 'eventSignage',
  revenue: 'revenueData',
  universe: 'linkedGuides',
  // Event-specific section ID → weight key mappings
  eventdetails: 'eventDetails',
  eventlogos: 'eventLogos',
  eventschedule: 'eventSchedule',
  eventspeakers: 'eventSpeakers',
  eventsponsors: 'eventSponsors',
  eventhistory: 'eventHistory',
  eventvideos: 'eventVideos',
  eventlocation: 'eventLocation',
  eventwebsites: 'eventWebsites',
  eventbanners: 'eventBanners',
  eventdigital: 'eventDigitalMaterials',
  eventpatterns: 'eventPatterns',
  partnerbooths: 'partnerBooths',
  subevents: 'subevents',
  sharedassets: 'sharedAssets',
  // 'products' and 'events' are nav-only sections with no weight key
};

// Sections that only apply to events (excluded from brand/product scoring)
const EVENT_ONLY_SECTIONS = new Set([
  'eventDetails', 'eventLogos', 'eventSchedule', 'eventSpeakers', 'eventSponsors',
  'eventHistory', 'eventVideos', 'eventLocation', 'eventWebsites', 'eventBanners',
  'eventDigitalMaterials', 'eventPatterns', 'subevents', 'sharedAssets', 'partnerBooths',
  'eventSignage',
]);

// Sections that only apply to brands/products (excluded from event scoring)
const BRAND_ONLY_SECTIONS = new Set([
  'webinars', 'locations', 'revenueData', 'customShapes',
  'websites', 'signatures', 'qr', 'displayBanners', 'caseStudies',
  'emailBanners', 'statistics', 'iconography', 'socialIcons', 'brandIcons',
  'templates', 'presentationTemplates', 'brochures',
]);

/**
 * Calculate brand health score from guide_data
 * @param hiddenSections - sections hidden by the admin; excluded from scoring
 * @param entityType - 'brand' | 'product' | 'event' to filter relevant sections
 * @param sectionOrder - optional ordered list of sidebar section IDs; when provided, ONLY
 *   sections present in this list (and not hidden) are scored. This ensures the health
 *   checklist matches the sidebar exactly.
 */
export function calculateBrandHealth(
  guideData: GuideData | null | undefined,
  hiddenSections?: string[] | null,
  entityType?: 'brand' | 'product' | 'event',
  sectionOrder?: string[] | null
): HealthScoreResult {
  // Build the set of WEIGHT keys that correspond to hidden SectionIds
  const hiddenWeightKeys = new Set(
    (hiddenSections ?? []).map(id => SECTION_ID_TO_WEIGHT_KEY[id] ?? id)
  );

  // When a sectionOrder is provided, build a whitelist of weight keys from it.
  // This guarantees the health score only counts sections visible in the sidebar.
  let allowedByOrder: Set<string> | null = null;
  if (sectionOrder && sectionOrder.length > 0) {
    allowedByOrder = new Set(
      sectionOrder.map(id => SECTION_ID_TO_WEIGHT_KEY[id] ?? id)
    );
  }

  // Filter sections by entity type relevance (fallback when no sectionOrder)
  const excludeByType = entityType === 'event' ? BRAND_ONLY_SECTIONS
    : (entityType === 'brand' || entityType === 'product') ? EVENT_ONLY_SECTIONS
    : new Set<string>();

  // Only count sections that are NOT hidden and relevant to the entity type
  const activeSections = Object.entries(SECTION_WEIGHTS).filter(([key]) => {
    if (hiddenWeightKeys.has(key)) return false;
    // If sectionOrder whitelist exists, only include sections in it
    if (allowedByOrder) return allowedByOrder.has(key);
    // Otherwise fall back to entity-type exclusion
    return !excludeByType.has(key);
  });
  const totalSections = activeSections.length;

  if (!guideData) {
    return {
      overallScore: 0,
      filledSections: 0,
      totalSections,
      breakdown: [],
      categoryScores: [],
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  let filledSections = 0;
  const breakdown: SectionScore[] = [];

  // Calculate each section's score (skip hidden sections)
  for (const [section, config] of activeSections) {
    const completeness = calculateSectionCompleteness(guideData, section);
    const earned = config.weight * completeness;
    const filled = completeness > 0;

    totalWeight += config.weight;
    earnedWeight += earned;
    if (filled) filledSections++;

    breakdown.push({
      section,
      label: config.label,
      weight: config.weight,
      earned,
      filled,
      completeness: Math.round(completeness * 100),
    });
  }

  // Calculate category scores
  const categories = [
    { name: 'Core Identity', sections: ['hero', 'tagline', 'identity', 'values', 'services'] },
    { name: 'Visual Identity', sections: ['colors', 'colorCombinations', 'typography', 'logos', 'brandIcons', 'gradients', 'patterns', 'customShapes', 'iconography', 'textstyles'] },
    { name: 'Digital Presence', sections: ['social', 'socialIcons', 'socialAssets', 'socialMetrics', 'websites', 'qr', 'signatures'] },
    { name: 'Content & Assets', sections: ['imagery', 'imageAssets', 'videos', 'assets', 'misuse'] },
    { name: 'Marketing Materials', sections: ['templates', 'templateSpecs', 'presentationTemplates', 'brochures', 'displayBanners'] },
    { name: 'Business & Events', sections: ['awards', 'caseStudies', 'statistics', 'revenueData', 'locations', 'webinars', 'insights', 'eventSignage'] },
    { name: 'Partnerships', sections: ['clientLogos', 'sponsorLogos'] },
    { name: 'Extended Features', sections: ['linkedGuides', 'emailBanners'] },
    // Event-specific categories (only score if sections exist in guide)
    { name: 'Event Core', sections: ['eventDetails', 'eventLocation', 'eventSchedule', 'eventSpeakers', 'subevents'] },
    { name: 'Event Branding', sections: ['eventLogos', 'eventBanners', 'eventDigitalMaterials', 'eventPatterns', 'eventVideos', 'eventWebsites'] },
    { name: 'Event Partners', sections: ['eventSponsors', 'partnerBooths', 'sharedAssets', 'eventHistory'] },
  ];

  const categoryScores = categories.map(cat => {
    const sectionScores = breakdown.filter(b => cat.sections.includes(b.section));
    const maxScore = sectionScores.reduce((sum, s) => sum + s.weight, 0);
    const score = sectionScores.reduce((sum, s) => sum + s.earned, 0);
    return {
      category: cat.name,
      score: Math.round(score * 10) / 10,
      maxScore,
      sections: cat.sections,
    };
  });

  const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    overallScore,
    filledSections,
    totalSections,
    breakdown,
    categoryScores,
  };
}

/**
 * Get a human-readable health status
 */
export function getHealthStatus(score: number): 'excellent' | 'good' | 'needs-work' | 'incomplete' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 40) return 'needs-work';
  return 'incomplete';
}

/**
 * Get trend based on comparing current to previous score
 */
export function getHealthTrend(currentScore: number, previousScore?: number): 'up' | 'down' | 'stable' {
  if (previousScore === undefined) return 'stable';
  if (currentScore > previousScore) return 'up';
  if (currentScore < previousScore) return 'down';
  return 'stable';
}

/**
 * Get priority sections to improve (unfilled sections sorted by weight)
 */
export function getPrioritySections(result: HealthScoreResult, limit = 5): SectionScore[] {
  return result.breakdown
    .filter(s => s.completeness < 100)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

/**
 * Get completion suggestions based on missing high-value sections
 */
export function getCompletionSuggestions(result: HealthScoreResult): string[] {
  const suggestions: string[] = [];
  const priority = getPrioritySections(result, 3);

  for (const section of priority) {
    if (section.completeness === 0) {
      suggestions.push(`Add ${section.label.toLowerCase()} to significantly improve your brand score`);
    } else if (section.completeness < 70) {
      suggestions.push(`Complete ${section.label.toLowerCase()} (currently ${section.completeness}% done)`);
    }
  }

  return suggestions;
}
