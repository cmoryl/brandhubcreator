import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, X, Pencil, Linkedin, Twitter, Instagram, Facebook, Youtube, Monitor, Smartphone, Download, ExternalLink, FileType, Figma, Upload, Image, ChevronDown, ChevronRight, Info, Maximize2, Layers, FolderOpen, Eye, LayoutGrid, Type, FileImage, FileArchive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { BrandLogo, BrandSocialAssetSpec, SocialAssetTemplate, SocialSizeCategory, SocialTemplateZone } from '@/types/brand';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';
import { parseCanvaUrl, CANVA_LOGO_SVG } from '@/lib/canvaUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { LayoutPreset } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDropZone } from '@/components/ui/drop-zone';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { safeUUID } from '@/lib/safeUUID';
import { cn } from '@/lib/utils';
import { SocialMockupPreviewDialog } from './social-mockups/SocialMockupPreviewDialog';
import { getTemplateDefinitionForAsset, getTemplatePreviewImage, getTemplatesForPlatformFormat, TemplateZoneType } from '@/lib/socialTemplates';
import { SlotFitControl } from './SlotFitControl';

interface SocialAssetsProps {
  socialAssets: BrandSocialAssetSpec[];
  onSocialAssetsChange?: (assets: BrandSocialAssetSpec[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  /** Brand logo library — used to auto-place a real logo into template `logo` zones. */
  brandLogos?: BrandLogo[];
}

const platformIcons: Record<string, React.ElementType> = {
  'LinkedIn': Linkedin,
  'X': Twitter,
  'X (Twitter)': Twitter,
  'Instagram': Instagram,
  'Facebook': Facebook,
  'YouTube': Youtube,
  'TikTok': Monitor,
  'Pinterest': Image,
  'Threads': Monitor,
  'Snapchat': Smartphone,
  'General': LayoutGrid,
};

const fileTypeIcons: Record<string, { icon: React.ElementType; className: string; label: string }> = {
  psd: { icon: FileType, className: 'text-primary', label: 'Photoshop' },
  figma: { icon: Figma, className: 'text-accent', label: 'Figma' },
  canva: { icon: FileType, className: 'text-primary', label: 'Canva' },
  ai: { icon: FileType, className: 'text-accent', label: 'Illustrator' },
  sketch: { icon: FileType, className: 'text-muted-foreground', label: 'Sketch' },
  xd: { icon: FileType, className: 'text-muted-foreground', label: 'Adobe XD' },
  other: { icon: FileType, className: 'text-muted-foreground', label: 'Other' },
};

const platformDefaultImages: Record<string, string> = {
  'LinkedIn': '/images/social-defaults/linkedin-default.jpg',
  'X': '/images/social-defaults/twitter-default.jpg',
  'X (Twitter)': '/images/social-defaults/twitter-default.jpg',
  'Instagram': '/images/social-defaults/instagram-default.jpg',
  'Facebook': '/images/social-defaults/facebook-default.jpg',
  'YouTube': '/images/social-defaults/youtube-default.jpg',
  'TikTok': '/images/social-defaults/tiktok-default.jpg',
  'Pinterest': '/images/social-defaults/pinterest-default.jpg',
  'Threads': '/images/social-defaults/threads-default.jpg',
};

const platformPresets: BrandSocialAssetSpec[] = [
  {
    id: 'preset-general',
    platform: 'General',
    postSize: '1200 x 630 px (Universal)',
    altSize: '1080 x 1080 px (Square)',
    storySize: '1080 x 1920 px (9:16)',
    reelSize: '1920 x 1080 px (16:9)',
    coverSize: '1500 x 500 px (Banner)',
    textLegibility: '24pt+ Headlines, 14pt+ Body',
    directive: 'Universal social sizes. Use as a starting point for cross-platform campaigns. Always verify final dimensions per platform.',
    templates: [],
  },
  {
    id: 'preset-linkedin',
    platform: 'LinkedIn',
    postSize: '1200 x 627 px',
    altSize: '1584 x 396 px (Banner)',
    storySize: 'N/A',
    coverSize: '1128 x 191 px',
    textLegibility: '24pt for Headlines, 14pt for Body',
    directive: 'Center 1200px (Avoid edges for text). Logo placement: top-left or bottom-left. Maintain 60px padding from all edges.',
    templates: [],
    previewImageUrl: '/images/social-defaults/linkedin-default.jpg',
  },
  {
    id: 'preset-x',
    platform: 'X',
    postSize: '1600 x 900 px',
    altSize: '1500 x 500 px (Header)',
    storySize: 'N/A',
    coverSize: '1500 x 500 px',
    textLegibility: '32pt for Headlines, 18pt for Body',
    directive: 'Center 1000px horizontally. Profile pic overlaps header on left. Keep important content right-of-center.',
    templates: [],
    previewImageUrl: '/images/social-defaults/twitter-default.jpg',
  },
  {
    id: 'preset-instagram',
    platform: 'Instagram',
    postSize: '1080 x 1080 px (1:1)',
    altSize: '1080 x 566 px (Landscape)',
    storySize: '1080 x 1920 px (9:16)',
    reelSize: '1080 x 1920 px (9:16)',
    coverSize: 'N/A',
    textLegibility: '48pt for Stories, 24pt for Posts',
    directive: 'Keep text within inner 80% to avoid UI overlays. Stories: avoid top 150px (username) and bottom 200px (CTA buttons).',
    templates: [],
    previewImageUrl: '/images/social-defaults/instagram-default.jpg',
  },
  {
    id: 'preset-facebook',
    platform: 'Facebook',
    postSize: '1200 x 630 px',
    altSize: '1200 x 1200 px (Square)',
    storySize: '1080 x 1920 px',
    coverSize: '820 x 312 px',
    textLegibility: '30pt for Headlines, 16pt for Body',
    directive: 'Center 640px to accommodate mobile crop. Cover: profile pic overlaps left side, keep key content centered.',
    templates: [],
    previewImageUrl: '/images/social-defaults/facebook-default.jpg',
  },
  {
    id: 'preset-youtube',
    platform: 'YouTube',
    postSize: '1280 x 720 px (Thumbnail)',
    altSize: '2560 x 1440 px (Channel Art)',
    storySize: '1080 x 1920 px (Shorts)',
    reelSize: '1080 x 1920 px (Shorts)',
    coverSize: '2560 x 1440 px',
    textLegibility: '96pt for Thumbnails, 48pt for Overlays',
    directive: 'Thumbnails: faces and bold text perform best. Channel art safe area: 1546 x 423 px center. Avoid corners.',
    templates: [],
    previewImageUrl: '/images/social-defaults/youtube-default.jpg',
  },
  {
    id: 'preset-tiktok',
    platform: 'TikTok',
    postSize: '1080 x 1920 px (9:16)',
    altSize: 'N/A',
    storySize: '1080 x 1920 px',
    reelSize: '1080 x 1920 px',
    coverSize: 'N/A',
    textLegibility: '48pt minimum for in-video text',
    directive: 'Avoid top 150px (username/music) and bottom 280px (engagement buttons/description). Center text in middle 60%.',
    templates: [],
    previewImageUrl: '/images/social-defaults/tiktok-default.jpg',
  },
  {
    id: 'preset-pinterest',
    platform: 'Pinterest',
    postSize: '1000 x 1500 px (2:3)',
    altSize: '1000 x 1000 px (Square)',
    storySize: '1080 x 1920 px (Idea Pins)',
    coverSize: 'N/A',
    textLegibility: '36pt for Headlines, 18pt for Body',
    directive: 'Vertical pins perform best. Text overlay in top or bottom third. High-contrast colors for readability.',
    templates: [],
    previewImageUrl: '/images/social-defaults/pinterest-default.jpg',
  },
  {
    id: 'preset-threads',
    platform: 'Threads',
    postSize: '1080 x 1080 px',
    altSize: '1080 x 566 px (Landscape)',
    storySize: 'N/A',
    coverSize: 'N/A',
    textLegibility: '24pt for Post Images',
    directive: 'Similar to Instagram feed. Keep important content centered. Text-based posts often outperform images.',
    templates: [],
    previewImageUrl: '/images/social-defaults/threads-default.jpg',
  },
];

const getGeneratedTemplatesForPlatform = (platform: string): SocialAssetTemplate[] => {
  const generated = platform === 'General'
    ? [
        ...getTemplatesForPlatformFormat('LinkedIn', 'feed').map((template) => ({
          template,
          sizeCategory: 'post' as SocialSizeCategory,
          sourceFormat: 'feed' as const,
        })),
        ...getTemplatesForPlatformFormat('Instagram', 'feed').map((template) => ({
          template,
          sizeCategory: 'square' as SocialSizeCategory,
          sourceFormat: 'feed' as const,
        })),
        ...getTemplatesForPlatformFormat('Instagram', 'story').map((template) => ({
          template,
          sizeCategory: 'story' as SocialSizeCategory,
          sourceFormat: 'story' as const,
        })),
        ...getTemplatesForPlatformFormat('YouTube', 'reel').map((template) => ({
          template,
          sizeCategory: 'reel' as SocialSizeCategory,
          sourceFormat: 'reel' as const,
        })),
        ...getTemplatesForPlatformFormat('LinkedIn', 'cover').map((template) => ({
          template,
          sizeCategory: 'cover' as SocialSizeCategory,
          sourceFormat: 'cover' as const,
        })),
      ]
    : [
        ...getTemplatesForPlatformFormat(platform, 'feed').map((template) => ({
          template,
          sizeCategory: 'post' as SocialSizeCategory,
          sourceFormat: 'feed' as const,
        })),
        ...getTemplatesForPlatformFormat(platform, 'story').map((template) => ({
          template,
          sizeCategory: 'story' as SocialSizeCategory,
          sourceFormat: 'story' as const,
        })),
        ...getTemplatesForPlatformFormat(platform, 'reel').map((template) => ({
          template,
          sizeCategory: 'reel' as SocialSizeCategory,
          sourceFormat: 'reel' as const,
        })),
        ...getTemplatesForPlatformFormat(platform, 'cover').map((template) => ({
          template,
          sizeCategory: 'cover' as SocialSizeCategory,
          sourceFormat: 'cover' as const,
        })),
        ...getTemplatesForPlatformFormat(platform, 'profile').map((template) => ({
          template,
          sizeCategory: 'other' as SocialSizeCategory,
          sourceFormat: 'profile' as const,
        })),
      ];

  const sizeMap: Record<string, SocialSizeCategory> = {
    feed: 'post',
    story: 'story',
    reel: 'reel',
    cover: 'cover',
    profile: 'other',
  };

  return generated.map(({ template, sizeCategory, sourceFormat }): SocialAssetTemplate => {
    return {
      id: platform === 'General' ? `generated-general-${sizeCategory}-${template.id}` : `generated-${template.id}`,
      name: template.name,
      fileType: 'other' as const,
      url: '',
      description: template.description,
      previewImageUrl: getTemplatePreviewImage(template),
      dimensions: template.formats.join(', '),
      sizeCategory: sizeCategory || sizeMap[sourceFormat] || 'other',
      sourceTemplateId: template.id,
      sourceTemplateFormat: sourceFormat,
    };
  });
};

const getResolvedTemplates = (asset: BrandSocialAssetSpec): SocialAssetTemplate[] => {
  const generatedTemplates = getGeneratedTemplatesForPlatform(asset.platform);
  const savedTemplates = asset.templates || [];

  if (savedTemplates.length === 0) return generatedTemplates;

  const resolvedSaved = savedTemplates.map((template) => {
    const matchedGenerated = generatedTemplates.find((generated) =>
      (template.sourceTemplateId && generated.sourceTemplateId === template.sourceTemplateId) ||
      (template.name === generated.name && template.sourceTemplateFormat && generated.sourceTemplateFormat === template.sourceTemplateFormat) ||
      (generated.name === template.name && generated.sizeCategory === template.sizeCategory && generated.dimensions === template.dimensions)
    );

    return {
      ...template,
      previewImageUrl: template.previewImageUrl || matchedGenerated?.previewImageUrl,
      sourceTemplateId: template.sourceTemplateId || matchedGenerated?.sourceTemplateId,
      sourceTemplateFormat: template.sourceTemplateFormat || matchedGenerated?.sourceTemplateFormat,
    };
  });

  const remainingGenerated = generatedTemplates.filter((generated) =>
    !resolvedSaved.some((template) =>
      (template.sourceTemplateId && template.sourceTemplateId === generated.sourceTemplateId) ||
      (template.name === generated.name && template.sourceTemplateFormat === generated.sourceTemplateFormat) ||
      (template.name === generated.name && template.sizeCategory === generated.sizeCategory && template.dimensions === generated.dimensions)
    )
  );

  return [...resolvedSaved, ...remainingGenerated];
};

const zonePreviewStyles: Record<TemplateZoneType, string> = {
  image: 'border-sky-400/80 bg-sky-500/15 text-sky-50',
  text: 'border-violet-400/80 bg-violet-500/15 text-violet-50',
  logo: 'border-emerald-400/80 bg-emerald-500/15 text-emerald-50',
  cta: 'border-amber-400/80 bg-amber-500/15 text-amber-50',
};

const zoneTypeLabels: Record<TemplateZoneType, string> = {
  image: 'Imagery frame',
  text: 'Text layer',
  logo: 'Logo frame',
  cta: 'CTA layer',
};

const clampZoneValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const defaultTemplatePreviewFit = { fit: 'cover' as const, focusX: 50, focusY: 50 };

const getZoneMediaFit = (zone: SocialTemplateZone) => zone.mediaFit || defaultTemplatePreviewFit;

const getTemplateFormat = (template: Pick<SocialAssetTemplate, 'sourceTemplateFormat' | 'sizeCategory'>) => (
  template.sourceTemplateFormat || (template.sizeCategory === 'story'
    ? 'story'
    : template.sizeCategory === 'reel'
      ? 'reel'
      : template.sizeCategory === 'cover'
        ? 'cover'
        : template.sizeCategory === 'other'
          ? 'profile'
          : 'feed')
);

const getSmartDefaultZoneFit = (
  zone: SocialTemplateZone,
  template: Pick<SocialAssetTemplate, 'sourceTemplateFormat' | 'sizeCategory'>,
) => {
  if (zone.type === 'logo') {
    return { fit: 'contain' as const, focusX: 50, focusY: 50 };
  }

  const format = getTemplateFormat(template);
  const centerX = zone.x + zone.width / 2;
  const centerY = zone.y + zone.height / 2;
  const aspectRatio = zone.width / Math.max(zone.height, 1);

  let focusX = 50;
  if (centerX <= 30) focusX = 38;
  else if (centerX >= 70) focusX = 62;

  let focusY = 50;
  if (format === 'story' || format === 'reel') {
    focusY = centerY <= 34 ? 38 : centerY >= 68 ? 62 : 48;
  } else if (format === 'cover') {
    focusY = 46;
  } else if (centerY <= 30) {
    focusY = 42;
  } else if (centerY >= 70) {
    focusY = 58;
  }

  if (zone.width >= 85 && zone.height >= 85) {
    focusX = 50;
    focusY = format === 'story' || format === 'reel' ? 44 : format === 'cover' ? 46 : 50;
  } else if (aspectRatio >= 2.2) {
    focusY = format === 'cover' ? 46 : 50;
  } else if (aspectRatio <= 0.7 && (format === 'story' || format === 'reel')) {
    focusY = 40;
  }

  return { fit: 'cover' as const, focusX, focusY };
};

/**
 * Pick the best logo URL from the brand logo library to drop into a template
 * `logo` zone. Prefers `primary`, then `wordmark`, then any logo with a usable URL.
 */
const pickDefaultBrandLogoUrl = (brandLogos?: BrandLogo[]): string | undefined => {
  if (!brandLogos?.length) return undefined;
  const order: BrandLogo['variant'][] = ['primary', 'wordmark', 'secondary', 'reversed', 'monochrome', 'icon'];
  for (const variant of order) {
    const match = brandLogos.find((logo) => logo.variant === variant && logo.url);
    if (match?.url) return match.url;
  }
  return brandLogos.find((logo) => !!logo.url)?.url;
};

// ---------------------------------------------------------------------------
// Background-aware logo recommendations
// ---------------------------------------------------------------------------

/** Cached luminance samples keyed by media URL so we don't re-decode on every render. */
const backgroundLuminanceCache = new Map<string, number>();
const backgroundLuminancePending = new Map<string, Promise<number | null>>();

/**
 * Load an image cross-origin and return a perceived-brightness score (0–1, where
 * 0 is pitch black and 1 is pure white). Sampling is downscaled for speed.
 */
const sampleImageLuminance = (url: string): Promise<number | null> => {
  if (!url) return Promise.resolve(null);
  if (backgroundLuminanceCache.has(url)) {
    return Promise.resolve(backgroundLuminanceCache.get(url) ?? null);
  }
  const pending = backgroundLuminancePending.get(url);
  if (pending) return pending;

  const promise = new Promise<number | null>((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 24;
          const h = 24;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let total = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255;
            if (a < 0.1) continue;
            // Rec. 709 luma
            const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
            total += lum * a;
            count += a;
          }
          const avg = count > 0 ? total / count : null;
          if (avg !== null) backgroundLuminanceCache.set(url, avg);
          resolve(avg);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  }).finally(() => {
    backgroundLuminancePending.delete(url);
  });

  backgroundLuminancePending.set(url, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// Logo asset transparency detection
// ---------------------------------------------------------------------------

/**
 * Cached "is this asset transparent?" answers keyed by URL. SVGs are treated as
 * transparent by default; PNG/WebP are inspected by sampling the alpha channel.
 * Other raster formats (JPEG, etc.) are always considered opaque.
 */
const assetTransparencyCache = new Map<string, boolean>();
const assetTransparencyPending = new Map<string, Promise<boolean>>();

const looksLikeSvgUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.split('?')[0].split('#')[0].toLowerCase();
  if (lower.endsWith('.svg')) return true;
  if (url.startsWith('data:image/svg')) return true;
  return false;
};

const looksLikeAlphaCapableRaster = (url: string): boolean => {
  if (!url) return false;
  const lower = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    lower.endsWith('.png')
    || lower.endsWith('.webp')
    || lower.endsWith('.gif')
    || lower.endsWith('.avif')
    || url.startsWith('data:image/png')
    || url.startsWith('data:image/webp')
    || url.startsWith('data:image/gif')
    || url.startsWith('data:image/avif')
  );
};

/**
 * Detect whether the given image URL has any transparent pixels. SVGs are
 * always transparent; rasters with no alpha channel (JPEG) are always opaque.
 * For PNG/WebP/etc. we sample the alpha channel on a downscaled canvas.
 */
const detectAssetTransparency = (url: string): Promise<boolean> => {
  if (!url) return Promise.resolve(false);
  if (assetTransparencyCache.has(url)) {
    return Promise.resolve(assetTransparencyCache.get(url) as boolean);
  }
  if (looksLikeSvgUrl(url)) {
    assetTransparencyCache.set(url, true);
    return Promise.resolve(true);
  }
  if (!looksLikeAlphaCapableRaster(url)) {
    assetTransparencyCache.set(url, false);
    return Promise.resolve(false);
  }
  const pending = assetTransparencyPending.get(url);
  if (pending) return pending;

  const promise = new Promise<boolean>((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = 32;
          const h = 32;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(false);
          // Clear so any non-painted pixels read as alpha=0 (covers fully transparent).
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let transparentPixels = 0;
          const totalPixels = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            // Treat anything below near-fully-opaque as transparent so soft
            // anti-aliased edges (very common in logos) count as transparency.
            if (data[i + 3] < 250) {
              transparentPixels += 1;
              // Early exit once we've crossed a meaningful threshold.
              if (transparentPixels / totalPixels > 0.02) break;
            }
          }
          const isTransparent = transparentPixels / totalPixels > 0.02;
          assetTransparencyCache.set(url, isTransparent);
          resolve(isTransparent);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    } catch {
      resolve(false);
    }
  }).finally(() => {
    assetTransparencyPending.delete(url);
  });

  assetTransparencyPending.set(url, promise);
  return promise;
};

