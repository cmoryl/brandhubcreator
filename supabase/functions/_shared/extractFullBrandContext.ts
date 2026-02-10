/**
 * Shared full brand context extractor.
 * All AI edge functions import this to get 100% section coverage.
 * Supports multimodal: extracts image URLs for vision-capable AI models.
 * Keeps output concise with slicing to stay within token/memory limits.
 */

export interface FullBrandContext {
  text: string;
  sectionsCovered: string[];
  sectionsWithData: string[];
  /** Image URLs extracted from visual sections for multimodal AI analysis */
  imageUrls: ImageReference[];
}

export interface ImageReference {
  url: string;
  section: string;
  label: string;
  type: 'logo' | 'image' | 'pattern' | 'gradient' | 'icon' | 'banner' | 'asset' | 'video-thumb' | 'shape' | 'qr';
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

/** Check if a string looks like a valid URL (http/https or storage path) */
function isValidUrl(s: unknown): s is string {
  if (typeof s !== 'string' || !s) return false;
  return s.startsWith('http') || s.startsWith('data:image') || s.startsWith('/storage');
}

/** Extract image URLs from an item, checking common field names */
function extractItemUrls(
  item: any,
  section: string,
  type: ImageReference['type'],
  label?: string,
): ImageReference[] {
  const refs: ImageReference[] = [];
  const urlFields = ['url', 'imageUrl', 'image_url', 'src', 'thumbnailUrl', 'thumbnail_url', 'coverImage', 'cover_image', 'logoUrl', 'logo_url', 'previewUrl', 'preview_url', 'file_url', 'fileUrl'];
  for (const field of urlFields) {
    if (isValidUrl(item?.[field])) {
      refs.push({
        url: item[field],
        section,
        label: label || item.name || item.label || item.title || section,
        type,
      });
      break; // one URL per item
    }
  }
  // Also check nested 'files' array (common in logos/assets)
  if (Array.isArray(item?.files)) {
    for (const f of item.files.slice(0, 3)) {
      if (isValidUrl(f?.url || f?.file_url)) {
        refs.push({
          url: f.url || f.file_url,
          section,
          label: f.name || f.label || label || section,
          type,
        });
      }
    }
  }
  return refs;
}

/**
 * Extract a comprehensive brand context string from guide_data.
 * Covers ALL sections while staying concise.
 * Also extracts image URLs for multimodal AI analysis.
 * 
 * @param guideData - The guide_data JSONB from brands/products/events table
 * @param entityName - The entity name
 * @param entityType - brand | product | event
 * @param maxTokenEstimate - Rough max character limit (default 4000)
 * @param extractImages - Whether to extract image URLs (default true)
 * @param maxImages - Maximum number of image URLs to extract (default 20)
 */
export function extractFullBrandContext(
  guideData: Record<string, unknown>,
  entityName: string,
  entityType: string = 'brand',
  maxTokenEstimate: number = 4000,
  extractImages: boolean = true,
  maxImages: number = 20,
): FullBrandContext {
  const g = guideData || {};
  const parts: string[] = [];
  const sectionsWithData: string[] = [];
  const imageUrls: ImageReference[] = [];

  // Helper to add images with limit check
  const addImages = (refs: ImageReference[]) => {
    if (!extractImages) return;
    for (const r of refs) {
      if (imageUrls.length < maxImages) imageUrls.push(r);
    }
  };

  // ── Hero ──
  const hero = safeObj(g.hero);
  parts.push(`ENTITY: ${entityName} (${entityType})`);
  if (hero.name) parts.push(`Brand Name: ${hero.name}`);
  if (hero.tagline) parts.push(`Hero Tagline: ${hero.tagline}`);
  if (hero.coverImage) sectionsWithData.push('hero');
  if (hero.logoUrl) parts.push(`Logo URL: present`);
  if (hero.name || hero.tagline) sectionsWithData.push('hero');
  // Extract hero images
  if (isValidUrl(hero.coverImage)) addImages([{ url: hero.coverImage as string, section: 'hero', label: 'Hero Cover Image', type: 'image' }]);
  if (isValidUrl(hero.logoUrl)) addImages([{ url: hero.logoUrl as string, section: 'hero', label: 'Hero Logo', type: 'logo' }]);

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
  if (combos.length) {
    parts.push(`Color Combinations: ${combos.length} defined`);
    sectionsWithData.push('colorCombinations');
    for (const c of combos.slice(0, 3)) {
      addImages(extractItemUrls(c, 'colorCombinations', 'image', c.name));
    }
  }

  // ── Gradients ──
  const gradients = safeArr(g.gradients);
  if (gradients.length) {
    parts.push(`Gradients (${gradients.length}): ${summarizeItems(gradients, 'name')}`);
    sectionsWithData.push('gradients');
    for (const gr of gradients.slice(0, 4)) {
      addImages(extractItemUrls(gr, 'gradients', 'gradient', gr.name));
      // Also capture gradient CSS for text analysis
      if (gr.css || gr.value) parts.push(`  Gradient "${gr.name || 'unnamed'}": ${gr.css || gr.value || ''}`);
    }
  }

  // ── Patterns ──
  const patterns = safeArr(g.patterns);
  if (patterns.length) {
    parts.push(`Patterns: ${patterns.length} defined`);
    sectionsWithData.push('patterns');
    for (const p of patterns.slice(0, 4)) {
      addImages(extractItemUrls(p, 'patterns', 'pattern', p.name));
    }
  }

  // ── Typography ──
  const typography = safeArr(g.typography);
  if (typography.length) {
    parts.push(`Typography (${typography.length}): ${typography.slice(0, 4).map((t: any) => `${t.name || t.fontFamily || 'font'} (${t.usage || t.role || 'general'})`).join(', ')}`);
    sectionsWithData.push('typography');
    for (const t of typography.slice(0, 3)) {
      addImages(extractItemUrls(t, 'typography', 'image', `Typography: ${t.name || t.fontFamily}`));
    }
  }

  // ── Text Styles ──
  const textStyles = safeArr(g.textStyles);
  if (textStyles.length) { parts.push(`Text Styles: ${textStyles.length} defined`); sectionsWithData.push('textStyles'); }

  // ── Logos ──
  const logos = safeArr(g.logos);
  if (logos.length) {
    parts.push(`Logos (${logos.length}): ${summarizeItems(logos, ['name', 'label', 'variant'])}`);
    sectionsWithData.push('logos');
    for (const logo of logos.slice(0, 6)) {
      addImages(extractItemUrls(logo, 'logos', 'logo', logo.name || logo.label || logo.variant));
    }
  }

  // ── Brand Icons ──
  const brandIcons = safeArr(g.brandIcons);
  if (brandIcons.length) {
    parts.push(`Brand Icons: ${brandIcons.length}`);
    sectionsWithData.push('brandIcons');
    for (const icon of brandIcons.slice(0, 4)) {
      addImages(extractItemUrls(icon, 'brandIcons', 'icon', icon.name));
    }
  }

  // ── Iconography ──
  const iconography = safeArr(g.iconography);
  if (iconography.length) {
    parts.push(`Iconography: ${iconography.length} icons`);
    sectionsWithData.push('iconography');
    for (const ic of iconography.slice(0, 4)) {
      addImages(extractItemUrls(ic, 'iconography', 'icon', ic.name));
    }
  }

  // ── Social Icons ──
  const socialIcons = safeArr(g.socialIcons);
  if (socialIcons.length) {
    parts.push(`Social Icons: ${socialIcons.length}`);
    sectionsWithData.push('socialIcons');
    for (const si of socialIcons.slice(0, 4)) {
      addImages(extractItemUrls(si, 'socialIcons', 'icon', si.name || si.platform));
    }
  }

  // ── Imagery ──
  const imagery = safeArr(g.imagery);
  if (imagery.length) {
    parts.push(`Imagery (${imagery.length}): ${imagery.slice(0, 3).map((im: any) => `${im.name || im.title || im.category || 'image'}${im.description ? ' - ' + String(im.description).slice(0, 40) : ''}`).join('; ')}`);
    sectionsWithData.push('imagery');
    for (const im of imagery.slice(0, 5)) {
      addImages(extractItemUrls(im, 'imagery', 'image', im.name || im.title || im.category));
    }
  }

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
  if (signatures.length) {
    parts.push(`Email Signatures: ${signatures.length}`);
    sectionsWithData.push('signatures');
    for (const sig of signatures.slice(0, 2)) {
      addImages(extractItemUrls(sig, 'signatures', 'image', sig.name || 'Email Signature'));
    }
  }

  // ── Email Banners ──
  const emailBanners = safeArr(g.emailBanners);
  if (emailBanners.length) {
    parts.push(`Email Banners: ${emailBanners.length}`);
    sectionsWithData.push('emailBanners');
    for (const eb of emailBanners.slice(0, 3)) {
      addImages(extractItemUrls(eb, 'emailBanners', 'banner', eb.name || 'Email Banner'));
    }
  }

  // ── Videos ──
  const videos = safeArr(g.videos);
  if (videos.length) {
    parts.push(`Videos (${videos.length}): ${videos.slice(0, 3).map((v: any) => v.title || v.name || 'video').join(', ')}`);
    sectionsWithData.push('videos');
    for (const vid of videos.slice(0, 3)) {
      addImages(extractItemUrls(vid, 'videos', 'video-thumb', vid.title || vid.name));
    }
  }

  // ── Assets ──
  const assets = safeArr(g.assets);
  if (assets.length) {
    parts.push(`Assets (${assets.length}): ${assets.slice(0, 3).map((a: any) => `${a.name || 'asset'} (${a.type || 'unknown'})`).join(', ')}`);
    sectionsWithData.push('assets');
    for (const a of assets.slice(0, 3)) {
      if (a.type && String(a.type).startsWith('image')) {
        addImages(extractItemUrls(a, 'assets', 'asset', a.name));
      }
    }
  }

  // ── Image Assets ──
  const imageAssets = safeArr(g.imageAssets);
  if (imageAssets.length) {
    parts.push(`Image Assets: ${imageAssets.length}`);
    sectionsWithData.push('imageAssets');
    for (const ia of imageAssets.slice(0, 5)) {
      addImages(extractItemUrls(ia, 'imageAssets', 'image', ia.name || ia.title));
    }
  }

  // ── Misuse Guidelines ──
  const misuse = safeArr(g.misuse);
  if (misuse.length) {
    parts.push(`Misuse Examples (${misuse.length}): ${misuse.slice(0, 3).map((m: any) => m.title || m.description?.slice(0, 40) || 'example').join('; ')}`);
    sectionsWithData.push('misuse');
    for (const m of misuse.slice(0, 3)) {
      addImages(extractItemUrls(m, 'misuse', 'image', m.title || 'Misuse Example'));
    }
  }

  // ── Case Studies ──
  const caseStudies = safeArr(g.caseStudies);
  if (caseStudies.length) {
    parts.push(`Case Studies (${caseStudies.length}): ${summarizeItems(caseStudies, ['title', 'name'])}`);
    sectionsWithData.push('caseStudies');
    for (const cs of caseStudies.slice(0, 3)) {
      addImages(extractItemUrls(cs, 'caseStudies', 'image', cs.title || cs.name));
    }
  }

  // ── Brochures ──
  const brochures = safeArr(g.brochures);
  if (brochures.length) {
    parts.push(`Brochures: ${brochures.length}`);
    sectionsWithData.push('brochures');
    for (const b of brochures.slice(0, 2)) {
      addImages(extractItemUrls(b, 'brochures', 'asset', b.name || 'Brochure'));
    }
  }

  // ── Templates ──
  const templates = safeArr(g.templates);
  if (templates.length) {
    parts.push(`Templates (${templates.length}): ${summarizeItems(templates, 'name')}`);
    sectionsWithData.push('templates');
    for (const t of templates.slice(0, 3)) {
      addImages(extractItemUrls(t, 'templates', 'image', t.name));
    }
  }

  // ── Services ──
  const services = safeArr(g.services);
  if (services.length) {
    parts.push(`Services (${services.length}): ${services.slice(0, 5).map((s: any) => `${s.name || s.title || 'service'}${s.description ? ': ' + String(s.description).slice(0, 60) : ''}`).join('; ')}`);
    sectionsWithData.push('services');
    for (const svc of services.slice(0, 3)) {
      addImages(extractItemUrls(svc, 'services', 'image', svc.name || svc.title));
    }
  }

  // ── Social Assets ──
  const socialAssets = safeArr(g.socialAssets);
  if (socialAssets.length) {
    parts.push(`Social Asset Specs: ${socialAssets.length}`);
    sectionsWithData.push('socialAssets');
    for (const sa of socialAssets.slice(0, 3)) {
      addImages(extractItemUrls(sa, 'socialAssets', 'image', sa.name || 'Social Asset'));
    }
  }

  // ── Display Banners ──
  const displayBanners = safeArr(g.displayBanners);
  if (displayBanners.length) {
    parts.push(`Display Banner Specs: ${displayBanners.length}`);
    sectionsWithData.push('displayBanners');
    for (const db of displayBanners.slice(0, 3)) {
      addImages(extractItemUrls(db, 'displayBanners', 'banner', db.name || 'Display Banner'));
    }
  }

  // ── Template Specs ──
  const templateSpecs = safeArr(g.templateSpecs);
  if (templateSpecs.length) {
    parts.push(`Template Specs: ${templateSpecs.length}`);
    sectionsWithData.push('templateSpecs');
    for (const ts of templateSpecs.slice(0, 2)) {
      addImages(extractItemUrls(ts, 'templateSpecs', 'image', ts.name));
    }
  }

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
  if (webinars.length) {
    parts.push(`Webinars: ${webinars.length}`);
    sectionsWithData.push('webinars');
    for (const w of webinars.slice(0, 2)) {
      addImages(extractItemUrls(w, 'webinars', 'video-thumb', w.title || w.name));
    }
  }

  // ── Awards ──
  const awards = safeArr(g.awards);
  if (awards.length) {
    parts.push(`Awards (${awards.length}): ${summarizeItems(awards, ['title', 'name'])}`);
    sectionsWithData.push('awards');
    for (const a of awards.slice(0, 3)) {
      addImages(extractItemUrls(a, 'awards', 'image', a.title || a.name));
    }
  }

  // ── Sponsor Logos ──
  const sponsorLogos = safeArr(g.sponsorLogos);
  if (sponsorLogos.length) {
    parts.push(`Sponsor Logos: ${sponsorLogos.length}`);
    sectionsWithData.push('sponsorLogos');
    for (const sl of sponsorLogos.slice(0, 4)) {
      addImages(extractItemUrls(sl, 'sponsorLogos', 'logo', sl.name));
    }
  }

  // ── Client Logos ──
  const clientLogos = safeArr(g.clientLogos);
  if (clientLogos.length) {
    parts.push(`Client Logos: ${clientLogos.length}`);
    sectionsWithData.push('clientLogos');
    for (const cl of clientLogos.slice(0, 4)) {
      addImages(extractItemUrls(cl, 'clientLogos', 'logo', cl.name));
    }
  }

  // ── Custom Shapes ──
  const customShapes = safeArr(g.customShapes);
  if (customShapes.length) {
    parts.push(`Custom Shapes: ${customShapes.length}`);
    sectionsWithData.push('customShapes');
    for (const cs of customShapes.slice(0, 3)) {
      addImages(extractItemUrls(cs, 'customShapes', 'shape', cs.name));
    }
  }

  // ── QR ──
  const qr = safeObj(g.qr);
  if (qr.defaultUrl) {
    parts.push(`QR Code URL: ${qr.defaultUrl}`);
    sectionsWithData.push('qr');
    if (isValidUrl(qr.imageUrl)) addImages([{ url: qr.imageUrl as string, section: 'qr', label: 'QR Code', type: 'qr' }]);
  }

  // ── Atmosphere ──
  const atmosphere = safeObj(g.atmosphere);
  if (atmosphere.style) {
    parts.push(`Atmosphere Style: ${atmosphere.style}`);
    sectionsWithData.push('atmosphere');
    if (isValidUrl(atmosphere.imageUrl)) addImages([{ url: atmosphere.imageUrl as string, section: 'atmosphere', label: 'Atmosphere Image', type: 'image' }]);
  }

  // ── Insights ──
  const insightsArr = safeArr(g.insights);
  if (insightsArr.length) { parts.push(`Brand Insights: ${insightsArr.length}`); sectionsWithData.push('insights'); }

  // ── Locations ──
  const locations = safeArr(g.locations);
  if (locations.length) {
    parts.push(`Locations (${locations.length}): ${locations.slice(0, 3).map((l: any) => `${l.name || l.city || 'location'}`).join(', ')}`);
    sectionsWithData.push('locations');
    for (const loc of locations.slice(0, 2)) {
      addImages(extractItemUrls(loc, 'locations', 'image', loc.name || loc.city));
    }
  }

  // ── Event Signage ──
  const eventSignage = safeArr(g.eventSignage);
  if (eventSignage.length) {
    parts.push(`Event Signage: ${eventSignage.length}`);
    sectionsWithData.push('eventSignage');
    for (const es of eventSignage.slice(0, 3)) {
      addImages(extractItemUrls(es, 'eventSignage', 'image', es.name || 'Signage'));
    }
  }

  // ── Presentation Templates ──
  const presentationTemplates = safeArr(g.presentationTemplates);
  if (presentationTemplates.length) {
    parts.push(`Presentation Templates: ${presentationTemplates.length}`);
    sectionsWithData.push('presentationTemplates');
    for (const pt of presentationTemplates.slice(0, 2)) {
      addImages(extractItemUrls(pt, 'presentationTemplates', 'image', pt.name));
    }
  }

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
    if (eventSpeakers.length) {
      parts.push(`Speakers (${eventSpeakers.length}): ${summarizeItems(eventSpeakers, 'name')}`);
      sectionsWithData.push('eventSpeakers');
      for (const sp of eventSpeakers.slice(0, 4)) {
        addImages(extractItemUrls(sp, 'eventSpeakers', 'image', sp.name));
      }
    }

    const eventSponsors = safeArr(g.eventSponsors);
    if (eventSponsors.length) {
      parts.push(`Sponsors: ${eventSponsors.length}`);
      sectionsWithData.push('eventSponsors');
      for (const es of eventSponsors.slice(0, 4)) {
        addImages(extractItemUrls(es, 'eventSponsors', 'logo', es.name));
      }
    }

    const eventLocation = safeObj(g.eventLocation);
    if (eventLocation.venueName) {
      parts.push(`Venue: ${eventLocation.venueName}, ${eventLocation.city || ''}`);
      sectionsWithData.push('eventLocation');
      if (isValidUrl(eventLocation.imageUrl)) addImages([{ url: eventLocation.imageUrl as string, section: 'eventLocation', label: 'Venue Image', type: 'image' }]);
    }

    const eventHistory = safeArr(g.eventHistory);
    if (eventHistory.length) { parts.push(`Event History: ${eventHistory.length} past events`); sectionsWithData.push('eventHistory'); }

    const eventBanners = safeArr(g.eventBanners);
    if (eventBanners.length) {
      parts.push(`Event Banners: ${eventBanners.length}`);
      sectionsWithData.push('eventBanners');
      for (const eb of eventBanners.slice(0, 3)) {
        addImages(extractItemUrls(eb, 'eventBanners', 'banner', eb.name || 'Event Banner'));
      }
    }

    const eventDigitalMaterials = safeArr(g.eventDigitalMaterials);
    if (eventDigitalMaterials.length) {
      parts.push(`Digital Materials: ${eventDigitalMaterials.length}`);
      sectionsWithData.push('eventDigitalMaterials');
      for (const edm of eventDigitalMaterials.slice(0, 3)) {
        addImages(extractItemUrls(edm, 'eventDigitalMaterials', 'image', edm.name));
      }
    }

    const eventVideos = safeArr(g.eventVideos);
    if (eventVideos.length) {
      parts.push(`Event Videos: ${eventVideos.length}`);
      sectionsWithData.push('eventVideos');
      for (const ev of eventVideos.slice(0, 2)) {
        addImages(extractItemUrls(ev, 'eventVideos', 'video-thumb', ev.title || ev.name));
      }
    }

    const eventLogos = safeArr(g.eventLogos);
    if (eventLogos.length) {
      parts.push(`Event Logos: ${eventLogos.length}`);
      sectionsWithData.push('eventLogos');
      for (const el of eventLogos.slice(0, 3)) {
        addImages(extractItemUrls(el, 'eventLogos', 'logo', el.name));
      }
    }
  }

