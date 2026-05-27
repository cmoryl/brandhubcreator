/**
 * Pure helpers extracted from SocialAssetsSection.tsx.
 * No React, no state — safe to import anywhere.
 */
import { BrandLogo, BrandSocialAssetSpec, SocialAssetTemplate, SocialSizeCategory, SocialTemplateZone } from '@/types/brand';
import {
  getTemplateDefinitionForAsset,
  getTemplatePreviewImage,
  getTemplatesForPlatformFormat,
  TemplateZoneType,
} from '@/lib/socialTemplates';
import {
  getZoneMediaFit as sharedGetZoneMediaFit,
  pickDefaultBrandLogoUrl,
  findBackgroundZoneForLogo as sharedFindBackgroundZoneForLogo,
  autoMatchLogosForZones as sharedAutoMatchLogosForZones,
} from '@/lib/templateZonePipeline';

export const getGeneratedTemplatesForPlatform = (platform: string): SocialAssetTemplate[] => {
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

export const getResolvedTemplates = (asset: BrandSocialAssetSpec): SocialAssetTemplate[] => {
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

export const zonePreviewStyles: Record<TemplateZoneType, string> = {
  image: 'border-sky-400/80 bg-sky-500/15 text-sky-50',
  text: 'border-violet-400/80 bg-violet-500/15 text-violet-50',
  logo: 'border-emerald-400/80 bg-emerald-500/15 text-emerald-50',
  cta: 'border-amber-400/80 bg-amber-500/15 text-amber-50',
};

export const zoneTypeLabels: Record<TemplateZoneType, string> = {
  image: 'Imagery frame',
  text: 'Text layer',
  logo: 'Logo frame',
  cta: 'CTA layer',
};

export const clampZoneValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getZoneMediaFit = sharedGetZoneMediaFit;

export const getTemplateFormat = (template: Pick<SocialAssetTemplate, 'sourceTemplateFormat' | 'sizeCategory'>) => (
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

export const getSmartDefaultZoneFit = (
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

// pickDefaultBrandLogoUrl, sampleImageLuminance, detectAssetTransparency,
// resolveSvgIntrinsicSize, scoreLogoForBackground, describeBackgroundTone,
// pickBestBrandLogoForLuminance, looksLikeSvgUrl, looksLikeAlphaCapableRaster,
// loadImageElement, and renderZoneAtOriginalResolution are imported from
// '@/lib/templateZonePipeline'. Local aliases below preserve the original
// (SocialTemplateZone-typed) call sites without behavioural change.

export const findBackgroundZoneForLogo = (
  logoZone: SocialTemplateZone,
  zones: SocialTemplateZone[],
): SocialTemplateZone | null =>
  sharedFindBackgroundZoneForLogo(logoZone, zones);

export const autoMatchLogosForZones = (
  zones: SocialTemplateZone[],
  brandLogos: BrandLogo[] | undefined,
) => sharedAutoMatchLogosForZones(zones, brandLogos);

export const getEditableZones = (
  platform: string,
  template: SocialAssetTemplate,
  brandLogos?: BrandLogo[],
): SocialTemplateZone[] => {
  const defaultLogo = brandLogos?.find((logo) =>
    logo.variant === 'primary' && logo.url
  ) || brandLogos?.find((logo) => !!logo.url);
  const defaultLogoUrl = pickDefaultBrandLogoUrl(brandLogos);

  const hydrate = (zone: SocialTemplateZone): SocialTemplateZone => {
    if (zone.type !== 'image' && zone.type !== 'logo') return { ...zone };
    const next: SocialTemplateZone = {
      ...zone,
      mediaFit: zone.mediaFit || getSmartDefaultZoneFit(zone, template),
    };
    // Auto-fill empty logo zones with the brand's default logo so every size
    // ships with a real logo placement out of the box. We tag the zone as
    // auto-matched so the background-aware matcher can later swap to a better
    // variant once the surrounding background is known.
    if (zone.type === 'logo' && !next.mediaUrl && defaultLogoUrl) {
      next.mediaUrl = defaultLogoUrl;
      if (defaultLogo?.id) next.autoMatchedLogoId = defaultLogo.id;
    }
    return next;
  };

  if (template.templateZones?.length) {
    return template.templateZones.map(hydrate);
  }
  const templateDefinition = getTemplateDefinitionForAsset(platform, template);
  return (templateDefinition?.zones || []).map(hydrate);
};

export type SafeAreaGuide = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export const getSafeAreaGuide = (platform: string, template: SocialAssetTemplate): SafeAreaGuide => {
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

