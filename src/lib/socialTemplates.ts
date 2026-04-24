/**
 * Branded template definitions for the Social Asset Studio.
 * Built around the TransPerfect visual system: Connection, Transformation, and Materiality.
 */

export type TemplateZoneType = 'image' | 'text' | 'logo' | 'cta';

export interface TemplateZone {
  type: TemplateZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  colorSlot?: 'primary' | 'secondary' | 'accent' | 'background';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
}

export type TemplateFormat = 'feed' | 'story' | 'reel' | 'cover' | 'profile';

export type TemplateCategory =
  | 'announcement'
  | 'product'
  | 'quote'
  | 'event'
  | 'testimonial'
  | 'minimal'
  | 'cover'
  | 'profile'
  | 'video';

export interface SocialTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  platforms: string[];
  formats: TemplateFormat[];
  zones: TemplateZone[];
  colorSlots: ('primary' | 'secondary' | 'accent')[];
  description: string;
  previewImageUrl?: string;
}

export const templateCategories: { id: TemplateCategory; label: string; description: string }[] = [
  { id: 'announcement', label: 'Announcement', description: 'Launches, news, and campaign updates' },
  { id: 'product', label: 'Offer Focus', description: 'Service, solution, and offer-led compositions' },
  { id: 'quote', label: 'Thought Leadership', description: 'Quote-led and editorial text layouts' },
  { id: 'event', label: 'Event Promo', description: 'Invites, sessions, webinars, and countdowns' },
  { id: 'testimonial', label: 'Social Proof', description: 'Customer proof, outcomes, and credibility' },
  { id: 'minimal', label: 'Minimal', description: 'Quiet brand-first layouts with strong restraint' },
  { id: 'cover', label: 'Cover / Banner', description: 'Headers, channel art, and panoramic canvases' },
  { id: 'profile', label: 'Profile / Icon', description: 'Avatar-safe logo and icon systems' },
  { id: 'video', label: 'Video', description: 'Reel, Short, and motion-first frames' },
];

