import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableSectionItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isHidden?: boolean;
  isAdmin?: boolean;
  isFavorited?: boolean;
  showFavorites?: boolean;
  onFavoriteToggle?: () => void;
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
  isFavorited = false,
  showFavorites = false,
  onFavoriteToggle,
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
      {/* Favorite star (when favorites mode is shown) */}
      {showFavorites && onFavoriteToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className={cn(
            "shrink-0 p-1 rounded transition-colors",
            isFavorited
              ? "text-amber-500 hover:text-amber-600"
              : "text-muted-foreground/30 hover:text-amber-500"
          )}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("h-3 w-3", isFavorited && "fill-current")} />
        </button>
      )}

      {isAdmin && onToggleVisibility && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={cn(
            "shrink-0 p-1 rounded transition-colors",
            "bg-primary/10 hover:bg-primary/20",
            "text-primary hover:text-primary"
          )}
          aria-label={isHidden ? "Show section" : "Hide section"}
          title={isHidden ? "Section hidden from viewers - click to show" : "Click to hide from viewers"}
        >
          {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      )}

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
          "flex-1 min-w-0 flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1",
          isHidden && "line-through"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isActive && "scale-110"
          )}
        />
        <span className="truncate flex-1 text-left">{label}</span>
        {/* Small favorite indicator when not in favorites mode */}
        {!showFavorites && isFavorited && (
          <Star className="h-3 w-3 text-amber-500 fill-current shrink-0" />
        )}
      </button>
    </div>
  );
};