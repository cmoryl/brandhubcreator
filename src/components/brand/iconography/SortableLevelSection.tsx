/**
 * SortableLevelSection - Collapsible section with drag-and-drop reordering for icon libraries
 * Now supports inline brand assignment for seamless icon flow
 */

import { useMemo } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Library,
  Building2,
  Package,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { BrandGuide } from '@/types/brand';
import { SortableLibraryCard } from './SortableLibraryCard';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG = {
  core: {
    label: 'Core Icons',
    description: 'Universal icons inherited by all brands in the organization',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  product_line: {
    label: 'Product Line Icons',
    description: 'Icons for specific product lines or divisions',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  brand: {
    label: 'Brand-Specific Icons',
    description: 'Custom icons for individual brands',
    icon: Layers,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
};

interface SortableLevelSectionProps {
  level: 'core' | 'product_line' | 'brand';
  libraries: IconLibrary[];
  isExpanded: boolean;
  onToggle: () => void;
  onCreateLibrary: (level: 'core' | 'product_line' | 'brand') => void;
  onEditLibrary: (library: IconLibrary) => void;
  onDeleteLibrary: (id: string) => void;
  onAddIcons: (library: IconLibrary) => void;
  onToggleActive: (library: IconLibrary) => void;
  onRemoveIcon: (library: IconLibrary, iconId: string) => void;
  onReorder: (libraryId: string, newOrder: number) => void;
  // Brand linking
  brands?: BrandGuide[];
  getLinkedBrandIds?: (libraryId: string) => string[];
  onLinkBrand?: (libraryId: string, brandId: string) => void;
  onUnlinkBrand?: (libraryId: string, brandId: string) => void;
}

export const SortableLevelSection = ({
  level,
  libraries,
  isExpanded,
  onToggle,
  onCreateLibrary,
  onEditLibrary,
  onDeleteLibrary,
  onAddIcons,
  onToggleActive,
  onRemoveIcon,
  onReorder,
  brands = [],
  getLinkedBrandIds,
  onLinkBrand,
  onUnlinkBrand,
}: SortableLevelSectionProps) => {
  const config = LEVEL_CONFIG[level];
  const IconComponent = config.icon;
  const totalIcons = libraries.reduce((sum, lib) => sum + lib.icons.length, 0);

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

  const libraryIds = useMemo(() => libraries.map(lib => lib.id), [libraries]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = libraries.findIndex(lib => lib.id === active.id);
      const newIndex = libraries.findIndex(lib => lib.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(active.id as string, newIndex);
      }
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn('rounded-lg border', config.borderColor)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <IconComponent className={cn('h-5 w-5', config.color)} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">{config.label}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <Badge variant="secondary">{libraries.length} libraries</Badge>
                <Badge variant="outline">{totalIcons} icons</Badge>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Core level info banner */}
            {level === 'core' && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                Core icons are automatically inherited by <strong>all brands</strong> — no manual assignment needed.
              </div>
            )}
            
            {libraries.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={libraryIds} strategy={rectSortingStrategy}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {libraries.map(library => (
                      <SortableLibraryCard
                        key={library.id}
                        library={library}
                        onEdit={onEditLibrary}
                        onDelete={onDeleteLibrary}
                        onAddIcons={onAddIcons}
                        onToggleActive={onToggleActive}
                        onRemoveIcon={onRemoveIcon}
                        brands={brands}
                        linkedBrandIds={getLinkedBrandIds?.(library.id) || []}
                        onLinkBrand={onLinkBrand}
                        onUnlinkBrand={onUnlinkBrand}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Library className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No {config.label.toLowerCase()} yet</p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => onCreateLibrary(level)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add {level === 'core' ? 'Core' : level === 'product_line' ? 'Product Line' : 'Brand'} Library
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
