/**
 * Template definitions for the Social Asset Studio template library.
 * Each template defines composition zones for layout guidance.
 */

export type TemplateZoneType = 'image' | 'text' | 'logo' | 'cta';

export interface TemplateZone {
  type: TemplateZoneType;
  x: number;      // percentage from left
  y: number;      // percentage from top
  width: number;  // percentage width
  height: number; // percentage height
  label: string;
  colorSlot?: 'primary' | 'secondary' | 'accent' | 'background';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
}

export type TemplateCategory = 'announcement' | 'product' | 'quote' | 'event' | 'testimonial' | 'minimal';

export interface SocialTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  platforms: string[];
  formats: string[];
  zones: TemplateZone[];
  colorSlots: ('primary' | 'secondary' | 'accent')[];
  description: string;
}

export const templateCategories: { id: TemplateCategory; label: string; description: string }[] = [
  { id: 'announcement', label: 'Announcement', description: 'News, launches, and updates' },
  { id: 'product', label: 'Product Showcase', description: 'Feature products and offerings' },
  { id: 'quote', label: 'Quote', description: 'Quotes, testimonials, and text-first posts' },
  { id: 'event', label: 'Event Promo', description: 'Event promotion and invitations' },
  { id: 'testimonial', label: 'Testimonial', description: 'Customer stories and social proof' },
  { id: 'minimal', label: 'Minimal', description: 'Clean, simple layouts' },
];

