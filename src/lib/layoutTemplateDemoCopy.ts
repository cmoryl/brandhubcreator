/**
 * Demo (placeholder) copy + typography spec for each layout-template target.
 *
 * - `copy` — eyebrow / headline / CTA shown when the user hasn't written their own.
 * - `type` — per-target typographic treatment (size, weight, font, tracking, case)
 *   so each template type gets a distinct, intentional voice. Headlines respect
 *   the project rule "Poppins for headlines, Montserrat for sub-headlines,
 *   Verdana/Geist for body".
 *
 * Sizes use clamp() so the canvas scales correctly inside small gallery
 * thumbnails AND large editor previews / exports.
 */
import type React from 'react';
import type { LayoutSectionTarget } from './brandLayoutTemplates';

export interface DemoCopy {
  eyebrow: string;
  headline: string;
  cta: string;
}

/** Typography rules for one of the three overlay slots. */
export interface OverlayType {
  /** CSS font-family stack. */
  fontFamily: string;
  /** Tailwind-friendly inline font-size (clamp() recommended). */
  fontSize: string;
  /** 100–900. */
  fontWeight: number;
  /** CSS letter-spacing. */
  letterSpacing?: string;
  /** Line height. */
  lineHeight?: number | string;
  textTransform?: React.CSSProperties['textTransform'];
  fontStyle?: React.CSSProperties['fontStyle'];
}

export interface TemplateTypography {
  eyebrow: OverlayType;
  headline: OverlayType;
  cta: OverlayType;
}

/* -------------------------------------------------------------------------- */
/*  Approved font stacks                                                       */
/* -------------------------------------------------------------------------- */

const HEAD = "'Poppins', 'Geist', 'Montserrat', sans-serif";          // Headlines
const SUB  = "'Montserrat', 'Poppins', 'Geist', sans-serif";          // Sub-heads / eyebrows
const BODY = "'Geist', 'Verdana', 'Montserrat', sans-serif";          // UI / CTAs / body

export const APPROVED_FONT_STACK = BODY; // back-compat export

/* -------------------------------------------------------------------------- */
/*  Reusable type presets                                                      */
/* -------------------------------------------------------------------------- */

