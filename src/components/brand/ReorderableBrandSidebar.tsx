import { useState } from 'react';
import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, Globe,
  FolderArchive, Ban, FileText, BookOpen, FileType, Video, Quote, Package, Briefcase, LayoutGrid, TrendingUp, BarChart3, Presentation, Calendar, Award, ImageIcon, Crown, Maximize, Star
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

// Section metadata - canonical labels and icons for each section
// NOTE: casestudies and templates are deprecated aliases, kept only for backwards compatibility
export const sectionMeta: Record<SectionId, { label: string; icon: React.ElementType; category: string }> = {
  hero: { label: 'Identity Shield', icon: Shield, category: 'Identity' },
  tagline: { label: 'Corporate Tagline', icon: Quote, category: 'Identity' },
  identity: { label: 'Narrative Architecture', icon: Scroll, category: 'Identity' },
  values: { label: 'Philosophical Pillars', icon: Heart, category: 'Identity' },
  bythenumbers: { label: 'By the Numbers', icon: BarChart3, category: 'Identity' },
  services: { label: 'Our Services', icon: Briefcase, category: 'Identity' },
  revenue: { label: 'Revenue Growth', icon: TrendingUp, category: 'Identity' },
  awards: { label: 'Awards & Recognition', icon: Award, category: 'Identity' },
  brief: { label: 'Brand Brief', icon: FileText, category: 'Identity' },
  locations: { label: 'Global Locations', icon: Globe, category: 'Identity' },
  logos: { label: 'Logos', icon: Image, category: 'Visual' },
  brandicon: { label: 'Symbol Standards', icon: Bookmark, category: 'Visual' },
  colors: { label: 'Color Palette', icon: Palette, category: 'Visual' },
  gradients: { label: 'Gradients', icon: Blend, category: 'Visual' },
  patterns: { label: 'Geometric Primitives', icon: Grid3X3, category: 'Visual' },
  typography: { label: 'Type Registry', icon: Type, category: 'Typography' },
  textstyles: { label: 'CSS Hierarchies', icon: Code, category: 'Typography' },
  iconography: { label: 'Iconography', icon: Layers, category: 'Assets' },
  socialicons: { label: 'Platform Markers', icon: Share2, category: 'Assets' },
  imagery: { label: 'Visual Direction', icon: Camera, category: 'Assets' },
  social: { label: 'Social Registry', icon: Users, category: 'Communication' },
  socialassets: { label: 'Social Assets & Guidelines', icon: LayoutGrid, category: 'Communication' },
  website: { label: 'Website', icon: Globe, category: 'Communication' },
  signatures: { label: 'Signature Protocol', icon: Mail, category: 'Communication' },
  qr: { label: 'QR Codes', icon: QrCode, category: 'Communication' },
  videos: { label: 'Video Resources', icon: Video, category: 'Resources' },
  webinars: { label: 'Webinar Series', icon: Presentation, category: 'Resources' },
  assets: { label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  imageassets: { label: 'Image Assets', icon: ImageIcon, category: 'Resources' },
  misuse: { label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  insights: { label: 'Insights & Updates', icon: TrendingUp, category: 'Resources' },
  brochures: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templatespecs: { label: 'Template Specs', icon: FileText, category: 'Collateral' },
  presentations: { label: 'Presentation Templates', icon: Presentation, category: 'Collateral' },
  products: { label: 'Products', icon: Package, category: 'Collateral' },
  events: { label: 'Events', icon: Calendar, category: 'Collateral' },
  universe: { label: 'Product Universe', icon: Globe, category: 'Collateral' },
  sponsorlogos: { label: 'Sponsor Logos', icon: Crown, category: 'Collateral' },
  clientlogos: { label: 'Client Logos', icon: Users, category: 'Collateral' },
  eventsignage: { label: 'Event Signage', icon: Maximize, category: 'Collateral' },
  socialmetrics: { label: 'Social Performance', icon: TrendingUp, category: 'Communication' },
  approvedimagery: { label: 'Approved Imagery', icon: ImageIcon, category: 'Assets' },
  // Deprecated aliases - kept for backwards compatibility with old section orders
  casestudies: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templates: { label: 'Presentation Templates', icon: Presentation, category: 'Collateral' },
  studios: { label: 'Our Studios', icon: Building2, category: 'Ecosystem' },
};

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