const ALL_FEED = ['Instagram', 'LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Threads'];
const SOCIAL_FEED = ['Instagram', 'LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'Pinterest', 'Threads'];
const VERTICAL_SOCIAL = ['Instagram', 'Facebook', 'TikTok', 'Pinterest', 'YouTube'];
const COVER_SOCIAL = ['LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'YouTube', 'TikTok'];
const PROFILE_SOCIAL = ['Instagram', 'LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Threads'];

const z = (
  type: TemplateZoneType,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  extra: Partial<TemplateZone> = {},
): TemplateZone => ({ type, x, y, width, height, label, ...extra });

export const socialTemplates: SocialTemplate[] = [
  {
    id: 'tp-feed-foundation-hero',
    name: 'Foundation Hero',
    category: 'announcement',
    platforms: ALL_FEED,
    formats: ['feed'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Full-bleed human-led image with quiet editorial copy and a restrained CTA band.',
    zones: [
      z('image', 0, 0, 100, 100, 'Hero Image'),
      z('text', 7, 10, 44, 16, 'Kicker', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('text', 7, 28, 52, 24, 'Headline', { colorSlot: 'primary', fontSize: 'xl', align: 'left' }),
      z('text', 7, 56, 40, 12, 'Support Copy', { fontSize: 'sm', align: 'left' }),
      z('cta', 7, 78, 28, 8, 'CTA', { colorSlot: 'accent' }),
      z('logo', 79, 8, 14, 8, 'Logo'),
    ],
  },
  {
    id: 'tp-feed-connection-editorial',
    name: 'Connection Editorial',
    category: 'minimal',
    platforms: SOCIAL_FEED,
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Candid photography with a left editorial rail for leadership, insights, or campaign copy.',
    zones: [
      z('text', 5, 8, 28, 12, 'Section Label', { colorSlot: 'accent', fontSize: 'sm', align: 'left' }),
      z('text', 5, 24, 28, 26, 'Headline', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 5, 54, 28, 20, 'Body Copy', { fontSize: 'sm', align: 'left' }),
      z('logo', 5, 86, 18, 7, 'Logo'),
      z('image', 38, 0, 62, 100, 'Human Image'),
    ],
  },
  {
    id: 'tp-feed-materiality-panel',
    name: 'Materiality Panel',
    category: 'product',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'Pinterest', 'Threads', 'YouTube'],
    formats: ['feed'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Glass-panel composition pairing a primary image with a benefit stack and action strip.',
    zones: [
      z('image', 6, 8, 42, 70, 'Main Image'),
      z('text', 54, 12, 36, 12, 'Headline', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 54, 28, 36, 12, 'Proof Point 1', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('text', 54, 42, 36, 12, 'Proof Point 2', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('text', 54, 56, 36, 12, 'Proof Point 3', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('cta', 54, 74, 26, 8, 'CTA', { colorSlot: 'accent' }),
      z('logo', 76, 88, 16, 6, 'Logo'),
    ],
  },
  {
    id: 'tp-feed-thought-leadership',
    name: 'Thought Leadership',
    category: 'quote',
    platforms: ['LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'Threads'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Editorial quote layout with generous whitespace and a subtle identity footer.',
    zones: [
      z('text', 10, 14, 12, 12, 'Mark', { colorSlot: 'accent', fontSize: 'xl', align: 'left' }),
      z('text', 16, 18, 70, 34, 'Quote', { colorSlot: 'primary', fontSize: 'xl', align: 'left' }),
      z('text', 16, 58, 48, 8, 'Attribution', { fontSize: 'md', align: 'left' }),
      z('text', 16, 70, 58, 8, 'Role / Context', { fontSize: 'sm', align: 'left' }),
      z('logo', 78, 86, 14, 7, 'Logo'),
    ],
  },
  {
    id: 'tp-feed-event-spotlight',
    name: 'Event Spotlight',
    category: 'event',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'X', 'X (Twitter)', 'YouTube'],
    formats: ['feed'],
    colorSlots: ['primary', 'accent'],
    description: 'Speaker or session highlight with image-first hierarchy and event registration CTA.',
    zones: [
      z('image', 5, 5, 32, 56, 'Speaker / Event Image'),
      z('text', 42, 10, 48, 10, 'Event Name', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('text', 42, 24, 48, 16, 'Session Headline', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 42, 44, 48, 12, 'Date / Time / Place', { fontSize: 'sm', align: 'left' }),
      z('text', 42, 60, 48, 10, 'Speaker Name', { colorSlot: 'accent', fontSize: 'md', align: 'left' }),
      z('cta', 42, 78, 26, 8, 'Register', { colorSlot: 'accent' }),
      z('logo', 76, 89, 16, 6, 'Logo'),
    ],
  },
  {
    id: 'tp-feed-proof-grid',
    name: 'Proof Grid',
    category: 'testimonial',
    platforms: ['Instagram', 'Facebook', 'Pinterest', 'LinkedIn'],
    formats: ['feed'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Multi-frame proof composition for services, outcomes, or campaign families.',
    zones: [
      z('text', 6, 4, 88, 10, 'Collection Title', { colorSlot: 'primary', fontSize: 'lg', align: 'center' }),
      z('image', 6, 18, 41, 28, 'Visual 1'),
      z('image', 53, 18, 41, 28, 'Visual 2'),
      z('image', 6, 50, 41, 28, 'Visual 3'),
      z('image', 53, 50, 41, 28, 'Visual 4'),
      z('text', 16, 82, 68, 8, 'Outcome / Testimonial', { colorSlot: 'secondary', fontSize: 'sm', align: 'center' }),
      z('logo', 42, 91, 16, 5, 'Logo'),
    ],
  },
  {
    id: 'tp-story-immersive-transition',
    name: 'Immersive Transition',
    category: 'announcement',
    platforms: VERTICAL_SOCIAL,
    formats: ['story'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Human image with soft-transition lower gradient and a centered action path.',
    zones: [
      z('logo', 38, 6, 24, 7, 'Logo'),
      z('image', 0, 0, 100, 100, 'Full Bleed Image'),
      z('text', 10, 52, 80, 10, 'Eyebrow', { colorSlot: 'secondary', fontSize: 'sm', align: 'center' }),
      z('text', 10, 63, 80, 14, 'Headline', { colorSlot: 'primary', fontSize: 'xl', align: 'center' }),
      z('text', 15, 79, 70, 7, 'Support Copy', { fontSize: 'sm', align: 'center' }),
      z('cta', 24, 89, 52, 6, 'CTA', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-story-speaker-countdown',
    name: 'Speaker Countdown',
    category: 'event',
    platforms: ['Instagram', 'Facebook', 'Pinterest'],
    formats: ['story'],
    colorSlots: ['primary', 'accent'],
    description: 'Countdown story with a speaker portrait, date lockup, and strong event CTA.',
    zones: [
      z('image', 18, 10, 64, 36, 'Speaker Image'),
      z('text', 14, 50, 72, 8, 'Countdown Label', { colorSlot: 'accent', fontSize: 'sm', align: 'center' }),
      z('text', 10, 59, 80, 14, 'Date', { colorSlot: 'primary', fontSize: 'xl', align: 'center' }),
      z('text', 16, 75, 68, 8, 'Event Name', { fontSize: 'md', align: 'center' }),
      z('cta', 22, 87, 56, 7, 'Set Reminder', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-story-proof-portrait',
    name: 'Proof Portrait',
    category: 'testimonial',
    platforms: ['Instagram', 'Facebook', 'TikTok', 'YouTube'],
    formats: ['story'],
    colorSlots: ['primary', 'accent'],
    description: 'Vertical testimonial frame with portrait, quote, and brand action footer.',
    zones: [
      z('logo', 39, 6, 22, 7, 'Logo'),
      z('image', 32, 18, 36, 16, 'Portrait'),
      z('text', 10, 40, 80, 26, 'Quote', { colorSlot: 'primary', fontSize: 'lg', align: 'center' }),
      z('text', 20, 68, 60, 6, 'Name / Title', { fontSize: 'sm', align: 'center' }),
      z('cta', 20, 85, 60, 7, 'Learn More', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-reel-hook-frame',
    name: 'Hook Frame',
    category: 'video',
    platforms: ['Instagram', 'Facebook', 'TikTok', 'YouTube'],
    formats: ['reel'],
    colorSlots: ['primary', 'accent'],
    description: 'Opening vertical video frame with strong hook line, brand mark, and subject image.',
    zones: [
      z('logo', 8, 6, 18, 6, 'Logo'),
      z('text', 8, 14, 62, 12, 'Hook', { colorSlot: 'primary', fontSize: 'xl', align: 'left' }),
      z('image', 0, 28, 100, 54, 'Video Frame'),
      z('text', 8, 84, 52, 7, 'Caption / Topic', { fontSize: 'sm', align: 'left' }),
      z('cta', 67, 87, 24, 5, 'Swipe / Watch', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-reel-case-study',
    name: 'Case Study Reel',
    category: 'product',
    platforms: ['Instagram', 'Facebook', 'TikTok', 'YouTube'],
    formats: ['reel'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Vertical case-study frame balancing proof copy with cinematic human imagery.',
    zones: [
      z('image', 0, 0, 100, 100, 'Full Video Frame'),
      z('text', 8, 10, 58, 8, 'Sector / Region', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('text', 8, 20, 66, 14, 'Outcome Headline', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 8, 78, 50, 8, 'Metric / Proof', { colorSlot: 'accent', fontSize: 'md', align: 'left' }),
      z('logo', 76, 8, 16, 6, 'Logo'),
      z('cta', 63, 88, 28, 5, 'View More', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-cover-panorama',
    name: 'Panoramic Cover',
    category: 'cover',
    platforms: COVER_SOCIAL,
    formats: ['cover'],
    colorSlots: ['primary', 'secondary', 'accent'],
    description: 'Panoramic header built for safe-center messaging over soft-transitional brand imagery.',
    zones: [
      z('image', 0, 0, 100, 100, 'Panoramic Background'),
      z('text', 18, 28, 38, 12, 'Headline Safe Area', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 18, 44, 32, 10, 'Support Copy', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('logo', 78, 14, 12, 14, 'Logo'),
      z('cta', 18, 62, 18, 10, 'CTA', { colorSlot: 'accent' }),
    ],
  },
  {
    id: 'tp-cover-channel-art',
    name: 'Channel Art',
    category: 'cover',
    platforms: ['YouTube', 'LinkedIn', 'Facebook'],
    formats: ['cover'],
    colorSlots: ['primary', 'secondary'],
    description: 'Wide header with center-safe storytelling and a discreet logo anchor.',
    zones: [
      z('image', 0, 0, 100, 100, 'Header Background'),
      z('text', 24, 34, 32, 14, 'Channel / Brand Line', { colorSlot: 'primary', fontSize: 'lg', align: 'left' }),
      z('text', 24, 52, 26, 8, 'Descriptor', { colorSlot: 'secondary', fontSize: 'sm', align: 'left' }),
      z('logo', 70, 30, 12, 18, 'Logo'),
    ],
  },
  {
    id: 'tp-profile-logo-core',
    name: 'Logo Core',
    category: 'profile',
    platforms: PROFILE_SOCIAL,
    formats: ['profile'],
    colorSlots: ['primary', 'secondary'],
    description: 'Centered avatar-safe mark with breathing room for circular and square profile crops.',
    zones: [
      z('image', 18, 18, 64, 64, 'Avatar Background'),
      z('logo', 30, 30, 40, 40, 'Primary Mark'),
    ],
  },
  {
    id: 'tp-profile-highlight-chip',
    name: 'Highlight Chip',
    category: 'profile',
    platforms: ['Instagram', 'Pinterest', 'Threads'],
    formats: ['profile'],
    colorSlots: ['primary', 'accent'],
    description: 'Small-format profile badge for highlights, boards, and compact community touchpoints.',
    zones: [
      z('image', 12, 12, 76, 76, 'Background Field'),
      z('logo', 28, 24, 44, 32, 'Mark'),
      z('text', 18, 63, 64, 10, 'Short Label', { colorSlot: 'accent', fontSize: 'sm', align: 'center' }),
    ],
  },
];

const normalizePlatform = (platform: string) => {
  if (platform === 'X' || platform === 'X (Twitter)') return 'x';
  return platform.trim().toLowerCase();
};

export function getTemplatesForPlatformFormat(platform: string, format: string): SocialTemplate[] {
  const normalizedPlatform = normalizePlatform(platform);
  const normalizedFormat = format.trim().toLowerCase() as TemplateFormat;

  return socialTemplates.filter((template) => {
    const matchesPlatform = template.platforms.some((item) => normalizePlatform(item) === normalizedPlatform);
    const matchesFormat = template.formats.includes(normalizedFormat);
    return matchesPlatform && matchesFormat;
  });
}

export function getTemplateDefinitionForAsset(
  platform: string,
  template: Pick<SocialTemplate, 'name'> & { sizeCategory?: string },
): SocialTemplate | undefined {
  const formatMap: Record<string, TemplateFormat[]> = {
    post: ['feed'],
    square: ['feed'],
    story: ['story'],
    reel: ['reel'],
    cover: ['cover'],
    other: ['profile', 'feed'],
  };

  const candidateFormats = formatMap[template.sizeCategory || 'other'] || ['feed'];
  const candidates = candidateFormats.flatMap((format) => getTemplatesForPlatformFormat(platform, format));

  return candidates.find((item) => item.name === template.name);
}

export function getTemplatePreviewImage(template: Pick<SocialTemplate, 'formats' | 'platforms' | 'category' | 'previewImageUrl'>): string | undefined {
  if (template.previewImageUrl) return template.previewImageUrl;

  const [format] = template.formats;
  const normalizedPlatforms = template.platforms.map(normalizePlatform);
  const isLandscapeFeed = format === 'feed' && normalizedPlatforms.some((platform) => ['linkedin', 'facebook', 'x', 'youtube'].includes(platform));
  const isCover = format === 'cover';
  const isStory = format === 'story';
  const isReel = format === 'reel';
  const isProfile = format === 'profile';

  if (isCover) return '/social-renders/tp-social-cover-banner.jpg';
  if (isStory) return '/social-renders/tp-social-story-vertical.jpg';
  if (isReel) return '/social-renders/tp-social-reel-vertical.jpg';
  if (isProfile) return '/social-renders/tp-social-square-editorial.jpg';
  if (isLandscapeFeed) return '/social-renders/tp-social-post-landscape.jpg';

  if (template.category === 'cover') return '/social-renders/tp-social-cover-banner.jpg';
  if (template.category === 'video') return '/social-renders/tp-social-reel-vertical.jpg';

  return '/social-renders/tp-social-square-editorial.jpg';
}