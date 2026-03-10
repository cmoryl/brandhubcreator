/**
 * Main studio view for a selected platform - shows realistic mockup + placement grid
 */
import { useState, useMemo, useEffect } from 'react';
import { Tv, Smartphone, Film, LayoutGrid, Image as ImageIcon, User, Monitor, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  platformConfigs,
  SocialPlatform,
  PlatformSizeSpec,
} from '@/components/brand/social-mockups/types';
import {
  InstagramMockup,
  LinkedInMockup,
  TwitterMockup,
  FacebookMockup,
  YouTubeMockup,
  TikTokMockup,
  PinterestMockup,
  ThreadsMockup,
} from '@/components/brand/social-mockups';
import { PlacementCard } from './PlacementCard';
import { ProfilePageMockup, DeviceMode } from './ProfilePageMockups';
import { ProfileImagePicker } from './ProfileImagePicker';
import { TemplateLibrary } from './TemplateLibrary';
import { SocialAssetPlacement } from '@/hooks/useSocialAssetPlacements';
import { SocialTemplate } from '@/lib/socialTemplates';

type StudioFormat = 'feed' | 'story' | 'reel' | 'cover' | 'profile';

const formatConfig: { id: StudioFormat; label: string; icon: React.ElementType }[] = [
  { id: 'feed', label: 'Feed Posts', icon: LayoutGrid },
  { id: 'story', label: 'Stories', icon: Smartphone },
  { id: 'reel', label: 'Reels / Shorts', icon: Film },
  { id: 'cover', label: 'Covers & Banners', icon: ImageIcon },
  { id: 'profile', label: 'Profile', icon: User },
];

interface BrandContext {
  name?: string;
  colors?: Array<{ name: string; hex: string; role?: string }>;
  typography?: Array<{ family: string; weight?: string; usage?: string }>;
  archetype?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  logos?: Array<{ url?: string; name?: string }>;
}

