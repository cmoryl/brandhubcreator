/**
 * industryMapping
 *
 * Maps a free-text brand industry string (whatever an editor typed into
 * guide_data.industry) to one of our INDUSTRY_PRESETS ids, so we can
 * auto-link the right icon collection to each brand.
 *
 * Pure data + lookup — no React, no side effects.
 */

import { INDUSTRY_PRESETS, type IndustryPreset } from './industryPresets';

/** Keyword bank per preset id. First match wins (in array order below). */
const KEYWORDS: Record<string, string[]> = {
  'tech-saas': ['saas', 'software', 'tech', 'platform', 'cloud', 'api', 'developer', 'devtool', 'it ', 'information technology'],
  healthcare: ['health', 'medical', 'medic', 'pharma', 'biotech', 'hospital', 'clinic', 'wellness care', 'life science'],
  finance: ['finance', 'financial', 'bank', 'insur', 'fintech', 'invest', 'wealth', 'capital', 'accounting', 'trading'],
  ecommerce: ['ecommerce', 'e-commerce', 'retail', 'shop', 'commerce', 'marketplace', 'd2c', 'dtc', 'consumer goods'],
  legal: ['legal', 'law', 'attorney', 'compliance', 'regulatory', 'litigation'],
  education: ['education', 'edtech', 'school', 'university', 'academic', 'learning', 'training'],
  realestate: ['real estate', 'realty', 'property', 'realtor', 'broker'],
  hospitality: ['hospitality', 'restaurant', 'food service', 'catering', 'dining', 'cafe', 'bar '],
  hotel: ['hotel', 'resort', 'lodging', 'inn ', 'hostel', 'bnb'],
  manufacturing: ['manufactur', 'industrial', 'factory', 'production', 'oem'],
  logistics: ['logistic', 'supply chain', 'shipping', 'freight', 'fulfillment', 'warehouse'],
  media: ['media', 'entertainment', 'broadcast', 'film', 'tv ', 'publishing', 'news', 'streaming'],
  energy: ['energy', 'oil', 'gas', 'utility', 'utilities', 'power', 'renewable', 'solar', 'wind'],
  automotive: ['auto', 'car ', 'vehicle', 'mobility', 'ev ', 'transport'],
  travel: ['travel', 'tourism', 'airline', 'cruise', 'tour operator'],
  nonprofit: ['nonprofit', 'non-profit', 'ngo', 'charity', 'foundation', 'social impact'],
  government: ['government', 'public sector', 'agency', 'municipal', 'federal'],
  agriculture: ['agriculture', 'farming', 'agri', 'agtech', 'food production'],
  construction: ['construction', 'building', 'contractor', 'engineering & construction', 'architecture'],
  localization: ['localization', 'translation', 'language services', 'lsp', 'interpretation', 'globalization'],
  fitness: ['fitness', 'gym', 'wellness', 'workout', 'sports performance'],
  consulting: ['consult', 'advisory', 'professional services', 'strategy'],
  startup: ['startup', 'venture', 'incubator', 'accelerator'],
  aviation: ['aviation', 'airline', 'aerospace', 'aircraft', 'airport'],
};

/**
 * Resolve a free-text industry string to a preset. Returns `null` when no
 * confident match is found — caller should fall back to a generic core set
 * or skip.
 */
export function matchIndustryPreset(industry: string | null | undefined): IndustryPreset | null {
  if (!industry) return null;
  const norm = ` ${industry.toLowerCase().trim()} `;

  // 1. Direct id match (e.g. industry === 'tech-saas')
  const direct = INDUSTRY_PRESETS.find((p) => p.id === industry.toLowerCase().trim());
  if (direct) return direct;

  // 2. Keyword scan
  for (const preset of INDUSTRY_PRESETS) {
    const keys = KEYWORDS[preset.id] || [];
    if (keys.some((k) => norm.includes(k))) return preset;
  }
  return null;
}
