/**
 * industrySuggestions
 *
 * Maps an industry vertical to recommended Layout Template targets and
 * starter copy blocks (eyebrow / headline / cta) for marketing collateral —
 * primarily ebrochures and case studies, with one-pagers and white papers
 * included for completeness.
 *
 * Pure data + lookup helpers — no React, no side effects.
 */
import type { LayoutSectionTarget } from './brandLayoutTemplates';

export type IndustryId =
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'professional-services'
  | 'manufacturing'
  | 'retail'
  | 'education'
  | 'nonprofit'
  | 'real-estate'
  | 'hospitality';

export interface IndustryCopyBlock {
  eyebrow: string;
  headline: string;
  cta: string;
}

export interface IndustryDefinition {
  id: IndustryId;
  label: string;
  description: string;
  /** Targets to surface first in the gallery filter (in priority order). */
  recommendedTargets: LayoutSectionTarget[];
  /** Per-target starter copy used to prefill the layout editor. */
  copy: Partial<Record<LayoutSectionTarget, IndustryCopyBlock>>;
}

export const industries: IndustryDefinition[] = [
  {
    id: 'technology',
    label: 'Technology / SaaS',
    description: 'Software, platforms, developer tools',
    recommendedTargets: ['ebrochure', 'casestudy', 'onepager', 'whitepaper'],
    copy: {
      ebrochure: {
        eyebrow: 'Platform Overview',
        headline: 'Ship faster with a unified developer platform',
        cta: 'Start your free trial',
      },
      casestudy: {
        eyebrow: 'Customer Story',
        headline: 'How {Customer} cut deployment time by 60%',
        cta: 'Read the full story',
      },
      onepager: {
        eyebrow: 'Product Sheet',
        headline: 'Everything you need to scale, in one platform',
        cta: 'Request a demo',
      },
      whitepaper: {
        eyebrow: 'Research Report',
        headline: 'The State of Engineering Velocity 2025',
        cta: 'Download the report',
      },
    },
  },
  {
    id: 'healthcare',
    label: 'Healthcare / Life Sciences',
    description: 'Providers, payers, biotech, medical devices',
    recommendedTargets: ['casestudy', 'whitepaper', 'ebrochure', 'onepager'],
    copy: {
      ebrochure: {
        eyebrow: 'Clinical Solutions',
        headline: 'Better outcomes through connected care',
        cta: 'Talk to our clinical team',
      },
      casestudy: {
        eyebrow: 'Outcome Story',
        headline: 'Reducing readmissions by 32% across 14 sites',
        cta: 'See the methodology',
      },
      onepager: {
        eyebrow: 'Solution Brief',
        headline: 'A clinically validated workflow, ready on day one',
        cta: 'Schedule a walkthrough',
      },
      whitepaper: {
        eyebrow: 'Evidence Report',
        headline: 'Real-world evidence: improving patient outcomes at scale',
        cta: 'Download the white paper',
      },
    },
  },
  {
    id: 'finance',
    label: 'Financial Services',
    description: 'Banking, fintech, wealth, insurance',
    recommendedTargets: ['whitepaper', 'casestudy', 'ebrochure', 'onepager'],
    copy: {
      ebrochure: {
        eyebrow: 'Capability Statement',
        headline: 'Trusted infrastructure for modern finance',
        cta: 'Speak with an advisor',
      },
      casestudy: {
        eyebrow: 'Client Success',
        headline: 'How {Client} unlocked $40M in operational savings',
        cta: 'Read the case study',
      },
      onepager: {
        eyebrow: 'Product Overview',
        headline: 'Compliance-ready solutions, purpose-built for finance',
        cta: 'Book a consultation',
      },
      whitepaper: {
        eyebrow: 'Industry Report',
        headline: 'Navigating regulatory change in 2025',
        cta: 'Download the report',
      },
    },
  },
  {
    id: 'professional-services',
    label: 'Professional Services',
    description: 'Consulting, legal, agencies, advisory',
    recommendedTargets: ['casestudy', 'ebrochure', 'whitepaper', 'onepager'],
    copy: {
      ebrochure: {
        eyebrow: 'Firm Overview',
        headline: 'Strategic expertise for an evolving market',
        cta: 'Start a conversation',
      },
      casestudy: {
        eyebrow: 'Engagement Story',
        headline: 'Transforming operations for a Fortune 500 client',
        cta: 'See our approach',
      },
      onepager: {
        eyebrow: 'Service Sheet',
        headline: 'Specialized advisory across the full lifecycle',
        cta: 'Request a proposal',
      },
      whitepaper: {
        eyebrow: 'Point of View',
        headline: 'Leadership perspectives on the year ahead',
        cta: 'Read the analysis',
      },
    },
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing / Industrial',
    description: 'Industrial equipment, supply chain, materials',
    recommendedTargets: ['ebrochure', 'onepager', 'casestudy', 'whitepaper'],
    copy: {
      ebrochure: {
        eyebrow: 'Product Catalog',
        headline: 'Engineered for performance, built to last',
        cta: 'Request a quote',
      },
      casestudy: {
        eyebrow: 'Customer Outcome',
        headline: 'Boosting line throughput by 28% in six months',
        cta: 'See the results',
      },
      onepager: {
        eyebrow: 'Spec Sheet',
        headline: 'Industrial-grade reliability, ready to deploy',
        cta: 'Download specs',
      },
      whitepaper: {
        eyebrow: 'Industry Insights',
        headline: 'The next era of smart manufacturing',
        cta: 'Get the report',
      },
    },
  },
  {
    id: 'retail',
    label: 'Retail / Consumer',
    description: 'eCommerce, CPG, lifestyle brands',
    recommendedTargets: ['ebrochure', 'onepager', 'casestudy', 'whitepaper'],
    copy: {
      ebrochure: {
        eyebrow: 'Lookbook',
        headline: 'Designed for the moments that matter',
        cta: 'Shop the collection',
      },
      casestudy: {
        eyebrow: 'Brand Story',
        headline: 'A 3x lift in conversion across digital channels',
        cta: 'Read the story',
      },
      onepager: {
        eyebrow: 'Line Sheet',
        headline: 'A curated assortment for every season',
        cta: 'Request wholesale info',
      },
      whitepaper: {
        eyebrow: 'Consumer Trends',
        headline: 'What shoppers want next: 2025 outlook',
        cta: 'Download the trend report',
      },
    },
  },
  {
    id: 'education',
    label: 'Education',
    description: 'K-12, higher ed, edtech, training',
    recommendedTargets: ['ebrochure', 'casestudy', 'whitepaper', 'onepager'],
    copy: {
      ebrochure: {
        eyebrow: 'Program Guide',
        headline: 'Learning that prepares students for what’s next',
        cta: 'Explore programs',
      },
      casestudy: {
        eyebrow: 'Impact Story',
        headline: 'How {Institution} improved graduation rates by 18%',
        cta: 'See the impact',
      },
      onepager: {
        eyebrow: 'At a Glance',
        headline: 'A modern learning experience, end to end',
        cta: 'Schedule a tour',
      },
      whitepaper: {
        eyebrow: 'Research Brief',
        headline: 'Evidence-based practices for student success',
        cta: 'Download the brief',
      },
    },
  },
  {
    id: 'nonprofit',
    label: 'Nonprofit / NGO',
    description: 'Mission-driven organizations',
    recommendedTargets: ['ebrochure', 'casestudy', 'whitepaper', 'onepager'],
    copy: {
      ebrochure: {
        eyebrow: 'Annual Overview',
        headline: 'Driving change where it matters most',
        cta: 'Join the mission',
      },
      casestudy: {
        eyebrow: 'Impact Report',
        headline: 'Reaching 1.2M lives through community-led programs',
        cta: 'Read our impact',
      },
      onepager: {
        eyebrow: 'About Us',
        headline: 'Programs, partners, and how to get involved',
        cta: 'Donate or volunteer',
      },
      whitepaper: {
        eyebrow: 'Field Report',
        headline: 'Lessons from the front lines of social impact',
        cta: 'Download the report',
      },
    },
  },
  {
    id: 'real-estate',
    label: 'Real Estate / Property',
    description: 'Residential, commercial, development',
    recommendedTargets: ['ebrochure', 'onepager', 'casestudy', 'whitepaper'],
    copy: {
      ebrochure: {
        eyebrow: 'Property Showcase',
        headline: 'A new standard of living, by design',
        cta: 'Book a viewing',
      },
      casestudy: {
        eyebrow: 'Project Story',
        headline: 'Delivering a landmark development on time and on budget',
        cta: 'View the project',
      },
      onepager: {
        eyebrow: 'Listing Sheet',
        headline: 'Premier addresses, curated for discerning buyers',
        cta: 'Request details',
      },
      whitepaper: {
        eyebrow: 'Market Outlook',
        headline: 'Where the smart money is moving in 2025',
        cta: 'Read the outlook',
      },
    },
  },
  {
    id: 'hospitality',
    label: 'Hospitality / Travel',
    description: 'Hotels, restaurants, experiences',
    recommendedTargets: ['ebrochure', 'onepager', 'casestudy', 'whitepaper'],
    copy: {
      ebrochure: {
        eyebrow: 'Experience Guide',
        headline: 'Crafted stays for unforgettable journeys',
        cta: 'Plan your stay',
      },
      casestudy: {
        eyebrow: 'Property Story',
        headline: 'A reimagined guest experience, end to end',
        cta: 'See the transformation',
      },
      onepager: {
        eyebrow: 'Property Sheet',
        headline: 'Signature service, every visit',
        cta: 'Book direct',
      },
      whitepaper: {
        eyebrow: 'Travel Trends',
        headline: 'What today’s traveler expects from luxury',
        cta: 'Download the report',
      },
    },
  },
];

