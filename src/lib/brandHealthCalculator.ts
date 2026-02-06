/**
 * Brand Health Score Calculator
 * Calculates a completeness/health score based on guide_data content
 * Analyzes ALL sections for comprehensive brand health assessment
 */

// All weighted sections with their importance to brand completeness
const SECTION_WEIGHTS: Record<string, { weight: number; label: string }> = {
  // Core Identity (High Weight - 40% total)
  hero: { weight: 10, label: 'Brand Name & Hero' },
  tagline: { weight: 6, label: 'Tagline' },
  identity: { weight: 8, label: 'Mission & Vision' },
  values: { weight: 8, label: 'Core Values' },
  services: { weight: 8, label: 'Services' },

  // Visual Identity (High Weight - 30% total)
  colors: { weight: 10, label: 'Color Palette' },
  typography: { weight: 8, label: 'Typography' },
  logo: { weight: 10, label: 'Logo Assets' },
  gradients: { weight: 2, label: 'Gradients' },
  patterns: { weight: 2, label: 'Patterns' },
  iconography: { weight: 3, label: 'Iconography' },
  textstyles: { weight: 2, label: 'Text Styles' },
  brandicon: { weight: 3, label: 'Brand Icon' },

  // Digital Presence (Medium Weight - 15% total)
  social: { weight: 5, label: 'Social Profiles' },
  socialicons: { weight: 2, label: 'Social Icons' },
  socialassets: { weight: 2, label: 'Social Assets' },
  website: { weight: 3, label: 'Website' },
  qr: { weight: 2, label: 'QR Codes' },
  signatures: { weight: 2, label: 'Email Signatures' },

  // Content & Assets (Medium Weight - 10% total)
  imagery: { weight: 3, label: 'Imagery Guidelines' },
  imageassets: { weight: 2, label: 'Image Assets' },
  videos: { weight: 2, label: 'Videos' },
  assets: { weight: 2, label: 'Assets' },
  misuse: { weight: 2, label: 'Misuse Guidelines' },

  // Marketing Materials (Low-Medium Weight - 8% total)
  templates: { weight: 3, label: 'Templates' },
  templatespecs: { weight: 2, label: 'Template Specs' },
  brochures: { weight: 3, label: 'Brochures' },

  // Business & Events (Low Weight - 7% total)
  awards: { weight: 2, label: 'Awards & Recognition' },
  casestudies: { weight: 2, label: 'Case Studies' },
  bythenumbers: { weight: 2, label: 'Statistics' },
  revenue: { weight: 1, label: 'Revenue Metrics' },
  locations: { weight: 2, label: 'Locations' },
  webinars: { weight: 2, label: 'Webinars' },
  insights: { weight: 2, label: 'Insights & Updates' },
  events: { weight: 1, label: 'Events' },
  eventsignage: { weight: 1, label: 'Event Signage' },

  // Partnerships (Low Weight - 3% total)
  clientlogos: { weight: 2, label: 'Client Logos' },
  sponsorlogos: { weight: 2, label: 'Sponsor Logos' },

  // Extended Features (Low Weight - 2% total)
  products: { weight: 1, label: 'Linked Products' },
  universe: { weight: 1, label: 'Brand Universe' },
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
 * Check if an array-like field has content
 */
function hasArrayContent(data: unknown[] | undefined | null, minCount = 1): { has: boolean; count: number } {
  const arr = data || [];
  return { has: arr.length >= minCount, count: arr.length };
}

/**
 * Check if an object has meaningful content
 */
function hasObjectContent(obj: Record<string, unknown> | undefined | null, requiredFields: string[]): { has: boolean; filledCount: number } {
  if (!obj) return { has: false, filledCount: 0 };
  const filledCount = requiredFields.filter(field => {
    const value = obj[field];
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
  return { has: filledCount > 0, filledCount };
}

/**
 * Calculate section completeness (0-1)
 */
function calculateSectionCompleteness(
  guideData: GuideData,
  section: string
): number {
  switch (section) {
    // Hero
    case 'hero': {
      const hero = guideData.hero as Record<string, unknown> | undefined;
      if (!hero?.name) return 0;
      const fields = ['name', 'description', 'tagline', 'imageUrl'];
      const filled = fields.filter(f => hero[f]).length;
      return filled / fields.length;
    }

    // Tagline
    case 'tagline': {
      const hero = guideData.hero as Record<string, unknown> | undefined;
      return hero?.tagline ? 1 : 0;
    }

    // Identity
    case 'identity': {
      const identity = guideData.identity as Record<string, unknown> | undefined;
      if (!identity) return 0;
      const fields = ['missionStatement', 'visionStatement', 'brandPromise', 'personality', 'voiceTone'];
      const { filledCount } = hasObjectContent(identity, fields);
      return Math.min(filledCount / 2, 1); // At least mission + vision for full score
    }

    // Values
    case 'values': {
      const values = (guideData.values as unknown[]) || [];
      if (values.length === 0) return 0;
      if (values.length >= 4) return 1;
      if (values.length >= 2) return 0.7;
      return 0.4;
    }

    // Services
    case 'services': {
      const services = (guideData.services as unknown[]) || [];
      if (services.length === 0) return 0;
      if (services.length >= 4) return 1;
      if (services.length >= 2) return 0.7;
      return 0.4;
    }

    // Colors
    case 'colors': {
      const colors = (guideData.colors as unknown[]) || [];
      if (colors.length === 0) return 0;
      if (colors.length >= 5) return 1;
      if (colors.length >= 3) return 0.7;
      return 0.4;
    }

    // Typography
    case 'typography': {
      const typography = (guideData.typography as unknown[]) || [];
      if (typography.length === 0) return 0;
      if (typography.length >= 3) return 1;
      if (typography.length >= 2) return 0.7;
      return 0.5;
    }

    // Logo
    case 'logo': {
      const logo = guideData.logo as Record<string, unknown> | undefined;
      if (!logo?.primaryUrl) return 0;
      const variants = ['primaryUrl', 'lightUrl', 'darkUrl', 'iconUrl', 'invertedUrl'];
      const { filledCount } = hasObjectContent(logo, variants);
      if (filledCount >= 3) return 1;
      if (filledCount >= 2) return 0.7;
      return 0.5;
    }

    // Brand Icon
    case 'brandicon': {
      const brandIcon = guideData.brandIcon as Record<string, unknown> | undefined;
      return brandIcon?.url ? 1 : 0;
    }

    // Array-based sections (simple check)
    case 'gradients':
    case 'patterns':
    case 'socialicons':
    case 'socialassets':
    case 'templates':
    case 'brochures':
    case 'casestudies':
    case 'awards':
    case 'webinars':
    case 'insights':
    case 'events':
    case 'eventsignage':
    case 'clientlogos':
    case 'sponsorlogos':
    case 'products':
    case 'videos':
    case 'assets':
    case 'imageassets': {
      const fieldMap: Record<string, string> = {
        gradients: 'gradients',
        patterns: 'patterns',
        socialicons: 'socialIcons',
        socialassets: 'socialAssets',
        templates: 'templates',
        brochures: 'brochures',
        casestudies: 'caseStudies',
        awards: 'awards',
        webinars: 'webinars',
        insights: 'insights',
        events: 'events',
        eventsignage: 'eventSignage',
        clientlogos: 'clientLogos',
        sponsorlogos: 'sponsorLogos',
        products: 'linkedGuides',
        videos: 'videos',
        assets: 'assets',
        imageassets: 'imageAssets',
      };
      const arr = (guideData[fieldMap[section]] as unknown[]) || [];
      if (arr.length === 0) return 0;
      if (arr.length >= 3) return 1;
      return 0.5;
    }

    // Iconography
    case 'iconography': {
      const icons = (guideData.icons as unknown[]) || [];
      if (icons.length === 0) return 0;
      if (icons.length >= 5) return 1;
      if (icons.length >= 3) return 0.7;
      return 0.4;
    }

    // Text Styles
    case 'textstyles': {
      const textStyles = (guideData.textStyles as unknown[]) || [];
      return textStyles.length > 0 ? 1 : 0;
    }

    // Social
    case 'social': {
      const social = (guideData.social as unknown[]) || [];
      if (social.length === 0) return 0;
      if (social.length >= 3) return 1;
      return 0.6;
    }

    // Website
    case 'website': {
      const website = guideData.website as Record<string, unknown> | undefined;
      return website?.url ? 1 : 0;
    }

    // QR
    case 'qr': {
      const qr = guideData.qr as Record<string, unknown> | undefined;
      return (qr?.url || qr?.dataUrl) ? 1 : 0;
    }

    // Signatures
    case 'signatures': {
      const signatures = (guideData.signatures as unknown[]) || [];
      return signatures.length > 0 ? 1 : 0;
    }

    // Imagery
    case 'imagery': {
      const imagery = guideData.imagery as Record<string, unknown> | undefined;
      const items = (imagery?.items as unknown[]) || [];
      if (imagery?.style || imagery?.guidelines || items.length > 0) return 1;
      return 0;
    }

    // Misuse
    case 'misuse': {
      const misuse = (guideData.misuse as unknown[]) || [];
      return misuse.length > 0 ? 1 : 0;
    }

    // Template Specs
    case 'templatespecs': {
      const specs = (guideData.templateSpecs as unknown[]) || [];
      return specs.length > 0 ? 1 : 0;
    }

    // Statistics (By The Numbers)
    case 'bythenumbers': {
      const stats = (guideData.statistics as unknown[]) || [];
      if (stats.length === 0) return 0;
      if (stats.length >= 4) return 1;
      return 0.5;
    }

    // Revenue
    case 'revenue': {
      const revenue = (guideData.revenueData as unknown[]) || [];
      return revenue.length > 0 ? 1 : 0;
    }

    // Locations
    case 'locations': {
      const locations = (guideData.locations as unknown[]) || [];
      const useShared = guideData.useSharedLocations;
      if (useShared) return 1;
      return locations.length > 0 ? 1 : 0;
    }

    // Universe
    case 'universe': {
      const linkedGuides = (guideData.linkedGuides as unknown[]) || [];
      return linkedGuides.length > 0 ? 1 : 0;
    }

    default:
      return 0;
  }
}

/**
 * Calculate brand health score from guide_data
 */
export function calculateBrandHealth(guideData: GuideData | null | undefined): HealthScoreResult {
  const totalSections = Object.keys(SECTION_WEIGHTS).length;

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

  // Calculate each section's score
  for (const [section, config] of Object.entries(SECTION_WEIGHTS)) {
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
    { name: 'Visual Identity', sections: ['colors', 'typography', 'logo', 'gradients', 'patterns', 'iconography', 'textstyles', 'brandicon'] },
    { name: 'Digital Presence', sections: ['social', 'socialicons', 'socialassets', 'website', 'qr', 'signatures'] },
    { name: 'Content & Assets', sections: ['imagery', 'imageassets', 'videos', 'assets', 'misuse'] },
    { name: 'Marketing Materials', sections: ['templates', 'templatespecs', 'brochures'] },
    { name: 'Business & Events', sections: ['awards', 'casestudies', 'bythenumbers', 'revenue', 'locations', 'webinars', 'insights', 'events', 'eventsignage'] },
    { name: 'Partnerships', sections: ['clientlogos', 'sponsorlogos'] },
    { name: 'Extended Features', sections: ['products', 'universe'] },
  ];

  const categoryScores = categories.map(cat => {
    const sectionScores = breakdown.filter(b => cat.sections.includes(b.section));
    const maxScore = sectionScores.reduce((sum, s) => sum + s.weight, 0);
    const score = sectionScores.reduce((sum, s) => sum + s.earned, 0);
    return {
      category: cat.name,
      score: Math.round(score),
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