/**
 * Find the image zone that visually sits behind the given logo zone — i.e. the
 * largest image zone that overlaps the logo's footprint. Used to decide which
 * logo variant (light/dark/etc.) reads best on top.
 */
const findBackgroundZoneForLogo = (
  logoZone: SocialTemplateZone,
  zones: SocialTemplateZone[],
): SocialTemplateZone | null => {
  const logoCx = logoZone.x + logoZone.width / 2;
  const logoCy = logoZone.y + logoZone.height / 2;
  let best: { zone: SocialTemplateZone; area: number } | null = null;
  for (const zone of zones) {
    if (zone === logoZone) continue;
    if (zone.type !== 'image') continue;
    if (!zone.mediaUrl) continue;
    // Center of the logo must fall within this image zone
    if (
      logoCx < zone.x ||
      logoCx > zone.x + zone.width ||
      logoCy < zone.y ||
      logoCy > zone.y + zone.height
    ) continue;
    const area = zone.width * zone.height;
    if (!best || area > best.area) best = { zone, area };
  }
  return best?.zone ?? null;
};

/**
 * Score a logo variant for legibility on a background of the given luminance.
 * Higher score = better fit. Returns 0–1.
 *  - dark backgrounds favour reversed / monochrome-light / wordmark-light
 *  - light backgrounds favour primary / secondary / monochrome-dark
 */
const scoreLogoForBackground = (
  variant: BrandLogo['variant'],
  bgLuminance: number,
): number => {
  const isDarkBg = bgLuminance < 0.5;
  // Base affinities — higher means "designed for this background tone"
  const lightBgAffinity: Record<BrandLogo['variant'], number> = {
    primary: 0.95,
    secondary: 0.85,
    wordmark: 0.8,
    icon: 0.75,
    monochrome: 0.7,
    reversed: 0.15,
  };
  const darkBgAffinity: Record<BrandLogo['variant'], number> = {
    reversed: 0.98,
    monochrome: 0.7,
    icon: 0.55,
    wordmark: 0.5,
    secondary: 0.35,
    primary: 0.2,
  };
  return isDarkBg ? darkBgAffinity[variant] : lightBgAffinity[variant];
};

const describeBackgroundTone = (lum: number): 'dark' | 'mid' | 'light' => {
  if (lum < 0.35) return 'dark';
  if (lum > 0.65) return 'light';
  return 'mid';
};

const getEditableZones = (
  platform: string,
  template: SocialAssetTemplate,
  brandLogos?: BrandLogo[],
): SocialTemplateZone[] => {
  const defaultLogoUrl = pickDefaultBrandLogoUrl(brandLogos);

  const hydrate = (zone: SocialTemplateZone): SocialTemplateZone => {
    if (zone.type !== 'image' && zone.type !== 'logo') return { ...zone };
    const next: SocialTemplateZone = {
      ...zone,
      mediaFit: zone.mediaFit || getSmartDefaultZoneFit(zone, template),
    };
    // Auto-fill empty logo zones with the brand's default logo so every size
    // ships with a real logo placement out of the box.
    if (zone.type === 'logo' && !next.mediaUrl && defaultLogoUrl) {
      next.mediaUrl = defaultLogoUrl;
    }
    return next;
  };

  if (template.templateZones?.length) {
    return template.templateZones.map(hydrate);
  }
  const templateDefinition = getTemplateDefinitionForAsset(platform, template);
  return (templateDefinition?.zones || []).map(hydrate);
};

