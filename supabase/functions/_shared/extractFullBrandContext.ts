/**
 * Shared full brand context extractor.
 * All AI edge functions import this to get 100% section coverage.
 * Keeps output concise with slicing to stay within token/memory limits.
 */

export interface FullBrandContext {
  text: string;
  sectionsCovered: string[];
  sectionsWithData: string[];
}

const ALL_SECTIONS = [
  'hero', 'tagline', 'identity', 'values', 'colors', 'gradients', 'patterns',
  'typography', 'textStyles', 'logos', 'brandIcons', 'iconography', 'socialIcons',
  'imagery', 'social', 'websites', 'signatures', 'emailBanners', 'videos',
  'assets', 'imageAssets', 'misuse', 'caseStudies', 'brochures', 'templates',
  'services', 'socialAssets', 'displayBanners', 'templateSpecs', 'statistics',
  'webinars', 'awards', 'sponsorLogos', 'clientLogos', 'customShapes',
  'qr', 'atmosphere', 'insights', 'locations', 'eventSignage',
  'presentationTemplates', 'colorCombinations', 'revenueData',
  // Event-specific
  'eventDetails', 'eventLogos', 'eventBanners', 'eventDigitalMaterials',
  'eventSchedule', 'eventSpeakers', 'eventSponsors', 'eventHistory',
  'eventVideos', 'eventLocation',
] as const;

function safeArr(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function safeObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
}

function summarizeItems(items: any[], nameKey: string | string[], max = 5): string {
  const keys = Array.isArray(nameKey) ? nameKey : [nameKey];
  return items.slice(0, max).map(item => {
    for (const k of keys) {
      if (item[k]) return String(item[k]);
    }
    return JSON.stringify(item).slice(0, 60);
  }).join(', ');
}

/**
 * Extract a comprehensive brand context string from guide_data.
 * Covers ALL sections while staying concise.
 * 
 * @param guideData - The guide_data JSONB from brands/products/events table
 * @param entityName - The entity name
 * @param entityType - brand | product | event
 * @param maxTokenEstimate - Rough max character limit (default 4000)
 */