export const socialTemplates: SocialTemplate[] = [
  // === ANNOUNCEMENT ===
  {
    id: 'ann-bold-header',
    name: 'Bold Header',
    category: 'announcement',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'Threads', 'X (Twitter)'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Large headline at top with supporting image below',
    zones: [
      { type: 'text', x: 5, y: 5, width: 90, height: 30, label: 'Headline', colorSlot: 'primary', fontSize: 'xl', align: 'left' },
      { type: 'image', x: 5, y: 38, width: 90, height: 45, label: 'Main Image' },
      { type: 'logo', x: 5, y: 88, width: 15, height: 8, label: 'Logo' },
      { type: 'cta', x: 65, y: 88, width: 30, height: 8, label: 'CTA', colorSlot: 'accent' },
    ],
  },
  {
    id: 'ann-full-bleed',
    name: 'Full Bleed',
    category: 'announcement',
    platforms: ['Instagram', 'Facebook', 'TikTok', 'Pinterest'],
    formats: ['feed', 'story'],
    colorSlots: ['primary', 'secondary'],
    description: 'Full-bleed background image with text overlay',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 100, label: 'Background Image' },
      { type: 'text', x: 8, y: 60, width: 84, height: 20, label: 'Headline', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'text', x: 15, y: 80, width: 70, height: 8, label: 'Subtext', fontSize: 'sm', align: 'center' },
      { type: 'logo', x: 40, y: 5, width: 20, height: 10, label: 'Logo' },
    ],
  },
  {
    id: 'ann-split-screen',
    name: 'Split Screen',
    category: 'announcement',
    platforms: ['LinkedIn', 'Facebook', 'X (Twitter)', 'Threads'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Two-column layout with text and image',
    zones: [
      { type: 'text', x: 3, y: 10, width: 44, height: 15, label: 'Headline', colorSlot: 'primary', fontSize: 'lg', align: 'left' },
      { type: 'text', x: 3, y: 28, width: 44, height: 30, label: 'Body Text', fontSize: 'sm', align: 'left' },
      { type: 'cta', x: 3, y: 62, width: 30, height: 8, label: 'CTA', colorSlot: 'accent' },
      { type: 'image', x: 50, y: 0, width: 50, height: 100, label: 'Right Image' },
      { type: 'logo', x: 3, y: 85, width: 15, height: 8, label: 'Logo' },
    ],
  },

  // === PRODUCT SHOWCASE ===
  {
    id: 'prod-centered',
    name: 'Product Center',
    category: 'product',
    platforms: ['Instagram', 'Facebook', 'Pinterest', 'TikTok'],
    formats: ['feed'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Product hero image centered with details below',
    zones: [
      { type: 'image', x: 15, y: 5, width: 70, height: 55, label: 'Product Image' },
      { type: 'text', x: 10, y: 63, width: 80, height: 12, label: 'Product Name', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'text', x: 15, y: 76, width: 70, height: 8, label: 'Description', fontSize: 'sm', align: 'center' },
      { type: 'cta', x: 30, y: 87, width: 40, height: 8, label: 'Shop Now', colorSlot: 'accent' },
    ],
  },
  {
    id: 'prod-grid',
    name: 'Product Grid',
    category: 'product',
    platforms: ['Instagram', 'Facebook', 'Pinterest'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Multi-product grid layout',
    zones: [
      { type: 'text', x: 5, y: 3, width: 90, height: 10, label: 'Collection Title', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'image', x: 5, y: 15, width: 43, height: 35, label: 'Product 1' },
      { type: 'image', x: 52, y: 15, width: 43, height: 35, label: 'Product 2' },
      { type: 'image', x: 5, y: 53, width: 43, height: 35, label: 'Product 3' },
      { type: 'image', x: 52, y: 53, width: 43, height: 35, label: 'Product 4' },
      { type: 'logo', x: 40, y: 91, width: 20, height: 6, label: 'Logo' },
    ],
  },
  {
    id: 'prod-story-swipe',
    name: 'Story Swipe Up',
    category: 'product',
    platforms: ['Instagram', 'Facebook', 'TikTok'],
    formats: ['story'],
    colorSlots: ['primary', 'accent'],
    description: 'Full-screen product with swipe-up CTA',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 65, label: 'Product Image' },
      { type: 'text', x: 8, y: 67, width: 84, height: 10, label: 'Product Name', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'text', x: 12, y: 78, width: 76, height: 6, label: 'Price / Detail', fontSize: 'md', align: 'center' },
      { type: 'cta', x: 25, y: 87, width: 50, height: 7, label: 'Swipe Up', colorSlot: 'accent' },
    ],
  },

  // === QUOTE ===
  {
    id: 'quote-centered',
    name: 'Centered Quote',
    category: 'quote',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'X (Twitter)', 'Threads'],
    formats: ['feed'],
    colorSlots: ['primary', 'secondary'],
    description: 'Large centered quote with attribution',
    zones: [
      { type: 'text', x: 10, y: 15, width: 80, height: 45, label: '"Quote Text"', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'text', x: 20, y: 65, width: 60, height: 8, label: '— Attribution', colorSlot: 'secondary', fontSize: 'md', align: 'center' },
      { type: 'logo', x: 38, y: 82, width: 24, height: 10, label: 'Logo' },
    ],
  },
  {
    id: 'quote-photo-bg',
    name: 'Photo Quote',
    category: 'quote',
    platforms: ['Instagram', 'Pinterest', 'Facebook'],
    formats: ['feed', 'story'],
    colorSlots: ['primary'],
    description: 'Quote overlaid on a background photo',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 100, label: 'Background Photo' },
      { type: 'text', x: 10, y: 25, width: 80, height: 40, label: '"Quote"', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'text', x: 25, y: 68, width: 50, height: 8, label: '— Author', fontSize: 'md', align: 'center' },
      { type: 'logo', x: 5, y: 5, width: 15, height: 8, label: 'Logo' },
    ],
  },
  {
    id: 'quote-card',
    name: 'Quote Card',
    category: 'quote',
    platforms: ['LinkedIn', 'X (Twitter)', 'Threads'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Clean card-style quote with color accent',
    zones: [
      { type: 'text', x: 10, y: 8, width: 10, height: 12, label: '"', colorSlot: 'accent', fontSize: 'xl' },
      { type: 'text', x: 10, y: 20, width: 80, height: 40, label: 'Quote Text', colorSlot: 'primary', fontSize: 'lg', align: 'left' },
      { type: 'image', x: 10, y: 68, width: 12, height: 12, label: 'Author Photo' },
      { type: 'text', x: 26, y: 68, width: 60, height: 12, label: 'Author & Title', fontSize: 'sm', align: 'left' },
      { type: 'logo', x: 75, y: 88, width: 18, height: 7, label: 'Logo' },
    ],
  },

  // === EVENT PROMO ===
  {
    id: 'event-banner',
    name: 'Event Banner',
    category: 'event',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'X (Twitter)'],
    formats: ['feed', 'cover'],
    colorSlots: ['primary', 'accent'],
    description: 'Event promotion with date, title, and CTA',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 50, label: 'Event Imagery' },
      { type: 'text', x: 8, y: 53, width: 84, height: 12, label: 'Event Name', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'text', x: 20, y: 66, width: 60, height: 8, label: 'Date & Location', fontSize: 'md', align: 'center' },
      { type: 'cta', x: 28, y: 78, width: 44, height: 8, label: 'Register Now', colorSlot: 'accent' },
      { type: 'logo', x: 5, y: 90, width: 15, height: 7, label: 'Logo' },
    ],
  },
  {
    id: 'event-countdown',
    name: 'Countdown',
    category: 'event',
    platforms: ['Instagram', 'Facebook', 'TikTok'],
    formats: ['story'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Story-format countdown with bold date',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 45, label: 'Event Image' },
      { type: 'text', x: 10, y: 48, width: 80, height: 8, label: 'COMING SOON', colorSlot: 'secondary', fontSize: 'sm', align: 'center' },
      { type: 'text', x: 10, y: 56, width: 80, height: 15, label: 'Date', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'text', x: 10, y: 72, width: 80, height: 10, label: 'Event Name', fontSize: 'lg', align: 'center' },
      { type: 'cta', x: 20, y: 85, width: 60, height: 7, label: 'Set Reminder', colorSlot: 'accent' },
    ],
  },
  {
    id: 'event-speaker',
    name: 'Speaker Spotlight',
    category: 'event',
    platforms: ['LinkedIn', 'Instagram', 'Facebook'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Featured speaker with bio and event details',
    zones: [
      { type: 'image', x: 5, y: 5, width: 35, height: 55, label: 'Speaker Photo' },
      { type: 'text', x: 45, y: 8, width: 50, height: 12, label: 'Speaker Name', colorSlot: 'primary', fontSize: 'lg', align: 'left' },
      { type: 'text', x: 45, y: 22, width: 50, height: 8, label: 'Title / Role', fontSize: 'sm', align: 'left' },
      { type: 'text', x: 45, y: 33, width: 50, height: 25, label: 'Topic or Bio', fontSize: 'sm', align: 'left' },
      { type: 'text', x: 5, y: 68, width: 90, height: 10, label: 'Event Name & Date', colorSlot: 'accent', fontSize: 'md', align: 'center' },
      { type: 'cta', x: 30, y: 82, width: 40, height: 8, label: 'Register', colorSlot: 'accent' },
      { type: 'logo', x: 5, y: 92, width: 15, height: 5, label: 'Logo' },
    ],
  },

  // === TESTIMONIAL ===
  {
    id: 'test-card',
    name: 'Review Card',
    category: 'testimonial',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'Threads'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Customer review with rating and photo',
    zones: [
      { type: 'text', x: 10, y: 8, width: 80, height: 8, label: '★★★★★', colorSlot: 'accent', fontSize: 'lg', align: 'center' },
      { type: 'text', x: 10, y: 20, width: 80, height: 35, label: '"Customer Quote"', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'image', x: 38, y: 60, width: 14, height: 14, label: 'Customer Photo' },
      { type: 'text', x: 20, y: 76, width: 60, height: 10, label: 'Name & Title', fontSize: 'sm', align: 'center' },
      { type: 'logo', x: 38, y: 90, width: 24, height: 7, label: 'Logo' },
    ],
  },
  {
    id: 'test-before-after',
    name: 'Before & After',
    category: 'testimonial',
    platforms: ['Instagram', 'Facebook', 'Pinterest'],
    formats: ['feed'],
    colorSlots: ['primary', 'secondary'],
    description: 'Side-by-side transformation showcase',
    zones: [
      { type: 'text', x: 5, y: 3, width: 90, height: 8, label: 'Transformation Title', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'image', x: 3, y: 14, width: 45, height: 55, label: 'Before' },
      { type: 'image', x: 52, y: 14, width: 45, height: 55, label: 'After' },
      { type: 'text', x: 3, y: 71, width: 45, height: 6, label: 'BEFORE', colorSlot: 'secondary', fontSize: 'sm', align: 'center' },
      { type: 'text', x: 52, y: 71, width: 45, height: 6, label: 'AFTER', colorSlot: 'primary', fontSize: 'sm', align: 'center' },
      { type: 'text', x: 10, y: 80, width: 80, height: 8, label: 'Customer Quote', fontSize: 'sm', align: 'center' },
      { type: 'logo', x: 40, y: 92, width: 20, height: 5, label: 'Logo' },
    ],
  },
  {
    id: 'test-story',
    name: 'Story Testimonial',
    category: 'testimonial',
    platforms: ['Instagram', 'Facebook', 'TikTok'],
    formats: ['story'],
    colorSlots: ['primary', 'accent'],
    description: 'Full-screen testimonial for stories',
    zones: [
      { type: 'logo', x: 38, y: 5, width: 24, height: 8, label: 'Logo' },
      { type: 'image', x: 30, y: 18, width: 25, height: 15, label: 'Customer Photo' },
      { type: 'text', x: 10, y: 36, width: 80, height: 30, label: '"Testimonial Quote"', colorSlot: 'primary', fontSize: 'lg', align: 'center' },
      { type: 'text', x: 20, y: 68, width: 60, height: 6, label: 'Customer Name', fontSize: 'md', align: 'center' },
      { type: 'text', x: 10, y: 75, width: 80, height: 5, label: '★★★★★', colorSlot: 'accent', fontSize: 'md', align: 'center' },
      { type: 'cta', x: 20, y: 85, width: 60, height: 7, label: 'Learn More', colorSlot: 'accent' },
    ],
  },

  // === MINIMAL ===
  {
    id: 'min-text-only',
    name: 'Text Only',
    category: 'minimal',
    platforms: ['LinkedIn', 'X (Twitter)', 'Threads', 'Instagram'],
    formats: ['feed'],
    colorSlots: ['primary'],
    description: 'Clean text-only post with brand mark',
    zones: [
      { type: 'text', x: 12, y: 25, width: 76, height: 40, label: 'Main Message', colorSlot: 'primary', fontSize: 'xl', align: 'center' },
      { type: 'logo', x: 40, y: 80, width: 20, height: 10, label: 'Logo' },
    ],
  },
  {
    id: 'min-photo-caption',
    name: 'Photo + Caption',
    category: 'minimal',
    platforms: ['Instagram', 'Pinterest', 'Facebook'],
    formats: ['feed'],
    colorSlots: ['primary'],
    description: 'Large photo with minimal text bar below',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 80, label: 'Photo' },
      { type: 'text', x: 5, y: 83, width: 70, height: 10, label: 'Caption', colorSlot: 'primary', fontSize: 'sm', align: 'left' },
      { type: 'logo', x: 80, y: 85, width: 15, height: 8, label: 'Logo' },
    ],
  },
  {
    id: 'min-brand-moment',
    name: 'Brand Moment',
    category: 'minimal',
    platforms: ['Instagram', 'Facebook', 'TikTok'],
    formats: ['story'],
    colorSlots: ['primary', 'accent'],
    description: 'Minimal full-screen brand moment',
    zones: [
      { type: 'image', x: 0, y: 0, width: 100, height: 100, label: 'Full Bleed Image' },
      { type: 'logo', x: 35, y: 42, width: 30, height: 16, label: 'Centered Logo' },
    ],
  },
];

export function getTemplatesForPlatformFormat(platform: string, format: string): SocialTemplate[] {
  return socialTemplates.filter(
    t => t.platforms.includes(platform) && t.formats.includes(format)
  );
}
