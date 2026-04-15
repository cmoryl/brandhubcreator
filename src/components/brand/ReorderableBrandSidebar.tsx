import { useState } from 'react';
import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, Globe,
  FolderArchive, Ban, FileText, BookOpen, FileType, Video, Quote, Package, Briefcase, LayoutGrid, TrendingUp, BarChart3, Presentation, Calendar, Award, ImageIcon, Crown, Maximize, Star, Building2
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SortableSectionItem } from './SortableSectionItem';
import { useSectionFavorites } from '@/hooks/useSectionFavorites';

interface ReorderableBrandSidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  brandName: string;
  brandId?: string;
  organizationId?: string | null;
  entityType?: 'brand' | 'product' | 'event';
  sectionOrder: SectionId[];
  onSectionOrderChange: (newOrder: SectionId[]) => void;
  hiddenSections?: SectionId[];
  onHiddenSectionsChange?: (hiddenSections: SectionId[]) => void;
  isAdmin?: boolean;
  showFavoritesOnly?: boolean;
  onShowFavoritesOnlyChange?: (show: boolean) => void;
}

// Re-export sectionMeta from extracted module for backwards compatibility
export { sectionMeta } from './sectionMeta';
import { sectionMeta } from './sectionMeta';

export const ReorderableBrandSidebar = ({ 
  activeSection, 
  onSectionChange, 
  brandName,
  brandId,
  organizationId,
  entityType = 'brand',
  sectionOrder,
  onSectionOrderChange,
  hiddenSections = [],
  onHiddenSectionsChange,
  isAdmin = false,
  showFavoritesOnly = false,
  onShowFavoritesOnlyChange,
}: ReorderableBrandSidebarProps) => {
  const [showFavoriteStars, setShowFavoriteStars] = useState(false);
  
  // Favorites hook
  const {
    isFavorited,
    toggleFavorite,
    favoriteCount,
    hasFavorites,
    isAuthenticated,
    favoritedSectionIds,
  } = useSectionFavorites({ entityType, entityId: brandId });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionId);
      const newIndex = sectionOrder.indexOf(over.id as SectionId);
      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      onSectionOrderChange(newOrder);
    }
  };

  const toggleSectionVisibility = (sectionId: SectionId) => {
    if (!onHiddenSectionsChange) return;
    
    if (hiddenSections.includes(sectionId)) {
      onHiddenSectionsChange(hiddenSections.filter(id => id !== sectionId));
    } else {
      onHiddenSectionsChange([...hiddenSections, sectionId]);
    }
  };

  // Sections excluded from sidebar navigation
  const excludedFromNav: SectionId[] = ['socialmetrics'];
  
  const visibleSections = (isAdmin 
    ? sectionOrder 
    : sectionOrder.filter(id => !hiddenSections.includes(id))
  ).filter(id => !excludedFromNav.includes(id));
    
  const displayedSections = showFavoritesOnly
    ? visibleSections.filter(id => favoritedSectionIds.has(id))
    : visibleSections;

  const visibleCount = sectionOrder.length - hiddenSections.length;

  return (
    <aside className="w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
      {/* Brand header */}
      <div className="p-4 border-b border-sidebar-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-semibold text-sidebar-foreground truncate">{brandName || 'Brand Guide'}</h2>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {showFavoritesOnly 
            ? `${favoriteCount} Favorite${favoriteCount !== 1 ? 's' : ''}`
            : `${visibleCount} of ${sectionOrder.length} Sections`}
          {isAdmin && !showFavoritesOnly && ' • Click eye to hide'}
        </p>
      </div>

      {/* Favorites filter bar */}
      {isAuthenticated && (
        <div className="px-3 py-2 border-b border-sidebar-border flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFavoritesOnly ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 gap-2 h-8 text-xs"
                onClick={() => onShowFavoritesOnlyChange?.(!showFavoritesOnly)}
                disabled={!hasFavorites && !showFavoritesOnly}
              >
                <Star className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
                {showFavoritesOnly ? 'Favorites' : 'All Sections'}
                {favoriteCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {favoriteCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showFavoritesOnly ? 'Show all sections' : 'Show only favorites'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFavoriteStars ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowFavoriteStars(!showFavoriteStars)}
              >
                <Star className={cn("h-3.5 w-3.5", showFavoriteStars && "text-amber-500")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showFavoriteStars ? 'Hide favorite controls' : 'Show favorite controls'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="p-2 pr-1">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={displayedSections} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {displayedSections.map((sectionId, index) => {
                  const meta = sectionMeta[sectionId];
                  if (!meta) return null;
                  const isHidden = hiddenSections.includes(sectionId);
                  
                  return (
                    <div 
                      key={sectionId}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                    >
                    <SortableSectionItem
                      key={sectionId}
                      id={sectionId}
                      label={meta.label}
                      icon={meta.icon}
                      isActive={activeSection === sectionId}
                      isHidden={isHidden}
                      isAdmin={isAdmin}
                      isFavorited={isFavorited(sectionId)}
                      showFavorites={showFavoriteStars}
                      onFavoriteToggle={() => toggleFavorite(sectionId)}
                      onClick={() => onSectionChange(sectionId)}
                      onToggleVisibility={() => toggleSectionVisibility(sectionId)}
                    />
                    </div>
                  );
                })}
                {showFavoritesOnly && displayedSections.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No favorites yet</p>
                    <p className="text-xs mt-1">Click the star button to add favorites</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </nav>
      </ScrollArea>

    </aside>
  );
};