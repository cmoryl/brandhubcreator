import { useState, useRef, useMemo } from 'react';
import { Plus, X, Pencil, Upload, Download, FileText, Image, Eye, GripVertical } from 'lucide-react';
import { BrandBrochure } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SectionHeader } from './SectionHeader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  onCollateralChange: (collateral: BrandBrochure[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
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
  { value: 'Other', label: 'Other', icon: '📁' },
];

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
        onClick={onPreview}
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground text-center">
              Preview
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
            <Button size="sm" variant="secondary" onClick={onDoneEditing} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
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
  onLayoutChange
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
  
  const { gridClass } = useLayoutClasses(layout);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingThumbnailFor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const thumbnailUrl = event.target?.result as string;
      updateItem(uploadingThumbnailFor, { thumbnailUrl });
      toast.success('Preview thumbnail added');
    };
    reader.readAsDataURL(file);

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
    setUploadingThumbnailFor(null);
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
    onCollateralChange(collateral.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    onCollateralChange(collateral.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadItem = (item: BrandBrochure) => {
    const link = document.createElement('a');
    link.href = item.previewUrl;
    link.download = item.title;
    link.click();
  };

  const removeThumbnail = (itemId: string) => {
    updateItem(itemId, { thumbnailUrl: undefined });
    toast.success('Thumbnail removed');
  };

  const isPdf = (url: string) => {
    return url?.includes('application/pdf') || url?.endsWith('.pdf');
  };

  const isImage = (url: string) => {
    return url?.includes('image') || url?.includes('data:image');
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
          <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

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
      <PreviewDialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        title={previewItem?.title || ''}
        previewUrl={previewItem?.thumbnailUrl || previewItem?.previewUrl}
        type={isPdf(previewItem?.previewUrl || '') ? 'iframe' : 'image'}
        aspectRatio="portrait"
      />
    </section>
  );
};
