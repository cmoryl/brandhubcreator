/**
 * SortableLibraryCard - Draggable icon library card for reordering
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  Pencil, 
  Plus, 
  X,
  GripVertical,
  Building2,
  Package,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG = {
  core: {
    label: 'Core Icons',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  product_line: {
    label: 'Product Line Icons',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  brand: {
    label: 'Brand-Specific Icons',
    icon: Layers,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
};

interface SortableLibraryCardProps {
  library: IconLibrary;
  onEdit: (library: IconLibrary) => void;
  onDelete: (id: string) => void;
  onAddIcons: (library: IconLibrary) => void;
  onToggleActive: (library: IconLibrary) => void;
  onRemoveIcon: (library: IconLibrary, iconId: string) => void;
}

export const SortableLibraryCard = ({
  library,
  onEdit,
  onDelete,
  onAddIcons,
  onToggleActive,
  onRemoveIcon,
}: SortableLibraryCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: library.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = LEVEL_CONFIG[library.level];
  const IconComponent = config.icon;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all',
        !library.is_active && 'opacity-50',
        isDragging && 'opacity-70 shadow-lg ring-2 ring-primary/50 z-50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className={cn('p-1.5 rounded-md', config.bgColor)}>
              <IconComponent className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <CardTitle className="text-base">{library.name}</CardTitle>
              {library.description && (
                <CardDescription className="text-xs mt-0.5">
                  {library.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {library.icons.length} icons
            </Badge>
            <Switch
              checked={library.is_active}
              onCheckedChange={() => onToggleActive(library)}
              className="scale-75"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Icon Preview Grid */}
        {library.icons.length > 0 ? (
          <div className="grid grid-cols-8 gap-2 mb-3">
            {library.icons.slice(0, 16).map((icon) => (
              <div
                key={icon.id}
                className="group relative aspect-square border rounded-md flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors"
                title={icon.name}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {icon.svgPath.includes('<') ? (
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: icon.svgPath }}
                    />
                  ) : (
                    <svg viewBox={icon.viewBox || '0 0 24 24'} className="w-full h-full">
                      <path 
                        d={icon.svgPath} 
                        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
                        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => onRemoveIcon(library, icon.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {library.icons.length > 16 && (
              <div className="aspect-square border rounded-md flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                +{library.icons.length - 16}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg mb-3">
            No icons added yet
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddIcons(library)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Icons
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(library)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Icon Library</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{library.name}"? This will remove all {library.icons.length} icons in this library.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(library.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
