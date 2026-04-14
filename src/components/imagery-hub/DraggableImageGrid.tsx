/**
 * DraggableImageGrid - Drag-and-drop sortable image grid with tagging
 */
import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApprovedImage } from '@/types/brand';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageTagEditor } from './ImageTagEditor';
import { useState } from 'react';

interface SortableImageProps {
  image: ApprovedImage;
  onRemove: () => void;
  onTagsChange: (tags: string[]) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  selectionMode?: boolean;
}

const SortableImage = ({ image, onRemove, onTagsChange, isSelected, onToggleSelect, selectionMode }: SortableImageProps) => {
  const [showTagEditor, setShowTagEditor] = useState(false);
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
      onClick={selectionMode ? onToggleSelect : undefined}
    >
      <img
        src={image.thumbnailUrl || image.url}
        alt={image.title}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />

      {/* Drag handle */}
      <div
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="bg-background/80 backdrop-blur-sm rounded p-0.5">
          <GripVertical className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-6 w-6"
          onClick={e => { e.stopPropagation(); setShowTagEditor(!showTagEditor); }}
        >
          <Tag className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-6 w-6"
          onClick={e => { e.stopPropagation(); onRemove(); }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Tags */}
      {image.tags && image.tags.length > 0 && (
        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
          {image.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-background/80 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
          {image.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-background/80">
              +{image.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Source indicator */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-background/80 backdrop-blur-sm">
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
}

export const DraggableImageGrid = ({
  images, onReorder, onRemoveImage, onUpdateTags,
  selectedImages, onToggleSelection, selectionMode, sectionId, tagFilter,
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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