export function extractFullBrandContext(
  guideData: Record<string, unknown>,
  entityName: string,
  entityType: string = 'brand',
  maxTokenEstimate: number = 4000,
): FullBrandContext {
  const g = guideData || {};
  const parts: string[] = [];
  const sectionsWithData: string[] = [];

  // ── Hero ──
  const hero = safeObj(g.hero);
  parts.push(`ENTITY: ${entityName} (${entityType})`);
  if (hero.name) parts.push(`Brand Name: ${hero.name}`);
  if (hero.tagline) parts.push(`Hero Tagline: ${hero.tagline}`);
  if (hero.coverImage) sectionsWithData.push('hero');
  if (hero.logoUrl) parts.push(`Logo URL: present`);
  if (hero.name || hero.tagline) sectionsWithData.push('hero');

  // ── Tagline ──
  const tagline = safeObj(g.tagline);
  if (tagline.primary) { parts.push(`Primary Tagline: ${tagline.primary}`); sectionsWithData.push('tagline'); }
  if (tagline.secondary) parts.push(`Secondary Tagline: ${tagline.secondary}`);
  const taglineVars = safeArr(tagline.variations);
  if (taglineVars.length) parts.push(`Tagline Variations: ${taglineVars.slice(0, 3).join('; ')}`);

  // ── Identity ──
  const identity = safeObj(g.identity);
  if (identity.missionStatement) { parts.push(`Mission: ${identity.missionStatement}`); sectionsWithData.push('identity'); }
  if (identity.archetype) parts.push(`Archetype: ${identity.archetype}`);
  if (identity.industry) parts.push(`Industry: ${identity.industry}`);
  const toneOfVoice = safeArr(identity.toneOfVoice);
  if (toneOfVoice.length) parts.push(`Tone of Voice: ${toneOfVoice.join(', ')}`);

  // ── Values ──
  const values = safeArr(g.values);
  if (values.length) {
    parts.push(`Core Values (${values.length}): ${summarizeItems(values, ['text', 'title', 'name'])}`);
    sectionsWithData.push('values');
  }

  // ── Colors ──
  const colors = safeArr(g.colors);
  if (colors.length) {
    parts.push(`Colors (${colors.length}): ${colors.slice(0, 6).map((c: any) => `${c.name || 'color'}(${c.hex || c.value || ''})`).join(', ')}`);
    sectionsWithData.push('colors');
  }

  // ── Color Combinations ──
  const combos = safeArr(g.colorCombinations);
  if (combos.length) { parts.push(`Color Combinations: ${combos.length} defined`); sectionsWithData.push('colorCombinations'); }

  // ── Gradients ──
  const gradients = safeArr(g.gradients);
  if (gradients.length) { parts.push(`Gradients (${gradients.length}): ${summarizeItems(gradients, 'name')}`); sectionsWithData.push('gradients'); }

  // ── Patterns ──
  const patterns = safeArr(g.patterns);
  if (patterns.length) { parts.push(`Patterns: ${patterns.length} defined`); sectionsWithData.push('patterns'); }

  // ── Typography ──
  const typography = safeArr(g.typography);
  if (typography.length) {
    parts.push(`Typography (${typography.length}): ${typography.slice(0, 4).map((t: any) => `${t.name || t.fontFamily || 'font'} (${t.usage || t.role || 'general'})`).join(', ')}`);
    sectionsWithData.push('typography');
  }

  // ── Text Styles ──
  const textStyles = safeArr(g.textStyles);
  if (textStyles.length) { parts.push(`Text Styles: ${textStyles.length} defined`); sectionsWithData.push('textStyles'); }

  // ── Logos ──
  const logos = safeArr(g.logos);
  if (logos.length) {
    parts.push(`Logos (${logos.length}): ${summarizeItems(logos, ['name', 'label', 'variant'])}`);
    sectionsWithData.push('logos');
  }

  // ── Brand Icons ──
  const brandIcons = safeArr(g.brandIcons);
  if (brandIcons.length) { parts.push(`Brand Icons: ${brandIcons.length}`); sectionsWithData.push('brandIcons'); }

  // ── Iconography ──
  const iconography = safeArr(g.iconography);
  if (iconography.length) { parts.push(`Iconography: ${iconography.length} icons`); sectionsWithData.push('iconography'); }

  // ── Social Icons ──
  const socialIcons = safeArr(g.socialIcons);
  if (socialIcons.length) { parts.push(`Social Icons: ${socialIcons.length}`); sectionsWithData.push('socialIcons'); }

  // ── Imagery ──
  const imagery = safeArr(g.imagery);
  if (imagery.length) { parts.push(`Imagery: ${imagery.length} assets`); sectionsWithData.push('imagery'); }

  // ── Social Profiles ──
  const social = safeArr(g.social);
  if (social.length) {
    parts.push(`Social Profiles: ${social.slice(0, 5).map((s: any) => `${s.platform || s.name || 'channel'}: ${s.handle || s.url || ''}`).join(', ')}`);
    sectionsWithData.push('social');
  }

  // ── Websites ──
  const websites = safeArr(g.websites);
  if (websites.length) {
    parts.push(`Websites: ${websites.slice(0, 3).map((w: any) => w.url || w.name || '').join(', ')}`);
    sectionsWithData.push('websites');
  }

  // ── Signatures ──
  const signatures = safeArr(g.signatures);
  if (signatures.length) { parts.push(`Email Signatures: ${signatures.length}`); sectionsWithData.push('signatures'); }

  // ── Email Banners ──
  const emailBanners = safeArr(g.emailBanners);
  if (emailBanners.length) { parts.push(`Email Banners: ${emailBanners.length}`); sectionsWithData.push('emailBanners'); }

  // ── Videos ──
  const videos = safeArr(g.videos);
  if (videos.length) { parts.push(`Videos: ${videos.length}`); sectionsWithData.push('videos'); }

  // ── Assets ──
  const assets = safeArr(g.assets);
  if (assets.length) { parts.push(`Assets: ${assets.length}`); sectionsWithData.push('assets'); }

  // ── Image Assets ──
  const imageAssets = safeArr(g.imageAssets);
  if (imageAssets.length) { parts.push(`Image Assets: ${imageAssets.length}`); sectionsWithData.push('imageAssets'); }

  // ── Misuse Guidelines ──
  const misuse = safeArr(g.misuse);
  if (misuse.length) { parts.push(`Misuse Examples: ${misuse.length}`); sectionsWithData.push('misuse'); }

  // ── Case Studies ──
  const caseStudies = safeArr(g.caseStudies);
  if (caseStudies.length) { parts.push(`Case Studies: ${caseStudies.length}`); sectionsWithData.push('caseStudies'); }

  // ── Brochures ──
  const brochures = safeArr(g.brochures);
  if (brochures.length) { parts.push(`Brochures: ${brochures.length}`); sectionsWithData.push('brochures'); }

  // ── Templates ──
  const templates = safeArr(g.templates);
  if (templates.length) { parts.push(`Templates (${templates.length}): ${summarizeItems(templates, 'name')}`); sectionsWithData.push('templates'); }

  // ── Services ──
  const services = safeArr(g.services);
  if (services.length) {
    parts.push(`Services (${services.length}): ${services.slice(0, 5).map((s: any) => `${s.name || s.title || 'service'}${s.description ? ': ' + String(s.description).slice(0, 60) : ''}`).join('; ')}`);
    sectionsWithData.push('services');
  }

  // ── Social Assets ──
  const socialAssets = safeArr(g.socialAssets);
  if (socialAssets.length) { parts.push(`Social Asset Specs: ${socialAssets.length}`); sectionsWithData.push('socialAssets'); }

  // ── Display Banners ──
  const displayBanners = safeArr(g.displayBanners);
  if (displayBanners.length) { parts.push(`Display Banner Specs: ${displayBanners.length}`); sectionsWithData.push('displayBanners'); }

  // ── Template Specs ──
  const templateSpecs = safeArr(g.templateSpecs);
  if (templateSpecs.length) { parts.push(`Template Specs: ${templateSpecs.length}`); sectionsWithData.push('templateSpecs'); }

  // ── Revenue Data ──
  const revenueData = safeArr(g.revenueData);
  if (revenueData.length) { parts.push(`Revenue Data Points: ${revenueData.length}`); sectionsWithData.push('revenueData'); }

  // ── Statistics ──
  const statistics = safeArr(g.statistics);
  if (statistics.length) {
    parts.push(`Statistics (${statistics.length}): ${statistics.slice(0, 3).map((s: any) => `${s.label || s.title || 'stat'}: ${s.value || ''}`).join(', ')}`);
    sectionsWithData.push('statistics');
  }

  // ── Webinars ──
  const webinars = safeArr(g.webinars);
  if (webinars.length) { parts.push(`Webinars: ${webinars.length}`); sectionsWithData.push('webinars'); }

  // ── Awards ──
  const awards = safeArr(g.awards);
  if (awards.length) { parts.push(`Awards (${awards.length}): ${summarizeItems(awards, ['title', 'name'])}`); sectionsWithData.push('awards'); }

  // ── Sponsor Logos ──
  const sponsorLogos = safeArr(g.sponsorLogos);
  if (sponsorLogos.length) { parts.push(`Sponsor Logos: ${sponsorLogos.length}`); sectionsWithData.push('sponsorLogos'); }

  // ── Client Logos ──
  const clientLogos = safeArr(g.clientLogos);
  if (clientLogos.length) { parts.push(`Client Logos: ${clientLogos.length}`); sectionsWithData.push('clientLogos'); }

  // ── Custom Shapes ──
  const customShapes = safeArr(g.customShapes);
  if (customShapes.length) { parts.push(`Custom Shapes: ${customShapes.length}`); sectionsWithData.push('customShapes'); }

  // ── QR ──
  const qr = safeObj(g.qr);
  if (qr.defaultUrl) { parts.push(`QR Code URL: ${qr.defaultUrl}`); sectionsWithData.push('qr'); }

  // ── Atmosphere ──
  const atmosphere = safeObj(g.atmosphere);
  if (atmosphere.style) { parts.push(`Atmosphere Style: ${atmosphere.style}`); sectionsWithData.push('atmosphere'); }

  // ── Insights ──
  const insightsArr = safeArr(g.insights);
  if (insightsArr.length) { parts.push(`Brand Insights: ${insightsArr.length}`); sectionsWithData.push('insights'); }

  // ── Locations ──
  const locations = safeArr(g.locations);
  if (locations.length) {
    parts.push(`Locations (${locations.length}): ${locations.slice(0, 3).map((l: any) => `${l.name || l.city || 'location'}`).join(', ')}`);
    sectionsWithData.push('locations');
  }

  // ── Event Signage ──
  const eventSignage = safeArr(g.eventSignage);
  if (eventSignage.length) { parts.push(`Event Signage: ${eventSignage.length}`); sectionsWithData.push('eventSignage'); }

  // ── Presentation Templates ──
  const presentationTemplates = safeArr(g.presentationTemplates);
  if (presentationTemplates.length) { parts.push(`Presentation Templates: ${presentationTemplates.length}`); sectionsWithData.push('presentationTemplates'); }

  // ── Event-specific sections ──
  if (entityType === 'event') {
    const eventDetails = safeObj(g.eventDetails);
    if (eventDetails.eventName || eventDetails.eventDate) {
      parts.push(`Event: ${eventDetails.eventName || entityName}, Date: ${eventDetails.eventDate || 'TBD'}, Format: ${eventDetails.eventFormat || 'TBD'}`);
      sectionsWithData.push('eventDetails');
    }

    const eventSchedule = safeArr(g.eventSchedule);
    if (eventSchedule.length) { parts.push(`Schedule: ${eventSchedule.length} sessions`); sectionsWithData.push('eventSchedule'); }

    const eventSpeakers = safeArr(g.eventSpeakers);
    if (eventSpeakers.length) { parts.push(`Speakers (${eventSpeakers.length}): ${summarizeItems(eventSpeakers, 'name')}`); sectionsWithData.push('eventSpeakers'); }

    const eventSponsors = safeArr(g.eventSponsors);
    if (eventSponsors.length) { parts.push(`Sponsors: ${eventSponsors.length}`); sectionsWithData.push('eventSponsors'); }

    const eventLocation = safeObj(g.eventLocation);
    if (eventLocation.venueName) { parts.push(`Venue: ${eventLocation.venueName}, ${eventLocation.city || ''}`); sectionsWithData.push('eventLocation'); }

    const eventHistory = safeArr(g.eventHistory);
    if (eventHistory.length) { parts.push(`Event History: ${eventHistory.length} past events`); sectionsWithData.push('eventHistory'); }

    const eventBanners = safeArr(g.eventBanners);
    if (eventBanners.length) { parts.push(`Event Banners: ${eventBanners.length}`); sectionsWithData.push('eventBanners'); }

    const eventDigitalMaterials = safeArr(g.eventDigitalMaterials);
    if (eventDigitalMaterials.length) { parts.push(`Digital Materials: ${eventDigitalMaterials.length}`); sectionsWithData.push('eventDigitalMaterials'); }

    const eventVideos = safeArr(g.eventVideos);
    if (eventVideos.length) { parts.push(`Event Videos: ${eventVideos.length}`); sectionsWithData.push('eventVideos'); }

    const eventLogos = safeArr(g.eventLogos);
    if (eventLogos.length) { parts.push(`Event Logos: ${eventLogos.length}`); sectionsWithData.push('eventLogos'); }
  }

  // Trim to max length
  let result = parts.join('\n');
  if (result.length > maxTokenEstimate) {
    result = result.slice(0, maxTokenEstimate) + '\n[...truncated for context limit]';
  }

  return {
    text: result,
    sectionsCovered: ALL_SECTIONS as unknown as string[],
    sectionsWithData,
  };
}

/**
 * Build a compatibility summary showing which sections have data.
 * Useful for showing integration coverage in the UI.
 */
export function getBrandSectionCoverage(guideData: Record<string, unknown>): {
  total: number;
  withData: number;
  percentage: number;
  sections: Record<string, boolean>;
} {
  const { sectionsWithData } = extractFullBrandContext(guideData, '', 'brand', 500);
  const sections: Record<string, boolean> = {};
  for (const s of ALL_SECTIONS) {
    sections[s] = sectionsWithData.includes(s);
  }
  return {
    total: ALL_SECTIONS.length,
    withData: sectionsWithData.length,
    percentage: Math.round((sectionsWithData.length / ALL_SECTIONS.length) * 100),
    sections,
  };
}
