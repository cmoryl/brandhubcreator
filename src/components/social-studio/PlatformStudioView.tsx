/**
 * Main studio view for a selected platform - shows realistic mockup + placement grid
 */
import { useState, useMemo } from 'react';
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
import { SocialAssetPlacement } from '@/hooks/useSocialAssetPlacements';

type StudioFormat = 'feed' | 'story' | 'reel' | 'cover' | 'profile';

const formatConfig: { id: StudioFormat; label: string; icon: React.ElementType }[] = [
  { id: 'feed', label: 'Feed Posts', icon: LayoutGrid },
  { id: 'story', label: 'Stories', icon: Smartphone },
  { id: 'reel', label: 'Reels / Shorts', icon: Film },
  { id: 'cover', label: 'Covers & Banners', icon: ImageIcon },
  { id: 'profile', label: 'Profile', icon: User },
];

interface PlatformStudioViewProps {
  platform: SocialPlatform;
  placements: SocialAssetPlacement[];
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId: string;
  brandName: string;
  brandLogoUrl?: string;
  isAdmin: boolean;
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
  const [previewSize, setPreviewSize] = useState<PlatformSizeSpec | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

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
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
            }}
          >
            <span className="text-white text-2xl font-bold">{platform.charAt(0)}</span>
          </div>
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
                    <div className="flex justify-center p-6 bg-muted/30 rounded-2xl border border-border/50 overflow-x-auto">
                      <div className={cn(
                        "transform origin-center",
                        (fmt === 'cover' || fmt === 'profile') && deviceMode === 'desktop' ? "scale-[0.75]" : "scale-90"
                      )}>
                        {renderMockup(platform, fmt, sizes[0], mockupImage, brandName, deviceMode, brandLogoUrl)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Asset placement grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Asset Placements ({sizes.length})
                    </h3>
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
                            organizationId={organizationId}
                            onUpload={(url) => onUpload(platform, fmt, size, url)}
                            onApprove={() => existingPlacement && onApprove(existingPlacement.id)}
                            onDelete={() => existingPlacement && onDelete(existingPlacement.id)}
                            onSaveToGuide={existingPlacement?.image_url && onSaveToGuide ? () => onSaveToGuide(platform, fmt, size, existingPlacement.image_url!) : undefined}
                            onPreview={() => setPreviewSize(size)}
                            isAdmin={isAdmin}
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
