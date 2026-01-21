import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, X, Pencil, Linkedin, Twitter, Instagram, Facebook, Youtube, Monitor, Smartphone, Download, ExternalLink, FileType, Link2, Figma, Upload, Image } from 'lucide-react';
import { BrandSocialAssetSpec, BrandDisplayBannerSpec, SocialAssetTemplate } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { LayoutPreset } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDropZone } from '@/components/ui/drop-zone';

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
  'Pinterest': Image,
  'Threads': Monitor,
  'Snapchat': Smartphone,
};

const fileTypeIcons: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'psd': { icon: FileType, color: 'text-blue-500', label: 'Photoshop' },
  'figma': { icon: Figma, color: 'text-purple-500', label: 'Figma' },
  'canva': { icon: FileType, color: 'text-cyan-500', label: 'Canva' },
  'ai': { icon: FileType, color: 'text-orange-500', label: 'Illustrator' },
  'sketch': { icon: FileType, color: 'text-yellow-500', label: 'Sketch' },
  'xd': { icon: FileType, color: 'text-pink-500', label: 'Adobe XD' },
  'other': { icon: FileType, color: 'text-muted-foreground', label: 'Other' },
};

// Platform brand colors for visual identification
const platformColors: Record<string, string> = {
  'LinkedIn': '#0A66C2',
  'X (Twitter)': '#000000',
  'Instagram': '#E4405F',
  'Facebook': '#1877F2',
  'YouTube': '#FF0000',
  'TikTok': '#000000',
  'Pinterest': '#BD081C',
  'Threads': '#000000',
  'Snapchat': '#FFFC00',
};