type SafeAreaGuide = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

const getSafeAreaGuide = (platform: string, template: SocialAssetTemplate): SafeAreaGuide => {
  const format = template.sourceTemplateFormat || (template.sizeCategory === 'story'
    ? 'story'
    : template.sizeCategory === 'reel'
      ? 'reel'
      : template.sizeCategory === 'cover'
        ? 'cover'
        : 'feed');

  if (format === 'story' || format === 'reel') {
    if (platform === 'TikTok') return { x: 10, y: 14, width: 76, height: 64, label: 'Safe area' };
    if (platform === 'YouTube') return { x: 10, y: 12, width: 80, height: 68, label: 'Safe area' };
    return { x: 8, y: 12, width: 84, height: 70, label: 'Safe area' };
  }

  if (format === 'cover') {
    if (platform === 'YouTube') return { x: 22, y: 34, width: 56, height: 32, label: 'Center-safe zone' };
    if (platform === 'LinkedIn') return { x: 18, y: 20, width: 64, height: 54, label: 'Center-safe zone' };
    if (platform === 'Facebook') return { x: 20, y: 18, width: 60, height: 58, label: 'Center-safe zone' };
    return { x: 18, y: 20, width: 64, height: 56, label: 'Center-safe zone' };
  }

  if (format === 'profile') {
    return { x: 16, y: 16, width: 68, height: 68, label: 'Avatar-safe zone' };
  }

  return { x: 6, y: 6, width: 88, height: 88, label: 'Content-safe zone' };
};

