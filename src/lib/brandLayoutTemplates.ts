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
  | 'web';

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

export const resolveTemplate = (
  template: BrandLayoutTemplate,
  visuals: BrandVisualsBundle | undefined,
): ResolvedSlot[] => {
  const statics = visuals?.staticAssets ?? [];
  const motions = visuals?.motionAssets ?? [];

  return template.slots.map((slot) => {
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
];

export const expressionStateColor: Record<ExpressionState, string> = {
  Foundation: 'hsl(229 100% 39%)', // primary blue
  Collaborate: 'hsl(265 60% 70%)', // lavender
  Transform: 'hsl(170 70% 55%)', // turquoise
};
