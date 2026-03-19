import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, X, Pencil, Linkedin, Twitter, Instagram, Facebook, Youtube, Monitor, Smartphone, Download, ExternalLink, FileType, Figma, Upload, Image, ChevronDown, ChevronRight, Info, Maximize2, Layers, FolderOpen, Eye } from 'lucide-react';
import { BrandSocialAssetSpec, BrandDisplayBannerSpec, SocialAssetTemplate } from '@/types/brand';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropZone } from '@/components/ui/drop-zone';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { safeUUID } from '@/lib/safeUUID';
import { cn } from '@/lib/utils';
import { SocialMockupPreviewDialog } from './social-mockups/SocialMockupPreviewDialog';

interface SocialAssetsProps {
  socialAssets: BrandSocialAssetSpec[];
  onSocialAssetsChange?: (assets: BrandSocialAssetSpec[]) => void;
  displayBanners: BrandDisplayBannerSpec[];
  onDisplayBannersChange?: (banners: BrandDisplayBannerSpec[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
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

const bannerPresets: BrandDisplayBannerSpec[] = [
  { id: 'preset-mrec', name: 'Medium Rectangle', dimensions: '300 x 250 px', maxMessaging: 'Headline: 25 chars | Body: 70 chars', textLegibility: 'Headline: 18-24pt Bold | Body: 12-14pt', safeZonePolicy: '15px padding all edges. Logo corner (max 60x40px). CTA bottom-right.', aspectRatio: 1.2, category: 'desktop' },
  { id: 'preset-leaderboard', name: 'Leaderboard', dimensions: '728 x 90 px', maxMessaging: 'Headline: 30 chars | Body: 50 chars', textLegibility: 'Headline: 24-28pt Bold | Body: 14-16pt', safeZonePolicy: 'Center in 650px. Logo left. CTA right.', aspectRatio: 8.09, category: 'desktop' },
  { id: 'preset-wide-sky', name: 'Wide Skyscraper', dimensions: '160 x 600 px', maxMessaging: 'Headline: 20 chars | Body: 60 chars', textLegibility: 'Headline: 18-22pt Bold | Body: 11-13pt', safeZonePolicy: '10px horizontal. Logo top. Stack vertical.', aspectRatio: 0.27, category: 'desktop' },
  { id: 'preset-large-rect', name: 'Large Rectangle', dimensions: '336 x 280 px', maxMessaging: 'Headline: 30 chars | Body: 90 chars', textLegibility: 'Headline: 20-26pt Bold | Body: 13-15pt', safeZonePolicy: '20px padding. Logo top-left. CTA center-bottom.', aspectRatio: 1.2, category: 'desktop' },
  { id: 'preset-billboard', name: 'Billboard', dimensions: '970 x 250 px', maxMessaging: 'Headline: 40 chars | Body: 100 chars', textLegibility: 'Headline: 32-40pt Bold | Body: 16-18pt', safeZonePolicy: 'Center in 800px. Logo left. Multiple CTAs allowed.', aspectRatio: 3.88, category: 'desktop' },
  { id: 'preset-half-page', name: 'Half Page', dimensions: '300 x 600 px', maxMessaging: 'Headline: 30 chars | Body: 120 chars', textLegibility: 'Headline: 24-30pt Bold | Body: 14-16pt', safeZonePolicy: '20px padding. Logo top. CTA bottom full-width.', aspectRatio: 0.5, category: 'desktop' },
  { id: 'preset-mobile-lead', name: 'Mobile Leaderboard', dimensions: '320 x 50 px', maxMessaging: 'Headline: 20 chars | CTA: 8 chars', textLegibility: 'Headline: 14-16pt Bold | CTA: 12pt', safeZonePolicy: 'Logo left (40x30px). CTA right. 8px edges.', aspectRatio: 6.4, category: 'mobile' },
  { id: 'preset-large-mobile', name: 'Large Mobile', dimensions: '320 x 100 px', maxMessaging: 'Headline: 25 chars | Body: 35 chars', textLegibility: 'Headline: 16-18pt Bold | Body: 12pt', safeZonePolicy: 'Two-line layout. CTA bottom-right. 10px padding.', aspectRatio: 3.2, category: 'mobile' },
  { id: 'preset-mobile-mrec', name: 'Mobile MREC', dimensions: '300 x 250 px', maxMessaging: 'Headline: 25 chars | Body: 60 chars', textLegibility: 'Headline: 20-24pt Bold | Body: 13-15pt', safeZonePolicy: 'Same as desktop MREC. Touch CTA min 44px.', aspectRatio: 1.2, category: 'mobile' },
  { id: 'preset-interstitial', name: 'Interstitial', dimensions: '320 x 480 px', maxMessaging: 'Headline: 30 chars | Body: 80 chars', textLegibility: 'Headline: 28-34pt Bold | Body: 16-18pt', safeZonePolicy: 'Close button top-right. CTA bottom 80px.', aspectRatio: 0.67, category: 'mobile' },
  { id: 'preset-video-rect', name: 'Video Rectangle', dimensions: '640 x 360 px', maxMessaging: 'Overlay: 20 chars | End card: 30 chars', textLegibility: 'Overlay: 18-22pt Bold | End card: 24-28pt', safeZonePolicy: 'Controls bottom 50px. Logo watermark top-left.', aspectRatio: 1.78, category: 'video' },
  { id: 'preset-native', name: 'Native Ad Unit', dimensions: '1200 x 627 px', maxMessaging: 'Headline: 50 chars | Desc: 150 chars', textLegibility: 'Headline: 24-30pt Bold | Desc: 16-18pt', safeZonePolicy: 'Image-focused. Text bottom 30% with gradient.', aspectRatio: 1.91, category: 'native' },
];

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
  const hasTemplates = (asset.templates?.length || 0) > 0;
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
              {asset.templates?.length}
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

// Compact Banner Card Component
const BannerCard = ({
  banner,
  onUpdate,
  onDelete,
  onExpand,
  canEdit = false,
}: {
  banner: BrandDisplayBannerSpec;
  onUpdate: (updates: Partial<BrandDisplayBannerSpec>) => void;
  onDelete: () => void;
  onExpand: () => void;
  canEdit?: boolean;
}) => {
  const aspectRatio = banner.aspectRatio || 1.2;
  const isVertical = aspectRatio < 0.7;
  const isWide = aspectRatio > 3;

  return (
    <div 
      className="group relative bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden hover:border-accent/30 transition-all cursor-pointer p-3"
      onClick={onExpand}
    >
      <div className="flex items-center gap-3">
        {/* Aspect ratio preview */}
        <div 
          className={cn(
            "flex-shrink-0 rounded border border-accent/30 bg-accent/5 flex items-center justify-center",
            isWide ? "w-16 h-4" : isVertical ? "w-6 h-12" : "w-10 h-8"
          )}
        >
          <span className="text-[7px] font-mono text-accent/60">{(banner.dimensions || '').split(' x ')[0] || '—'}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{banner.name}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{banner.dimensions}</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-1.5 rounded hover:bg-secondary transition-colors"
          >
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
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
                    asset.platform === 'X (Twitter)' && "-top-10 left-4 w-20 h-20",
                    asset.platform === 'Facebook' && "-top-8 left-4 w-[100px] h-[100px]",
                    asset.platform === 'YouTube' && "-top-8 left-4 w-16 h-16",
                    asset.platform === 'Instagram' && "-top-6 left-1/2 -translate-x-1/2 w-20 h-20",
                    asset.platform === 'TikTok' && "-top-6 left-1/2 -translate-x-1/2 w-24 h-24",
                    !['LinkedIn', 'X (Twitter)', 'Facebook', 'YouTube', 'Instagram', 'TikTok'].includes(asset.platform) && "-top-8 left-4 w-16 h-16",
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
                      asset.platform === 'X (Twitter)' && "-top-10 left-20 translate-x-1",
                      asset.platform === 'Facebook' && "-top-8 left-[100px] translate-x-1",
                      asset.platform === 'YouTube' && "-top-8 left-16 translate-x-1",
                      asset.platform === 'Instagram' && "-top-6 left-1/2 translate-x-8",
                      asset.platform === 'TikTok' && "-top-6 left-1/2 translate-x-10",
                      !['LinkedIn', 'X (Twitter)', 'Facebook', 'YouTube', 'Instagram', 'TikTok'].includes(asset.platform) && "-top-8 left-16 translate-x-1"
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

// Detail Modal for Banner
const BannerDetailModal = ({
  banner,
  open,
  onOpenChange,
  onUpdate,
  entityId,
  entityType,
}: {
  banner: BrandDisplayBannerSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<BrandDisplayBannerSpec>) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const { uploadFile } = useStorageUpload({
    entityType: entityType || 'brand',
    entityId: entityId || '',
  });

  const handleFileDrop = useCallback(async (file: File) => {
    if (!banner) return;
    if (entityId) {
      setUploadingBanner(true);
      try {
        const result = await uploadFile(file, 'asset', `banner-preview-${banner.id}`);
        if (result?.url) onUpdate(banner.id, { previewImageUrl: result.url });
      } catch { toast.error('Failed to upload banner preview'); }
      finally { setUploadingBanner(false); }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => { onUpdate(banner.id, { previewImageUrl: event.target?.result as string }); };
      reader.readAsDataURL(file);
    }
  }, [banner, onUpdate, entityId, uploadFile]);

  const { isDragging, fileInputRef, dragHandlers, openFilePicker, handleInputChange } = useDropZone({
    onFileDrop: handleFileDrop,
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  if (!banner) return null;

  const aspectRatio = banner.aspectRatio || 1.2;
  const isVertical = aspectRatio < 0.7;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-accent" />
            </div>
            <span>{banner.name}</span>
            <Badge variant="outline" className="ml-2 text-xs font-mono">{banner.dimensions}</Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="ml-auto">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* Preview */}
          <div 
            className={cn(
              "relative rounded-lg overflow-hidden border-2 border-dashed transition-colors mx-auto",
              isDragging ? "border-accent bg-accent/5" : "border-border/50",
              isVertical ? "w-32 h-64" : "w-full h-32"
            )}
            onDragOver={dragHandlers.onDragOver}
            onDragLeave={dragHandlers.onDragLeave}
            onDrop={dragHandlers.onDrop}
          >
            {banner.previewImageUrl ? (
              <>
                <img src={banner.previewImageUrl} alt={banner.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={openFilePicker}><Upload className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => onUpdate(banner.id, { previewImageUrl: '' })}><X className="h-3 w-3" /></Button>
                </div>
              </>
            ) : (
              <button onClick={openFilePicker} className="w-full h-full flex flex-col items-center justify-center bg-accent/5">
                <Image className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add preview</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Dimensions', key: 'dimensions', value: banner.dimensions },
              { label: 'Max Messaging', key: 'maxMessaging', value: banner.maxMessaging },
              { label: 'Text Legibility', key: 'textLegibility', value: banner.textLegibility },
              { label: 'Safe Zone Policy', key: 'safeZonePolicy', value: banner.safeZonePolicy },
            ].map(({ label, key, value }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
                {isEditing ? (
                  key === 'safeZonePolicy' ? (
                    <Textarea
                      value={value || ''}
                      onChange={(e) => onUpdate(banner.id, { [key]: e.target.value })}
                      className="min-h-[60px] resize-none"
                    />
                  ) : (
                    <Input
                      value={value || ''}
                      onChange={(e) => onUpdate(banner.id, { [key]: e.target.value })}
                      className="h-9"
                    />
                  )
                ) : (
                  <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-sm">{value || '—'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Inline editable template card info
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
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)} className="h-7 text-xs px-3">Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
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
  );
};

export const SocialAssetsSection = ({
  socialAssets,
  onSocialAssetsChange,
  displayBanners,
  onDisplayBannersChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange,
  entityId,
  entityType,
}: SocialAssetsProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<BrandSocialAssetSpec | null>(null);
  const [activePlatformId, setActivePlatformId] = useState<string | null>(null);
  const [mockupPreviewPlatform, setMockupPreviewPlatform] = useState<BrandSocialAssetSpec | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<BrandDisplayBannerSpec | null>(null);
  const [bannerTab, setBannerTab] = useState('desktop');
  const { gridClass } = useLayoutClasses(layout);
  
  // Determine if editing is allowed
  const canEditSocial = !!onSocialAssetsChange;
  const canEditBanners = !!onDisplayBannersChange;

  const { uploadFile } = useStorageUpload({
    entityType: entityType || 'brand',
    entityId: entityId || '',
  });

  const hasSocialInitialized = useRef(false);
  const hasBannerInitialized = useRef(false);

  // Auto-populate presets (only when editable)
  useEffect(() => {
    if (!hasSocialInitialized.current && socialAssets.length === 0 && onSocialAssetsChange) {
      hasSocialInitialized.current = true;
      onSocialAssetsChange(platformPresets.map(p => ({ ...p, id: safeUUID(), templates: [] })));
    }
  }, [socialAssets.length, onSocialAssetsChange]);

  useEffect(() => {
    if (!hasBannerInitialized.current && displayBanners.length === 0 && onDisplayBannersChange) {
      hasBannerInitialized.current = true;
      onDisplayBannersChange(bannerPresets.map(b => ({ ...b, id: safeUUID() })));
    }
  }, [displayBanners.length, onDisplayBannersChange]);

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

  const updateDisplayBanner = (id: string, updates: Partial<BrandDisplayBannerSpec>) => {
    if (!onDisplayBannersChange) return;
    onDisplayBannersChange(displayBanners.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBanner?.id === id) {
      setSelectedBanner({ ...selectedBanner, ...updates });
    }
  };

  const deleteDisplayBanner = (id: string) => {
    if (!onDisplayBannersChange) return;
    onDisplayBannersChange(displayBanners.filter(b => b.id !== id));
    if (selectedBanner?.id === id) setSelectedBanner(null);
  };

  const addSocialAsset = (preset?: BrandSocialAssetSpec) => {
    if (!onSocialAssetsChange) return;
    const newAsset: BrandSocialAssetSpec = preset
      ? { ...preset, id: safeUUID(), templates: [] }
      : { id: safeUUID(), platform: 'LinkedIn', postSize: '1200 x 627 px', altSize: '', textLegibility: '', directive: '', templates: [], previewImageUrl: platformDefaultImages['LinkedIn'] };
    onSocialAssetsChange([...socialAssets, newAsset]);
    if (!preset) setSelectedPlatform(newAsset);
  };

  const addDisplayBanner = (preset?: BrandDisplayBannerSpec) => {
    if (!onDisplayBannersChange) return;
    const newBanner: BrandDisplayBannerSpec = preset
      ? { ...preset, id: safeUUID() }
      : { id: safeUUID(), name: 'Custom Banner', dimensions: '300 x 250 px', maxMessaging: '', textLegibility: '', safeZonePolicy: '', aspectRatio: 1.2, category: 'desktop' };
    onDisplayBannersChange([...displayBanners, newBanner]);
    if (!preset) setSelectedBanner(newBanner);
  };

  // Group banners by category
  const bannersByCategory = {
    desktop: displayBanners.filter(b => b.category === 'desktop' || !b.category),
    mobile: displayBanners.filter(b => b.category === 'mobile'),
    video: displayBanners.filter(b => b.category === 'video'),
    native: displayBanners.filter(b => b.category === 'native'),
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
          {socialAssets.map((asset) => {
            const IconComponent = platformIcons[asset.platform] || Monitor;
            const isActive = activePlatformId === asset.id;
            const templateCount = asset.templates?.length || 0;
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
          const activePlatform = socialAssets.find(a => a.id === activePlatformId);
          if (!activePlatform) return (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Select a platform above to view specs and templates
            </div>
          );
          
          const IconComponent = platformIcons[activePlatform.platform] || Monitor;
          const sizeSpecs = [
            { label: 'Post', value: activePlatform.postSize },
            { label: 'Cover/Banner', value: activePlatform.coverSize || activePlatform.altSize },
            { label: 'Story', value: activePlatform.storySize },
            { label: 'Reel/Short', value: activePlatform.reelSize },
          ].filter(s => s.value && s.value !== 'N/A');

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

                {/* Size specs bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-muted/30 overflow-x-auto">
                  {sizeSpecs.map((spec) => (
                    <div key={spec.label} className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{spec.label}</span>
                      <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5">{spec.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template cards grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Design Templates
                    {(activePlatform.templates?.length || 0) > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{activePlatform.templates?.length}</Badge>
                    )}
                  </h4>
                  {canEditSocial && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedPlatform(activePlatform)} className="h-8 text-xs gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Add Template
                    </Button>
                  )}
                </div>

                {(activePlatform.templates?.length || 0) > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activePlatform.templates?.map((template) => {
                      const isCanva = template.fileType === 'canva' || template.url?.includes('canva.com');
                      const typeInfo = fileTypeIcons[template.fileType] || fileTypeIcons.other;
                      const TypeIcon = typeInfo.icon;
                      const hasPreview = !!template.previewImageUrl;

                      const handleTemplateImageUpload = async (file: File) => {
                        if (!entityId) {
                          // Fallback to base64
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const updatedTemplates = (activePlatform.templates || []).map(t =>
                              t.id === template.id ? { ...t, previewImageUrl: ev.target?.result as string } : t
                            );
                            updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
                          };
                          reader.readAsDataURL(file);
                          return;
                        }
                        try {
                          const result = await uploadFile(file, 'asset', `template-preview-${template.id}`);
                          if (result?.url) {
                            const updatedTemplates = (activePlatform.templates || []).map(t =>
                              t.id === template.id ? { ...t, previewImageUrl: result.url } : t
                            );
                            updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
                            toast.success('Template preview updated');
                          }
                        } catch {
                          toast.error('Failed to upload preview image');
                        }
                      };

                      return (
                        <div key={template.id} className="group/card bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                          {/* Template preview area */}
                          <div className="relative aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                            {hasPreview ? (
                              <img src={template.previewImageUrl} alt={template.name} className="w-full h-full object-cover" />
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
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-foreground/0 group-hover/card:bg-foreground/10 transition-colors flex flex-col items-center justify-center gap-2">
                              <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center gap-2">
                                {isCanva ? (
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
                                  <a
                                    href={template.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Template
                                  </a>
                                )}
                                {canEditSocial && (
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-background/90 backdrop-blur-sm text-foreground hover:bg-background shadow-lg cursor-pointer transition-colors">
                                    <Upload className="h-3 w-3" />
                                    {hasPreview ? 'Replace Image' : 'Add Image'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleTemplateImageUpload(file);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                            {/* Remove image button */}
                            {hasPreview && canEditSocial && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedTemplates = (activePlatform.templates || []).map(t =>
                                    t.id === template.id ? { ...t, previewImageUrl: undefined } : t
                                  );
                                  updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
                                  toast.success('Preview image removed');
                                }}
                                className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover/card:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {/* Template info */}
                          <TemplateCardInfo
                            template={template}
                            isCanva={isCanva}
                            typeLabel={isCanva ? 'Canva Template' : typeInfo.label}
                            canEdit={canEditSocial}
                            onUpdate={(updates) => {
                              const updatedTemplates = (activePlatform.templates || []).map(t =>
                                t.id === template.id ? { ...t, ...updates } : t
                              );
                              updateSocialAsset(activePlatform.id, { templates: updatedTemplates });
                            }}
                            onDelete={() => {
                              updateSocialAsset(activePlatform.id, {
                                templates: (activePlatform.templates || []).filter(t => t.id !== template.id),
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 text-muted-foreground">
                    <Layers className="h-8 w-8 opacity-40" />
                    <div className="text-center">
                      <p className="font-medium text-sm">No templates yet</p>
                      <p className="text-xs">Click "Add Template" to link Canva designs or upload files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Display Banners - Tabbed by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            Display Banner Specs
            <Badge variant="secondary" className="text-[10px]">{displayBanners.length}</Badge>
          </h3>
          {canEditBanners && (
            <Button onClick={() => addDisplayBanner()} size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />Custom Banner
            </Button>
          )}
        </div>

        <Tabs value={bannerTab} onValueChange={setBannerTab} className="w-full">
          <TabsList className="h-9 w-full justify-start bg-muted/50 rounded-lg p-1">
            {[
              { id: 'desktop', label: 'Desktop', count: bannersByCategory.desktop.length },
              { id: 'mobile', label: 'Mobile', count: bannersByCategory.mobile.length },
              { id: 'video', label: 'Video', count: bannersByCategory.video.length },
              { id: 'native', label: 'Native', count: bannersByCategory.native.length },
            ].map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs data-[state=active]:bg-background gap-1.5 px-3">
                {tab.label}
                <span className="text-[10px] text-muted-foreground">({tab.count})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(bannersByCategory).map(([category, banners]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {banners.map((banner) => (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    onUpdate={(updates) => updateDisplayBanner(banner.id, updates)}
                    onDelete={() => deleteDisplayBanner(banner.id)}
                    onExpand={() => setSelectedBanner(banner)}
                    canEdit={canEditBanners}
                  />
                ))}
              </div>
              {banners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {category} banners configured
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
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

      <BannerDetailModal
        banner={selectedBanner}
        open={!!selectedBanner}
        onOpenChange={(open) => !open && setSelectedBanner(null)}
        onUpdate={updateDisplayBanner}
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
