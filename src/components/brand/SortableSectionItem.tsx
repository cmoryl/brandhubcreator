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
        "relative flex items-center gap-0.5 rounded-lg transition-all duration-200 group pr-1",
        isDragging && "opacity-50 z-50 scale-105",
        isHidden && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground/70 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors duration-200 shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onClick}
        className={cn(
          // Reserve room for the eye icon so it never gets clipped by narrow sidebars
          "flex-1 min-w-0 flex items-center gap-2 px-2 py-2 pr-9 rounded-lg text-sm transition-all duration-200",
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
            // Absolute positioning ensures this never gets pushed offscreen/clipped.
            // Always visible with clear background - not hidden on hover
            "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors z-10",
            "bg-sidebar-accent/40", // Always show a subtle background so icon is visible
            isHidden 
              ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/20" 
              : "text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent"
          )}
          aria-label={isHidden ? "Show section" : "Hide section"}
          title={isHidden ? "Section hidden from viewers - click to show" : "Click to hide from viewers"}
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};