  // Add image summary to text context
  if (imageUrls.length > 0) {
    parts.push(`\nVISUAL ASSETS AVAILABLE FOR ANALYSIS (${imageUrls.length} images):`);
    const bySection: Record<string, number> = {};
    for (const img of imageUrls) {
      bySection[img.section] = (bySection[img.section] || 0) + 1;
    }
    parts.push(Object.entries(bySection).map(([s, c]) => `  ${s}: ${c} image(s)`).join('\n'));
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
    imageUrls,
  };
}

/**
 * Build multimodal message content array for AI APIs.
 * Combines text context with image URLs for vision-capable models.
 * Filters to only include http/https URLs (not base64) to keep payload small.
 */
export function buildMultimodalContent(
  textPrompt: string,
  imageUrls: ImageReference[],
  maxImages: number = 8,
): Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: textPrompt },
  ];

  // Only include http URLs (not base64 data URIs which are too large)
  const httpImages = imageUrls.filter(img => img.url.startsWith('http'));
  
  for (const img of httpImages.slice(0, maxImages)) {
    content.push({
      type: 'image_url',
      image_url: { url: img.url },
    });
  }

  return content;
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
  imageCount: number;
} {
  const { sectionsWithData, imageUrls } = extractFullBrandContext(guideData, '', 'brand', 500, true, 50);
  const sections: Record<string, boolean> = {};
  for (const s of ALL_SECTIONS) {
    sections[s] = sectionsWithData.includes(s);
  }
  return {
    total: ALL_SECTIONS.length,
    withData: sectionsWithData.length,
    percentage: Math.round((sectionsWithData.length / ALL_SECTIONS.length) * 100),
    sections,
    imageCount: imageUrls.length,
  };
}