const TemplateCardPreview = ({
  platform,
  template,
  interactive = false,
  onClick,
  brandLogos,
}: {
  platform: string;
  template: SocialAssetTemplate;
  interactive?: boolean;
  onClick?: () => void;
  brandLogos?: BrandLogo[];
}) => {
  const previewImage = template.previewImageUrl;
  const templateZones = getEditableZones(platform, template, brandLogos);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        'relative aspect-video w-full overflow-hidden bg-muted/30 text-left',
        interactive && 'cursor-zoom-in',
      )}
    >
      {previewImage ? (
        <img
          src={previewImage}
          alt={template.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted/50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />

      {templateZones.length > 0 ? (
        <div className="absolute inset-0 p-3">
          {templateZones.map((zone, index) => (
            <div
              key={`${template.id}-zone-${index}`}
              className={cn(
                'absolute overflow-hidden rounded border border-dashed backdrop-blur-[1px] transition-all',
                zonePreviewStyles[zone.type],
              )}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
            >
              {(zone.type === 'image' || zone.type === 'logo') && zone.mediaUrl ? (
                <img
                  src={zone.mediaUrl}
                  alt={zone.label}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    objectFit: getZoneMediaFit(zone).fit,
                    objectPosition: `${getZoneMediaFit(zone).focusX}% ${getZoneMediaFit(zone).focusY}%`,
                  }}
                />
              ) : null}
              <div className="relative flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-medium leading-tight">
                <span className="truncate">{zone.label}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {interactive && (
        <div className="absolute right-3 top-3 rounded-md bg-background/85 px-2 py-1 text-[10px] font-medium text-foreground shadow-sm">
          View larger
        </div>
      )}
    </button>
  );
};

const TemplatePreviewDialog = ({
  open,
  onOpenChange,
  platform,
  template,
  layoutOptions,
  onSelectTemplate,
  canEdit,
  onUploadZoneMedia,
  onSelectZoneMedia,
  onUpdateTemplate,
  brandLogos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  template: SocialAssetTemplate | null;
  layoutOptions: SocialAssetTemplate[];
  onSelectTemplate: (template: SocialAssetTemplate) => void;
  canEdit: boolean;
  onUploadZoneMedia: (zoneIndex: number, file: File) => Promise<void>;
  onSelectZoneMedia: (zoneIndex: number, url: string) => void;
  onUpdateTemplate: (updates: Partial<SocialAssetTemplate>) => void;
  brandLogos?: BrandLogo[];
}) => {
  if (!template) return null;

  const templateZones = getEditableZones(platform, template, brandLogos);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [activeFrameZoneIndex, setActiveFrameZoneIndex] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [zoomLevel, setZoomLevel] = useState('100');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportScale, setExportScale] = useState<'1' | '2' | '3'>('2');
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportIncludeGuides, setExportIncludeGuides] = useState(false);
  const [exportOriginalResolution, setExportOriginalResolution] = useState(false);
  const [exportTarget, setExportTarget] = useState<'preview' | 'frames'>('preview');
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const safeAreaGuide = getSafeAreaGuide(platform, template);
  const frameZones = templateZones
    .map((zone, index) => ({ zone, index }))
    .filter(({ zone }) => zone.type === 'image' || zone.type === 'logo');

  useEffect(() => {
    const firstFrameIndex = frameZones[0]?.index ?? 0;
    setSelectedZoneIndex(firstFrameIndex);
    setActiveFrameZoneIndex(frameZones[0]?.index ?? null);
  }, [frameZones, template?.id, open]);

  const selectedZone = templateZones[selectedZoneIndex] || null;
  const activeFrameZone = activeFrameZoneIndex !== null ? templateZones[activeFrameZoneIndex] || null : null;

  // Detect the image zone that sits behind the active logo zone so we can
  // recommend a logo variant whose contrast reads well on top of it.
  const activeLogoBackgroundZone = activeFrameZone && activeFrameZone.type === 'logo'
    ? findBackgroundZoneForLogo(activeFrameZone, templateZones)
    : null;
  const activeLogoBackgroundUrl = activeLogoBackgroundZone?.mediaUrl;
  const [activeLogoBgLuminance, setActiveLogoBgLuminance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!activeLogoBackgroundUrl) {
      setActiveLogoBgLuminance(null);
      return;
    }
    sampleImageLuminance(activeLogoBackgroundUrl).then((value) => {
      if (!cancelled) setActiveLogoBgLuminance(value);
    });
    return () => { cancelled = true; };
  }, [activeLogoBackgroundUrl]);

  const updateZone = (zoneIndex: number, updates: Partial<SocialTemplateZone>) => {
    const nextZones = templateZones.map((zone, index) =>
      index === zoneIndex ? { ...zone, ...updates } : zone
    );
    onUpdateTemplate({ templateZones: nextZones });
  };

  const applyCropToAllFrames = () => {
    if (activeFrameZoneIndex === null) return;
    const sourceZone = templateZones[activeFrameZoneIndex];
    if (!sourceZone || (sourceZone.type !== 'image' && sourceZone.type !== 'logo')) return;

    const sourceFit = getZoneMediaFit(sourceZone);
    const nextZones = templateZones.map((zone) => (
      zone.type === 'image' || zone.type === 'logo'
        ? { ...zone, mediaFit: { ...sourceFit } }
        : zone
    ));

    onUpdateTemplate({ templateZones: nextZones });
  };

  const sanitizeFileName = (name: string) =>
    name.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'frame';

  const triggerDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  interface ExportRenderOptions {
    pixelRatio: number;
    transparent: boolean;
    includeGuides: boolean;
    originalResolution?: boolean;
  }

  const renderCanvasToDataUrl = async (
    options: ExportRenderOptions,
  ): Promise<string | null> => {
    if (!canvasRef.current) return null;
    const previousGrid = showGrid;
    const previousSafe = showSafeArea;
    if (!options.includeGuides) {
      setShowGrid(false);
      setShowSafeArea(false);
    }
    setIsExporting(true);
    // Wait two frames so React commits the chrome-hiding state before capture.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    try {
      return await toPng(canvasRef.current, {
        pixelRatio: options.pixelRatio,
        cacheBust: true,
        skipFonts: false,
        backgroundColor: options.transparent ? undefined : undefined,
        // html-to-image: setting `style.background = transparent` via filter wrapper is not supported,
        // but PNG output preserves transparency unless an explicit backgroundColor is set.
        // When transparent=false we let the canvas's own background paint through.
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          if (node.dataset.exportExclude === 'true') return false;
          if (options.transparent && node === canvasRef.current) {
            node.dataset.exportPrevBg = node.style.background || '';
            node.style.background = 'transparent';
          }
          return true;
        },
      }).finally(() => {
        if (options.transparent && canvasRef.current) {
          const prev = canvasRef.current.dataset.exportPrevBg ?? '';
          canvasRef.current.style.background = prev;
          delete canvasRef.current.dataset.exportPrevBg;
        }
      });
    } finally {
      setShowGrid(previousGrid);
      setShowSafeArea(previousSafe);
      setIsExporting(false);
    }
  };

  const handleExportPreview = async (options: ExportRenderOptions) => {
    setIsExporting(true);
    try {
      const dataUrl = await renderCanvasToDataUrl(options);
      if (!dataUrl) {
        toast.error('Preview not ready to export');
        return;
      }
      triggerDownload(dataUrl, `${sanitizeFileName(template.name)}-preview@${options.pixelRatio}x.png`);
      toast.success('Preview exported');
    } catch (err) {
      console.error('Export preview failed', err);
      toast.error('Failed to export preview');
    } finally {
      setIsExporting(false);
    }
  };

  const loadImageElement = (src: string): Promise<HTMLImageElement> => (
    new Promise((resolve, reject) => {
      const img = new globalThis.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    })
  );

  /**
   * Render a single frame zone from its source media at the media's native
   * resolution, replicating object-fit: cover/contain + focus point cropping
   * so the output matches what the canvas previews on-screen.
   */
  const renderFrameAtOriginalResolution = async (
    zone: SocialTemplateZone,
    transparent: boolean,
  ): Promise<string | null> => {
    if (!zone.mediaUrl) return null;
    let img: HTMLImageElement;
    try {
      img = await loadImageElement(zone.mediaUrl);
    } catch (err) {
      console.warn('Failed to load frame media for original-resolution export', err);
      return null;
    }

    const fit = getZoneMediaFit(zone);
    const mediaW = img.naturalWidth || img.width;
    const mediaH = img.naturalHeight || img.height;
    if (mediaW === 0 || mediaH === 0) return null;

    // Frame aspect from the zone's percentage dimensions.
    const zoneAspect = zone.width / zone.height;
    const mediaAspect = mediaW / mediaH;

    let outW: number;
    let outH: number;
    let sx = 0;
    let sy = 0;
    let sw = mediaW;
    let sh = mediaH;
    let dx = 0;
    let dy = 0;
    let dw: number;
    let dh: number;

    if (fit.fit === 'cover') {
      // Crop the source to the zone's aspect; output is full res of the visible crop.
      if (mediaAspect > zoneAspect) {
        // Media is wider than the frame — crop horizontally.
        sh = mediaH;
        sw = Math.round(mediaH * zoneAspect);
        const focusPx = ((fit.focusX ?? 50) / 100) * mediaW;
        sx = Math.round(Math.max(0, Math.min(mediaW - sw, focusPx - sw / 2)));
        sy = 0;
      } else {
        // Media is taller — crop vertically.
        sw = mediaW;
        sh = Math.round(mediaW / zoneAspect);
        const focusPy = ((fit.focusY ?? 50) / 100) * mediaH;
        sy = Math.round(Math.max(0, Math.min(mediaH - sh, focusPy - sh / 2)));
        sx = 0;
      }
      outW = sw;
      outH = sh;
      dw = outW;
      dh = outH;
    } else {
      // contain: keep entire media, letterbox onto a frame-shaped canvas at media's max dimension.
      // Use the longer media side as the basis to preserve resolution.
      if (mediaAspect > zoneAspect) {
        outW = mediaW;
        outH = Math.round(mediaW / zoneAspect);
      } else {
        outH = mediaH;
        outW = Math.round(mediaH * zoneAspect);
      }
      dw = mediaW;
      dh = mediaH;
      const focusPx = ((fit.focusX ?? 50) / 100) * (outW - dw);
      const focusPy = ((fit.focusY ?? 50) / 100) * (outH - dh);
      dx = Math.round(Math.max(0, Math.min(outW - dw, focusPx)));
      dy = Math.round(Math.max(0, Math.min(outH - dh, focusPy)));
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, outW);
    canvas.height = Math.max(1, outH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (!transparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    return canvas.toDataURL('image/png');
  };

  const handleExportFramesZip = async (options: ExportRenderOptions) => {
    if (frameZones.length === 0) {
      toast.error('No frames to export');
      return;
    }
    setIsExporting(true);
    try {
      const fullDataUrl = await renderCanvasToDataUrl(options);
      if (!fullDataUrl || !canvasRef.current) {
        toast.error('Preview not ready to export');
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(sanitizeFileName(template.name)) || zip;
      folder.file('preview.png', fullDataUrl.split(',')[1], { base64: true });

      // Load full canvas image — used as the fallback source when a frame has no
      // bound media or when original-resolution export is disabled.
      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new globalThis.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = fullDataUrl;
      });

      const baseW = baseImg.width;
      const baseH = baseImg.height;
      let originalUsed = 0;
      let originalFallback = 0;

      for (let i = 0; i < frameZones.length; i++) {
        const { zone } = frameZones[i];
        const safeLabel = sanitizeFileName(zone.label || `frame-${i + 1}`);
        let cropDataUrl: string | null = null;

        if (options.originalResolution) {
          cropDataUrl = await renderFrameAtOriginalResolution(zone, options.transparent);
          if (cropDataUrl) {
            originalUsed += 1;
          } else {
            originalFallback += 1;
          }
        }

        if (!cropDataUrl) {
          // Fallback: slice from the rasterized preview canvas.
          const sx = Math.max(0, Math.round((zone.x / 100) * baseW));
          const sy = Math.max(0, Math.round((zone.y / 100) * baseH));
          const sw = Math.max(1, Math.round((zone.width / 100) * baseW));
          const sh = Math.max(1, Math.round((zone.height / 100) * baseH));

          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(baseImg, sx, sy, sw, sh, 0, 0, sw, sh);
          cropDataUrl = canvas.toDataURL('image/png');
        }

        folder.file(
          `${String(i + 1).padStart(2, '0')}-${safeLabel}.png`,
          cropDataUrl.split(',')[1],
          { base64: true },
        );
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const suffix = options.originalResolution ? 'orig' : `${options.pixelRatio}x`;
      triggerDownload(url, `${sanitizeFileName(template.name)}-frames@${suffix}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      if (options.originalResolution && originalFallback > 0) {
        toast.success(
          `Exported ${frameZones.length} frame${frameZones.length === 1 ? '' : 's'} (${originalUsed} at original, ${originalFallback} from preview)`,
        );
      } else {
        toast.success(`Exported ${frameZones.length} frame${frameZones.length === 1 ? '' : 's'}`);
      }
    } catch (err) {
      console.error('Export frames failed', err);
      toast.error('Failed to export frames');
    } finally {
      setIsExporting(false);
    }
  };

  const openExportDialog = (target: 'preview' | 'frames') => {
    setExportTarget(target);
    setExportDialogOpen(true);
  };

  const runExportFromDialog = async () => {
    const options: ExportRenderOptions = {
      pixelRatio: Number(exportScale),
      transparent: exportTransparent,
      includeGuides: exportIncludeGuides,
      originalResolution: exportTarget === 'frames' && exportOriginalResolution,
    };
    setExportDialogOpen(false);
    if (exportTarget === 'preview') {
      await handleExportPreview(options);
    } else {
      await handleExportFramesZip(options);
    }
  };

  const handleZonePointerDown = (
    event: React.PointerEvent<HTMLElement>,
    zoneIndex: number,
    mode: 'move' | 'resize',
  ) => {
    if (!canEdit) return;

    event.preventDefault();
    event.stopPropagation();

    const container = event.currentTarget.closest('[data-template-canvas="true"]') as HTMLDivElement | null;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startZone = templateZones[zoneIndex];
    if (!startZone) return;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      const nextZones = templateZones.map((zone, index) => {
        if (index !== zoneIndex) return zone;

        if (mode === 'move') {
          return {
            ...zone,
            x: clampZoneValue(startZone.x + deltaX, 0, 100 - startZone.width),
            y: clampZoneValue(startZone.y + deltaY, 0, 100 - startZone.height),
          };
        }

        return {
          ...zone,
          width: clampZoneValue(startZone.width + deltaX, 8, 100 - startZone.x),
          height: clampZoneValue(startZone.height + deltaY, 6, 100 - startZone.y),
        };
      });

      onUpdateTemplate({ templateZones: nextZones });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {layoutOptions.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  Layout switcher
                </div>
                <div className="flex flex-wrap gap-2">
                  {layoutOptions.map((option) => {
                    const isActive = option.id === template.id;
                    return (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className="h-8"
                        onClick={() => onSelectTemplate(option)}
                      >
                        {option.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 overflow-hidden rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={showGrid ? 'default' : 'outline'}
                    className="h-8 gap-1.5"
                    onClick={() => setShowGrid((current) => !current)}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Grid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={showSafeArea ? 'default' : 'outline'}
                    className="h-8 gap-1.5"
                    onClick={() => setShowSafeArea((current) => !current)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Safe area
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-8 gap-1.5"
                        disabled={isExporting}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isExporting ? 'Exporting…' : 'Export'}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => openExportDialog('preview')} disabled={isExporting}>
                        <FileImage className="mr-2 h-4 w-4" />
                        Export preview (PNG)…
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openExportDialog('frames')}
                        disabled={isExporting || frameZones.length === 0}
                      >
                        <FileArchive className="mr-2 h-4 w-4" />
                        Export frames (ZIP)…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Zoom</span>
                  <Select value={zoomLevel} onValueChange={setZoomLevel}>
                    <SelectTrigger className="h-8 w-[96px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                      <SelectItem value="125">125%</SelectItem>
                      <SelectItem value="150">150%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-border bg-muted/20 p-3">
                <div
                  className="mx-auto"
                  style={{
                    width: `${Math.max(Number(zoomLevel), 100)}%`,
                    minWidth: Number(zoomLevel) < 100 ? `${zoomLevel}%` : undefined,
                  }}
                >
                  <div ref={canvasRef} data-template-canvas="true" className="relative aspect-video overflow-hidden rounded-lg bg-muted/30">
                    {template.previewImageUrl ? (
                      <img
                        src={template.previewImageUrl}
                        alt={template.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted/50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent" />

                    {showGrid && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        aria-hidden="true"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, hsl(var(--foreground) / 0.14) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.14) 1px, transparent 1px)',
                          backgroundSize: '10% 100%, 100% 10%',
                        }}
                      />
                    )}

                    {showSafeArea && (
                      <div
                        className="pointer-events-none absolute rounded border border-dashed border-primary/80 bg-primary/10"
                        aria-hidden="true"
                        style={{
                          left: `${safeAreaGuide.x}%`,
                          top: `${safeAreaGuide.y}%`,
                          width: `${safeAreaGuide.width}%`,
                          height: `${safeAreaGuide.height}%`,
                        }}
                      >
                        <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                          {safeAreaGuide.label}
                        </span>
                      </div>
                    )}

                    {templateZones.map((zone, index) => (
                      <div
                        key={`${template.id}-editor-zone-${index}`}
                        className={cn(
                          'absolute overflow-hidden rounded shadow-sm backdrop-blur-[1px] transition-all',
                          !isExporting && 'border-2 border-dashed',
                          !isExporting && zonePreviewStyles[zone.type],
                          canEdit && !isExporting && 'cursor-move',
                          !isExporting && selectedZoneIndex === index && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        )}
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                        }}
                        onClick={() => setSelectedZoneIndex(index)}
                        onPointerDown={(event) => {
                          setSelectedZoneIndex(index);
                          if (zone.type === 'image' || zone.type === 'logo') setActiveFrameZoneIndex(index);
                          handleZonePointerDown(event, index, 'move');
                        }}
                      >
                        {(zone.type === 'image' || zone.type === 'logo') && zone.mediaUrl ? (
                          <img
                            src={zone.mediaUrl}
                            alt={zone.label}
                            className="absolute inset-0 h-full w-full"
                            style={{
                              objectFit: getZoneMediaFit(zone).fit,
                              objectPosition: `${getZoneMediaFit(zone).focusX}% ${getZoneMediaFit(zone).focusY}%`,
                            }}
                          />
                        ) : null}
                        {!isExporting && (
                          <div
                            data-export-exclude="true"
                            className="relative flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium leading-tight"
                          >
                            <span className="truncate">{zone.content || zone.label}</span>
                          </div>
                        )}
                        {canEdit && zone.type !== 'image' && !isExporting && (
                          <button
                            type="button"
                            data-export-exclude="true"
                            className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-border bg-background shadow-sm"
                            onPointerDown={(event) => {
                              setSelectedZoneIndex(index);
                              handleZonePointerDown(event, index, 'resize');
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {templateZones.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {templateZones.map((zone, index) => (
                  <button
                    key={`${template.id}-detail-${index}`}
                    type="button"
                    onClick={() => setSelectedZoneIndex(index)}
                    className={cn(
                      'rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:border-primary/40',
                      selectedZoneIndex === index ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{zone.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{zone.type.toUpperCase()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Zone editor</p>
              <p className="text-xs text-muted-foreground">
                {selectedZone ? `${selectedZone.label} · ${selectedZone.type}` : 'Select a zone'}
              </p>
            </div>

            <div className="space-y-4 p-4">
              {frameZones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    Frame manager
                  </div>
                  <div className="space-y-2">
                    {frameZones.map(({ zone, index }) => {
                      const isSelected = activeFrameZoneIndex === index;
                      return (
                        <button
                          key={`${template.id}-frame-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedZoneIndex(index);
                            setActiveFrameZoneIndex(index);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary/40',
                            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{zone.label}</p>
                            <p className="text-[11px] text-muted-foreground">{zoneTypeLabels[zone.type]}</p>
                          </div>
                          <div className="shrink-0 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                            {Math.round(zone.width)} × {Math.round(zone.height)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeFrameZone && (activeFrameZone.type === 'image' || activeFrameZone.type === 'logo') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {activeFrameZone.label} · {zoneTypeLabels[activeFrameZone.type]}
                    </p>
                    {frameZones.length > 1 && canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={applyCropToAllFrames}
                      >
                        Apply to all frames
                      </Button>
                    )}
                  </div>
                  {canEdit && activeFrameZoneIndex !== null && (
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                        <Upload className="h-3 w-3" />
                        Upload media
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void onUploadZoneMedia(activeFrameZoneIndex, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <ImageLibraryPicker
                        onSelect={(url) => onSelectZoneMedia(activeFrameZoneIndex, url)}
                        trigger={
                          <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5">
                            <FolderOpen className="h-3 w-3" />
                            Library
                          </Button>
                        }
                        defaultCategory="Backgrounds"
                      />
                    </div>
                  )}
                  {canEdit
                    && activeFrameZoneIndex !== null
                    && activeFrameZone.type === 'logo'
                    && (brandLogos?.length ?? 0) > 0 && (() => {
                      const usableLogos = brandLogos!.filter((logo) => !!logo.url);
                      const bgLum = activeLogoBgLuminance;
                      const bgTone = bgLum !== null ? describeBackgroundTone(bgLum) : null;
                      const ranked = usableLogos
                        .map((logo) => ({
                          logo,
                          score: bgLum !== null ? scoreLogoForBackground(logo.variant, bgLum) : 0.5,
                        }))
                        .sort((a, b) => b.score - a.score);
                      const topScore = ranked[0]?.score ?? 0;
                      return (
                        <div className="space-y-1.5 rounded-lg border border-dashed border-border bg-muted/10 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium text-muted-foreground">
                              Brand logo variants
                            </p>
                            {bgTone && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span
                                  className={cn(
                                    'h-2.5 w-2.5 rounded-full border border-border',
                                    bgTone === 'dark' && 'bg-foreground',
                                    bgTone === 'light' && 'bg-background',
                                    bgTone === 'mid' && 'bg-muted',
                                  )}
                                />
                                {bgTone === 'dark' ? 'Dark' : bgTone === 'light' ? 'Light' : 'Mid-tone'} background
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ranked.map(({ logo, score }) => {
                              const isActive = activeFrameZone.mediaUrl === logo.url;
                              const isRecommended = bgLum !== null && score === topScore && score >= 0.7;
                              const isPoorMatch = bgLum !== null && score < 0.3;
                              return (
                                <button
                                  key={logo.id}
                                  type="button"
                                  title={`${logo.name} (${logo.variant})${isRecommended ? ' — recommended for this background' : isPoorMatch ? ' — low contrast on this background' : ''}`}
                                  onClick={() => onSelectZoneMedia(activeFrameZoneIndex!, logo.url)}
                                  className={cn(
                                    'relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-md border p-1 transition-colors',
                                    // Preview each swatch on the tone it's designed for so the
                                    // light-on-dark variants don't look invisible in the picker.
                                    logo.variant === 'reversed' || logo.variant === 'monochrome'
                                      ? 'bg-foreground'
                                      : 'bg-background',
                                    isActive
                                      ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background'
                                      : isRecommended
                                        ? 'border-primary/60 hover:border-primary'
                                        : 'border-border hover:border-primary/40',
                                    isPoorMatch && !isActive && 'opacity-50',
                                  )}
                                >
                                  <img
                                    src={logo.url}
                                    alt={logo.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                  {isRecommended && (
                                    <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1 text-[8px] font-semibold leading-3 text-primary-foreground shadow">
                                      ★
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {bgTone
                              ? 'Variants are ranked by contrast against the background. Tap to drop one in.'
                              : 'Tap a variant to drop it into this logo zone.'}
                          </p>
                        </div>
                      );
                    })()}
                  <SlotFitControl
                    previewUrl={activeFrameZone.mediaUrl || template.previewImageUrl}
                    assetType={activeFrameZone.mediaUrl ? 'image' : 'empty'}
                    value={getZoneMediaFit(activeFrameZone)}
                    onChange={(next) => updateZone(activeFrameZoneIndex!, { mediaFit: next })}
                    onCommit={(next) => updateZone(activeFrameZoneIndex!, { mediaFit: next })}
                    onReset={() => updateZone(activeFrameZoneIndex!, { mediaFit: defaultTemplatePreviewFit })}
                  />
                </div>
              )}

              {selectedZone ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Label</label>
                    <Input
                      value={selectedZone.label}
                      onChange={(e) => updateZone(selectedZoneIndex, { label: e.target.value })}
                      className="h-8"
                    />
                  </div>

                {(selectedZone.type === 'text' || selectedZone.type === 'cta') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Content</label>
                    <Textarea
                      value={selectedZone.content || ''}
                      onChange={(e) => updateZone(selectedZoneIndex, { content: e.target.value })}
                      placeholder="Enter editable text"
                      className="min-h-[92px]"
                    />
                  </div>
                )}

                {(selectedZone.type === 'image' || selectedZone.type === 'logo') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Media URL</label>
                    <Input
                      value={selectedZone.mediaUrl || ''}
                      onChange={(e) => updateZone(selectedZoneIndex, { mediaUrl: e.target.value })}
                      placeholder="Paste media or logo URL"
                      className="h-8"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Width %</label>
                    <Input
                      type="number"
                      min={8}
                      max={100}
                      value={Math.round(selectedZone.width)}
                      onChange={(e) => updateZone(selectedZoneIndex, {
                        width: clampZoneValue(Number(e.target.value) || selectedZone.width, 8, 100 - selectedZone.x),
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Height %</label>
                    <Input
                      type="number"
                      min={6}
                      max={100}
                      value={Math.round(selectedZone.height)}
                      onChange={(e) => updateZone(selectedZoneIndex, {
                        height: clampZoneValue(Number(e.target.value) || selectedZone.height, 6, 100 - selectedZone.y),
                      })}
                      className="h-8"
                    />
                  </div>
                </div>

                  {(selectedZone.type === 'text' || selectedZone.type === 'cta') && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Alignment</label>
                      <Select
                        value={selectedZone.align || 'center'}
                        onValueChange={(value) => updateZone(selectedZoneIndex, { align: value as SocialTemplateZone['align'] })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Click a zone to edit it.</div>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export options</DialogTitle>
          <DialogDescription>
            {exportTarget === 'preview'
              ? 'Configure how the preview PNG is rendered.'
              : 'Configure how the ZIP archive of frame assets is rendered.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {(() => {
            const scaleDisabled = exportTarget === 'frames' && exportOriginalResolution;
            return (
              <div className={cn('space-y-2', scaleDisabled && 'opacity-50 pointer-events-none')}>
                <Label className="text-sm font-medium">PNG scale</Label>
                <RadioGroup
                  value={exportScale}
                  onValueChange={(value) => setExportScale(value as '1' | '2' | '3')}
                  className="grid grid-cols-3 gap-2"
                >
                  {(['1', '2', '3'] as const).map((scale) => (
                    <Label
                      key={scale}
                      htmlFor={`export-scale-${scale}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent',
                        exportScale === scale && 'border-primary bg-accent'
                      )}
                    >
                      <RadioGroupItem id={`export-scale-${scale}`} value={scale} className="sr-only" />
                      <span className="font-medium">{scale}x</span>
                    </Label>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {scaleDisabled
                    ? 'Scale is ignored when exporting at original media resolution.'
                    : 'Higher scales produce sharper images at larger file sizes.'}
                </p>
              </div>
            );
          })()}

          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="export-transparent" className="text-sm font-medium">
                Transparent background
              </Label>
              <p className="text-xs text-muted-foreground">
                Export with a transparent canvas instead of the template background.
              </p>
            </div>
            <Switch
              id="export-transparent"
              checked={exportTransparent}
              onCheckedChange={setExportTransparent}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="export-guides" className="text-sm font-medium">
                Include guides
              </Label>
              <p className="text-xs text-muted-foreground">
                Render the grid and safe-area overlays in the exported file.
              </p>
            </div>
            <Switch
              id="export-guides"
              checked={exportIncludeGuides}
              onCheckedChange={setExportIncludeGuides}
            />
          </div>

          {exportTarget === 'frames' && (
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="export-original" className="text-sm font-medium">
                  Original media resolution
                </Label>
                <p className="text-xs text-muted-foreground">
                  Render each frame from its source image at full native resolution
                  instead of the preview canvas. Frames without bound media fall back
                  to the preview slice.
                </p>
              </div>
              <Switch
                id="export-original"
                checked={exportOriginalResolution}
                onCheckedChange={setExportOriginalResolution}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={runExportFromDialog} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : exportTarget === 'preview' ? 'Export PNG' : 'Export ZIP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};


// Compact Platform Card Component
const PlatformCard = ({
  asset,
  onUpdate,
  onDelete,
  onExpand,
  onMockupPreview,
  canEdit = false,
  entityId,
  entityType,
}: {
  asset: BrandSocialAssetSpec;
  onUpdate: (updates: Partial<BrandSocialAssetSpec>) => void;
  onDelete: () => void;
  onExpand: () => void;
  onMockupPreview: () => void;
  canEdit?: boolean;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}) => {
  const IconComponent = platformIcons[asset.platform] || Monitor;
  const resolvedTemplates = getResolvedTemplates(asset);
  const hasTemplates = resolvedTemplates.length > 0;
  const sizeCount = [asset.postSize, asset.storySize, asset.reelSize, asset.coverSize].filter(s => s && s !== 'N/A').length;
  const [uploadingCard, setUploadingCard] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useStorageUpload({
    entityType: entityType || 'brand',
    entityId: entityId || '',
  });

  const handleCardImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (entityId) {
      setUploadingCard(true);
      try {
        const result = await uploadFile(file, 'asset', `social-card-${asset.id}`);
        if (result?.url) onUpdate({ previewImageUrl: result.url });
      } catch { toast.error('Failed to upload card image'); }
      finally { setUploadingCard(false); }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => onUpdate({ previewImageUrl: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  }, [asset.id, entityId, onUpdate, uploadFile]);

  return (
    <div 
      className="group relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
      onClick={onExpand}
    >
      {/* Preview thumbnail */}
      <div className="relative h-24 bg-muted/30 overflow-hidden">
        {asset.previewImageUrl ? (
          <img 
            src={asset.previewImageUrl} 
            alt={asset.platform}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <IconComponent className="h-8 w-8 text-primary/40" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Platform name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <IconComponent className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">{asset.platform}</span>
          </div>
        </div>

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); cardFileInputRef.current?.click(); }}
                className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                title="Upload Card Image"
                disabled={uploadingCard}
              >
                {uploadingCard ? (
                  <span className="h-3 w-3 block animate-spin rounded-full border border-muted-foreground border-t-transparent" />
                ) : (
                  <Upload className="h-3 w-3 text-foreground" />
                )}
              </button>
              <input
                ref={cardFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCardImageUpload}
              />
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onMockupPreview(); }}
            className="p-1.5 rounded-md bg-primary backdrop-blur-sm hover:bg-primary/90 transition-colors"
            title="View Mockup"
          >
            <Eye className="h-3 w-3 text-primary-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-1.5 rounded-md bg-secondary backdrop-blur-sm hover:bg-secondary/80 transition-colors"
            title="Edit Details"
          >
            <Maximize2 className="h-3 w-3 text-secondary-foreground" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-md bg-destructive hover:bg-destructive/90 transition-colors"
              title="Delete"
            >
              <X className="h-3 w-3 text-destructive-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {sizeCount} sizes
          </Badge>
          {hasTemplates && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1">
              <Download className="h-2.5 w-2.5" />
              {resolvedTemplates.length}
            </Badge>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {(asset.postSize || '').split(' x ')[0] || '—'}px
        </span>
      </div>
    </div>
  );
};


// Detail Modal for Platform
const PlatformDetailModal = ({
  asset,
  open,
  onOpenChange,
  onUpdate,
  entityId,
  entityType,
}: {
  asset: BrandSocialAssetSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<BrandSocialAssetSpec>) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<SocialAssetTemplate>>({});
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const { uploadFile } = useStorageUpload({
    entityType: entityType || 'brand',
    entityId: entityId || '',
  });

  const handleFileDrop = useCallback(async (file: File) => {
    if (!asset) return;
    if (entityId) {
      setUploadingPreview(true);
      try {
        const result = await uploadFile(file, 'asset', `social-preview-${asset.id}`);
        if (result?.url) onUpdate(asset.id, { previewImageUrl: result.url });
      } catch { toast.error('Failed to upload preview image'); }
      finally { setUploadingPreview(false); }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => { onUpdate(asset.id, { previewImageUrl: event.target?.result as string }); };
      reader.readAsDataURL(file);
    }
  }, [asset, onUpdate, entityId, uploadFile]);

  const handleProfileIconDrop = useCallback(async (file: File) => {
    if (!asset) return;
    if (entityId) {
      setUploadingProfile(true);
      try {
        const result = await uploadFile(file, 'asset', `social-profile-${asset.id}`);
        if (result?.url) onUpdate(asset.id, { profileIconUrl: result.url });
      } catch { toast.error('Failed to upload profile icon'); }
      finally { setUploadingProfile(false); }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => { onUpdate(asset.id, { profileIconUrl: event.target?.result as string }); };
      reader.readAsDataURL(file);
    }
  }, [asset, onUpdate, entityId, uploadFile]);

  const handleLibrarySelectPreview = useCallback((url: string) => {
    if (!asset) return;
    onUpdate(asset.id, { previewImageUrl: url });
  }, [asset, onUpdate]);

  const handleLibrarySelectProfile = useCallback((url: string) => {
    if (!asset) return;
    onUpdate(asset.id, { profileIconUrl: url });
  }, [asset, onUpdate]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB limit for social assets
  });

  const profileIconDropZone = useDropZone({
    onFileDrop: handleProfileIconDrop,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB limit for profile icons
  });

  if (!asset) return null;

  const IconComponent = platformIcons[asset.platform] || Monitor;

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.url) return;
    const template: SocialAssetTemplate = {
      id: safeUUID(),
      name: newTemplate.name,
      fileType: (newTemplate.fileType as SocialAssetTemplate['fileType']) || 'other',
      url: newTemplate.url,
      description: newTemplate.description,
    };
    onUpdate(asset.id, { templates: [...(asset.templates || []), template] });
    setNewTemplate({});
    setShowTemplateForm(false);
  };

  const deleteTemplate = (templateId: string) => {
    onUpdate(asset.id, { templates: (asset.templates || []).filter(t => t.id !== templateId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
            <span>{asset.platform} Protocol</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              className="ml-auto"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Preview Image with Social Layout */}
          <div 
            className={cn(
              "relative rounded-lg overflow-hidden border-2 border-dashed transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border/50"
            )}
            onDragOver={dragHandlers.onDragOver}
            onDragLeave={dragHandlers.onDragLeave}
            onDrop={dragHandlers.onDrop}
          >
            {/* Header/Cover area */}
            <div className="relative h-48">
              {asset.previewImageUrl ? (
                <>
                  <img src={asset.previewImageUrl} alt={asset.platform} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={openFilePicker}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Replace
                    </Button>
                    <ImageLibraryPicker
                      onSelect={handleLibrarySelectPreview}
                      trigger={
                        <Button size="sm" variant="secondary">
                          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                          Library
                        </Button>
                      }
                      defaultCategory="Backgrounds"
                    />
                    <Button size="sm" variant="destructive" onClick={() => onUpdate(asset.id, { previewImageUrl: '' })}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {/* Safe zone indicator */}
                  <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded pointer-events-none">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wider text-white/70 bg-black/40 px-2 py-1 rounded">
                      Safe Zone
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 gap-2">
                  <Image className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Drop image or click to upload (up to 10MB)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={openFilePicker}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload
                    </Button>
                    <ImageLibraryPicker
                      onSelect={handleLibrarySelectPreview}
                      trigger={
                        <Button size="sm" variant="outline">
                          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                          Library
                        </Button>
                      }
                      defaultCategory="Backgrounds"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Realistic social page layout preview */}
            <div className="bg-card border-t border-border">
              {/* Profile section showing where avatar appears */}
              <div className="relative px-4 pb-3">
                {/* User icon placeholder - positioned to overlap header */}
                <div 
                  className={cn(
                    "absolute border-4 border-card bg-muted rounded-full flex items-center justify-center overflow-hidden cursor-pointer group/avatar transition-all",
                    asset.platform === 'LinkedIn' && "-top-12 left-4 w-24 h-24",
                    (asset.platform === 'X' || asset.platform === 'X (Twitter)') && "-top-10 left-4 w-20 h-20",
                    asset.platform === 'Facebook' && "-top-8 left-4 w-[100px] h-[100px]",
                    asset.platform === 'YouTube' && "-top-8 left-4 w-16 h-16",
                    asset.platform === 'Instagram' && "-top-6 left-1/2 -translate-x-1/2 w-20 h-20",
                    asset.platform === 'TikTok' && "-top-6 left-1/2 -translate-x-1/2 w-24 h-24",
                    !['LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'YouTube', 'Instagram', 'TikTok'].includes(asset.platform) && "-top-8 left-4 w-16 h-16",
                    profileIconDropZone.isDragging && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={profileIconDropZone.openFilePicker}
                  onDragOver={profileIconDropZone.dragHandlers.onDragOver}
                  onDragLeave={profileIconDropZone.dragHandlers.onDragLeave}
                  onDrop={profileIconDropZone.dragHandlers.onDrop}
                >
                  {asset.profileIconUrl ? (
                    <>
                      <img 
                        src={asset.profileIconUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover/avatar:from-primary/30 group-hover/avatar:to-accent/30 transition-all">
                        <span className="text-2xl font-bold text-primary/40 group-hover/avatar:opacity-0 transition-opacity">
                          {asset.platform.charAt(0)}
                        </span>
                        <Upload className="absolute h-5 w-5 text-primary/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                      </div>
                    </>
                  )}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    Click to upload
                  </span>
                </div>
                
                {/* Remove profile icon button */}
                {asset.profileIconUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdate(asset.id, { profileIconUrl: '' }); }}
                    className={cn(
                      "absolute z-10 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors",
                      asset.platform === 'LinkedIn' && "-top-12 left-24 translate-x-1",
                      (asset.platform === 'X' || asset.platform === 'X (Twitter)') && "-top-10 left-20 translate-x-1",
                      asset.platform === 'Facebook' && "-top-8 left-[100px] translate-x-1",
                      asset.platform === 'YouTube' && "-top-8 left-16 translate-x-1",
                      asset.platform === 'Instagram' && "-top-6 left-1/2 translate-x-8",
                      asset.platform === 'TikTok' && "-top-6 left-1/2 translate-x-10",
                      !['LinkedIn', 'X', 'X (Twitter)', 'Facebook', 'YouTube', 'Instagram', 'TikTok'].includes(asset.platform) && "-top-8 left-16 translate-x-1"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                
                {/* Username/handle placeholder */}
                <div className={cn(
                  "pt-14",
                  asset.platform === 'Instagram' && "pt-16 text-center",
                  asset.platform === 'TikTok' && "pt-16 text-center",
                  asset.platform === 'Facebook' && "pt-16"
                )}>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
            <input ref={profileIconDropZone.fileInputRef} type="file" accept="image/*" onChange={profileIconDropZone.handleInputChange} className="hidden" />
          </div>

          {/* Size Specifications */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Post Size', key: 'postSize', value: asset.postSize },
              { label: 'Cover/Banner', key: 'coverSize', value: asset.coverSize || asset.altSize },
              { label: 'Story Size', key: 'storySize', value: asset.storySize },
              { label: 'Reel/Short', key: 'reelSize', value: asset.reelSize },
            ].map(({ label, key, value }) => (
              (value || isEditing) && (
                <div key={key} className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
                  {isEditing ? (
                    <Input
                      value={value || ''}
                      onChange={(e) => onUpdate(asset.id, { [key]: e.target.value })}
                      className="h-9"
                      placeholder={`e.g., 1080 x 1080 px`}
                    />
                  ) : (
                    <p className="font-medium text-sm">{value || '—'}</p>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Text Legibility */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Text Legibility</label>
            {isEditing ? (
              <Input
                value={asset.textLegibility}
                onChange={(e) => onUpdate(asset.id, { textLegibility: e.target.value })}
                className="h-9"
              />
            ) : (
              <p className="font-medium text-sm">{asset.textLegibility || '—'}</p>
            )}
          </div>

          {/* Directive */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Platform Directive</label>
            {isEditing ? (
              <Textarea
                value={asset.directive}
                onChange={(e) => onUpdate(asset.id, { directive: e.target.value })}
                className="min-h-[100px] resize-none"
                placeholder="Safe zone guidelines, logo placement rules..."
              />
            ) : (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{asset.directive || 'No specific directive'}</p>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-primary" />
                Design Templates
                {(asset.templates?.length || 0) > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{asset.templates?.length}</Badge>
                )}
              </label>
              <Button size="sm" variant="outline" onClick={() => setShowTemplateForm(true)} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Template
              </Button>
            </div>

            {showTemplateForm && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-primary/20">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Template name"
                    className="h-8"
                  />
                  <Select value={newTemplate.fileType || 'figma'} onValueChange={(val) => setNewTemplate({ ...newTemplate, fileType: val as SocialAssetTemplate['fileType'] })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      {['figma', 'canva', 'psd', 'ai', 'sketch', 'xd', 'other'].map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={newTemplate.url || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    const updates: Partial<SocialAssetTemplate> = { ...newTemplate, url };
                    // Auto-detect Canva URLs and set fileType
                    if (url.includes('canva.com')) {
                      updates.fileType = 'canva';
                      if (!newTemplate.name) {
                        updates.name = 'Canva Template';
                      }
                    }
                    setNewTemplate(updates);
                  }}
                  placeholder="Paste Canva link or template URL..."
                  className="h-8"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addTemplate} disabled={!newTemplate.name || !newTemplate.url} className="h-7">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowTemplateForm(false); setNewTemplate({}); }} className="h-7">Cancel</Button>
                </div>
              </div>
            )}

            {(asset.templates?.length || 0) > 0 && (
              <div className="space-y-2">
                {asset.templates?.map((template) => {
                    const isCanva = template.fileType === 'canva' || template.url?.includes('canva.com');
                    const typeInfo = fileTypeIcons[template.fileType] || fileTypeIcons.other;
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div key={template.id} className="flex items-center justify-between bg-background/50 rounded-lg p-2.5 border border-border/30 group">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-7 h-7 rounded flex items-center justify-center", isCanva ? "bg-[hsl(178,100%,40%)]/10" : "bg-muted/50", typeInfo.className)}>
                            {isCanva ? (
                              <img src={CANVA_LOGO_SVG} alt="Canva" className="w-4 h-4" />
                            ) : (
                              <TypeIcon className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{isCanva ? 'Canva Template' : typeInfo.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isCanva ? (
                            <button
                              onClick={() => {
                                toast.info('Remember to apply your brand colors and fonts in Canva', { duration: 4000, icon: '🎨' });
                                window.open(template.url, '_blank', 'noopener,noreferrer');
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[hsl(178,100%,40%)]/10 text-[hsl(178,100%,30%)] hover:bg-[hsl(178,100%,40%)]/20 transition-colors"
                            >
                              <img src={CANVA_LOGO_SVG} alt="" className="w-3.5 h-3.5" />
                              Open in Canva
                            </button>
                          ) : (
                            <a href={template.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-primary/10 text-primary">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button onClick={() => deleteTemplate(template.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TemplateCardInfo = ({
  template,
  isCanva,
  typeLabel,
  canEdit,
  onUpdate,
  onDelete,
}: {
  template: SocialAssetTemplate;
  isCanva: boolean;
  typeLabel: string;
  canEdit: boolean;
  onUpdate: (updates: Partial<SocialAssetTemplate>) => void;
  onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(false);

  if (editing && canEdit) {
    return (
      <div className="p-3 space-y-2 border-t border-border bg-muted/20">
        <Input
          value={template.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Template name"
          className="h-7 text-xs"
          autoFocus
        />
        <Input
          value={template.dimensions || ''}
          onChange={(e) => onUpdate({ dimensions: e.target.value })}
          placeholder="Dimensions (e.g. 1080 x 1080 px)"
          className="h-7 text-xs font-mono"
        />
        <Input
          value={template.url}
          onChange={(e) => {
            const url = e.target.value;
            const updates: Partial<SocialAssetTemplate> = { url };
            if (url.includes('canva.com')) updates.fileType = 'canva';
            onUpdate(updates);
          }}
          placeholder="Template URL"
          className="h-7 text-xs font-mono"
        />
        <div className="flex items-center gap-2">
          <Select value={template.fileType} onValueChange={(val) => onUpdate({ fileType: val as SocialAssetTemplate['fileType'] })}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['figma', 'canva', 'psd', 'ai', 'sketch', 'xd', 'other'].map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={template.sizeCategory || 'other'} onValueChange={(val) => onUpdate({ sizeCategory: val as SocialSizeCategory })}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Size category" /></SelectTrigger>
            <SelectContent>
              {[{ v: 'post', l: 'Post' }, { v: 'square', l: 'Square' }, { v: 'cover', l: 'Cover / Banner' }, { v: 'story', l: 'Story' }, { v: 'reel', l: 'Reel / Short' }, { v: 'other', l: 'Other' }].map(t => (
                <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)} className="h-7 text-xs px-3">Done</Button>
        </div>
      </div>
    );
  }

  const sizeCategoryOptions: { v: SocialSizeCategory; l: string }[] = [
    { v: 'post', l: 'Post' }, { v: 'square', l: 'Square' }, { v: 'cover', l: 'Cover / Banner' }, { v: 'story', l: 'Story' }, { v: 'reel', l: 'Reel / Short' }, { v: 'other', l: 'Other' },
  ];
  const currentCatLabel = sizeCategoryOptions.find(c => c.v === (template.sizeCategory || 'other'))?.l || 'Other';

  return (
    <div className="p-3 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
          {template.dimensions && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{template.dimensions}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canEdit ? (
          <Select value={template.sizeCategory || 'other'} onValueChange={(val) => onUpdate({ sizeCategory: val as SocialSizeCategory })}>
            <SelectTrigger className="h-6 text-[10px] w-auto min-w-[80px] border-dashed gap-1 px-2">
              <Layers className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeCategoryOptions.map(t => (
                <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
            <Layers className="h-2.5 w-2.5" />
            {currentCatLabel}
          </Badge>
        )}
        {canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              title="Edit template"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              title="Delete template"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
// Size category section with view-more toggle (2 rows = 6 cards default)
const CARDS_PER_ROW = 3;
const DEFAULT_VISIBLE_ROWS = 2;

const SizeCategorySection = ({
  category,
  categoryTemplates,
  activePlatform,
  canEditSocial,
  entityId,
  updateSocialAsset,
  uploadFile,
  cardGridClass,
  brandLogos,
}: {
  category: { key: string; label: string; spec: string };
  categoryTemplates: SocialAssetTemplate[];
  activePlatform: BrandSocialAssetSpec;
  canEditSocial: boolean;
  entityId?: string;
  updateSocialAsset: (id: string, updates: Partial<BrandSocialAssetSpec>) => void;
  uploadFile: (file: File, type: string, prefix: string) => Promise<{ url: string } | undefined>;
  cardGridClass: string;
  brandLogos?: BrandLogo[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SocialAssetTemplate | null>(null);
  const maxVisible = DEFAULT_VISIBLE_ROWS * CARDS_PER_ROW;
  const hasMore = categoryTemplates.length > maxVisible;
  const visibleTemplates = expanded ? categoryTemplates : categoryTemplates.slice(0, maxVisible);

  const persistTemplateVersion = useCallback(
    (templateToSave: SocialAssetTemplate, updates: Partial<SocialAssetTemplate>) => {
      const nextTemplate: SocialAssetTemplate = {
        ...templateToSave,
        ...updates,
        sourceTemplateId: templateToSave.sourceTemplateId || updates.sourceTemplateId,
        sourceTemplateFormat: templateToSave.sourceTemplateFormat || updates.sourceTemplateFormat,
      };

      const existingTemplates = activePlatform.templates || [];
      const matchIndex = existingTemplates.findIndex((item) =>
        item.id === templateToSave.id ||
        (!!templateToSave.sourceTemplateId && item.sourceTemplateId === templateToSave.sourceTemplateId) ||
        (!!templateToSave.sourceTemplateFormat &&
          item.sourceTemplateFormat === templateToSave.sourceTemplateFormat &&
          item.name === templateToSave.name)
      );

      const updatedTemplates =
        matchIndex >= 0
          ? existingTemplates.map((item, index) => (index === matchIndex ? { ...item, ...nextTemplate } : item))
          : [...existingTemplates, nextTemplate];

      updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
      return nextTemplate;
    },
    [activePlatform.id, activePlatform.templates, updateSocialAsset],
  );

  const updateTemplateZoneMedia = useCallback((templateToUpdate: SocialAssetTemplate, zoneIndex: number, mediaUrl: string) => {
    const nextZones = getEditableZones(activePlatform.platform, templateToUpdate, brandLogos).map((zone, index) => (
      index === zoneIndex ? { ...zone, mediaUrl } : zone
    ));

    return persistTemplateVersion(templateToUpdate, { templateZones: nextZones });
  }, [activePlatform.platform, persistTemplateVersion, brandLogos]);

  return (
    <div className="space-y-3">
      {/* Sub-section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-foreground">{category.label}</h4>
          {category.spec && (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">{category.spec}</Badge>
          )}
          {categoryTemplates.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{categoryTemplates.length}</Badge>
          )}
        </div>
        {canEditSocial && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newTemplate: SocialAssetTemplate = {
                id: safeUUID(),
                name: `${activePlatform.platform} ${category.label}`,
                fileType: 'canva',
                url: '',
                sizeCategory: category.key as SocialSizeCategory,
                dimensions: category.spec || '',
              };
              updateSocialAsset(activePlatform.id, {
                templates: [...(activePlatform.templates || []), newTemplate],
              });
            }}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>

      {visibleTemplates.length > 0 ? (
        <div className={cardGridClass}>
          {visibleTemplates.map((template) => {
            const isCanva = template.fileType === 'canva' || template.url?.includes('canva.com');
            const typeInfo = fileTypeIcons[template.fileType] || fileTypeIcons.other;
            const TypeIcon = typeInfo.icon;
            const hasPreview = !!template.previewImageUrl;

            const handleTemplateImageUpload = async (file: File) => {
              if (!entityId) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  persistTemplateVersion(template, { previewImageUrl: ev.target?.result as string });
                };
                reader.readAsDataURL(file);
                return;
              }
              try {
                const result = await uploadFile(file, 'asset', `template-preview-${template.id}`);
                if (result?.url) {
                  persistTemplateVersion(template, { previewImageUrl: result.url });
                  toast.success('Template preview updated');
                }
              } catch {
                toast.error('Failed to upload preview image');
              }
            };

            const handleTemplateLibrarySelect = (url: string) => {
              const nextTemplate = persistTemplateVersion(template, { previewImageUrl: url, previewFit: defaultTemplatePreviewFit });
              setSelectedTemplate(nextTemplate);
              toast.success('Template image updated from library — adjust crop & fit in the larger preview');
            };

            return (
              <div key={template.id} className="group/card bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                <div className="relative overflow-hidden">
                  {hasPreview ? (
                    <TemplateCardPreview
                      platform={activePlatform.platform}
                      template={template}
                      interactive
                      onClick={() => setSelectedTemplate(template)}
                      brandLogos={brandLogos}
                    />
                  ) : isCanva ? (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <img src={CANVA_LOGO_SVG} alt="Canva" className="w-10 h-10" />
                      <span className="text-xs text-muted-foreground">Canva Template</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <TypeIcon className={cn("h-8 w-8", typeInfo.className)} />
                      <span className="text-xs text-muted-foreground">{typeInfo.label}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-foreground/0 group-hover/card:bg-foreground/10 transition-colors flex flex-col items-center justify-center gap-2">
                    <div className="pointer-events-auto opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center gap-2">
                      {template.url ? (isCanva ? (
                        <button
                          onClick={() => {
                            toast.info('Remember to apply your brand colors and fonts in Canva', { duration: 4000, icon: '🎨' });
                            window.open(template.url, '_blank', 'noopener,noreferrer');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(178,100%,40%)] text-white hover:bg-[hsl(178,100%,35%)] shadow-lg transition-colors"
                        >
                          <img src={CANVA_LOGO_SVG} alt="" className="w-4 h-4" />
                          Open in Canva
                        </button>
                      ) : (
                        <a href={template.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-colors">
                          <ExternalLink className="h-4 w-4" />
                          Open Template
                        </a>
                      )) : null}
                      {canEditSocial && (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg cursor-pointer transition-colors">
                            <Upload className="h-3 w-3" />
                            {hasPreview ? 'Replace Image' : 'Add Image'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleTemplateImageUpload(file); e.target.value = ''; }} />
                          </label>
                          <ImageLibraryPicker
                            onSelect={handleTemplateLibrarySelect}
                            trigger={
                              <Button type="button" size="sm" variant="secondary" className="h-8 gap-1.5 bg-background/90 shadow-lg backdrop-blur-sm">
                                <FolderOpen className="h-3 w-3" />
                                Library
                              </Button>
                            }
                            defaultCategory="Backgrounds"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {hasPreview && canEditSocial && (
                    <button
                      onClick={(e) => { e.stopPropagation(); const updatedTemplates = (activePlatform.templates || []).map(t => t.id === template.id ? { ...t, previewImageUrl: undefined } : t); updateSocialAsset(activePlatform.id, { templates: updatedTemplates }); toast.success('Preview image removed'); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover/card:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <TemplateCardInfo
                  template={template}
                  isCanva={isCanva}
                  typeLabel={isCanva ? 'Canva Template' : typeInfo.label}
                  canEdit={canEditSocial}
                  onUpdate={(updates) => {
                    const updatedTemplates = (activePlatform.templates || []).map(t => t.id === template.id ? { ...t, ...updates } : t);
                    updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
                  }}
                  onDelete={() => {
                    updateSocialAsset(activePlatform.id, { templates: (activePlatform.templates || []).filter(t => t.id !== template.id) });
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
          <span className="text-xs">No {category.label.toLowerCase()} templates yet</span>
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border hover:border-primary/30 transition-all"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          {expanded ? 'Show less' : `View ${categoryTemplates.length - maxVisible} more`}
        </button>
      )}

      <TemplatePreviewDialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        platform={activePlatform.platform}
        template={selectedTemplate}
        layoutOptions={categoryTemplates}
        onSelectTemplate={setSelectedTemplate}
        canEdit={canEditSocial}
        brandLogos={brandLogos}
        onUploadZoneMedia={async (zoneIndex, file) => {
          if (!selectedTemplate) return;

          if (!entityId) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const nextTemplate = updateTemplateZoneMedia(selectedTemplate, zoneIndex, ev.target?.result as string);
              setSelectedTemplate(nextTemplate);
            };
            reader.readAsDataURL(file);
            return;
          }

          try {
            const result = await uploadFile(file, 'asset', `template-zone-${selectedTemplate.id}-${zoneIndex}`);
            if (result?.url) {
              const nextTemplate = updateTemplateZoneMedia(selectedTemplate, zoneIndex, result.url);
              setSelectedTemplate(nextTemplate);
              toast.success('Frame media updated');
            }
          } catch {
            toast.error('Failed to upload frame media');
          }
        }}
        onSelectZoneMedia={(zoneIndex, url) => {
          if (!selectedTemplate) return;
          const nextTemplate = updateTemplateZoneMedia(selectedTemplate, zoneIndex, url);
          setSelectedTemplate(nextTemplate);
          toast.success('Frame media updated from library');
        }}
        onUpdateTemplate={(updates) => {
          if (!selectedTemplate) return;
          const persistedTemplate = persistTemplateVersion(selectedTemplate, updates);
          setSelectedTemplate(persistedTemplate);
        }}
      />
    </div>
  );
};

export const SocialAssetsSection = ({
  socialAssets,
  onSocialAssetsChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange,
  entityId,
  entityType,
  brandLogos,
}: SocialAssetsProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<BrandSocialAssetSpec | null>(null);
  const [activePlatformId, setActivePlatformId] = useState<string | null>(() => {
    // Default to first populated platform (has templates), or first platform overall
    const sorted = [...socialAssets].sort((a, b) => a.platform === 'General' ? -1 : b.platform === 'General' ? 1 : 0);
    const firstPopulated = sorted.find(a => (a.templates?.length || 0) > 0);
    return firstPopulated?.id || sorted[0]?.id || null;
  });
  const [mockupPreviewPlatform, setMockupPreviewPlatform] = useState<BrandSocialAssetSpec | null>(null);
  const [cardLayout, setCardLayout] = useState<LayoutPreset>('grid-3');
  const { gridClass } = useLayoutClasses(layout);
  const { gridClass: cardGridClass } = useLayoutClasses(cardLayout);
  
  const canEditSocial = !!onSocialAssetsChange;

  const { uploadFile } = useStorageUpload({
    entityType: entityType || 'brand',
    entityId: entityId || '',
  });

  const hasSocialInitialized = useRef(false);

  // Auto-populate presets (only when editable)
  useEffect(() => {
    if (!hasSocialInitialized.current && socialAssets.length === 0 && onSocialAssetsChange) {
      hasSocialInitialized.current = true;
      onSocialAssetsChange(platformPresets.map(p => ({ ...p, id: safeUUID(), templates: [] })));
    }
  }, [socialAssets.length, onSocialAssetsChange]);

  // Auto-select first populated platform when assets load or change and none is active
  useEffect(() => {
    if (activePlatformId && socialAssets.some(a => a.id === activePlatformId)) return;
    const sorted = [...socialAssets].sort((a, b) => a.platform === 'General' ? -1 : b.platform === 'General' ? 1 : 0);
    const firstPopulated = sorted.find(a => (a.templates?.length || 0) > 0);
    setActivePlatformId(firstPopulated?.id || sorted[0]?.id || null);
  }, [socialAssets, activePlatformId]);

  const updateSocialAsset = (id: string, updates: Partial<BrandSocialAssetSpec>) => {
    if (!onSocialAssetsChange) return;
    onSocialAssetsChange(socialAssets.map(a => a.id === id ? { ...a, ...updates } : a));
    if (selectedPlatform?.id === id) {
      setSelectedPlatform({ ...selectedPlatform, ...updates });
    }
  };

  const deleteSocialAsset = (id: string) => {
    if (!onSocialAssetsChange) return;
    onSocialAssetsChange(socialAssets.filter(a => a.id !== id));
    if (selectedPlatform?.id === id) setSelectedPlatform(null);
  };

  const addSocialAsset = (preset?: BrandSocialAssetSpec) => {
    if (!onSocialAssetsChange) return;
    const newAsset: BrandSocialAssetSpec = preset
      ? { ...preset, id: safeUUID(), templates: [] }
      : { id: safeUUID(), platform: 'LinkedIn', postSize: '1200 x 627 px', altSize: '', textLegibility: '', directive: '', templates: [], previewImageUrl: platformDefaultImages['LinkedIn'] };
    onSocialAssetsChange([...socialAssets, newAsset]);
    if (!preset) setSelectedPlatform(newAsset);
  };

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Social Assets & Guidelines"
            defaultSubtitle="Platform specifications, safe zones, and design templates"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {onLayoutChange && (
          <LayoutSelector
            value={layout}
            onChange={onLayoutChange}
            availableLayouts={['grid-2', 'grid-3', 'grid-4', 'large-cards']}
            size="sm"
          />
        )}
      </div>

      {/* Social Platforms - Horizontal Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Social Platforms
            <Badge variant="secondary" className="text-[10px]">{socialAssets.length}</Badge>
          </h3>
          {canEditSocial && (
            <div className="flex gap-2">
              <Select onValueChange={(platform) => {
                const preset = platformPresets.find(p => p.platform === platform);
                if (preset) addSocialAsset(preset);
              }}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Add platform..." />
                </SelectTrigger>
                <SelectContent>
                  {platformPresets.filter(p => !socialAssets.some(a => a.platform === p.platform)).map((preset) => {
                    const Icon = platformIcons[preset.platform] || Monitor;
                    return (
                      <SelectItem key={preset.platform} value={preset.platform}>
                        <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{preset.platform}</div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Horizontal platform pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {[...socialAssets].sort((a, b) => a.platform === 'General' ? -1 : b.platform === 'General' ? 1 : 0).map((asset) => {
            const IconComponent = platformIcons[asset.platform] || Monitor;
            const isActive = activePlatformId === asset.id;
            const templateCount = getResolvedTemplates(asset).length;
            return (
              <button
                key={asset.id}
                onClick={() => setActivePlatformId(isActive ? null : asset.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                )}
              >
                <IconComponent className="h-4 w-4" />
                {asset.platform}
                {templateCount > 0 && (
                  <Badge variant={isActive ? "outline" : "secondary"} className={cn("text-[10px] px-1.5 py-0", isActive && "border-primary-foreground/30 text-primary-foreground")}>
                    {templateCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Active platform content */}
        {(() => {
          const rawPlatform = socialAssets.find(a => a.id === activePlatformId);
          // Merge with preset defaults so size specs are always available
          const presetDefaults = platformPresets.find(p => p.platform === rawPlatform?.platform);
          const activePlatform = rawPlatform ? {
            ...presetDefaults,
            ...rawPlatform,
            postSize: rawPlatform.postSize || presetDefaults?.postSize || '',
            altSize: rawPlatform.altSize || presetDefaults?.altSize || '',
            storySize: rawPlatform.storySize || presetDefaults?.storySize || '',
            reelSize: rawPlatform.reelSize || presetDefaults?.reelSize || '',
            coverSize: rawPlatform.coverSize || presetDefaults?.coverSize || '',
            textLegibility: rawPlatform.textLegibility || presetDefaults?.textLegibility || '',
            directive: rawPlatform.directive || presetDefaults?.directive || '',
          } : null;
          if (!activePlatform) return (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Select a platform above to view specs and templates
            </div>
          );
          
          const IconComponent = platformIcons[activePlatform.platform] || Monitor;
          

          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Platform header with specs */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Hero area */}
                <div className="relative h-32 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 overflow-hidden">
                  {activePlatform.previewImageUrl && (
                    <img src={activePlatform.previewImageUrl} alt={activePlatform.platform} className="w-full h-full object-cover opacity-40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{activePlatform.platform}</h4>
                      <p className="text-xs text-muted-foreground">{activePlatform.directive?.slice(0, 80)}{(activePlatform.directive?.length || 0) > 80 ? '...' : ''}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      onClick={() => setMockupPreviewPlatform(activePlatform)}
                      className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background border border-border/50 transition-colors"
                      title="View Mockup"
                    >
                      <Eye className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <button
                      onClick={() => setSelectedPlatform(activePlatform)}
                      className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background border border-border/50 transition-colors"
                      title="Edit Details"
                    >
                      <Pencil className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    {canEditSocial && (
                      <button
                        onClick={() => deleteSocialAsset(activePlatform.id)}
                        className="p-2 rounded-lg bg-destructive/80 backdrop-blur-sm hover:bg-destructive transition-colors"
                        title="Delete Platform"
                      >
                        <X className="h-3.5 w-3.5 text-destructive-foreground" />
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Platform Sizing Specs Reference */}
              <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {activePlatform.platform} Size Reference
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { label: 'Post', value: activePlatform.postSize },
                    { label: 'Alt / Landscape', value: activePlatform.altSize },
                    { label: 'Story', value: activePlatform.storySize },
                    { label: 'Reel / Short', value: activePlatform.reelSize },
                    { label: 'Cover / Banner', value: activePlatform.coverSize },
                  ].filter(s => s.value && s.value !== 'N/A').map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border/50">
                      <span className="text-xs font-medium text-muted-foreground">{spec.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">{spec.value}</Badge>
                    </div>
                  ))}
                </div>
                {activePlatform.textLegibility && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    <Type className="h-3 w-3 shrink-0" />
                    <span>{activePlatform.textLegibility}</span>
                  </div>
                )}
                {activePlatform.directive && (
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{activePlatform.directive}</p>
                )}
              </div>

              {/* Template cards grouped by size category */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Templates by Size</h3>
                  <LayoutSelector
                    value={cardLayout}
                    onChange={setCardLayout}
                    availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list', 'large-cards']}
                    size="sm"
                  />
                </div>
                {(() => {
                  const allTemplates = getResolvedTemplates(activePlatform);
                  
                  // Consistent size categories across all platforms
                   const sizeCategories: { key: string; label: string; spec: string }[] = [
                     { key: 'post', label: 'Post', spec: activePlatform.postSize && activePlatform.postSize !== 'N/A' ? activePlatform.postSize : '' },
                     { key: 'square', label: 'Square', spec: (activePlatform as any).squareSize && (activePlatform as any).squareSize !== 'N/A' ? (activePlatform as any).squareSize : (activePlatform.platform === 'General' ? '1080 x 1080 px (1:1)' : '') },
                     { key: 'cover', label: 'Cover / Banner', spec: (activePlatform.coverSize || activePlatform.altSize) && (activePlatform.coverSize || activePlatform.altSize) !== 'N/A' ? (activePlatform.coverSize || activePlatform.altSize || '') : '' },
                     { key: 'story', label: 'Story', spec: activePlatform.storySize && activePlatform.storySize !== 'N/A' ? activePlatform.storySize : '' },
                     { key: 'reel', label: 'Reel / Short', spec: activePlatform.reelSize && activePlatform.reelSize !== 'N/A' ? activePlatform.reelSize : '' },
                   ];

                  // Add "Other" if there are uncategorized templates
                  const categorizedKeys = new Set(sizeCategories.map(c => c.key));
                  const hasOther = allTemplates.some(t => !t.sizeCategory || !categorizedKeys.has(t.sizeCategory));
                  if (hasOther && allTemplates.length > 0) {
                    sizeCategories.push({ key: 'other', label: 'Other', spec: 'Custom sizes' });
                  }

                  return sizeCategories.map((category) => {
                    const categoryTemplates = allTemplates.filter(t => 
                      t.sizeCategory === category.key || 
                      (!t.sizeCategory && category.key === 'other') ||
                      (t.sizeCategory && !categorizedKeys.has(t.sizeCategory) && category.key === 'other')
                    );

                    return (
                      <SizeCategorySection
                        key={category.key}
                        category={category}
                        categoryTemplates={categoryTemplates}
                        activePlatform={activePlatform}
                        canEditSocial={canEditSocial}
                        entityId={entityId}
                        updateSocialAsset={updateSocialAsset}
                        uploadFile={uploadFile}
                        cardGridClass={cardGridClass}
                        brandLogos={brandLogos}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          );
        })()}
      </div>


      {/* Detail Modals */}
      <PlatformDetailModal
        asset={selectedPlatform}
        open={!!selectedPlatform}
        onOpenChange={(open) => !open && setSelectedPlatform(null)}
        onUpdate={updateSocialAsset}
        entityId={entityId}
        entityType={entityType}
      />

      {/* Mockup Preview Dialog */}
      <SocialMockupPreviewDialog
        asset={mockupPreviewPlatform}
        open={!!mockupPreviewPlatform}
        onOpenChange={(open) => !open && setMockupPreviewPlatform(null)}
        brandName={customSubtitle?.split(' ')[0] || 'Your Brand'}
      />
    </section>
  );
};
