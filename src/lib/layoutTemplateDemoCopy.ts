/**
 * Demo (placeholder) copy shown inside layout-template previews when the user
 * hasn't provided their own headline/eyebrow/CTA yet. Keyed by LayoutSectionTarget
 * so each template type (hero, social, billboard, etc.) gets contextual copy.
 *
 * All demo copy renders in the brand-approved font (Geist → Poppins → Montserrat),
 * declared globally via tailwind.config.ts and applied on overlay text.
 */
import type { LayoutSectionTarget } from './brandLayoutTemplates';

export interface DemoCopy {
  eyebrow: string;
  headline: string;
  cta: string;
}

const DEMO_COPY: Record<LayoutSectionTarget, DemoCopy> = {
  hero:        { eyebrow: 'Introducing',       headline: 'Connecting global brands to every audience.', cta: 'Explore the work' },
  services:    { eyebrow: 'What we do',        headline: 'Language. Technology. Culture.',              cta: 'See capabilities' },
  casestudy:   { eyebrow: 'Case study',        headline: 'Scaling a global launch in 47 markets.',      cta: 'Read the story' },
  social:      { eyebrow: 'Now live',          headline: 'Move faster. Speak to everyone.',             cta: 'Follow along' },
  event:       { eyebrow: 'Save the date',     headline: 'Join us at GlobalLink NEXT.',                 cta: 'Reserve your seat' },
  product:     { eyebrow: 'Product',           headline: 'Localization, reimagined for AI.',            cta: 'Discover the suite' },
  editorial:   { eyebrow: 'Field notes',       headline: 'Where translation meets transformation.',     cta: 'Read the essay' },
  divider:     { eyebrow: 'Section',           headline: 'A new chapter.',                              cta: 'Continue' },
  ad:          { eyebrow: 'Now available',     headline: 'Speak globally. Scale instantly.',            cta: 'Get a demo' },
  email:       { eyebrow: 'This week',         headline: 'Your localization update.',                   cta: 'Read the brief' },
  billboard:   { eyebrow: 'Coming soon',       headline: 'One brand. Every language.',                  cta: 'Learn more' },
  story:       { eyebrow: 'Inside TransPerfect', headline: 'Real teams. Real results.',                 cta: 'Tap to explore' },
  carousel:    { eyebrow: 'Three steps',       headline: 'Foundation. Collaborate. Transform.',         cta: 'Swipe →' },
  pitch:       { eyebrow: 'Confidential',      headline: 'A vision for the connected enterprise.',      cta: 'Continue' },
  web:         { eyebrow: 'Welcome',           headline: 'Build a brand the world understands.',        cta: 'Start now' },
  ebrochure:   { eyebrow: 'Brand brochure',    headline: 'A handcrafted look at our work.',             cta: 'Open the brochure' },
  onepager:    { eyebrow: 'At a glance',       headline: 'Everything in one page.',                     cta: 'Download PDF' },
  whitepaper:  { eyebrow: 'Research',          headline: 'The state of global brand experience.',       cta: 'Read the report' },
};

export const getDemoCopy = (target: LayoutSectionTarget): DemoCopy =>
  DEMO_COPY[target] ?? DEMO_COPY.hero;

/** Brand-approved font stack used inside layout-template overlays. */
export const APPROVED_FONT_STACK =
  "'Geist', 'Poppins', 'Montserrat', 'Verdana', sans-serif";
