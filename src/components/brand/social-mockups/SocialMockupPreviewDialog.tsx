import { useState, useMemo } from 'react';
import { Instagram, Linkedin, Twitter, Facebook, Youtube, Monitor, Image as ImageIcon, Smartphone, Tv, Film, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { BrandSocialAssetSpec } from '@/types/brand';
import { 
  InstagramMockup, 
  LinkedInMockup, 
  TwitterMockup, 
  FacebookMockup, 
  YouTubeMockup, 
  TikTokMockup, 
  PinterestMockup, 
  ThreadsMockup,
  platformConfigs,
  SocialPlatform,
  PostFormat,
  PlatformSizeSpec
} from './index';

interface SocialMockupPreviewDialogProps {
  asset: BrandSocialAssetSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName?: string;
}

const platformIcons: Record<string, React.ElementType> = {
  'LinkedIn': Linkedin,
  'X': Twitter,
  'X (Twitter)': Twitter,
  'Instagram': Instagram,
  'Facebook': Facebook,
  'YouTube': Youtube,
  'TikTok': Monitor,
  'Pinterest': ImageIcon,
  'Threads': Monitor,
};

const formatIcons: Record<PostFormat, React.ElementType> = {
  'feed': Tv,
  'story': Smartphone,
  'reel': Film,
};

const formatLabels: Record<PostFormat, string> = {
  'feed': 'Feed Post',
  'story': 'Story',
  'reel': 'Reel / Short',
};

export const SocialMockupPreviewDialog = ({
  asset,
  open,
  onOpenChange,
  brandName = 'Your Brand',
}: SocialMockupPreviewDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>('feed');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const platformConfig = useMemo(() => {
    if (!asset) return null;
    return platformConfigs[asset.platform as SocialPlatform] || null;
  }, [asset]);

  const availableFormats = useMemo((): PostFormat[] => {
    if (!platformConfig) return ['feed'];
    const formats: PostFormat[] = ['feed'];
    if (platformConfig.supportsStory) formats.push('story');
    if (platformConfig.supportsReel) formats.push('reel');
    return formats;
  }, [platformConfig]);

  const availableSizes = useMemo((): PlatformSizeSpec[] => {
    if (!platformConfig) return [];
    const formatSizes = platformConfig.sizes[selectedFormat];
    return formatSizes || platformConfig.sizes.feed || [];
  }, [platformConfig, selectedFormat]);

  // Reset to feed and first size when opening a new platform
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedFormat('feed');
      setSelectedSizeIndex(0);
    }
    onOpenChange(isOpen);
  };

  // Reset size index when format changes
  const handleFormatChange = (format: PostFormat) => {
    setSelectedFormat(format);
    setSelectedSizeIndex(0);
  };

  if (!asset) return null;

  const IconComponent = platformIcons[asset.platform] || Monitor;
  const handle = brandName.toLowerCase().replace(/\s+/g, '');
  const currentSize = availableSizes[selectedSizeIndex];

  const renderMockup = () => {
    const props = {
      imageUrl: asset.previewImageUrl,
      profileImageUrl: asset.profileIconUrl,
      brandName,
      handle,
      format: selectedFormat,
      sizeSpec: currentSize,
    };

    switch (asset.platform) {
      case 'Instagram':
        return <InstagramMockup {...props} />;
      case 'LinkedIn':
        return <LinkedInMockup {...props} />;
      case 'X':
      case 'X (Twitter)':
        return <TwitterMockup {...props} />;
      case 'Facebook':
        return <FacebookMockup {...props} />;
      case 'YouTube':
        return <YouTubeMockup {...props} />;
      case 'TikTok':
        return <TikTokMockup {...props} />;
      case 'Pinterest':
        return <PinterestMockup {...props} />;
      case 'Threads':
        return <ThreadsMockup {...props} />;
      default:
        return (
          <div className="w-[320px] aspect-square bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Preview not available</span>
          </div>
        );
    }
  };

  const getSizeInfo = () => {
    switch (selectedFormat) {
      case 'story':
        return asset.storySize || '1080 x 1920 px';
      case 'reel':
        return asset.reelSize || '1080 x 1920 px';
      default:
        return asset.postSize || '1080 x 1080 px';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: platformConfig 
                  ? `linear-gradient(135deg, ${platformConfig.primaryColor}, ${platformConfig.secondaryColor})`
                  : 'var(--primary)'
              }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold">{asset.platform}</span>
              <p className="text-sm font-normal text-muted-foreground">Live Preview Mockup</p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview how your content will appear on {asset.platform} in different formats and sizes.
          </DialogDescription>
        </DialogHeader>

        {/* Format selector tabs */}
        <div className="flex-shrink-0 border-b border-border pb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-2">Format:</span>
            {availableFormats.map((format) => {
              const FormatIcon = formatIcons[format];
              const isActive = selectedFormat === format;
              return (
                <Button
                  key={format}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFormatChange(format)}
                  className={cn(
                    'gap-2 transition-all',
                    isActive && 'ring-2 ring-primary/20'
                  )}
                >
                  <FormatIcon className="h-4 w-4" />
                  {formatLabels[format]}
                </Button>
              );
            })}
          </div>
          
          {/* Size selector */}
          {availableSizes.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">
                <Layers className="h-4 w-4 inline mr-1" />
                Size:
              </span>
              <ScrollArea className="max-w-[600px]">
                <div className="flex gap-2">
                  {availableSizes.map((size, index) => {
                    const isActive = selectedSizeIndex === index;
                    return (
                      <Button
                        key={`${size.name}-${index}`}
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedSizeIndex(index)}
                        className={cn(
                          'text-xs whitespace-nowrap transition-all',
                          isActive && 'ring-2 ring-primary/20 bg-secondary'
                        )}
                      >
                        {size.name}
                        <span className="ml-1.5 text-muted-foreground">
                          ({size.aspectRatio})
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Mockup preview area */}
        <div className="flex-1 overflow-auto py-6">
          <div className="flex flex-col items-center gap-6">
            {/* Mockup */}
            <div className="relative">
              {/* Background pattern */}
              <div className="absolute inset-0 -m-8 bg-gradient-to-br from-muted/50 to-muted rounded-2xl" />
              <div className="relative">
                {renderMockup()}
              </div>
            </div>

            {/* Size info */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {currentSize && (
                <Badge variant="secondary" className="gap-2">
                  <ImageIcon className="h-3 w-3" />
                  {currentSize.width} x {currentSize.height} px
                </Badge>
              )}
              {currentSize && (
                <Badge variant="outline" className="gap-2">
                  {currentSize.name}
                </Badge>
              )}
              {selectedFormat !== 'feed' && (() => {
                const FormatIconComponent = formatIcons[selectedFormat];
                return (
                  <Badge variant="outline" className="gap-2">
                    <FormatIconComponent className="h-3 w-3" />
                    {formatLabels[selectedFormat]}
                  </Badge>
                );
              })()}
            </div>

            {/* Size description */}
            {currentSize?.description && (
              <p className="text-sm text-muted-foreground">{currentSize.description}</p>
            )}

            {/* Platform directive */}
            {asset.directive && (
              <div className="max-w-md text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Platform Directive</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{asset.directive}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
