// Phase 2 mappings: section → categories and brand industry → categories.
// Used to surface a "Suggested for this brand" rail in relevant guide sections.

export type IconCategory =
  | 'brands' | 'social' | 'communication' | 'health' | 'wellness'
  | 'food' | 'travel' | 'finance' | 'business' | 'ecommerce'
  | 'education' | 'science' | 'nature' | 'weather' | 'transport'
  | 'tech' | 'devtools' | 'media' | 'security' | 'gaming'
  | 'sports' | 'files' | 'arrows' | 'ui' | 'shapes'
  | 'emoji' | 'flags' | 'crypto' | 'misc';

/** Map guide section id → preferred categories (first match wins). */
export const SECTION_CATEGORY_MAP: Record<string, IconCategory[]> = {
  iconography: ['ui', 'arrows', 'shapes', 'communication', 'files'],
  symbolStandards: ['shapes', 'ui', 'arrows'],
  socialAssets: ['brands', 'social', 'communication'],
  appIcons: ['ui', 'system' as any, 'arrows', 'communication'].filter(Boolean) as IconCategory[],
  qrCodes: ['security', 'tech', 'communication'],
  geometricPrimitives: ['shapes'],
  digitalCollateral: ['files', 'business', 'media'],
  signatures: ['communication', 'brands'],
  antiPatterns: ['ui', 'arrows'],
  platformMarketer: ['business', 'social', 'media', 'communication'],
  events: ['business', 'travel', 'communication'],
  statistics: ['business', 'finance'],
};

/** Map brand industry (lowercased keyword) → preferred categories. */
export const INDUSTRY_CATEGORY_MAP: Record<string, IconCategory[]> = {
  // Healthcare
  health: ['health', 'wellness', 'science'],
  healthcare: ['health', 'wellness', 'science'],
  medical: ['health', 'science'],
  pharma: ['health', 'science'],
  wellness: ['wellness', 'health', 'nature'],
  fitness: ['wellness', 'sports'],
  // Finance / fintech
  finance: ['finance', 'business', 'crypto'],
  fintech: ['finance', 'crypto', 'tech', 'business'],
  banking: ['finance', 'business', 'security'],
  insurance: ['finance', 'security', 'business'],
  crypto: ['crypto', 'finance'],
  // Tech / SaaS
  tech: ['tech', 'devtools', 'ui'],
  software: ['tech', 'devtools', 'ui'],
  saas: ['tech', 'business', 'ui'],
  ai: ['tech', 'science'],
  cybersecurity: ['security', 'tech'],
  // Travel / hospitality
  travel: ['travel', 'transport', 'nature'],
  hospitality: ['travel', 'food', 'business'],
  airline: ['travel', 'transport'],
  hotel: ['travel', 'food'],
  // Retail / ecommerce
  retail: ['ecommerce', 'business', 'brands'],
  ecommerce: ['ecommerce', 'business', 'brands'],
  fashion: ['ecommerce', 'media'],
  // Food / beverage
  food: ['food', 'nature', 'wellness'],
  restaurant: ['food', 'travel'],
  beverage: ['food'],
  // Media / entertainment
  media: ['media', 'social', 'brands'],
  entertainment: ['media', 'gaming', 'social'],
  gaming: ['gaming', 'tech', 'media'],
  publishing: ['media', 'education'],
  // Education
  education: ['education', 'science', 'communication'],
  edtech: ['education', 'tech'],
  // Sports
  sports: ['sports', 'wellness', 'media'],
  // Environment / nature
  energy: ['nature', 'science', 'tech'],
  sustainability: ['nature', 'science'],
  agriculture: ['nature', 'food', 'science'],
  // Transport / logistics
  logistics: ['transport', 'ecommerce', 'business'],
  automotive: ['transport', 'tech'],
  shipping: ['transport', 'ecommerce'],
  // Real estate / construction
  realestate: ['business', 'ui'],
  construction: ['tech', 'business'],
  // Professional services
  legal: ['business', 'files', 'security'],
  consulting: ['business', 'communication'],
  enterprise: ['business', 'tech', 'communication'],
  // Government / nonprofit
  government: ['business', 'files', 'security'],
  nonprofit: ['social', 'communication', 'wellness'],
};

/** Look up categories for a brand industry string (handles fuzzy matching). */
export function categoriesForIndustry(industry?: string | null): IconCategory[] {
  if (!industry) return ['ui', 'business', 'communication'];
  const norm = industry.toLowerCase().replace(/[^a-z]/g, '');
  // Direct hit
  if (INDUSTRY_CATEGORY_MAP[norm]) return INDUSTRY_CATEGORY_MAP[norm];
  // Substring match (e.g. "Healthcare Technology" → 'health' + 'tech')
  const matches = new Set<IconCategory>();
  for (const [key, cats] of Object.entries(INDUSTRY_CATEGORY_MAP)) {
    if (norm.includes(key)) cats.forEach((c) => matches.add(c));
  }
  if (matches.size > 0) return Array.from(matches);
  return ['ui', 'business', 'communication'];
}

export function categoriesForSection(sectionId: string): IconCategory[] {
  return SECTION_CATEGORY_MAP[sectionId] ?? ['ui'];
}