interface PlatformStudioViewProps {
  platform: SocialPlatform;
  placements: SocialAssetPlacement[];
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId: string;
  brandName: string;
  brandLogoUrl?: string;
  isAdmin: boolean;
  brandContext?: BrandContext;
  onUpload: (platform: string, format: string, sizeSpec: PlatformSizeSpec, imageUrl: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveToGuide?: (platform: string, format: string, sizeSpec: PlatformSizeSpec, imageUrl: string) => void;
}

// Map format to matching sizes - expand beyond just feed/story/reel
function getSizesForFormat(platform: SocialPlatform, format: StudioFormat): PlatformSizeSpec[] {
  const config = platformConfigs[platform];
  if (!config) return [];

  switch (format) {
    case 'feed':
      return config.sizes.feed.filter(s => 
        !s.name.toLowerCase().includes('cover') && 
        !s.name.toLowerCase().includes('banner') &&
        !s.name.toLowerCase().includes('header') &&
        !s.name.toLowerCase().includes('icon') &&
        !s.name.toLowerCase().includes('profile')
      );
    case 'story':
      return config.sizes.story || [];
    case 'reel':
      return config.sizes.reel || [];
    case 'cover':
      return config.sizes.feed.filter(s =>
        s.name.toLowerCase().includes('cover') ||
        s.name.toLowerCase().includes('banner') ||
        s.name.toLowerCase().includes('header') ||
        s.name.toLowerCase().includes('channel') ||
        s.name.toLowerCase().includes('end screen')
      );
    case 'profile':
      return config.sizes.feed.filter(s =>
        s.name.toLowerCase().includes('icon') ||
        s.name.toLowerCase().includes('profile') ||
        s.name.toLowerCase().includes('avatar') ||
        s.name.toLowerCase().includes('photo')
      );
    default:
      return [];
  }
}

function getAvailableFormats(platform: SocialPlatform): StudioFormat[] {
  const config = platformConfigs[platform];
  if (!config) return ['feed'];

  const formats: StudioFormat[] = ['feed'];
  if (config.supportsStory && config.sizes.story?.length) formats.push('story');
  if (config.supportsReel && config.sizes.reel?.length) formats.push('reel');
  
  // Check for cover/banner sizes
  const hasCoverSizes = config.sizes.feed.some(s =>
    s.name.toLowerCase().includes('cover') ||
    s.name.toLowerCase().includes('banner') ||
    s.name.toLowerCase().includes('header') ||
    s.name.toLowerCase().includes('channel')
  );
  if (hasCoverSizes) formats.push('cover');

  // Check for profile sizes
  const hasProfileSizes = config.sizes.feed.some(s =>
    s.name.toLowerCase().includes('icon') ||
    s.name.toLowerCase().includes('profile') ||
    s.name.toLowerCase().includes('avatar') ||
    s.name.toLowerCase().includes('photo')
  );
  if (hasProfileSizes) formats.push('profile');

  return formats;
}

const renderMockup = (platform: SocialPlatform, format: string, sizeSpec: PlatformSizeSpec, imageUrl?: string, brandName?: string, deviceMode?: DeviceMode, brandLogoUrl?: string) => {
  const handle = (brandName || 'Brand').toLowerCase().replace(/\s+/g, '');
  
  // For cover/profile formats, render the full profile page mockup
  if (format === 'cover' || format === 'profile') {
    const isCover = sizeSpec?.name?.toLowerCase().includes('cover') || 
                    sizeSpec?.name?.toLowerCase().includes('banner') || 
                    sizeSpec?.name?.toLowerCase().includes('header') ||
                    sizeSpec?.name?.toLowerCase().includes('channel');
    return (
      <ProfilePageMockup
        platform={platform}
        coverImageUrl={isCover ? imageUrl : undefined}
        profileImageUrl={!isCover ? imageUrl : brandLogoUrl}
        brandName={brandName || 'Brand'}
        handle={handle}
        sizeSpec={sizeSpec}
        deviceMode={deviceMode || 'desktop'}
        defaultProfileImageUrl={brandLogoUrl}
      />
    );
  }

  const mockupFormat = format;
  const props = {
    imageUrl,
    profileImageUrl: brandLogoUrl,
    brandName: brandName || 'Brand',
    handle,
    format: mockupFormat as any,
    sizeSpec,
  };

  switch (platform) {
    case 'Instagram': return <InstagramMockup {...props} />;
    case 'LinkedIn': return <LinkedInMockup {...props} />;
    case 'X (Twitter)': return <TwitterMockup {...props} />;
    case 'Facebook': return <FacebookMockup {...props} />;
    case 'YouTube': return <YouTubeMockup {...props} />;
    case 'TikTok': return <TikTokMockup {...props} />;
    case 'Pinterest': return <PinterestMockup {...props} />;
    case 'Threads': return <ThreadsMockup {...props} />;
    default: return null;
  }
};

export const PlatformStudioView = ({
  platform,
  placements,
  entityId,
  entityType,
  organizationId,
  brandName,
  brandLogoUrl,
  isAdmin,
  brandContext,
  onUpload,
  onApprove,
  onDelete,
  onSaveToGuide,
}: PlatformStudioViewProps) => {
  const config = platformConfigs[platform];
  const availableFormats = useMemo(() => getAvailableFormats(platform), [platform]);
  const [activeFormat, setActiveFormat] = useState<StudioFormat>('feed');
  const [customProfileImage, setCustomProfileImage] = useState<string | undefined>(undefined);
  
  // Use custom profile image if set, otherwise fall back to brand logo
  const effectiveProfileImage = customProfileImage || brandLogoUrl;
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [selectedTemplate, setSelectedTemplate] = useState<SocialTemplate | null>(null);

  // Clear template selection when platform or format changes
  useEffect(() => {
    setSelectedTemplate(null);
  }, [platform, activeFormat]);

  const currentSizes = useMemo(() => getSizesForFormat(platform, activeFormat), [platform, activeFormat]);
  
  // Get the first size for the live mockup preview
  const mockupPreviewSize = currentSizes[0] || config?.sizes.feed[0];

  // Find a placement that has an image for the mockup preview
  const mockupImage = useMemo(() => {
    const p = placements.find(
      pl => pl.platform === platform && pl.format === activeFormat && pl.image_url
    );
    return p?.image_url || undefined;
  }, [placements, platform, activeFormat]);

  // Ensure active format is valid for current platform
  if (!availableFormats.includes(activeFormat) && availableFormats.length > 0) {
    setActiveFormat(availableFormats[0]);
  }

  if (!config) return <div className="text-muted-foreground p-8">Platform not found</div>;

  const approvedCount = placements.filter(p => p.platform === platform && p.status === 'approved').length;
  const totalSlots = Object.values(config.sizes).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Platform header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ProfileImagePicker
            currentImage={customProfileImage}
            brandLogoUrl={brandLogoUrl}
            entityId={entityId}
            entityType={entityType}
            organizationId={organizationId}
            onSelect={setCustomProfileImage}
          />
          <div>
            <h2 className="text-2xl font-bold">{platform}</h2>
            <p className="text-sm text-muted-foreground">
              {approvedCount} / {totalSlots} placements approved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Feed: {config.feedAspectRatio}
          </Badge>
          {config.supportsStory && (
            <Badge variant="outline" className="text-xs">
              Story: {config.storyAspectRatio}
            </Badge>
          )}
          {config.supportsReel && (
            <Badge variant="outline" className="text-xs">
              Reel: {config.reelAspectRatio}
            </Badge>
          )}
        </div>
      </div>

      {/* Format tabs */}
      <Tabs value={activeFormat} onValueChange={(v) => setActiveFormat(v as StudioFormat)}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableFormats.length}, 1fr)` }}>
          {availableFormats.map((fmt) => {
            const fmtConfig = formatConfig.find(f => f.id === fmt)!;
            const FmtIcon = fmtConfig.icon;
            return (
              <TabsTrigger key={fmt} value={fmt} className="gap-2">
                <FmtIcon className="h-4 w-4" />
                {fmtConfig.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {availableFormats.map((fmt) => {
          const sizes = getSizesForFormat(platform, fmt);
          return (
            <TabsContent key={fmt} value={fmt} className="mt-6">
              {sizes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium mb-1">No {formatConfig.find(f => f.id === fmt)?.label} formats</p>
                  <p className="text-sm">{platform} doesn't support this format</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Live mockup preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Live Preview
                      </h3>
                      {(fmt === 'cover' || fmt === 'profile') && (
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          {([
                            { mode: 'desktop' as DeviceMode, icon: Monitor, label: 'Desktop' },
                            { mode: 'tablet' as DeviceMode, icon: Tablet, label: 'Tablet' },
                            { mode: 'mobile' as DeviceMode, icon: Smartphone, label: 'Mobile' },
                          ]).map(({ mode, icon: Icon, label }) => (
                            <Button
                              key={mode}
                              variant={deviceMode === mode ? 'secondary' : 'ghost'}
                              size="sm"
                              className={cn("h-7 px-2.5 gap-1.5 text-xs", deviceMode === mode && "shadow-sm")}
                              onClick={() => setDeviceMode(mode)}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{label}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex justify-center p-6 bg-muted/30 rounded-2xl border border-border/50 overflow-x-auto">
                      <div className={cn(
                        "transform origin-center",
                        (fmt === 'cover' || fmt === 'profile') && deviceMode === 'desktop' ? "scale-[0.75]" : "scale-90"
                      )}>
                        {renderMockup(platform, fmt, sizes[0], mockupImage, brandName, deviceMode, effectiveProfileImage)}
                      </div>
                      {/* Template overlay on live preview */}
                      {selectedTemplate && (
                        <div className="absolute inset-6 pointer-events-none z-10 rounded-xl overflow-hidden">
                          <div className="relative w-full h-full">
                            {selectedTemplate.zones.map((zone, i) => {
                              const zoneTypeColors: Record<string, string> = {
                                image: 'border-sky-500/60 bg-sky-500/10',
                                text: 'border-violet-500/60 bg-violet-500/10',
                                logo: 'border-emerald-500/60 bg-emerald-500/10',
                                cta: 'border-amber-500/60 bg-amber-500/10',
                              };
                              const zoneLabelColors: Record<string, string> = {
                                image: 'text-sky-600 dark:text-sky-300',
                                text: 'text-violet-600 dark:text-violet-300',
                                logo: 'text-emerald-600 dark:text-emerald-300',
                                cta: 'text-amber-600 dark:text-amber-300',
                              };
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    'absolute border-2 border-dashed rounded flex items-center justify-center',
                                    zoneTypeColors[zone.type] || 'border-border bg-muted/20',
                                  )}
                                  style={{
                                    left: `${zone.x}%`,
                                    top: `${zone.y}%`,
                                    width: `${zone.width}%`,
                                    height: `${zone.height}%`,
                                  }}
                                >
                                  <span className={cn(
                                    'text-[10px] font-semibold text-center px-1 truncate drop-shadow-sm',
                                    zoneLabelColors[zone.type] || 'text-muted-foreground',
                                  )}>
                                    {zone.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-md border border-border shadow-sm">
                            Template: {selectedTemplate.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Asset placement grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Asset Placements ({sizes.length})
                    </h3>

                    {/* Template Library */}
                    <TemplateLibrary
                      platform={platform}
                      format={fmt}
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={setSelectedTemplate}
                      aspectRatio={sizes[0] ? sizes[0].width / sizes[0].height : 1}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sizes.map((size) => {
                        const existingPlacement = placements.find(
                          p => p.platform === platform && p.format === fmt && p.size_name === size.name
                        );
                        return (
                          <PlacementCard
                            key={`${platform}-${fmt}-${size.name}`}
                            platform={platform}
                            format={fmt}
                            sizeSpec={size}
                            placement={existingPlacement}
                            entityId={entityId}
                            entityType={entityType}
                            organizationId={organizationId}
                            onUpload={(url) => onUpload(platform, fmt, size, url)}
                            onApprove={() => existingPlacement && onApprove(existingPlacement.id)}
                            onDelete={() => existingPlacement && onDelete(existingPlacement.id)}
                            onSaveToGuide={existingPlacement?.image_url && onSaveToGuide ? () => onSaveToGuide(platform, fmt, size, existingPlacement.image_url!) : undefined}
                            onPreview={() => {}}
                            isAdmin={isAdmin}
                            brandContext={brandContext}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
