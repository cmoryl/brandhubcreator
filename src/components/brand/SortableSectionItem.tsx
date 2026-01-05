import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionId } from '@/types/brand';

interface SortableSectionItemProps {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

export const SortableSectionItem = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}: SortableSectionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-lg transition-colors group",
        isDragging && "opacity-50 z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        onClick={onClick}
        className={cn(
          "flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
          isActive 
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
};