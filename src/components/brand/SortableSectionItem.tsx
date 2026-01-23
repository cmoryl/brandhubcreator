import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableSectionItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isHidden?: boolean;
  isAdmin?: boolean;
  onClick: () => void;
  onToggleVisibility?: () => void;
}

export const SortableSectionItem = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  isHidden = false,
  isAdmin = false,
  onClick,
  onToggleVisibility
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
        "flex items-center gap-1 rounded-lg transition-all duration-200 group",
        isDragging && "opacity-50 z-50 scale-105",
        isHidden && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors duration-200"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        onClick={onClick}
        className={cn(
          "flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-200",
          isActive 
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1",
          isHidden && "line-through"
        )}
      >
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isActive && "scale-110"
        )} />
        <span className="truncate flex-1 text-left">{label}</span>
      </button>
      {isAdmin && onToggleVisibility && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={cn(
            "p-1 rounded-md transition-colors",
            isHidden 
              ? "text-muted-foreground hover:text-foreground hover:bg-secondary" 
              : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary opacity-0 group-hover:opacity-100"
          )}
          aria-label={isHidden ? "Show section" : "Hide section"}
        >
          {isHidden ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
};