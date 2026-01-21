import { useState } from 'react';
import { Plus, X, Pencil, Linkedin, Twitter, Instagram, Facebook, Youtube, Monitor, Smartphone } from 'lucide-react';
import { BrandSocialAssetSpec, BrandDisplayBannerSpec } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { LayoutPreset } from '@/types/brand';

interface SocialAssetsProps {
  socialAssets: BrandSocialAssetSpec[];
  onSocialAssetsChange: (assets: BrandSocialAssetSpec[]) => void;
  displayBanners: BrandDisplayBannerSpec[];
  onDisplayBannersChange: (banners: BrandDisplayBannerSpec[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

const platformIcons: Record<string, React.ElementType> = {
  'LinkedIn': Linkedin,
  'X (Twitter)': Twitter,
  'Instagram': Instagram,
  'Facebook': Facebook,
  'YouTube': Youtube,
  'TikTok': Monitor,
};

const platformPresets: BrandSocialAssetSpec[] = [
  {
    id: crypto.randomUUID(),
    platform: 'LinkedIn',
    postSize: '1200 x 627 px',
    altSize: '1584 x 396 px',
    textLegibility: '24pt for Headlines, 14pt for Body',
    directive: 'Center 1200px (Avoid edges for text)',
  },
  {
    id: crypto.randomUUID(),
    platform: 'X (Twitter)',
    postSize: '1600 x 900 px',
    altSize: '1500 x 500 px',
    textLegibility: '32pt for Headlines, 18pt for Body',
    directive: 'Center 1000px horizontally',
  },
  {
    id: crypto.randomUUID(),
    platform: 'Instagram',
    postSize: '1080 x 1080 px (1:1)',
    altSize: 'N/A (Grid Focus)',
    textLegibility: '48pt for Stories, 24pt for Posts',
    directive: 'Keep text within inner 80% to avoid UI overlays',
  },
  {
    id: crypto.randomUUID(),
    platform: 'Facebook',
    postSize: '1200 x 630 px',
    altSize: '820 x 312 px',
    textLegibility: '30pt for Headlines, 16pt for Body',
    directive: 'Center 640px to accommodate mobile crop',
  },
];

const bannerPresets: BrandDisplayBannerSpec[] = [
  {
    id: crypto.randomUUID(),
    name: 'Medium Rectangle',
    dimensions: '300 x 250 px',
    maxMessaging: '12 Words',
    textLegibility: '12pt Min',
    safeZonePolicy: '15px padding from all edges',
    aspectRatio: 1.2,
  },
  {
    id: crypto.randomUUID(),
    name: 'Leaderboard',
    dimensions: '728 x 90 px',
    maxMessaging: '15 Words',
    textLegibility: '14pt Min',
    safeZonePolicy: 'Center 90%. (Avoid 36px from left/right)',
    aspectRatio: 8.09,
  },
  {
    id: crypto.randomUUID(),
    name: 'Wide Skyscraper',
    dimensions: '160 x 600 px',
    maxMessaging: '10 Words',
    textLegibility: '14pt Min',
    safeZonePolicy: '10px horizontal padding, avoid bottom 50px',
    aspectRatio: 0.27,
  },
  {
    id: crypto.randomUUID(),
    name: 'Large Rectangle',
    dimensions: '336 x 280 px',
    maxMessaging: '15 Words',
    textLegibility: '14pt Min',
    safeZonePolicy: '20px padding from all edges',
    aspectRatio: 1.2,
  },
  {
    id: crypto.randomUUID(),
    name: 'Billboard',
    dimensions: '970 x 250 px',
    maxMessaging: '20 Words',
    textLegibility: '18pt Min',
    safeZonePolicy: 'Center 800px horizontally',
    aspectRatio: 3.88,
  },
  {
    id: crypto.randomUUID(),
    name: 'Mobile Leaderboard',
    dimensions: '320 x 50 px',
    maxMessaging: '6 Words',
    textLegibility: '11pt Min',
    safeZonePolicy: 'Logo on left, 10px text padding',
    aspectRatio: 6.4,
  },
];

export const SocialAssetsSection = ({
  socialAssets,
  onSocialAssetsChange,
  displayBanners,
  onDisplayBannersChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-2',
  onLayoutChange,
}: SocialAssetsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { gridClass } = useLayoutClasses(layout);

  const addSocialAsset = (preset?: BrandSocialAssetSpec) => {
    const newAsset: BrandSocialAssetSpec = preset
      ? { ...preset, id: crypto.randomUUID() }
      : {
          id: crypto.randomUUID(),
          platform: 'LinkedIn',
          postSize: '1200 x 627 px',
          altSize: '',
          textLegibility: '',
          directive: '',
        };
    onSocialAssetsChange([...socialAssets, newAsset]);
    if (!preset) setEditingId(newAsset.id);
  };

  const updateSocialAsset = (id: string, updates: Partial<BrandSocialAssetSpec>) => {
    onSocialAssetsChange(socialAssets.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteSocialAsset = (id: string) => {
    onSocialAssetsChange(socialAssets.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addDisplayBanner = (preset?: BrandDisplayBannerSpec) => {
    const newBanner: BrandDisplayBannerSpec = preset
      ? { ...preset, id: crypto.randomUUID() }
      : {
          id: crypto.randomUUID(),
          name: 'Custom Banner',
          dimensions: '300 x 250 px',
          maxMessaging: '12 Words',
          textLegibility: '12pt Min',
          safeZonePolicy: '',
          aspectRatio: 1.2,
        };
    onDisplayBannersChange([...displayBanners, newBanner]);
    if (!preset) setEditingId(newBanner.id);
  };

  const updateDisplayBanner = (id: string, updates: Partial<BrandDisplayBannerSpec>) => {
    onDisplayBannersChange(displayBanners.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteDisplayBanner = (id: string) => {
    onDisplayBannersChange(displayBanners.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const getSafeZoneHeight = (aspectRatio: number) => {
    // Scale height based on aspect ratio, with min/max bounds
    if (aspectRatio > 4) return 'h-12'; // Wide banners
    if (aspectRatio > 2) return 'h-16';
    if (aspectRatio < 0.5) return 'h-48'; // Tall banners
    return 'h-28';
  };

  return (
    <section className="space-y-8">
      {/* Header with layout selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Social Assets & Guidelines"
            defaultSubtitle="Platform specifications, safe zones, and display banner rules"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'large-cards', 'list']}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Social Platform Protocols */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Social Platform Protocols
          </h3>
          <div className="flex gap-2">
            <Select onValueChange={(platform) => {
              const preset = platformPresets.find(p => p.platform === platform);
              if (preset) addSocialAsset(preset);
            }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Add preset..." />
              </SelectTrigger>
              <SelectContent>
                {platformPresets.map((preset) => (
                  <SelectItem key={preset.platform} value={preset.platform}>
                    {preset.platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addSocialAsset()} size="sm" variant="outline" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />
              Custom
            </Button>
          </div>
        </div>

        <div className={gridClass}>
          {socialAssets.map((asset, index) => {
            const IconComponent = platformIcons[asset.platform] || Monitor;
            const isEditing = editingId === asset.id;

            return (
              <div
                key={asset.id}
                className="group relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden animate-scale-in hover:border-primary/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    {isEditing ? (
                      <Select
                        value={asset.platform}
                        onValueChange={(platform) => updateSocialAsset(asset.id, { platform })}
                      >
                        <SelectTrigger className="h-7 text-xs w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(platformIcons).map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-semibold text-sm uppercase tracking-wide text-foreground">
                        {asset.platform} Protocol
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded text-muted-foreground">
                      {asset.altSize || asset.postSize.split(' ')[0]}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(isEditing ? null : asset.id)}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteSocialAsset(asset.id)}
                        className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safe Zone Preview */}
                <div className="px-4 py-4">
                  <div className="relative bg-muted/30 rounded-lg border border-dashed border-primary/30 h-28 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-4 border border-primary/40 rounded flex items-center justify-center">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-primary/60">
                        Safe Zone
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Post Size
                      </p>
                      {isEditing ? (
                        <Input
                          value={asset.postSize}
                          onChange={(e) => updateSocialAsset(asset.id, { postSize: e.target.value })}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{asset.postSize}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Text Legibility
                      </p>
                      {isEditing ? (
                        <Input
                          value={asset.textLegibility}
                          onChange={(e) => updateSocialAsset(asset.id, { textLegibility: e.target.value })}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{asset.textLegibility || '—'}</p>
                      )}
                    </div>
                  </div>

                  {/* Directive */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Directive
                    </p>
                    {isEditing ? (
                      <Textarea
                        value={asset.directive}
                        onChange={(e) => updateSocialAsset(asset.id, { directive: e.target.value })}
                        className="min-h-[60px] text-xs resize-none"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {asset.directive || 'No specific directive'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {socialAssets.length === 0 && (
            <button
              onClick={() => addSocialAsset(platformPresets[0])}
              className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors col-span-full"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add social platform protocol</span>
            </button>
          )}
        </div>
      </div>

      {/* Display Banner Specs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Industry Display Banner Specs
          </h3>
          <div className="flex gap-2">
            <Select onValueChange={(name) => {
              const preset = bannerPresets.find(p => p.name === name);
              if (preset) addDisplayBanner(preset);
            }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Add preset..." />
              </SelectTrigger>
              <SelectContent>
                {bannerPresets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addDisplayBanner()} size="sm" variant="outline" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />
              Custom
            </Button>
          </div>
        </div>

        <div className={gridClass}>
          {displayBanners.map((banner, index) => {
            const isEditing = editingId === banner.id;
            const safeZoneHeight = getSafeZoneHeight(banner.aspectRatio);

            return (
              <div
                key={banner.id}
                className="group relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden animate-scale-in hover:border-accent/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-accent" />
                    </div>
                    {isEditing ? (
                      <Input
                        value={banner.name}
                        onChange={(e) => updateDisplayBanner(banner.id, { name: e.target.value })}
                        className="h-7 text-xs w-[140px]"
                      />
                    ) : (
                      <span className="font-semibold text-sm uppercase tracking-wide text-foreground">
                        {banner.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded text-muted-foreground">
                      {banner.dimensions.replace(' px', '')}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(isEditing ? null : banner.id)}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteDisplayBanner(banner.id)}
                        className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safe Zone Preview */}
                <div className="px-4 py-4">
                  <div className={`relative bg-muted/30 rounded-lg border border-dashed border-accent/30 ${safeZoneHeight} flex items-center justify-center overflow-hidden`}>
                    <div 
                      className="border border-accent/40 rounded flex items-center justify-center"
                      style={{
                        width: banner.aspectRatio > 2 ? '60%' : banner.aspectRatio < 0.5 ? '50%' : '40%',
                        height: banner.aspectRatio > 2 ? '60%' : banner.aspectRatio < 0.5 ? '30%' : '50%',
                      }}
                    >
                      <span className="text-[9px] font-medium uppercase tracking-widest text-accent/60">
                        Safe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Max Messaging
                      </p>
                      {isEditing ? (
                        <Input
                          value={banner.maxMessaging}
                          onChange={(e) => updateDisplayBanner(banner.id, { maxMessaging: e.target.value })}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{banner.maxMessaging}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Text Legibility
                      </p>
                      {isEditing ? (
                        <Input
                          value={banner.textLegibility}
                          onChange={(e) => updateDisplayBanner(banner.id, { textLegibility: e.target.value })}
                          className="h-7 text-xs"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{banner.textLegibility}</p>
                      )}
                    </div>
                  </div>

                  {/* Safe Zone Policy */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Safe Zone Policy
                    </p>
                    {isEditing ? (
                      <Textarea
                        value={banner.safeZonePolicy}
                        onChange={(e) => updateDisplayBanner(banner.id, { safeZonePolicy: e.target.value })}
                        className="min-h-[60px] text-xs resize-none"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {banner.safeZonePolicy || 'No specific policy'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {displayBanners.length === 0 && (
            <button
              onClick={() => addDisplayBanner(bannerPresets[0])}
              className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors col-span-full"
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-sm font-medium">Add display banner spec</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