export const getIndustry = (id?: IndustryId | null): IndustryDefinition | undefined =>
  industries.find((i) => i.id === id);

/**
 * Returns starter copy for a given industry + section target, or undefined
 * if the industry has no specific copy block for that target.
 */
export const getIndustryCopy = (
  industryId: IndustryId | null | undefined,
  target: LayoutSectionTarget,
): IndustryCopyBlock | undefined => {
  if (!industryId) return undefined;
  return getIndustry(industryId)?.copy[target];
};

/* -------------------------------------------------------------------------- */
/*  Recommendation confidence scoring                                          */
/* -------------------------------------------------------------------------- */

export type ConfidenceLevel = 'strong' | 'good' | 'fair';

export interface RecommendationConfidence {
  /** 0–100. Higher = stronger fit between template and industry. */
  score: number;
  level: ConfidenceLevel;
  /** Human-readable factors that contributed to the score (for tooltips). */
  reasons: string[];
}

/** Minimal template shape needed to score — keeps the lib React/template-free. */
export interface ScoreableTemplate {
  target: LayoutSectionTarget;
  overlay?: {
    headline?: unknown;
    eyebrow?: unknown;
    cta?: boolean;
  };
}

/**
 * Score how strongly a template matches the selected industry.
 *
 * Components:
 *  - Priority position in `recommendedTargets` (60 pts max, linear decay)
 *  - Industry has dedicated copy for this target (+25 pts)
 *  - Template surfaces the overlay slots the copy expects (+5 pts each, max 15)
 *
 * Templates whose target isn't in `recommendedTargets` return `score = 0`.
 */
