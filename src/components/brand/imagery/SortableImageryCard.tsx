/**
 * SortableImageryCard - Draggable image card for Visual Direction reordering
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Pencil, GripVertical } from 'lucide-react';
import { BrandImagery } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

interface SortableImageryCardProps {
  image: BrandImagery;
  index: number;
  viewMode: 'split' | 'grid-2' | 'grid-3' | 'grid-4';
  canEdit: boolean;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BrandImagery>) => void;
  onDelete: (id: string) => void;
  onEditDone: () => void;
}

export const SortableImageryCard = ({
  image,
  index,
  viewMode,
  canEdit,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onEditDone,
}: SortableImageryCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const borderColor = image.type === 'do' ? 'border-green-200' : 'border-red-200';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-card rounded-xl overflow-hidden shadow-sm border-2 animate-scale-in',
        borderColor,
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary/50 z-50'
      )}
    >
      <div className={`${viewMode === 'split' ? 'aspect-video' : 'aspect-square'} relative`}>
        <OptimizedImage src={image.url} alt={image.description} className="w-full h-full" objectFit="cover" />
        {image.type === 'dont' && <div className="absolute inset-0 bg-destructive/10" />}
        
        {/* Drag handle */}
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="absolute top-2 left-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(image.id)}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(image.id)}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        
        {/* Type badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${image.type === 'do' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {image.type === 'do' ? 'Do' : "Don't"}
        </div>
      </div>
      
      <div className="p-3">
        {isEditing && canEdit ? (
          <div className="space-y-2">
            <Input
              value={image.description}
              onChange={(e) => onUpdate(image.id, { description: e.target.value })}
              placeholder="Description"
              className="h-8"
            />
            <Select
              value={image.type}
              onValueChange={(type: 'do' | 'dont') => onUpdate(image.id, { type })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="do">Do</SelectItem>
                <SelectItem value="dont">Don't</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="secondary" onClick={onEditDone} className="w-full">Done</Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
        )}
      </div>
    </div>
  );
};
