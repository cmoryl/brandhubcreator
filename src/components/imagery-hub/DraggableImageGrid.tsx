/**
 * DraggableImageGrid - Drag-and-drop sortable image grid with tagging, quality badges, and visual search
 */
import { useCallback, useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Tag, Eye, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApprovedImage } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageTagEditor } from './ImageTagEditor';
import { ImageQualityBadge } from './ImageQualityBadge';
import { ImageryPreviewDialog } from '@/components/brand/approved-imagery/ImageryPreviewDialog';

interface SortableImageProps {
  image: ApprovedImage;
  onRemove: () => void;
  onTagsChange: (tags: string[]) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  selectionMode?: boolean;
  entityId?: string;
  entityType?: string;
  onQualityScored?: (score: number, details: ApprovedImage['qualityDetails']) => void;
  onVisualSearch?: (imageUrl: string) => void;
}

const SortableImage = ({
  image, onRemove, onTagsChange, isSelected, onToggleSelect, selectionMode,
  entityId, entityType, onQualityScored, onVisualSearch,
}: SortableImageProps) => {
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg overflow-hidden border border-border bg-card',
        isDragging && 'opacity-50 z-50 shadow-lg',
        selectionMode && isSelected && 'ring-2 ring-primary',
        selectionMode && 'cursor-pointer'
      )}
      onClick={selectionMode ? onToggleSelect : () => setShowPreview(true)}
    >
      <img
        src={image.thumbnailUrl || image.url}
        alt={image.title}
        className="w-full aspect-square object-cover cursor-pointer"
        loading="lazy"
      />

      {/* Always-visible drag handle */}
      <div
        className="absolute top-1.5 left-1.5 cursor-grab active:cursor-grabbing bg-background/70 backdrop-blur-sm rounded-md p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-foreground/70" />
      </div>

      {/* Always-visible action buttons */}
      <div className="absolute top-1.5 right-1.5 flex gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-background/70 backdrop-blur-sm border-0 shadow-sm"
          onClick={e => { e.stopPropagation(); setShowPreview(true); }}
          title="View larger"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        {onVisualSearch && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-background/70 backdrop-blur-sm border-0 shadow-sm"
            onClick={e => { e.stopPropagation(); onVisualSearch(image.url || image.thumbnailUrl); }}
            title="Find similar"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-background/70 backdrop-blur-sm border-0 shadow-sm"
          onClick={e => { e.stopPropagation(); setShowTagEditor(!showTagEditor); }}
          title="Edit tags"
        >
          <Tag className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 shadow-sm"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remove image"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Always-visible quality score badge */}
      <div className="absolute bottom-10 left-1.5">
        <ImageQualityBadge
          image={image}
          entityId={entityId}
          entityType={entityType}
          onScoreUpdate={onQualityScored}
        />
      </div>

      {/* Tags */}
      {image.tags && image.tags.length > 0 && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-1">
          {image.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-[11px] px-1.5 py-0 h-5 bg-background/80 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
          {image.tags.length > 3 && (
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5 bg-background/80">
              +{image.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Source indicator */}
      <div className="absolute bottom-1.5 right-1.5">
        <Badge variant="outline" className="text-[11px] px-1.5 py-0 h-5 bg-background/80 backdrop-blur-sm">
          {image.source}
        </Badge>
      </div>

      {/* Tag editor popover */}
      {showTagEditor && (
        <div className="absolute inset-x-0 top-full z-50 mt-1" onClick={e => e.stopPropagation()}>
          <ImageTagEditor
            tags={image.tags || []}
            onTagsChange={onTagsChange}
            onClose={() => setShowTagEditor(false)}
          />
        </div>
      )}

      {/* Full-resolution preview dialog */}
      <ImageryPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        image={showPreview ? {
          id: image.id,
          url: image.url,
          thumbnailUrl: image.thumbnailUrl,
          title: image.title,
          source: image.source,
          category: image.category,
        } : null}
      />
    </div>
  );
};

interface DraggableImageGridProps {
  images: ApprovedImage[];
  onReorder: (newImages: ApprovedImage[]) => void;
  onRemoveImage: (imageId: string) => void;
  onUpdateTags: (imageId: string, tags: string[]) => void;
  selectedImages?: Map<string, ApprovedImage>;
  onToggleSelection?: (image: ApprovedImage) => void;
  selectionMode?: boolean;
  sectionId: string;
  tagFilter?: string;
  entityId?: string;
  entityType?: string;
  onQualityScored?: (imageId: string, score: number, details: ApprovedImage['qualityDetails']) => void;
  onVisualSearch?: (imageUrl: string) => void;
}

export const DraggableImageGrid = ({
  images, onReorder, onRemoveImage, onUpdateTags,
  selectedImages, onToggleSelection, selectionMode, sectionId, tagFilter,
  entityId, entityType, onQualityScored, onVisualSearch,
}: DraggableImageGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredImages = tagFilter
    ? images.filter(img => img.tags?.some(t => t.toLowerCase().includes(tagFilter.toLowerCase())))
    : images;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex(img => img.id === active.id);
    const newIndex = images.findIndex(img => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(images, oldIndex, newIndex));
  }, [images, onReorder]);

  if (filteredImages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {tagFilter ? 'No images match the tag filter' : 'No images in this category'}
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={filteredImages.map(img => img.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filteredImages.map(image => (
            <SortableImage
              key={image.id}
              image={image}
              onRemove={() => onRemoveImage(image.id)}
              onTagsChange={tags => onUpdateTags(image.id, tags)}
              isSelected={selectedImages?.has(`${sectionId}::${image.id}`)}
              onToggleSelect={() => onToggleSelection?.(image)}
              selectionMode={selectionMode}
              entityId={entityId}
              entityType={entityType}
              onQualityScored={onQualityScored ? (s, d) => onQualityScored(image.id, s, d) : undefined}
              onVisualSearch={onVisualSearch}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
