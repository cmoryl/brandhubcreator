import { useState, useRef, useMemo } from 'react';
import { Plus, X, Pencil, Upload, Download, FileText, Image, Eye, GripVertical, Link, ExternalLink, Palette, FileImage } from 'lucide-react';
import { generatePdfThumbnail } from '@/lib/pdfThumbnail';
import { BrandBrochure } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { parseCanvaUrl, refineDesignType, CANVA_LOGO_SVG } from '@/lib/canvaUtils';
import { SectionHeader } from './SectionHeader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DigitalCollateralSectionProps {
  collateral: BrandBrochure[];
  onCollateralChange?: (collateral: BrandBrochure[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

// Extended category options with all content types
const CATEGORY_OPTIONS = [
  { value: 'Brief', label: 'Brief', icon: '📋' },
  { value: 'Spotlight', label: 'Spotlight', icon: '🔦' },
  { value: 'Whitepaper', label: 'Whitepaper', icon: '📄' },
  { value: 'Case Study', label: 'Case Study', icon: '📊' },
  { value: 'eBrochure', label: 'eBrochure', icon: '📖' },
  { value: 'Infographic', label: 'Infographic', icon: '📈' },
  { value: 'Capability Statement', label: 'Capability Statement', icon: '💼' },
  { value: 'Product Brochure', label: 'Product Brochure', icon: '📦' },
  { value: 'Company Overview', label: 'Company Overview', icon: '🏢' },
  { value: 'Pitch Deck', label: 'Pitch Deck', icon: '🎯' },
  { value: 'Annual Report', label: 'Annual Report', icon: '📅' },
  { value: 'Social Banner Set — LinkedIn', label: 'Social Banner — LinkedIn', icon: '🔗' },
  { value: 'Social Banner Set — Facebook', label: 'Social Banner — Facebook', icon: '📘' },
  { value: 'Social Banner Set — Instagram', label: 'Social Banner — Instagram', icon: '📸' },
  { value: 'Social Banner Set — X (Twitter)', label: 'Social Banner — X', icon: '🐦' },
  { value: 'Social Banner Set — YouTube', label: 'Social Banner — YouTube', icon: '🎬' },
  { value: 'Social Banner Set — TikTok', label: 'Social Banner — TikTok', icon: '🎵' },
  { value: 'Social Banner Set — Pinterest', label: 'Social Banner — Pinterest', icon: '📌' },
  { value: 'Social Banner Set — Multi-Platform', label: 'Social Banner — Multi-Platform', icon: '🌐' },
  { value: 'Other', label: 'Other', icon: '📁' },
];

// Social banner platform options for quick-add dialog
const SOCIAL_BANNER_PLATFORMS = [
  { value: 'Social Banner Set — LinkedIn', label: 'LinkedIn', icon: '🔗' },
  { value: 'Social Banner Set — Facebook', label: 'Facebook', icon: '📘' },
  { value: 'Social Banner Set — Instagram', label: 'Instagram', icon: '📸' },
  { value: 'Social Banner Set — X (Twitter)', label: 'X (Twitter)', icon: '🐦' },
  { value: 'Social Banner Set — YouTube', label: 'YouTube', icon: '🎬' },
  { value: 'Social Banner Set — TikTok', label: 'TikTok', icon: '🎵' },
  { value: 'Social Banner Set — Pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'Social Banner Set — Multi-Platform', label: 'Multi-Platform', icon: '🌐' },
];

const isSocialBannerCategory = (category: string) => category.startsWith('Social Banner Set');

// Sortable Item Component
interface SortableItemProps {
  item: BrandBrochure;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onThumbnailUpload: () => void;
  onDownload: () => void;
  onUpdate: (updates: Partial<BrandBrochure>) => void;
  onRemoveThumbnail: () => void;
  onDoneEditing: () => void;
  isImage: (url: string) => boolean;
  isDragging?: boolean;
}

const SortableCollateralItem = ({
  item,
  isEditing,
  onEdit,
  onDelete,
  onPreview,
  onThumbnailUpload,
  onDownload,
  onUpdate,
  onRemoveThumbnail,
  onDoneEditing,
  isImage,
  isDragging,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:border-primary/50 transition-all",
        isSortableDragging && "ring-2 ring-primary shadow-lg z-50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-secondary"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Preview Area - Compact */}
      <div 
        className="aspect-[4/3] bg-muted relative flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => {
          // For PDFs without thumbnails, open directly in a new tab
          const url = item.previewUrl || '';
          const hasPdf = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?') || url.includes('application/pdf');
          if (hasPdf && !item.thumbnailUrl) {
            window.open(item.previewUrl, '_blank', 'noopener,noreferrer');
          } else if (item.thumbnailUrl || item.previewUrl) {
            onPreview();
          } else if (item.externalUrl) {
            window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        {item.thumbnailUrl ? (
          <OptimizedImage 
            src={item.thumbnailUrl} 
            alt={item.title} 
            className="w-full h-full" 
            objectFit="cover" 
          />
        ) : isImage(item.previewUrl) ? (
          <OptimizedImage 
            src={item.previewUrl} 
            alt={item.title} 
            className="w-full h-full" 
            objectFit="cover" 
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {item.externalUrl ? (
                <ExternalLink className="h-8 w-8 text-primary" />
              ) : (
                <FileText className="h-8 w-8 text-primary" />
              )}
            </div>
            <span className="text-xs text-muted-foreground text-center">
              {item.externalUrl ? 'External Link' : 'Preview'}
            </span>
          </div>
        )}
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Preview"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onThumbnailUpload(); }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Add thumbnail"
          >
            <Image className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Thumbnail indicator */}
        {item.thumbnailUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveThumbnail(); }}
            className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Remove thumbnail
          </button>
        )}
      </div>

      {/* Content Info - Compact */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={item.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Title"
              className="h-8"
            />
            <Select
              value={item.category}
              onValueChange={(category) => onUpdate({ category })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={item.externalUrl || ''}
              onChange={(e) => onUpdate({ externalUrl: e.target.value || undefined })}
              placeholder={isSocialBannerCategory(item.category) ? "Canva template link..." : "External URL (Dropbox, GlobalLink...)"}
              className="h-8 text-xs"
            />
            <Button size="sm" variant="secondary" onClick={onDoneEditing} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">{item.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-muted-foreground">{item.category}</p>
                {item.externalUrl && (() => {
                  const canvaInfo = refineDesignType(parseCanvaUrl(item.externalUrl), item.category, item.title);
                  return canvaInfo.isCanva ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Remember to apply your brand colors and fonts in Canva', { duration: 4000, icon: '🎨' });
                        window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[hsl(178,100%,30%)] hover:text-[hsl(178,100%,25%)] hover:underline"
                      title={`Open in Canva — ${canvaInfo.displayLabel}`}
                    >
                      <img src={CANVA_LOGO_SVG} alt="" className="w-3.5 h-3.5" />
                      <span>{canvaInfo.displayLabel}</span>
                    </button>
                  ) : (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                      title={item.externalUrl}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Link</span>
                    </a>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Drag Overlay Item (shown while dragging) - Compact
const DragOverlayItem = ({ item, isImage }: { item: BrandBrochure; isImage: (url: string) => boolean }) => (
  <div className="bg-card rounded-lg overflow-hidden shadow-2xl border-2 border-primary w-48 opacity-90">
    <div className="aspect-[4/3] bg-muted relative flex items-center justify-center overflow-hidden">
      {item.thumbnailUrl ? (
        <OptimizedImage src={item.thumbnailUrl} alt={item.title} className="w-full h-full" objectFit="cover" />
      ) : isImage(item.previewUrl) ? (
        <OptimizedImage src={item.previewUrl} alt={item.title} className="w-full h-full" objectFit="cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 p-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </div>
      )}
    </div>
    <div className="p-3">
      <h3 className="font-medium text-sm text-foreground truncate">{item.title}</h3>
      <p className="text-xs text-muted-foreground">{item.category}</p>
    </div>
  </div>
);

export const DigitalCollateralSection = ({
  collateral: collateralProp,
  onCollateralChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'compact',
  onLayoutChange,
  entityId,
  entityType = 'brand',
}: DigitalCollateralSectionProps) => {
  const collateral = Array.isArray(collateralProp) ? collateralProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BrandBrochure | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnailFor, setUploadingThumbnailFor] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showBannerSetDialog, setShowBannerSetDialog] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', category: 'Other' });
  const [newBannerSet, setNewBannerSet] = useState({ title: '', canvaUrl: '', platform: 'Social Banner Set — Multi-Platform', description: '' });
  const bannerSetImageRef = useRef<HTMLInputElement>(null);
  const [pendingBannerSetImage, setPendingBannerSetImage] = useState<File | null>(null);
  const [bannerSetImagePreview, setBannerSetImagePreview] = useState<string | null>(null);
  
  const { gridClass } = useLayoutClasses(layout);
  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });
  
  // Determine if editing is allowed
  const canEdit = !!onCollateralChange;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onCollateralChange) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    // Upload to cloud storage if entityId available, else fallback to base64
    if (entityId) {
      const result = await uploadFile(file, 'asset', `collateral-${Date.now()}`);
      if (!result) return;
      const newItem: BrandBrochure = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: selectedCategory || 'Other',
        previewUrl: result.url,
      };
      onCollateralChange([...collateral, newItem]);
      setEditingId(newItem.id);
      setSelectedCategory(null);
    } else {
      // Fallback: base64 (no entityId yet — entity not yet saved)
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newItem: BrandBrochure = {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: selectedCategory || 'Other',
          previewUrl: url,
        };
        onCollateralChange([...collateral, newItem]);
        setEditingId(newItem.id);
        setSelectedCategory(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingThumbnailFor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    const itemId = uploadingThumbnailFor;
    setUploadingThumbnailFor(null);

    if (!entityId) {
      toast.error('Please save this guide first, then upload thumbnails.');
      return;
    }

    const result = await uploadFile(file, 'asset', `thumbnail-${itemId}`);
    if (!result) return;
    updateItem(itemId, { thumbnailUrl: result.url });
    toast.success('Preview thumbnail saved to storage');
  };

  const triggerThumbnailUpload = (itemId: string) => {
    setUploadingThumbnailFor(itemId);
    thumbnailInputRef.current?.click();
  };

  const triggerUploadForCategory = (category: string) => {
    setSelectedCategory(category);
    fileInputRef.current?.click();
  };

  const updateItem = (id: string, updates: Partial<BrandBrochure>) => {
    if (!onCollateralChange) return;
    onCollateralChange(collateral.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    if (!onCollateralChange) return;
    onCollateralChange(collateral.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadItem = (item: BrandBrochure) => {
    if (item.externalUrl && !item.previewUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const link = document.createElement('a');
    link.href = item.previewUrl;
    link.download = item.title;
    link.click();
  };

  const removeThumbnail = (itemId: string) => {
    updateItem(itemId, { thumbnailUrl: undefined });
    toast.success('Thumbnail removed');
  };

  const handleAddLink = () => {
    if (!newLink.url || !newLink.title || !onCollateralChange) return;
    const newItem: BrandBrochure = {
      id: crypto.randomUUID(),
      title: newLink.title,
      category: newLink.category,
      previewUrl: '', // No file — external link only
      externalUrl: newLink.url,
    };
    onCollateralChange([...collateral, newItem]);
    setEditingId(newItem.id);
    setShowLinkDialog(false);
    setNewLink({ title: '', url: '', category: 'Other' });
    toast.success('External link added — upload a preview thumbnail via the edit overlay');
  };

  const handleAddBannerSet = async () => {
    if (!newBannerSet.title || !onCollateralChange) return;
    
    const newItem: BrandBrochure = {
      id: crypto.randomUUID(),
      title: newBannerSet.title,
      category: newBannerSet.platform,
      previewUrl: '',
      externalUrl: newBannerSet.canvaUrl || undefined,
    };

    // Upload preview image if provided
    if (pendingBannerSetImage && entityId) {
      const result = await uploadFile(pendingBannerSetImage, 'asset', `banner-${newItem.id}`);
      if (result) {
        newItem.thumbnailUrl = result.url;
      }
    } else if (bannerSetImagePreview) {
      // Fallback base64 if no entityId
      newItem.thumbnailUrl = bannerSetImagePreview;
    }

    onCollateralChange([...collateral, newItem]);
    setShowBannerSetDialog(false);
    setNewBannerSet({ title: '', canvaUrl: '', platform: 'Social Banner Set — Multi-Platform', description: '' });
    setPendingBannerSetImage(null);
    setBannerSetImagePreview(null);
    toast.success('Social media banner set added');
  };

  const handleBannerSetImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingBannerSetImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerSetImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (bannerSetImageRef.current) bannerSetImageRef.current.value = '';
  };

  const isPdf = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('application/pdf') || lower.endsWith('.pdf') || lower.includes('.pdf?');
  };

  const isImage = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Check for data URIs
    if (lower.startsWith('data:image')) return true;
    // Check for common image extensions (handles Supabase storage URLs)
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'];
    if (imageExts.some(ext => lower.includes(ext))) return true;
    // Check for MIME type in URL
    if (lower.includes('image/')) return true;
    return false;
  };

  // Group by category
  const groupedCollateral = useMemo(() => {
    return collateral.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BrandBrochure[]>);
  }, [collateral]);

  // Sort categories by the order in CATEGORY_OPTIONS
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedCollateral).sort((a, b) => {
      const indexA = CATEGORY_OPTIONS.findIndex(c => c.value === a);
      const indexB = CATEGORY_OPTIONS.findIndex(c => c.value === b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [groupedCollateral]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder within category
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeItem = collateral.find(item => item.id === active.id);
    const overItem = collateral.find(item => item.id === over.id);

    if (!activeItem || !overItem) return;

    // Only allow reordering within the same category
    if (activeItem.category !== overItem.category) {
      toast.error('Items can only be reordered within the same category');
      return;
    }

    // Find indices in the full collateral array
    const oldIndex = collateral.findIndex(item => item.id === active.id);
    const newIndex = collateral.findIndex(item => item.id === over.id);

    const newCollateral = arrayMove(collateral, oldIndex, newIndex);
    onCollateralChange(newCollateral);
    toast.success('Item reordered');
  };

  const activeItem = activeId ? collateral.find(item => item.id === activeId) : null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <SectionHeader
            title="Digital Collateral"
            defaultSubtitle="Briefs, spotlights, whitepapers, case studies, and marketing materials"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['compact', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          {canEdit && (
            <Button onClick={() => setShowBannerSetDialog(true)} size="sm" variant="outline" className="gap-2 shrink-0">
              <Palette className="h-4 w-4" />
              Banner Set
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setShowLinkDialog(true)} size="sm" variant="outline" className="gap-2 shrink-0">
              <Link className="h-4 w-4" />
              Add Link
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0" disabled={isUploading}>
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </div>
      </div>

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="hidden"
          />

          {/* Category Quick-Add Chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.slice(0, 6).map(cat => (
              <button
                key={cat.value}
                onClick={() => triggerUploadForCategory(cat.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <Plus className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Canva Templates Strip */}
      {(() => {
        const canvaItems = collateral.filter(b => b.externalUrl?.includes('canva.com'));
        if (canvaItems.length === 0) return null;
        return (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <img src={CANVA_LOGO_SVG} alt="Canva" className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-foreground">Canva Templates</h3>
              <Badge variant="secondary" className="text-xs">{canvaItems.length}</Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {canvaItems.map(item => {
                const info = refineDesignType(parseCanvaUrl(item.externalUrl), item.category, item.title);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      toast.info('Remember to apply your brand colors and fonts in Canva', { duration: 4000, icon: '🎨' });
                      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background hover:border-[hsl(178,100%,40%)]/50 hover:bg-[hsl(178,100%,40%)]/5 transition-colors shrink-0 group"
                  >
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <img src={CANVA_LOGO_SVG} alt="" className="w-5 h-5 opacity-60" />
                    )}
                    <div className="text-left">
                      <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{info.displayLabel}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-[hsl(178,100%,30%)] ml-1" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {sortedCategories.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {sortedCategories.map(category => {
              const categoryItems = groupedCollateral[category];
              const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === category);
              const itemIds = categoryItems.map(item => item.id);
              
              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryInfo?.icon || '📁'}</span>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryItems.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      (drag to reorder)
                    </span>
                  </div>
                  
                  <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                    <div className={gridClass}>
                      {categoryItems.map((item) => (
                        <SortableCollateralItem
                          key={item.id}
                          item={item}
                          isEditing={editingId === item.id}
                          onEdit={() => setEditingId(item.id)}
                          onDelete={() => deleteItem(item.id)}
                          onPreview={() => setPreviewItem(item)}
                          onThumbnailUpload={() => triggerThumbnailUpload(item.id)}
                          onDownload={() => downloadItem(item)}
                          onUpdate={(updates) => updateItem(item.id, updates)}
                          onRemoveThumbnail={() => removeThumbnail(item.id)}
                          onDoneEditing={() => setEditingId(null)}
                          isImage={isImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
          
          <DragOverlay>
            {activeItem ? (
              <DragOverlayItem item={activeItem} isImage={isImage} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-primary', 'bg-primary/5', 'text-primary');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(fakeEvent);
            }
          }}
          className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <FileText className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">Drop files or click to upload</p>
            <p className="text-sm">PDFs, briefs, case studies, whitepapers & more</p>
          </div>
        </button>
      )}

      {/* Preview Dialog */}
      {previewItem && isPdf(previewItem.previewUrl || '') ? (
        <PreviewDialog
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          title={previewItem.title}
          previewUrl={previewItem.thumbnailUrl || undefined}
          externalUrl={previewItem.previewUrl}
          type={previewItem.thumbnailUrl ? 'image' : 'iframe'}
          aspectRatio="portrait"
        />
      ) : (
        <PreviewDialog
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          title={previewItem?.title || ''}
          previewUrl={previewItem?.thumbnailUrl || previewItem?.previewUrl}
          type="image"
          aspectRatio="portrait"
        />
      )}

      {/* Add External Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add External Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={newLink.title}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Asset title"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://dropbox.com/... or external URL"
            />
            <Select
              value={newLink.category}
              onValueChange={(category) => setNewLink(prev => ({ ...prev, category }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLink} disabled={!newLink.title || !newLink.url}>
              <Link className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Social Media Banner Set Dialog */}
      <Dialog open={showBannerSetDialog} onOpenChange={(open) => {
        setShowBannerSetDialog(open);
        if (!open) {
          setNewBannerSet({ title: '', canvaUrl: '', platform: 'Social Banner Set — Multi-Platform', description: '' });
          setPendingBannerSetImage(null);
          setBannerSetImagePreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Add Social Media Banner Set
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Banner Set Name</label>
              <Input
                value={newBannerSet.title}
                onChange={(e) => setNewBannerSet(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Q1 2026 Campaign Banners"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
              <div className="grid grid-cols-4 gap-1.5">
                {SOCIAL_BANNER_PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setNewBannerSet(prev => ({ ...prev, platform: p.value }))}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                      newBannerSet.platform === p.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-card hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="truncate w-full text-center">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Canva Template Link</label>
              <Input
                value={newBannerSet.canvaUrl}
                onChange={(e) => setNewBannerSet(prev => ({ ...prev, canvaUrl: e.target.value }))}
                placeholder="https://www.canva.com/design/..."
              />
              <p className="text-xs text-muted-foreground mt-1">Paste the Canva template share link for this banner set</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preview Image</label>
              <input
                ref={bannerSetImageRef}
                type="file"
                accept="image/*"
                onChange={handleBannerSetImageSelect}
                className="hidden"
              />
              {bannerSetImagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={bannerSetImagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPendingBannerSetImage(null); setBannerSetImagePreview(null); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerSetImageRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Upload a preview of the banner set</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBannerSetDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBannerSet} disabled={!newBannerSet.title || isUploading}>
              <Palette className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Add Banner Set'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
