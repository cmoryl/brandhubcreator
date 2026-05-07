import type React from 'react';
/**
 * Brand Guide Layout Templates
 *
 * Reusable layout templates that automatically place brand visuals from the
 * Foundation / Collaborate / Transform expression states into common brand
 * guide sections (hero, services, case study, social card, etc.).
 *
 * Templates are expression-state-aware: each slot specifies which expression
 * state should fill it. The runtime resolver picks the best static or motion
 * asset for that slot from `guide_data.brandVisuals`.
 */

export type ExpressionState = 'Foundation' | 'Collaborate' | 'Transform';

export type LayoutSectionTarget =
  | 'hero'
  | 'services'
  | 'casestudy'
  | 'social'
  | 'event'
  | 'product'
  | 'editorial'
  | 'divider'
  | 'ad'
  | 'email'
  | 'billboard'
  | 'story'
  | 'carousel'
  | 'pitch'
  | 'web'
  | 'ebrochure'
  | 'onepager'
  | 'whitepaper';

export type SlotKind = 'background' | 'feature' | 'card' | 'banner' | 'video';
export type SlotShape = 'wide' | 'standard' | 'banner' | 'vertical' | 'square';

export interface LayoutSlot {
  /** Stable slot key inside the template (used by the renderer). */
  key: string;
  /** Which brand expression state should fill this slot. */
  expressionState: ExpressionState;
  /** What kind of surface this slot renders as. */
  kind: SlotKind;
  /** Preferred asset shape — used to score the best matching visual. */
  preferredShape: SlotShape;
  /** Allow motion (video) assets in addition to static. */
  allowMotion?: boolean;
  /** Human label shown in the editor preview. */
  label: string;
  /** Optional CSS grid placement, percentages of the canvas. */
  position?: { x: number; y: number; width: number; height: number };
}

export interface BrandLayoutTemplate {
  id: string;
  name: string;
  description: string;
  /** Brand guide section this template targets. */
  target: LayoutSectionTarget;
  /** Aspect ratio of the overall composition. */
  aspectRatio: number;
  /** Tailwind class for preview canvas (light wrapper styling). */
  previewClass?: string;
  /** Slots, in render order. */
  slots: LayoutSlot[];
  /** Suggested overlay / typography hints for renderers. */
  overlay?: {
    headline?: { y: number; align: 'left' | 'center' | 'right' };
    eyebrow?: { y: number; align: 'left' | 'center' | 'right' };
    cta?: boolean;
  };
}

/* -------------------------------------------------------------------------- */
/*  Template definitions                                                       */
/* -------------------------------------------------------------------------- */