// Default background images for each platform
const platformDefaultImages: Record<string, string> = {
  'LinkedIn': '/images/social-defaults/linkedin-default.jpg',
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
    platform: 'X (Twitter)',
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
    platform: 'Instagram',
    postSize: '1080 x 1080 px (1:1)',
    altSize: '1080 x 566 px (Landscape)',
    storySize: '1080 x 1920 px (9:16)',
    reelSize: '1080 x 1920 px (9:16)',
    coverSize: 'N/A',
    textLegibility: '48pt for Stories, 24pt for Posts',
    directive: 'Keep text within inner 80% to avoid UI overlays. Stories: avoid top 150px (username) and bottom 200px (CTA buttons).',
    templates: [],
    previewImageUrl: '',
  },
  {
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

// Image upload component for social asset preview
const SocialAssetPreviewUpload = ({ 
  asset, 
  onUpdate 
}: { 
  asset: BrandSocialAssetSpec; 
  onUpdate: (updates: Partial<BrandSocialAssetSpec>) => void;
}) => {
  const handleFileDrop = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onUpdate({ previewImageUrl: url });
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const platformColor = platformColors[asset.platform] || '#6366f1';
  const defaultImage = platformDefaultImages[asset.platform];
  const isUsingDefaultImage = asset.previewImageUrl === defaultImage;

  const handleResetToDefault = () => {
    if (defaultImage) {
      onUpdate({ previewImageUrl: defaultImage });
    }
  };

  if (asset.previewImageUrl) {
    return (
      <div className="relative group/preview">
        <img 
          src={asset.previewImageUrl} 
          alt={`${asset.platform} example`}
          className="w-full h-32 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={openFilePicker}
            className="h-7 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Replace
          </Button>
          {!isUsingDefaultImage && defaultImage && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleResetToDefault}
              className="h-7 text-xs bg-white/10 border-white/20 hover:bg-white/20"
            >
              Reset
            </Button>
          )}
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onUpdate({ previewImageUrl: '' })}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        {/* Safe zone overlay */}
        <div className="absolute inset-4 border-2 border-dashed border-white/40 rounded pointer-events-none">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-medium uppercase tracking-widest text-white/60 bg-black/30 px-2 py-0.5 rounded">
            Safe Zone
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <button
      onClick={openFilePicker}
      onDragOver={dragHandlers.onDragOver}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={dragHandlers.onDrop}
      className={`relative w-full h-32 rounded-lg border-2 border-dashed transition-all overflow-hidden ${
        isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-border/50 hover:border-primary/50 bg-muted/30'
      }`}
    >
      {/* Platform-colored gradient background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          background: `linear-gradient(135deg, ${platformColor}40 0%, transparent 50%, ${platformColor}20 100%)` 
        }}
      />
      
      {/* Safe zone indicator */}
      <div className="absolute inset-4 border border-primary/30 rounded flex items-center justify-center">
        <div className="text-center">
          <Image className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {isDragging ? 'Drop Image' : 'Add Example'}
          </span>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </button>
  );
};

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
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [addingTemplateFor, setAddingTemplateFor] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<SocialAssetTemplate>>({});
  const { gridClass } = useLayoutClasses(layout);
  const hasInitialized = useRef(false);

  // Auto-populate with all platform presets on first render if empty
  useEffect(() => {
    if (!hasInitialized.current && socialAssets.length === 0) {
      hasInitialized.current = true;
      const presetsWithIds = platformPresets.map(preset => ({
        ...preset,
        id: crypto.randomUUID(),
        templates: [],
      }));
      onSocialAssetsChange(presetsWithIds);
    }
  }, [socialAssets.length, onSocialAssetsChange]);

  const toggleTemplateExpand = (id: string) => {
    const newSet = new Set(expandedTemplates);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTemplates(newSet);
  };

  // Initialize with all presets (manual button)
  const initializeWithPresets = () => {
    const presetsWithIds = platformPresets.map(preset => ({
      ...preset,
      id: crypto.randomUUID(),
      templates: [],
    }));
    onSocialAssetsChange(presetsWithIds);
  };

  const addSocialAsset = (preset?: BrandSocialAssetSpec) => {
    const newAsset: BrandSocialAssetSpec = preset
      ? { ...preset, id: crypto.randomUUID(), templates: [] }
      : {
          id: crypto.randomUUID(),
          platform: 'LinkedIn',
          postSize: '1200 x 627 px',
          altSize: '',
          textLegibility: '',
          directive: '',
          templates: [],
          previewImageUrl: platformDefaultImages['LinkedIn'] || '',
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

  // Template management
  const addTemplate = (assetId: string) => {
    if (!newTemplate.name || !newTemplate.url) return;
    
    const template: SocialAssetTemplate = {
      id: crypto.randomUUID(),
      name: newTemplate.name,
      fileType: (newTemplate.fileType as SocialAssetTemplate['fileType']) || 'other',
      url: newTemplate.url,
      description: newTemplate.description,
    };
    
    const asset = socialAssets.find(a => a.id === assetId);
    if (asset) {
      updateSocialAsset(assetId, {
        templates: [...(asset.templates || []), template]
      });
    }
    
    setNewTemplate({});
    setAddingTemplateFor(null);
  };

  const deleteTemplate = (assetId: string, templateId: string) => {
    const asset = socialAssets.find(a => a.id === assetId);
    if (asset) {
      updateSocialAsset(assetId, {
        templates: (asset.templates || []).filter(t => t.id !== templateId)
      });
    }
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
    if (aspectRatio > 4) return 'h-12';
    if (aspectRatio > 2) return 'h-16';
    if (aspectRatio < 0.5) return 'h-48';
    return 'h-28';
  };

  return (
    <section className="space-y-8">
      {/* Header with layout selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Social Assets & Guidelines"
            defaultSubtitle="Platform specifications, safe zones, and downloadable design templates"
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Social Platform Protocols
          </h3>
          <div className="flex gap-2 flex-wrap">
            {socialAssets.length === 0 && (
              <Button onClick={initializeWithPresets} size="sm" variant="default" className="gap-1.5 h-8">
                <Plus className="h-3.5 w-3.5" />
                Add All Platforms
              </Button>
            )}
            <Select onValueChange={(platform) => {
              const preset = platformPresets.find(p => p.platform === platform);
              if (preset) addSocialAsset(preset);
            }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Add preset..." />
              </SelectTrigger>
              <SelectContent>
                {platformPresets.map((preset) => {
                  const IconComp = platformIcons[preset.platform] || Monitor;
                  return (
                    <SelectItem key={preset.platform} value={preset.platform}>
                      <div className="flex items-center gap-2">
                        <IconComp className="h-3.5 w-3.5" />
                        {preset.platform}
                      </div>
                    </SelectItem>
                  );
                })}
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
            const hasTemplates = (asset.templates?.length || 0) > 0;
            const isTemplateExpanded = expandedTemplates.has(asset.id);
            const isAddingTemplate = addingTemplateFor === asset.id;

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
                    {hasTemplates && (
                      <Badge variant="secondary" className="text-[9px] gap-1">
                        <Download className="h-2.5 w-2.5" />
                        {asset.templates?.length}
                      </Badge>
                    )}
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

                {/* Preview Image Upload Area */}
                <div className="px-4 py-3">
                  <SocialAssetPreviewUpload 
                    asset={asset} 
                    onUpdate={(updates) => updateSocialAsset(asset.id, updates)} 
                  />
                </div>

                {/* Specs */}
                <div className="px-4 pb-4 space-y-3">
                  {/* Size Specifications Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
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
                        <p className="font-medium text-foreground text-[11px]">{asset.postSize}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Banner/Cover
                      </p>
                      {isEditing ? (
                        <Input
                          value={asset.coverSize || asset.altSize || ''}
                          onChange={(e) => updateSocialAsset(asset.id, { coverSize: e.target.value })}
                          className="h-7 text-xs"
                          placeholder="e.g., 1500 x 500 px"
                        />
                      ) : (
                        <p className="font-medium text-foreground text-[11px]">{asset.coverSize || asset.altSize || '—'}</p>
                      )}
                    </div>
                    {(asset.storySize || isEditing) && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Story Size
                        </p>
                        {isEditing ? (
                          <Input
                            value={asset.storySize || ''}
                            onChange={(e) => updateSocialAsset(asset.id, { storySize: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="e.g., 1080 x 1920 px"
                          />
                        ) : (
                          <p className="font-medium text-foreground text-[11px]">{asset.storySize}</p>
                        )}
                      </div>
                    )}
                    {(asset.reelSize || isEditing) && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Reel/Short Size
                        </p>
                        {isEditing ? (
                          <Input
                            value={asset.reelSize || ''}
                            onChange={(e) => updateSocialAsset(asset.id, { reelSize: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="e.g., 1080 x 1920 px"
                          />
                        ) : (
                          <p className="font-medium text-foreground text-[11px]">{asset.reelSize}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text Legibility */}
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
                      <p className="font-medium text-foreground text-[11px]">{asset.textLegibility || '—'}</p>
                    )}
                  </div>

                  {/* Directive */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      Platform Directive
                    </p>
                    {isEditing ? (
                      <Textarea
                        value={asset.directive}
                        onChange={(e) => updateSocialAsset(asset.id, { directive: e.target.value })}
                        className="min-h-[80px] text-xs resize-none"
                        placeholder="Enter safe zone guidelines, logo placement rules, etc."
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {asset.directive || 'No specific directive'}
                      </p>
                    )}
                  </div>

                  {/* Templates Section */}
                  <Collapsible open={isTemplateExpanded} onOpenChange={() => toggleTemplateExpand(asset.id)}>
                    <div className="border-t border-border/30 pt-3 mt-3">
                      <CollapsibleTrigger className="flex items-center justify-between w-full group/trigger">
                        <div className="flex items-center gap-2">
                          <Download className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Design Templates
                          </span>
                          {hasTemplates && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {asset.templates?.length} files
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground group-hover/trigger:text-foreground transition-colors">
                          {isTemplateExpanded ? 'Hide' : 'Show'}
                        </span>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-3 space-y-2">
                        {/* Template List */}
                        {asset.templates?.map((template) => {
                          const typeInfo = fileTypeIcons[template.fileType] || fileTypeIcons.other;
                          const TypeIcon = typeInfo.icon;
                          
                          return (
                            <div 
                              key={template.id}
                              className="flex items-center justify-between gap-2 bg-background/50 rounded-lg p-2 border border-border/30 group/template"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded flex items-center justify-center bg-muted/50 ${typeInfo.color}`}>
                                  <TypeIcon className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{template.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{typeInfo.label}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={template.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                                  title="Open template"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <button
                                  onClick={() => deleteTemplate(asset.id, template.id)}
                                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover/template:opacity-100 transition-all"
                                  title="Remove template"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Template Form */}
                        {isAddingTemplate ? (
                          <div className="bg-background/50 rounded-lg p-3 border border-primary/30 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={newTemplate.name || ''}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                placeholder="Template name"
                                className="h-7 text-xs"
                              />
                              <Select
                                value={newTemplate.fileType || 'figma'}
                                onValueChange={(val) => setNewTemplate({ ...newTemplate, fileType: val as SocialAssetTemplate['fileType'] })}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="figma">Figma</SelectItem>
                                  <SelectItem value="canva">Canva</SelectItem>
                                  <SelectItem value="psd">Photoshop</SelectItem>
                                  <SelectItem value="ai">Illustrator</SelectItem>
                                  <SelectItem value="sketch">Sketch</SelectItem>
                                  <SelectItem value="xd">Adobe XD</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              value={newTemplate.url || ''}
                              onChange={(e) => setNewTemplate({ ...newTemplate, url: e.target.value })}
                              placeholder="Template URL (Figma, Canva, Dropbox, etc.)"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={newTemplate.description || ''}
                              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                              placeholder="Description (optional)"
                              className="h-7 text-xs"
                            />
                            <div className="flex gap-2 pt-1">
                              <Button 
                                size="sm" 
                                onClick={() => addTemplate(asset.id)} 
                                disabled={!newTemplate.name || !newTemplate.url}
                                className="h-7 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Template
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setAddingTemplateFor(null); setNewTemplate({}); }}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingTemplateFor(asset.id)}
                            className="w-full h-8 text-xs gap-1.5 border-dashed"
                          >
                            <Link2 className="h-3 w-3" />
                            Add Template Link
                          </Button>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
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
