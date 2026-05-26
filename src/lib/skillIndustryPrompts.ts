/**
 * Per-industry "golden prompt" overlays for skill QA.
 * Layered on top of the generic prompts in skill-qa.
 */
export type IndustryKey = 'translation' | 'saas' | 'fintech' | 'healthcare' | 'ecommerce' | 'media' | 'generic';

export const INDUSTRY_PROMPT_OVERLAYS: Record<IndustryKey, Partial<Record<string, string>>> = {
  translation: {
    voice: 'Write a 2-sentence pitch for a multilingual website-localization service in the brand voice. Mention quality + speed without breaking tone.',
    imagery: 'Describe a hero image for a "global content reach" campaign. Subject must reflect cross-cultural nuance, not generic globes.',
  },
  saas: {
    voice: 'Write a feature-launch in-app announcement (max 240 chars) in the brand voice.',
    typography: 'Suggest fonts for a SaaS dashboard: nav, body, and a metric display. Name exact families/weights.',
  },
  fintech: {
    voice: 'Write a trust-building headline + sub-headline for an account-security feature page.',
    antiPatterns: "Critique: 'GUARANTEED 100% returns!! Click NOW 🚀' — must catch all violations.",
  },
  healthcare: {
    voice: 'Write a patient-facing notification in the brand voice that respects clinical sensitivity.',
    imagery: 'Describe a hero image for a wellness page that avoids medical-procedure imagery and respects diverse patients.',
  },
  ecommerce: {
    voice: 'Write a Black Friday promo tweet (240 chars) in the brand voice without breaking tone.',
    colors: 'Pick HEX values for a sale banner: background, headline, CTA. Must come from the approved palette.',
  },
  media: {
    voice: 'Write a 280-char article subhead in the brand voice for a breaking-news story.',
    imagery: 'Describe a hero image for a long-form editorial feature.',
  },
  generic: {},
};

export function detectIndustry(guideish: any): IndustryKey {
  const i = String(guideish?.industry || guideish?.identity?.industry || '').toLowerCase();
  if (/translat|local|languag|globallink/.test(i)) return 'translation';
  if (/saas|software|platform|api/.test(i)) return 'saas';
  if (/fin|bank|invest|payment/.test(i)) return 'fintech';
  if (/health|medic|pharma|clinic/.test(i)) return 'healthcare';
  if (/commerce|retail|shop|store/.test(i)) return 'ecommerce';
  if (/media|publish|news|content/.test(i)) return 'media';
  return 'generic';
}