export const brandLayoutTemplates: BrandLayoutTemplate[] = [
  /* ---------------- HERO ---------------- */
  {
    id: 'hero-foundation-wide',
    name: 'Foundation Hero — Ultrawide',
    description: 'Full-bleed Foundation visual as a calm, confident hero band.',
    target: 'hero',
    aspectRatio: 30 / 13,
    slots: [
      {
        key: 'bg',
        expressionState: 'Foundation',
        kind: 'background',
        preferredShape: 'wide',
        label: 'Foundation background',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { headline: { y: 55, align: 'left' }, eyebrow: { y: 42, align: 'left' }, cta: true },
  },
  {
    id: 'hero-foundation-standard',
    name: 'Foundation Hero — Standard',
    description: '16:10 Foundation hero with overlaid headline and supporting CTA.',
    target: 'hero',
    aspectRatio: 16 / 10,
    slots: [
      {
        key: 'bg',
        expressionState: 'Foundation',
        kind: 'background',
        preferredShape: 'standard',
        label: 'Foundation hero',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { headline: { y: 60, align: 'center' }, cta: true },
  },
  {
    id: 'hero-transform-motion',
    name: 'Transform Hero — Motion',
    description: 'Looping Rhythm motion as the hero — energetic and forward-leaning.',
    target: 'hero',
    aspectRatio: 16 / 9,
    slots: [
      {
        key: 'bg',
        expressionState: 'Transform',
        kind: 'video',
        preferredShape: 'wide',
        allowMotion: true,
        label: 'Rhythm horizontal',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { headline: { y: 65, align: 'left' }, cta: true },
  },

  /* ---------------- SERVICES / FEATURES ---------------- */
  {
    id: 'services-collab-trio',
    name: 'Services — Collaborate Trio',
    description: 'Three illustrative Collaborate panels for service or capability grids.',
    target: 'services',
    aspectRatio: 16 / 6,
    slots: [
      {
        key: 'a',
        expressionState: 'Collaborate',
        kind: 'feature',
        preferredShape: 'standard',
        label: 'Service A',
        position: { x: 0, y: 0, width: 33.33, height: 100 },
      },
      {
        key: 'b',
        expressionState: 'Collaborate',
        kind: 'feature',
        preferredShape: 'standard',
        label: 'Service B',
        position: { x: 33.33, y: 0, width: 33.33, height: 100 },
      },
      {
        key: 'c',
        expressionState: 'Collaborate',
        kind: 'feature',
        preferredShape: 'standard',
        label: 'Service C',
        position: { x: 66.66, y: 0, width: 33.34, height: 100 },
      },
    ],
  },
  {
    id: 'services-split-foundation-collab',
    name: 'Services — Split (Foundation + Collaborate)',
    description: 'Foundation anchor on the left; Collaborate illustrative on the right.',
    target: 'services',
    aspectRatio: 16 / 7,
    slots: [
      {
        key: 'left',
        expressionState: 'Foundation',
        kind: 'feature',
        preferredShape: 'standard',
        label: 'Foundation anchor',
        position: { x: 0, y: 0, width: 50, height: 100 },
      },
      {
        key: 'right',
        expressionState: 'Collaborate',
        kind: 'feature',
        preferredShape: 'standard',
        label: 'Collaborate detail',
        position: { x: 50, y: 0, width: 50, height: 100 },
      },
    ],
  },

  /* ---------------- CASE STUDY ---------------- */
  {
    id: 'casestudy-collab-cover',
    name: 'Case Study — Collaborate Cover',
    description: 'Standard 16:9 Collaborate cover with title block overlay.',
    target: 'casestudy',
    aspectRatio: 16 / 9,
    slots: [
      {
        key: 'cover',
        expressionState: 'Collaborate',
        kind: 'background',
        preferredShape: 'standard',
        label: 'Collaborate cover',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { eyebrow: { y: 70, align: 'left' }, headline: { y: 78, align: 'left' } },
  },
  {
    id: 'casestudy-collab-banner',
    name: 'Case Study — Banner Divider',
    description: 'Ultra-wide Collaborate banner for inline section dividers.',
    target: 'divider',
    aspectRatio: 30 / 6,
    slots: [
      {
        key: 'bg',
        expressionState: 'Collaborate',
        kind: 'banner',
        preferredShape: 'banner',
        label: 'Collaborate banner',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
  },

  /* ---------------- SOCIAL / CARDS ---------------- */
  {
    id: 'social-transform-card',
    name: 'Social — Transform Card',
    description: 'Vertical Transform card for social tiles, mobile features and reels covers.',
    target: 'social',
    aspectRatio: 12 / 13,
    slots: [
      {
        key: 'bg',
        expressionState: 'Transform',
        kind: 'card',
        preferredShape: 'vertical',
        label: 'Transform vertical',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { headline: { y: 70, align: 'center' }, cta: true },
  },
  {
    id: 'social-transform-motion-vertical',
    name: 'Social — Transform Motion (Vertical)',
    description: '9:16 motion Rhythm for Reels, TikTok, Shorts and vertical signage.',
    target: 'social',
    aspectRatio: 9 / 16,
    slots: [
      {
        key: 'bg',
        expressionState: 'Transform',
        kind: 'video',
        preferredShape: 'vertical',
        allowMotion: true,
        label: 'Rhythm vertical',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { headline: { y: 75, align: 'center' } },
  },

  /* ---------------- PRODUCT / EVENT ---------------- */
  {
    id: 'product-foundation-card',
    name: 'Product — Foundation Card',
    description: 'Foundation hero used as a product suite card cover.',
    target: 'product',
    aspectRatio: 16 / 10,
    slots: [
      {
        key: 'bg',
        expressionState: 'Foundation',
        kind: 'card',
        preferredShape: 'standard',
        label: 'Foundation product cover',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { eyebrow: { y: 10, align: 'left' }, headline: { y: 75, align: 'left' } },
  },
  {
    id: 'event-transform-banner',
    name: 'Event — Transform Banner',
    description: 'Transform motion or vertical card to anchor event promotion.',
    target: 'event',
    aspectRatio: 16 / 9,
    slots: [
      {
        key: 'bg',
        expressionState: 'Transform',
        kind: 'video',
        preferredShape: 'wide',
        allowMotion: true,
        label: 'Transform banner',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
    ],
    overlay: { eyebrow: { y: 12, align: 'center' }, headline: { y: 60, align: 'center' }, cta: true },
  },

  /* ---------------- EDITORIAL ---------------- */
  {
    id: 'editorial-foundation-collab-stack',
    name: 'Editorial — Foundation + Collaborate Stack',
    description:
      'Foundation hero on top, Collaborate banner below — used for long-form editorial pages.',
    target: 'editorial',
    aspectRatio: 16 / 12,
    slots: [
      {
        key: 'top',
        expressionState: 'Foundation',
        kind: 'background',
        preferredShape: 'standard',
        label: 'Foundation hero',
        position: { x: 0, y: 0, width: 100, height: 65 },
      },
      {
        key: 'bottom',
        expressionState: 'Collaborate',
        kind: 'banner',
        preferredShape: 'banner',
        label: 'Collaborate banner',
        position: { x: 0, y: 65, width: 100, height: 35 },
      },
    ],
  },

  /* ---------------- ADDITIONAL HERO ---------------- */
  {
    id: 'hero-split-foundation-transform',
    name: 'Hero — Split Foundation + Transform',
    description: 'Foundation calm anchor on left; Transform motion energy on right.',
    target: 'hero',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'left', expressionState: 'Foundation', kind: 'background', preferredShape: 'standard', label: 'Foundation', position: { x: 0, y: 0, width: 55, height: 100 } },
      { key: 'right', expressionState: 'Transform', kind: 'video', preferredShape: 'standard', allowMotion: true, label: 'Transform motion', position: { x: 55, y: 0, width: 45, height: 100 } },
    ],
    overlay: { eyebrow: { y: 18, align: 'left' }, headline: { y: 32, align: 'left' }, cta: true },
  },
  {
    id: 'hero-collab-overlap',
    name: 'Hero — Collaborate Overlap',
    description: 'Foundation backdrop with a Collaborate floating tile overlay.',
    target: 'hero',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation backdrop', position: { x: 0, y: 0, width: 100, height: 100 } },
      { key: 'tile', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'square', label: 'Collaborate tile', position: { x: 58, y: 18, width: 36, height: 64 } },
    ],
    overlay: { headline: { y: 28, align: 'left' }, eyebrow: { y: 18, align: 'left' }, cta: true },
  },
  {
    id: 'hero-mosaic-3up',
    name: 'Hero — Mosaic 3-up',
    description: 'Foundation hero with two stacked Collaborate accents on the right.',
    target: 'hero',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'main', expressionState: 'Foundation', kind: 'background', preferredShape: 'standard', label: 'Foundation main', position: { x: 0, y: 0, width: 66, height: 100 } },
      { key: 'top', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'standard', label: 'Collaborate top', position: { x: 66, y: 0, width: 34, height: 50 } },
      { key: 'bot', expressionState: 'Transform', kind: 'feature', preferredShape: 'standard', label: 'Transform bottom', position: { x: 66, y: 50, width: 34, height: 50 } },
    ],
    overlay: { headline: { y: 65, align: 'left' } },
  },

  /* ---------------- WEB / LANDING ---------------- */
  {
    id: 'web-feature-bento',
    name: 'Web — Bento Feature Grid',
    description: 'Asymmetric bento grid mixing all three expression states for landing pages.',
    target: 'web',
    aspectRatio: 16 / 10,
    slots: [
      { key: 'a', expressionState: 'Foundation', kind: 'feature', preferredShape: 'standard', label: 'Foundation', position: { x: 0, y: 0, width: 50, height: 60 } },
      { key: 'b', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'square', label: 'Collaborate', position: { x: 50, y: 0, width: 50, height: 30 } },
      { key: 'c', expressionState: 'Transform', kind: 'feature', preferredShape: 'standard', label: 'Transform', position: { x: 50, y: 30, width: 50, height: 30 } },
      { key: 'd', expressionState: 'Collaborate', kind: 'banner', preferredShape: 'banner', label: 'Collaborate banner', position: { x: 0, y: 60, width: 100, height: 40 } },
    ],
  },
  {
    id: 'web-cta-band',
    name: 'Web — Transform CTA Band',
    description: 'Energetic Transform background for end-of-page calls to action.',
    target: 'web',
    aspectRatio: 30 / 8,
    slots: [
      { key: 'bg', expressionState: 'Transform', kind: 'video', allowMotion: true, preferredShape: 'wide', label: 'Transform CTA', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 35, align: 'center' }, cta: true },
  },

  /* ---------------- AD / DISPLAY ---------------- */
  {
    id: 'ad-leaderboard',
    name: 'Ad — Leaderboard 728×90',
    description: 'Standard leaderboard banner using a Foundation background.',
    target: 'ad',
    aspectRatio: 728 / 90,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation banner', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 35, align: 'left' }, cta: true },
  },
  {
    id: 'ad-mpu',
    name: 'Ad — Medium Rectangle 300×250',
    description: 'Square-ish display ad anchored on a Collaborate tile.',
    target: 'ad',
    aspectRatio: 300 / 250,
    slots: [
      { key: 'bg', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Collaborate', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 12, align: 'left' }, headline: { y: 60, align: 'left' }, cta: true },
  },
  {
    id: 'ad-skyscraper',
    name: 'Ad — Skyscraper 160×600',
    description: 'Vertical Transform skyscraper for sidebar placements.',
    target: 'ad',
    aspectRatio: 160 / 600,
    slots: [
      { key: 'bg', expressionState: 'Transform', kind: 'video', allowMotion: true, preferredShape: 'vertical', label: 'Transform vertical', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 78, align: 'center' }, cta: true },
  },

  /* ---------------- EMAIL ---------------- */
  {
    id: 'email-header',
    name: 'Email — Header Banner',
    description: 'Foundation header banner sized for newsletter and transactional emails.',
    target: 'email',
    aspectRatio: 600 / 240,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation header', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 22, align: 'left' }, headline: { y: 45, align: 'left' } },
  },
  {
    id: 'email-feature-card',
    name: 'Email — Feature Card',
    description: 'Two-column email card pairing a Collaborate visual with copy space.',
    target: 'email',
    aspectRatio: 600 / 320,
    slots: [
      { key: 'img', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'standard', label: 'Collaborate visual', position: { x: 0, y: 0, width: 50, height: 100 } },
      { key: 'panel', expressionState: 'Foundation', kind: 'card', preferredShape: 'standard', label: 'Foundation panel', position: { x: 50, y: 0, width: 50, height: 100 } },
    ],
    overlay: { headline: { y: 35, align: 'left' }, cta: true },
  },

  /* ---------------- BILLBOARD / OOH ---------------- */
  {
    id: 'billboard-horizontal',
    name: 'Billboard — Horizontal 14×48',
    description: 'Ultra-wide highway billboard format with bold Foundation imagery.',
    target: 'billboard',
    aspectRatio: 48 / 14,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'background', preferredShape: 'banner', label: 'Foundation', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 40, align: 'left' }, cta: true },
  },
  {
    id: 'billboard-digital-motion',
    name: 'Billboard — Digital Motion',
    description: 'Animated digital out-of-home using the Transform Rhythm motion.',
    target: 'billboard',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'bg', expressionState: 'Transform', kind: 'video', allowMotion: true, preferredShape: 'wide', label: 'Transform motion', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 42, align: 'center' } },
  },

  /* ---------------- STORY / VERTICAL ---------------- */
  {
    id: 'story-foundation-9x16',
    name: 'Story — Foundation 9×16',
    description: 'Instagram / TikTok story with Foundation hero and bottom-aligned headline.',
    target: 'story',
    aspectRatio: 9 / 16,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 78, align: 'center' }, cta: true },
  },
  {
    id: 'story-split',
    name: 'Story — Split (Foundation + Collaborate)',
    description: 'Vertical 9:16 split story stacking Foundation above a Collaborate tile.',
    target: 'story',
    aspectRatio: 9 / 16,
    slots: [
      { key: 'top', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation', position: { x: 0, y: 0, width: 100, height: 60 } },
      { key: 'bottom', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'square', label: 'Collaborate', position: { x: 0, y: 60, width: 100, height: 40 } },
    ],
    overlay: { headline: { y: 85, align: 'center' } },
  },

  /* ---------------- CAROUSEL ---------------- */
  {
    id: 'carousel-square-trio',
    name: 'Carousel — Square Trio',
    description: 'Three Instagram-square carousel slides walking from Foundation → Collaborate → Transform.',
    target: 'carousel',
    aspectRatio: 3,
    slots: [
      { key: 's1', expressionState: 'Foundation', kind: 'card', preferredShape: 'square', label: 'Slide 1', position: { x: 0, y: 0, width: 33.33, height: 100 } },
      { key: 's2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Slide 2', position: { x: 33.33, y: 0, width: 33.33, height: 100 } },
      { key: 's3', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Slide 3', position: { x: 66.66, y: 0, width: 33.34, height: 100 } },
    ],
  },

  /* ---------------- PITCH DECK ---------------- */
  {
    id: 'pitch-cover',
    name: 'Pitch — Deck Cover',
    description: '16:9 pitch deck cover with Foundation hero and overlaid title block.',
    target: 'pitch',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'bg', expressionState: 'Foundation', kind: 'background', preferredShape: 'standard', label: 'Foundation cover', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 70, align: 'left' }, headline: { y: 80, align: 'left' } },
  },
  {
    id: 'pitch-section-divider',
    name: 'Pitch — Section Divider',
    description: 'Collaborate banner used between deck sections.',
    target: 'pitch',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'bg', expressionState: 'Collaborate', kind: 'background', preferredShape: 'standard', label: 'Collaborate divider', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 45, align: 'center' }, headline: { y: 55, align: 'center' } },
  },

  /* ---------------- ADDITIONAL EDITORIAL / SOCIAL ---------------- */
  {
    id: 'editorial-magazine-spread',
    name: 'Editorial — Magazine Spread',
    description: 'Large Foundation spread with a small Transform inset for magazine layouts.',
    target: 'editorial',
    aspectRatio: 16 / 10,
    slots: [
      { key: 'main', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation spread', position: { x: 0, y: 0, width: 100, height: 100 } },
      { key: 'inset', expressionState: 'Transform', kind: 'feature', preferredShape: 'square', label: 'Transform inset', position: { x: 5, y: 60, width: 22, height: 32 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'left' }, headline: { y: 14, align: 'left' } },
  },
  {
    id: 'social-quote-card',
    name: 'Social — Quote Card 1:1',
    description: 'Square social quote card with a Collaborate background tint.',
    target: 'social',
    aspectRatio: 1,
    slots: [
      { key: 'bg', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Collaborate', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { headline: { y: 45, align: 'center' } },
  },

  /* ---------------- EBROCHURE (digital brochures, A4 portrait & spreads) ---------------- */
  {
    id: 'ebrochure-cover-foundation',
    name: 'Ebrochure — Cover (A4 Portrait)',
    description: 'A4 portrait Foundation cover with overlaid title block and eyebrow tag.',
    target: 'ebrochure',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'cover', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation cover', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'left' }, headline: { y: 75, align: 'left' }, cta: true },
  },
  {
    id: 'ebrochure-spread-feature',
    name: 'Ebrochure — Feature Spread',
    description: 'Two-page A4 spread: Foundation imagery left, Collaborate copy block right.',
    target: 'ebrochure',
    aspectRatio: 420 / 297,
    slots: [
      { key: 'left', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation page', position: { x: 0, y: 0, width: 50, height: 100 } },
      { key: 'right', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'vertical', label: 'Collaborate detail', position: { x: 50, y: 0, width: 50, height: 100 } },
    ],
    overlay: { eyebrow: { y: 12, align: 'right' }, headline: { y: 22, align: 'right' } },
  },
  {
    id: 'ebrochure-product-grid',
    name: 'Ebrochure — Product Grid',
    description: 'A4 portrait page with hero band on top and 2×2 product grid below.',
    target: 'ebrochure',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'hero', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation hero', position: { x: 0, y: 0, width: 100, height: 35 } },
      { key: 'p1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Product A', position: { x: 4, y: 38, width: 46, height: 30 } },
      { key: 'p2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Product B', position: { x: 50, y: 38, width: 46, height: 30 } },
      { key: 'p3', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Product C', position: { x: 4, y: 69, width: 46, height: 30 } },
      { key: 'p4', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Product D', position: { x: 50, y: 69, width: 46, height: 30 } },
    ],
    overlay: { eyebrow: { y: 6, align: 'left' }, headline: { y: 14, align: 'left' } },
  },
  {
    id: 'ebrochure-back-cover',
    name: 'Ebrochure — Back Cover & CTA',
    description: 'A4 portrait back cover: Transform motion top, contact CTA band bottom.',
    target: 'ebrochure',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'top', expressionState: 'Transform', kind: 'video', preferredShape: 'standard', allowMotion: true, label: 'Transform motion', position: { x: 0, y: 0, width: 100, height: 70 } },
      { key: 'band', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation CTA band', position: { x: 0, y: 70, width: 100, height: 30 } },
    ],
    overlay: { headline: { y: 78, align: 'center' }, cta: true },
  },

  /* ---------------- ENHANCED CASE STUDIES ---------------- */
  {
    id: 'casestudy-hero-metrics',
    name: 'Case Study — Hero + Metrics',
    description: 'Foundation hero with three Collaborate metric cards anchored bottom.',
    target: 'casestudy',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'hero', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation hero', position: { x: 0, y: 0, width: 100, height: 65 } },
      { key: 'm1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Metric 1', position: { x: 4, y: 68, width: 30, height: 28 } },
      { key: 'm2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Metric 2', position: { x: 35, y: 68, width: 30, height: 28 } },
      { key: 'm3', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Metric 3', position: { x: 66, y: 68, width: 30, height: 28 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'left' }, headline: { y: 16, align: 'left' } },
  },
  {
    id: 'casestudy-problem-solution',
    name: 'Case Study — Problem / Solution',
    description: 'Editorial split: Foundation problem statement left, Transform solution right.',
    target: 'casestudy',
    aspectRatio: 16 / 10,
    slots: [
      { key: 'problem', expressionState: 'Foundation', kind: 'background', preferredShape: 'standard', label: 'Problem (Foundation)', position: { x: 0, y: 0, width: 50, height: 100 } },
      { key: 'solution', expressionState: 'Transform', kind: 'feature', preferredShape: 'standard', label: 'Solution (Transform)', position: { x: 50, y: 0, width: 50, height: 100 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'center' }, headline: { y: 18, align: 'center' } },
  },
  {
    id: 'casestudy-testimonial-portrait',
    name: 'Case Study — Testimonial Portrait',
    description: 'Vertical Collaborate portrait card with pull-quote overlay.',
    target: 'casestudy',
    aspectRatio: 4 / 5,
    slots: [
      { key: 'portrait', expressionState: 'Collaborate', kind: 'background', preferredShape: 'vertical', label: 'Collaborate portrait', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 60, align: 'left' }, headline: { y: 70, align: 'left' } },
  },
  {
    id: 'casestudy-results-band',
    name: 'Case Study — Results Band',
    description: 'Ultrawide Transform band for outcome / KPI summary slides.',
    target: 'casestudy',
    aspectRatio: 30 / 9,
    slots: [
      { key: 'bg', expressionState: 'Transform', kind: 'banner', preferredShape: 'banner', label: 'Transform results band', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 25, align: 'center' }, headline: { y: 50, align: 'center' } },
  },

  /* ---------------- ONE-PAGERS / SALES SHEETS ---------------- */
  {
    id: 'onepager-classic',
    name: 'One-Pager — Classic Sales Sheet',
    description: 'A4 portrait: Foundation hero, three benefit columns, Transform CTA footer.',
    target: 'onepager',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'hero', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation hero', position: { x: 0, y: 0, width: 100, height: 32 } },
      { key: 'b1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'vertical', label: 'Benefit 1', position: { x: 4, y: 36, width: 30, height: 45 } },
      { key: 'b2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'vertical', label: 'Benefit 2', position: { x: 35, y: 36, width: 30, height: 45 } },
      { key: 'b3', expressionState: 'Collaborate', kind: 'card', preferredShape: 'vertical', label: 'Benefit 3', position: { x: 66, y: 36, width: 30, height: 45 } },
      { key: 'cta', expressionState: 'Transform', kind: 'banner', preferredShape: 'banner', label: 'Transform CTA', position: { x: 0, y: 82, width: 100, height: 18 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'left' }, headline: { y: 16, align: 'left' }, cta: true },
  },
  {
    id: 'onepager-product-spec',
    name: 'One-Pager — Product Spec Sheet',
    description: 'Foundation product image left (60%), specs/features stack right (40%).',
    target: 'onepager',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'product', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation product', position: { x: 0, y: 0, width: 60, height: 100 } },
      { key: 'spec1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'standard', label: 'Spec block 1', position: { x: 60, y: 0, width: 40, height: 33 } },
      { key: 'spec2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'standard', label: 'Spec block 2', position: { x: 60, y: 33, width: 40, height: 34 } },
      { key: 'spec3', expressionState: 'Transform', kind: 'card', preferredShape: 'standard', label: 'CTA / pricing', position: { x: 60, y: 67, width: 40, height: 33 } },
    ],
    overlay: { eyebrow: { y: 6, align: 'right' }, headline: { y: 14, align: 'right' } },
  },
  {
    id: 'onepager-service-overview',
    name: 'One-Pager — Service Overview',
    description: 'Hero band, 4-up Collaborate service grid, Foundation footer band.',
    target: 'onepager',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'hero', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation hero', position: { x: 0, y: 0, width: 100, height: 28 } },
      { key: 's1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Service A', position: { x: 4, y: 32, width: 46, height: 28 } },
      { key: 's2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Service B', position: { x: 50, y: 32, width: 46, height: 28 } },
      { key: 's3', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Service C', position: { x: 4, y: 61, width: 46, height: 28 } },
      { key: 's4', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Service D', position: { x: 50, y: 61, width: 46, height: 28 } },
      { key: 'foot', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation footer', position: { x: 0, y: 90, width: 100, height: 10 } },
    ],
    overlay: { eyebrow: { y: 6, align: 'left' }, headline: { y: 14, align: 'left' } },
  },

  /* ---------------- WHITE PAPERS / REPORTS ---------------- */
  {
    id: 'whitepaper-cover',
    name: 'White Paper — Cover',
    description: 'A4 portrait Foundation cover with research title block and Collaborate accent strip.',
    target: 'whitepaper',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'cover', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation cover', position: { x: 0, y: 0, width: 100, height: 78 } },
      { key: 'accent', expressionState: 'Collaborate', kind: 'banner', preferredShape: 'banner', label: 'Collaborate accent', position: { x: 0, y: 78, width: 100, height: 22 } },
    ],
    overlay: { eyebrow: { y: 6, align: 'left' }, headline: { y: 60, align: 'left' } },
  },
  {
    id: 'whitepaper-toc',
    name: 'White Paper — Table of Contents',
    description: 'A4 portrait: Foundation header band + clean body for chapter list.',
    target: 'whitepaper',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'header', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation header', position: { x: 0, y: 0, width: 100, height: 22 } },
      { key: 'side', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'vertical', label: 'Collaborate side accent', position: { x: 0, y: 22, width: 8, height: 78 } },
    ],
    overlay: { eyebrow: { y: 6, align: 'left' }, headline: { y: 12, align: 'left' } },
  },
  {
    id: 'whitepaper-chapter-opener',
    name: 'White Paper — Chapter Opener',
    description: 'A4 portrait: Foundation chapter image (top half) and clean editorial body below.',
    target: 'whitepaper',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'image', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation chapter image', position: { x: 0, y: 0, width: 100, height: 50 } },
      { key: 'rule', expressionState: 'Collaborate', kind: 'banner', preferredShape: 'banner', label: 'Collaborate divider', position: { x: 0, y: 50, width: 100, height: 4 } },
    ],
    overlay: { eyebrow: { y: 56, align: 'left' }, headline: { y: 62, align: 'left' } },
  },
  {
    id: 'whitepaper-data-spread',
    name: 'White Paper — Data Spread',
    description: 'Two-page A3 landscape spread: Collaborate chart left, Transform insight callout right.',
    target: 'whitepaper',
    aspectRatio: 420 / 297,
    slots: [
      { key: 'chart', expressionState: 'Collaborate', kind: 'feature', preferredShape: 'standard', label: 'Collaborate chart', position: { x: 0, y: 0, width: 60, height: 100 } },
      { key: 'insight', expressionState: 'Transform', kind: 'card', preferredShape: 'standard', label: 'Transform insight', position: { x: 60, y: 0, width: 40, height: 100 } },
    ],
    overlay: { eyebrow: { y: 10, align: 'right' }, headline: { y: 18, align: 'right' } },
  },
  {
    id: 'whitepaper-back-cover',
    name: 'White Paper — Back Cover',
    description: 'A4 portrait back cover: Transform motion + author/contact band at bottom.',
    target: 'whitepaper',
    aspectRatio: 210 / 297,
    slots: [
      { key: 'top', expressionState: 'Transform', kind: 'video', preferredShape: 'standard', allowMotion: true, label: 'Transform motion', position: { x: 0, y: 0, width: 100, height: 75 } },
      { key: 'band', expressionState: 'Foundation', kind: 'banner', preferredShape: 'banner', label: 'Foundation footer', position: { x: 0, y: 75, width: 100, height: 25 } },
    ],
    overlay: { headline: { y: 82, align: 'center' }, cta: true },
  },
];

/* -------------------------------------------------------------------------- */
/*  Resolver: map a template + brand visuals → concrete URLs per slot          */
/* -------------------------------------------------------------------------- */

export interface BrandStaticAsset {
  id: string;
  name: string;
  expressionState: ExpressionState;
  aspectRatio: string;
  imageUrl: string;
  /**
   * Asset category — used by templates to request a specific kind of imagery.
   * - 'abstract' (default): orbs, gradients, abstract brand visuals
   * - 'human': realistic human photography
   */
  category?: 'abstract' | 'human';
  tags?: string[];
  recommendedUse?: string;
  description?: string;
}

export interface BrandMotionAsset {
  id: string;
  name: string;
  expressionState: ExpressionState;
  aspectRatio: string;
  videoUrl: string;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
  autoplay?: boolean;
  muted?: boolean;
}

export interface BrandVisualsBundle {
  staticAssets?: BrandStaticAsset[];
  motionAssets?: BrandMotionAsset[];
}

export interface ResolvedSlot {
  slot: LayoutSlot;
  asset:
    | { type: 'image'; url: string; meta: BrandStaticAsset }
    | { type: 'video'; url: string; meta: BrandMotionAsset }
    | { type: 'empty' };
}

const shapeAspectScore = (shape: SlotShape, aspectRatio: string | undefined): number => {
  if (!aspectRatio) return 0;
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) return 0;
  const r = w / h;
  switch (shape) {
    case 'wide':
      return r >= 2 ? 3 : r >= 1.6 ? 2 : 1;
    case 'banner':
      return r >= 4 ? 3 : r >= 2.5 ? 2 : 0;
    case 'standard':
      return r >= 1.4 && r <= 1.9 ? 3 : r >= 1.2 && r <= 2.2 ? 2 : 1;
    case 'vertical':
      return r <= 0.7 ? 3 : r <= 1 ? 2 : 0;
    case 'square':
      return r >= 0.9 && r <= 1.1 ? 3 : 1;
    default:
      return 1;
  }
};

/**
 * User customization applied on top of a base template.
 * Stored per-brand inside guide_data.layoutTemplateCustomizations[].
 */
export interface LayoutTemplateCustomization {
  /** Stable id for the saved variant (timestamp or uuid). */
  id: string;
  /** Base template id this variant is derived from. */
  baseTemplateId: string;
  /** Display name for the saved variant. */
  name: string;
  /** Optional headline / eyebrow / cta copy overrides. */
  copy?: {
    eyebrow?: string;
    headline?: string;
    cta?: string;
  };
  /** Per-slot manual asset overrides (keyed by slot.key → asset id). */
  slotOverrides?: Record<string, { type: 'image' | 'video'; assetId: string } | { type: 'empty' }>;
  /** Per-slot position overrides. */
  positionOverrides?: Record<string, { x: number; y: number; width: number; height: number }>;
  /** Per-slot crop / fit overrides (object-fit + focal point as 0–100 percent). */
  slotFitOverrides?: Record<string, { fit: 'cover' | 'contain'; focusX: number; focusY: number }>;
  /** Overlay alignment / position overrides. */
  overlayOverrides?: BrandLayoutTemplate['overlay'];
  /**
   * Advanced gradient blur overlays for separating imagery zones,
   * creating depth, and enhancing copy legibility.
   * Multiple overlays stack in order (first = bottom layer).
   */
  gradientBlurOverlays?: GradientBlurOverlay[];
  createdAt: string;
}

/** Preset gradient blur overlay styles for imagery template separation. */
export type GradientBlurPreset =
  | 'edge-fade-bottom'
  | 'edge-fade-top'
  | 'edge-fade-left'
  | 'edge-fade-right'
  | 'vignette'
  | 'split-horizontal'
  | 'split-vertical'
  | 'radial-spotlight'
  | 'diagonal-sweep'
  | 'frosted-band-bottom'
  | 'frosted-band-top'
  | 'corner-glow';

export interface GradientBlurOverlay {
  id: string;
  preset: GradientBlurPreset;
  /** Tint color (hex or hsl string). Defaults to brand primary or black. */
  color?: string;
  /** 0–100 — overall opacity of the overlay. */
  opacity?: number;
  /** 0–40 — backdrop blur strength in px applied behind the gradient. */
  blur?: number;
  /** Optional blend mode. */
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light' | 'screen';
  /** When true, only the gradient (not blur) extends to full canvas. */
  fullBleed?: boolean;
}

/**
 * Build CSS background + backdrop-filter for a gradient blur overlay preset.
 * Returns inline style + className-friendly object.
 */
export const gradientBlurOverlayStyle = (
  ov: GradientBlurOverlay,
  fallbackColor = 'hsl(229 100% 12%)',
): React.CSSProperties => {
  const color = ov.color ?? fallbackColor;
  const opacity = (ov.opacity ?? 70) / 100;
  const blur = ov.blur ?? 12;
  const blend = ov.blendMode ?? 'normal';

  const transparent = 'transparent';
  let background = '';
  switch (ov.preset) {
    case 'edge-fade-bottom':
      background = `linear-gradient(to top, ${color} 0%, ${color}cc 25%, ${transparent} 70%)`;
      break;
    case 'edge-fade-top':
      background = `linear-gradient(to bottom, ${color} 0%, ${color}cc 25%, ${transparent} 70%)`;
      break;
    case 'edge-fade-left':
      background = `linear-gradient(to right, ${color} 0%, ${color}cc 25%, ${transparent} 70%)`;
      break;
    case 'edge-fade-right':
      background = `linear-gradient(to left, ${color} 0%, ${color}cc 25%, ${transparent} 70%)`;
      break;
    case 'vignette':
      background = `radial-gradient(ellipse at center, ${transparent} 45%, ${color}aa 90%, ${color} 100%)`;
      break;
    case 'split-horizontal':
      background = `linear-gradient(to bottom, ${color} 0%, ${color} 49%, ${transparent} 50%, ${transparent} 100%)`;
      break;
    case 'split-vertical':
      background = `linear-gradient(to right, ${color} 0%, ${color} 49%, ${transparent} 50%, ${transparent} 100%)`;
      break;
    case 'radial-spotlight':
      background = `radial-gradient(circle at 50% 45%, ${transparent} 25%, ${color}80 60%, ${color} 95%)`;
      break;
    case 'diagonal-sweep':
      background = `linear-gradient(135deg, ${color} 0%, ${color}99 30%, ${transparent} 65%)`;
      break;
    case 'frosted-band-bottom':
      background = `linear-gradient(to top, ${color}e6 0%, ${color}b3 60%, ${transparent} 100%)`;
      break;
    case 'frosted-band-top':
      background = `linear-gradient(to bottom, ${color}e6 0%, ${color}b3 60%, ${transparent} 100%)`;
      break;
    case 'corner-glow':
      background = `radial-gradient(circle at 100% 0%, ${color} 0%, ${color}66 25%, ${transparent} 55%)`;
      break;
  }

  return {
    position: 'absolute',
    inset: 0,
    background,
    opacity,
    mixBlendMode: blend,
    backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
    WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
    pointerEvents: 'none',
  };
};

export const gradientBlurPresetLabels: Record<GradientBlurPreset, string> = {
  'edge-fade-bottom': 'Edge Fade · Bottom',
  'edge-fade-top': 'Edge Fade · Top',
  'edge-fade-left': 'Edge Fade · Left',
  'edge-fade-right': 'Edge Fade · Right',
  vignette: 'Vignette',
  'split-horizontal': 'Split · Horizontal',
  'split-vertical': 'Split · Vertical',
  'radial-spotlight': 'Radial Spotlight',
  'diagonal-sweep': 'Diagonal Sweep',
  'frosted-band-bottom': 'Frosted Band · Bottom',
  'frosted-band-top': 'Frosted Band · Top',
  'corner-glow': 'Corner Glow',
};

/** Default fit settings for a slot when no override exists. */
export const defaultSlotFit = { fit: 'cover' as const, focusX: 50, focusY: 50 };

export const resolveTemplate = (
  template: BrandLayoutTemplate,
  visuals: BrandVisualsBundle | undefined,
  customization?: LayoutTemplateCustomization,
): ResolvedSlot[] => {
  const statics = visuals?.staticAssets ?? [];
  const motions = visuals?.motionAssets ?? [];
  const overrides = customization?.slotOverrides ?? {};

  return template.slots.map((rawSlot) => {
    // Apply position overrides
    const slot: LayoutSlot = customization?.positionOverrides?.[rawSlot.key]
      ? { ...rawSlot, position: customization.positionOverrides[rawSlot.key] }
      : rawSlot;

    // 0) Manual override wins.
    const ov = overrides[slot.key];
    if (ov) {
      if (ov.type === 'empty') return { slot, asset: { type: 'empty' } };
      if (ov.type === 'image') {
        const meta = statics.find((s) => s.id === ov.assetId);
        if (meta) return { slot, asset: { type: 'image', url: meta.imageUrl, meta } };
      }
      if (ov.type === 'video') {
        const meta = motions.find((m) => m.id === ov.assetId);
        if (meta) return { slot, asset: { type: 'video', url: meta.videoUrl, meta } };
      }
    }

    // 1) For video slots, prefer motion assets matching expression state + orientation.
    if (slot.allowMotion && slot.kind === 'video') {
      const wantVertical = slot.preferredShape === 'vertical';
      const motion = motions
        .filter((m) => m.expressionState === slot.expressionState)
        .sort((a, b) => {
          const aMatch = (a.orientation === 'vertical') === wantVertical ? 1 : 0;
          const bMatch = (b.orientation === 'vertical') === wantVertical ? 1 : 0;
          return bMatch - aMatch;
        })[0];

      if (motion) {
        return { slot, asset: { type: 'video', url: motion.videoUrl, meta: motion } };
      }
    }

    // 2) Fall back to best-matching static asset for expression state + shape.
    const candidates = statics.filter((s) => s.expressionState === slot.expressionState);
    if (candidates.length === 0) {
      return { slot, asset: { type: 'empty' } };
    }
    const best = [...candidates].sort(
      (a, b) =>
        shapeAspectScore(slot.preferredShape, b.aspectRatio) -
        shapeAspectScore(slot.preferredShape, a.aspectRatio),
    )[0];
    return { slot, asset: { type: 'image', url: best.imageUrl, meta: best } };
  });
};

/**
 * Auto-fill empty slots in a customization with the best available brand visuals.
 * - Skips slots that already have a non-empty manual override (preserves user choices).
 * - For unfilled slots, prefers same-expression-state assets, then relaxes to any state
 *   so empty slots get something visible.
 * Returns a new customization with `slotOverrides` populated.
 */
export const autoFillSlots = (
  template: BrandLayoutTemplate,
  visuals: BrandVisualsBundle | undefined,
  customization: LayoutTemplateCustomization,
): { customization: LayoutTemplateCustomization; filledCount: number } => {
  const statics = visuals?.staticAssets ?? [];
  const motions = visuals?.motionAssets ?? [];
  const existing = customization.slotOverrides ?? {};
  const next: NonNullable<LayoutTemplateCustomization['slotOverrides']> = { ...existing };
  const usedAssetIds = new Set<string>(
    Object.values(existing)
      .filter((o): o is { type: 'image' | 'video'; assetId: string } => 'assetId' in o)
      .map((o) => o.assetId),
  );
  let filledCount = 0;

  for (const slot of template.slots) {
    const ov = existing[slot.key];
    // Preserve real user picks (image/video override). Re-fill only when missing or explicitly empty.
    if (ov && 'assetId' in ov) continue;

    // Video slot: try motion assets first.
    if (slot.allowMotion && slot.kind === 'video') {
      const wantVertical = slot.preferredShape === 'vertical';
      const motionPool = [
        ...motions.filter((m) => m.expressionState === slot.expressionState),
        ...motions.filter((m) => m.expressionState !== slot.expressionState),
      ];
      const motion =
        motionPool.find((m) => !usedAssetIds.has(m.id) && (m.orientation === 'vertical') === wantVertical) ??
        motionPool.find((m) => !usedAssetIds.has(m.id)) ??
        motionPool[0];
      if (motion) {
        next[slot.key] = { type: 'video', assetId: motion.id };
        usedAssetIds.add(motion.id);
        filledCount++;
        continue;
      }
    }

    // Static image: prefer same expression state + best aspect, then relax.
    const sameState = statics.filter((s) => s.expressionState === slot.expressionState);
    const sortByShape = (pool: typeof statics) =>
      [...pool].sort(
        (a, b) =>
          shapeAspectScore(slot.preferredShape, b.aspectRatio) -
          shapeAspectScore(slot.preferredShape, a.aspectRatio),
      );
    const sortedSame = sortByShape(sameState);
    const otherState = sortByShape(statics.filter((s) => s.expressionState !== slot.expressionState));

    const pick =
      sortedSame.find((s) => !usedAssetIds.has(s.id)) ??
      sortedSame[0] ??
      otherState.find((s) => !usedAssetIds.has(s.id)) ??
      otherState[0];

    if (pick) {
      next[slot.key] = { type: 'image', assetId: pick.id };
      usedAssetIds.add(pick.id);
      filledCount++;
    }
  }

  return {
    customization: { ...customization, slotOverrides: next },
    filledCount,
  };
};

/** Merge a customization into a template to produce an effective template (overlay etc). */
export const applyCustomization = (
  template: BrandLayoutTemplate,
  customization?: LayoutTemplateCustomization,
): BrandLayoutTemplate => {
  if (!customization) return template;
  return {
    ...template,
    name: customization.name || template.name,
    overlay: { ...(template.overlay ?? {}), ...(customization.overlayOverrides ?? {}) },
  };
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const getTemplatesForTarget = (target: LayoutSectionTarget): BrandLayoutTemplate[] =>
  brandLayoutTemplates.filter((t) => t.target === target);

export const layoutTargets: { id: LayoutSectionTarget; label: string; description: string }[] = [
  { id: 'hero', label: 'Hero', description: 'Top-of-page hero bands' },
  { id: 'services', label: 'Services', description: 'Service & capability grids' },
  { id: 'casestudy', label: 'Case Study', description: 'Case study covers & detail' },
  { id: 'social', label: 'Social', description: 'Social tiles & vertical formats' },
  { id: 'event', label: 'Event', description: 'Event promo banners' },
  { id: 'product', label: 'Product', description: 'Product suite cards' },
  { id: 'editorial', label: 'Editorial', description: 'Long-form editorial pages' },
  { id: 'divider', label: 'Divider', description: 'Inline section dividers' },
  { id: 'web', label: 'Web', description: 'Landing page & web sections' },
  { id: 'ad', label: 'Ad', description: 'Display & banner ad units' },
  { id: 'email', label: 'Email', description: 'Newsletter & transactional email' },
  { id: 'billboard', label: 'Billboard', description: 'OOH & digital billboards' },
  { id: 'story', label: 'Story', description: 'Vertical story formats (9:16)' },
  { id: 'carousel', label: 'Carousel', description: 'Multi-slide social carousels' },
  { id: 'pitch', label: 'Pitch', description: 'Pitch deck slides' },
  { id: 'ebrochure', label: 'Ebrochure', description: 'Multi-page digital brochures' },
  { id: 'onepager', label: 'One-Pager', description: 'Single-page sales sheets & product overviews' },
  { id: 'whitepaper', label: 'White Paper', description: 'Long-form reports & research papers' },
];

export const expressionStateColor: Record<ExpressionState, string> = {
  Foundation: 'hsl(229 100% 39%)', // primary blue
  Collaborate: 'hsl(265 60% 70%)', // lavender
  Transform: 'hsl(170 70% 55%)', // turquoise
};