const eyebrowSm: OverlayType  = { fontFamily: SUB,  fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',  fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.2 };
const eyebrowXs: OverlayType  = { fontFamily: SUB,  fontSize: 'clamp(0.5rem, 0.9vw, 0.65rem)', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', lineHeight: 1.2 };
const eyebrowMd: OverlayType  = { fontFamily: SUB,  fontSize: 'clamp(0.65rem, 1.1vw, 0.85rem)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1.2 };
const eyebrowSerifIt: OverlayType = { fontFamily: HEAD, fontSize: 'clamp(0.6rem, 1vw, 0.8rem)', fontWeight: 400, letterSpacing: '0.05em', fontStyle: 'italic', lineHeight: 1.2 };

const headXl: OverlayType   = { fontFamily: HEAD, fontSize: 'clamp(1.4rem, 4.5vw, 3.25rem)',  fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 };
const headLg: OverlayType   = { fontFamily: HEAD, fontSize: 'clamp(1.1rem, 3.5vw, 2.5rem)',   fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.1 };
const headMd: OverlayType   = { fontFamily: HEAD, fontSize: 'clamp(0.95rem, 2.8vw, 2rem)',    fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15 };
const headSm: OverlayType   = { fontFamily: HEAD, fontSize: 'clamp(0.8rem, 2.2vw, 1.5rem)',   fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.2 };
const headThin: OverlayType = { fontFamily: HEAD, fontSize: 'clamp(1rem, 3vw, 2.25rem)',      fontWeight: 300, letterSpacing: '0',        lineHeight: 1.15 };
const headBold: OverlayType = { fontFamily: HEAD, fontSize: 'clamp(1.5rem, 5vw, 4rem)',       fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' };
const headEditorial: OverlayType = { fontFamily: HEAD, fontSize: 'clamp(1.1rem, 3.2vw, 2.4rem)', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.18, fontStyle: 'italic' };

const ctaPill: OverlayType  = { fontFamily: BODY, fontSize: 'clamp(0.55rem, 0.95vw, 0.75rem)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 };
const ctaQuiet: OverlayType = { fontFamily: BODY, fontSize: 'clamp(0.5rem, 0.85vw, 0.7rem)',   fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 };
const ctaLoud: OverlayType  = { fontFamily: BODY, fontSize: 'clamp(0.6rem, 1.05vw, 0.8rem)',   fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 };

/* -------------------------------------------------------------------------- */
/*  Per-target spec                                                            */
/* -------------------------------------------------------------------------- */

interface TargetSpec extends DemoCopy {
  type: TemplateTypography;
}

const SPECS: Record<LayoutSectionTarget, TargetSpec> = {
  hero:        { eyebrow: 'Introducing',         headline: 'Connecting global brands to every audience.', cta: 'Explore the work', type: { eyebrow: eyebrowMd, headline: headXl, cta: ctaLoud } },
  services:    { eyebrow: 'What we do',          headline: 'Language. Technology. Culture.',              cta: 'See capabilities', type: { eyebrow: eyebrowSm, headline: headLg, cta: ctaPill } },
  casestudy:   { eyebrow: 'Case study',          headline: 'Scaling a global launch in 47 markets.',      cta: 'Read the story',   type: { eyebrow: eyebrowSerifIt, headline: headEditorial, cta: ctaQuiet } },
  social:      { eyebrow: 'Now live',            headline: 'Move faster. Speak to everyone.',             cta: 'Follow along',     type: { eyebrow: eyebrowMd, headline: headBold, cta: ctaLoud } },
  event:       { eyebrow: 'Save the date',       headline: 'Join us at GlobalLink NEXT.',                 cta: 'Reserve your seat', type: { eyebrow: eyebrowMd, headline: headXl, cta: ctaLoud } },
  product:     { eyebrow: 'Product',             headline: 'Localization, reimagined for AI.',            cta: 'Discover the suite', type: { eyebrow: eyebrowSm, headline: headLg, cta: ctaPill } },
  editorial:   { eyebrow: 'Field notes',         headline: 'Where translation meets transformation.',     cta: 'Read the essay',   type: { eyebrow: eyebrowSerifIt, headline: headEditorial, cta: ctaQuiet } },
  divider:     { eyebrow: 'Section',             headline: 'A new chapter.',                              cta: 'Continue',         type: { eyebrow: eyebrowXs, headline: headThin, cta: ctaQuiet } },
  ad:          { eyebrow: 'Now available',       headline: 'Speak globally. Scale instantly.',            cta: 'Get a demo',       type: { eyebrow: eyebrowSm, headline: headMd, cta: ctaLoud } },
  email:       { eyebrow: 'This week',           headline: 'Your localization update.',                   cta: 'Read the brief',   type: { eyebrow: eyebrowSm, headline: headMd, cta: ctaPill } },
  billboard:   { eyebrow: 'Coming soon',         headline: 'One brand. Every language.',                  cta: 'Learn more',       type: { eyebrow: eyebrowMd, headline: headBold, cta: ctaLoud } },
  story:       { eyebrow: 'Inside TransPerfect', headline: 'Real teams. Real results.',                   cta: 'Tap to explore',   type: { eyebrow: eyebrowMd, headline: headLg, cta: ctaPill } },
  carousel:    { eyebrow: 'Three steps',         headline: 'Foundation. Collaborate. Transform.',         cta: 'Swipe →',          type: { eyebrow: eyebrowSm, headline: headMd, cta: ctaQuiet } },
  pitch:       { eyebrow: 'Confidential',        headline: 'A vision for the connected enterprise.',      cta: 'Continue',         type: { eyebrow: eyebrowSerifIt, headline: headEditorial, cta: ctaQuiet } },
  web:         { eyebrow: 'Welcome',             headline: 'Build a brand the world understands.',        cta: 'Start now',        type: { eyebrow: eyebrowMd, headline: headXl, cta: ctaLoud } },
  ebrochure:   { eyebrow: 'Brand brochure',      headline: 'A handcrafted look at our work.',             cta: 'Open the brochure', type: { eyebrow: eyebrowSerifIt, headline: headEditorial, cta: ctaQuiet } },
  onepager:    { eyebrow: 'At a glance',         headline: 'Everything in one page.',                     cta: 'Download PDF',     type: { eyebrow: eyebrowSm, headline: headMd, cta: ctaPill } },
  whitepaper:  { eyebrow: 'Research',            headline: 'The state of global brand experience.',       cta: 'Read the report',  type: { eyebrow: eyebrowSerifIt, headline: headEditorial, cta: ctaQuiet } },
};

export const getDemoCopy = (target: LayoutSectionTarget): DemoCopy => {
  const s = SPECS[target] ?? SPECS.hero;
  return { eyebrow: s.eyebrow, headline: s.headline, cta: s.cta };
};

export const getTemplateTypography = (target: LayoutSectionTarget): TemplateTypography =>
  (SPECS[target] ?? SPECS.hero).type;

/** Convert an OverlayType into inline React style. */
export const overlayTypeToStyle = (t: OverlayType): React.CSSProperties => ({
  fontFamily: t.fontFamily,
  fontSize: t.fontSize,
  fontWeight: t.fontWeight,
  letterSpacing: t.letterSpacing,
  lineHeight: t.lineHeight,
  textTransform: t.textTransform,
  fontStyle: t.fontStyle,
});
