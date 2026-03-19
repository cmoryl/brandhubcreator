/**
 * Canva URL utilities
 * Smart detection of Canva design types, URL parsing, and brand context helpers
 */

export interface CanvaDesignInfo {
  isCanva: boolean;
  designId: string | null;
  designType: CanvaDesignType;
  displayLabel: string;
  /** Canva brand color in HSL for consistent theming */
  brandColorClass: string;
}

export type CanvaDesignType =
  | 'social-post'
  | 'instagram-story'
  | 'presentation'
  | 'banner'
  | 'logo'
  | 'video'
  | 'document'
  | 'whiteboard'
  | 'custom';

const DESIGN_TYPE_MAP: Record<CanvaDesignType, string> = {
  'social-post': 'Social Post',
  'instagram-story': 'Story',
  'presentation': 'Presentation',
  'banner': 'Banner',
  'logo': 'Logo',
  'video': 'Video',
  'document': 'Document',
  'whiteboard': 'Whiteboard',
  'custom': 'Design',
};

const DESIGN_TYPE_ICONS: Record<CanvaDesignType, string> = {
  'social-post': '📱',
  'instagram-story': '📲',
  'presentation': '📊',
  'banner': '🖼️',
  'logo': '✦',
  'video': '🎬',
  'document': '📄',
  'whiteboard': '🧩',
  'custom': '🎨',
};

/**
 * Parse a URL and determine if it's a Canva link, extracting design metadata
 */
export function parseCanvaUrl(url: string | undefined): CanvaDesignInfo {
  const empty: CanvaDesignInfo = {
    isCanva: false,
    designId: null,
    designType: 'custom',
    displayLabel: 'Design',
    brandColorClass: 'bg-[hsl(178,100%,40%)]',
  };

  if (!url || !url.includes('canva.com')) return empty;

  // Extract design ID from /design/DAF.../... pattern
  const designIdMatch = url.match(/\/design\/([A-Za-z0-9_-]+)/);
  const designId = designIdMatch ? designIdMatch[1] : null;

  // Detect type from URL path segments
  const designType = detectDesignType(url);

  return {
    isCanva: true,
    designId,
    designType,
    displayLabel: DESIGN_TYPE_MAP[designType],
    brandColorClass: 'bg-[hsl(178,100%,40%)]',
  };
}

function detectDesignType(url: string): CanvaDesignType {
  const lower = url.toLowerCase();

  if (lower.includes('/presentation/') || lower.includes('presentation')) return 'presentation';
  if (lower.includes('/video/') || lower.includes('video-editor')) return 'video';
  if (lower.includes('/whiteboard/')) return 'whiteboard';
  if (lower.includes('/doc/') || lower.includes('document')) return 'document';
  if (lower.includes('logo')) return 'logo';
  if (lower.includes('story') || lower.includes('stories') || lower.includes('1080x1920')) return 'instagram-story';
  if (lower.includes('banner') || lower.includes('header') || lower.includes('cover')) return 'banner';
  if (lower.includes('post') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('social')) return 'social-post';

  return 'custom';
}

/**
 * Refine the design type using the item's category or title as heuristics
 */
export function refineDesignType(
  info: CanvaDesignInfo,
  category?: string,
  title?: string
): CanvaDesignInfo {
  if (!info.isCanva || info.designType !== 'custom') return info;

  const text = `${category || ''} ${title || ''}`.toLowerCase();

  let refined: CanvaDesignType = 'custom';
  if (text.includes('linkedin') || text.includes('facebook') || text.includes('instagram') || text.includes('tiktok') || text.includes('x ') || text.includes('twitter')) {
    refined = 'social-post';
  } else if (text.includes('story') || text.includes('stories') || text.includes('reel')) {
    refined = 'instagram-story';
  } else if (text.includes('presentation') || text.includes('deck') || text.includes('pitch')) {
    refined = 'presentation';
  } else if (text.includes('banner') || text.includes('header') || text.includes('cover')) {
    refined = 'banner';
  } else if (text.includes('logo') || text.includes('icon') || text.includes('mark')) {
    refined = 'logo';
  } else if (text.includes('video') || text.includes('motion')) {
    refined = 'video';
  }

  if (refined === 'custom') return info;

  return {
    ...info,
    designType: refined,
    displayLabel: DESIGN_TYPE_MAP[refined],
  };
}

/**
 * Get the emoji icon for a design type
 */
export function getDesignTypeIcon(type: CanvaDesignType): string {
  return DESIGN_TYPE_ICONS[type] || '🎨';
}

/**
 * Build a brand context reminder string from guideData
 */
export function buildBrandContextReminder(
  entityName: string,
  guideData: Record<string, unknown>
): string {
  const parts: string[] = [];

  // Extract primary colors
  const colors = guideData?.colors as Array<{ hex?: string; name?: string }> | undefined;
  if (Array.isArray(colors) && colors.length > 0) {
    const colorList = colors
      .slice(0, 4)
      .map(c => c.hex || c.name)
      .filter(Boolean)
      .join(', ');
    if (colorList) parts.push(`Colors: ${colorList}`);
  }

  // Extract tagline from identity/messaging
  const identity = guideData?.identity as Record<string, unknown> | undefined;
  const tagline = (identity?.tagline as string) || (guideData?.tagline as string);
  if (tagline) parts.push(`Tagline: "${tagline}"`);

  if (parts.length === 0) return `Opening Canva template for ${entityName}`;

  return `${entityName} brand kit → ${parts.join(' | ')}`;
}

/**
 * Canva SVG logo as a data URI for inline use
 */
export const CANVA_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="%2300C4CC"/><path d="M16.8 10.4c-.3-2.2-2.3-3.8-4.5-3.8-2.5 0-4.6 2.1-4.6 4.6 0 2.1 1.4 3.9 3.4 4.4.3.1.5-.1.5-.4v-.3c0-.2-.1-.4-.3-.4-1.3-.4-2.2-1.6-2.2-3 0-1.8 1.4-3.2 3.2-3.2 1.6 0 2.9 1.1 3.1 2.6.1.5.5.9 1 .9.6 0 1-.5.9-1.1l-.5-.3z" fill="white"/></svg>'
)}`;