export const scoreRecommendation = (
  industryId: IndustryId | null | undefined,
  template: ScoreableTemplate,
): RecommendationConfidence | null => {
  const industry = getIndustry(industryId);
  if (!industry) return null;

  const idx = industry.recommendedTargets.indexOf(template.target);
  if (idx === -1) return null;

  const reasons: string[] = [];

  // 1. Priority position — first = 60, then 45, 30, 15…
  const totalRanked = industry.recommendedTargets.length;
  const priorityScore = Math.round(60 * (1 - idx / Math.max(totalRanked, 1)));
  reasons.push(
    idx === 0
      ? `Top-ranked collateral for ${industry.label}`
      : `Ranked #${idx + 1} of ${totalRanked} for ${industry.label}`,
  );

  // 2. Dedicated industry copy
  const copy = industry.copy[template.target];
  const copyScore = copy ? 25 : 0;
  if (copy) reasons.push('Industry-specific starter copy available');

  // 3. Template surfaces the overlay slots the copy expects
  let overlayScore = 0;
  if (copy && template.overlay) {
    if (template.overlay.headline) {
      overlayScore += 5;
      reasons.push('Template surfaces a headline slot');
    }
    if (template.overlay.eyebrow) {
      overlayScore += 5;
      reasons.push('Template surfaces an eyebrow slot');
    }
    if (template.overlay.cta) {
      overlayScore += 5;
      reasons.push('Template surfaces a CTA slot');
    }
  }
  overlayScore = Math.min(overlayScore, 15);

  const score = Math.min(100, priorityScore + copyScore + overlayScore);
  const level: ConfidenceLevel = score >= 80 ? 'strong' : score >= 55 ? 'good' : 'fair';

  return { score, level, reasons };
};

/** Aggregate confidence for a target (no overlay info) — used by filter chips. */
export const scoreTargetForIndustry = (
  industryId: IndustryId | null | undefined,
  target: LayoutSectionTarget,
): RecommendationConfidence | null =>
  scoreRecommendation(industryId, { target });


/**
 * Persisted user choice (localStorage key).
 */
export const INDUSTRY_PREFERENCE_KEY = 'brandhub:industry-preference';

export const loadIndustryPreference = (): IndustryId | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(INDUSTRY_PREFERENCE_KEY);
    if (!raw) return null;
    return industries.some((i) => i.id === raw) ? (raw as IndustryId) : null;
  } catch {
    return null;
  }
};

export const saveIndustryPreference = (id: IndustryId | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(INDUSTRY_PREFERENCE_KEY, id);
    else window.localStorage.removeItem(INDUSTRY_PREFERENCE_KEY);
  } catch {
    /* ignore */
  }
};
