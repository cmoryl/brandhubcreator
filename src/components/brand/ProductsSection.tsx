import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Layers, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { LinkedGuideCard } from './LinkedGuideCard';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useBrands } from '@/contexts/BrandContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LayoutPreset } from '@/types/brand';
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
} from '@dnd-kit/sortable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface GuideItem {
  id: string;
  name: string;
  slug?: string | null;
  guide_data?: unknown;
  type: 'brand' | 'product' | 'event';
}

interface LinkedGuide {
  id: string;
  guideId?: string;
  guideType?: 'brand' | 'product' | 'event';
  // Legacy format fields
  name?: string;
  slug?: string;
  type?: 'brand' | 'product' | 'event';
}

interface ProductsSectionProps {
  brandId?: string;
  productId?: string;
  linkedGuides?: LinkedGuide[];
  onLinkedGuidesChange?: (guides: LinkedGuide[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

export const ProductsSection = ({ 
  brandId,
  productId,
  linkedGuides = [],
  onLinkedGuidesChange,
  customSubtitle, 
  onSubtitleChange,
  layout = 'grid-4',
  onLayoutChange
}: ProductsSectionProps) => {
  // Determine the entity ID and type
  const entityId = brandId || productId || '';
  const entityType: 'brand' | 'product' = brandId ? 'brand' : 'product';
  const [allGuides, setAllGuides] = useState<GuideItem[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<GuideItem[]>([]);
  const { gridClass } = useLayoutClasses(layout);
  const [availableGuides, setAvailableGuides] = useState<GuideItem[]>([]);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addProduct, brands } = useBrands();

  useEffect(() => {
    fetchGuides({ initial: true });
    // NOTE: We intentionally *don't* depend on linkedGuides here.
    // Linking/unlinking performs an optimistic UI update so cards appear instantly.
    // A full refetch on each linkedGuides change caused noticeable loading flicker.
  }, [entityId]);

  const fetchGuides = async ({ initial = false }: { initial?: boolean } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      // Fetch products, brands, and events in parallel
      const [
        { data: linkedByParent, error: linkedError },
        { data: availableProducts, error: availableError },
        { data: allBrands, error: brandsError },
        { data: allEvents, error: eventsError },
      ] = await Promise.all([
        // Only fetch by parent_brand_id if we're on a brand
        entityType === 'brand' 
          ? supabase.from('products').select('id, name, slug').eq('parent_brand_id', entityId)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('products')
          .select('id, name, slug')
          .neq('id', entityId),
        supabase
          .from('brands')
          .select('id, name, slug')
          .neq('id', entityId),
        supabase
          .from('events')
          .select('id, name, slug'),
      ]);

      if (linkedError) throw linkedError;
      if (availableError) throw availableError;
      if (brandsError) throw brandsError;
      if (eventsError) throw eventsError;

      // Combine linked products with manually linked guides
      const linkedProductItems: GuideItem[] = (linkedByParent || []).map(p => ({
        ...p,
        type: 'product' as const
      }));

      // Get manually linked guides from linkedGuides prop
      // Handle both formats: legacy {id, name, type} and new {id, guideId, guideType}
      const manuallyLinkedIds = linkedGuides.map(lg => lg.guideId || lg.id);
      
      // Fetch manually linked brands
      const manuallyLinkedBrands = (allBrands || [])
        .filter(b => manuallyLinkedIds.includes(b.id))
        .map(b => ({ ...b, type: 'brand' as const }));

      // Fetch manually linked products (that aren't already linked via parent_brand_id)
      const manuallyLinkedProducts = (availableProducts || [])
        .filter(p => manuallyLinkedIds.includes(p.id))
        .map(p => ({ ...p, type: 'product' as const }));

      // Fetch manually linked events
      const manuallyLinkedEvents = (allEvents || [])
        .filter(e => manuallyLinkedIds.includes(e.id))
        .map(e => ({ ...e, type: 'event' as const }));

      // Combine all linked items
      const allLinked = [
        ...linkedProductItems,
        ...manuallyLinkedBrands,
        ...manuallyLinkedProducts,
        ...manuallyLinkedEvents
      ];

      // Remove duplicates
      const uniqueLinked = allLinked.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      setLinkedProducts(uniqueLinked);

      // Available guides = all brands + unlinked products + unlinked events, minus what's already linked
      const linkedIds = uniqueLinked.map(l => l.id);
      const availableBrandItems: GuideItem[] = (allBrands || [])
        .filter(b => !linkedIds.includes(b.id))
        .map(b => ({ ...b, type: 'brand' as const }));
      
      const availableProductItems: GuideItem[] = (availableProducts || [])
        .filter(p => !linkedIds.includes(p.id))
        .map(p => ({ ...p, type: 'product' as const }));

      const availableEventItems: GuideItem[] = (allEvents || [])
        .filter(e => !linkedIds.includes(e.id))
        .map(e => ({ ...e, type: 'event' as const }));

      setAvailableGuides([...availableBrandItems, ...availableProductItems, ...availableEventItems]);
      setAllGuides([...availableBrandItems, ...availableProductItems, ...availableEventItems]);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to load guides');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    
    setIsCreating(true);
    try {
      // For brands, use brandId; for products, pass undefined (no parent link via DB)
      const parentBrandId = entityType === 'brand' ? entityId : undefined;
      const product = await addProduct(newProductName.trim(), parentBrandId);
      if (product) {
        // If we're on a product, manually link the new product via linkedGuides
        if (entityType === 'product' && onLinkedGuidesChange) {
          const newLinkedGuide: LinkedGuide = {
            id: crypto.randomUUID(),
            guideId: product.id,
            guideType: 'product'
          };
          onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
        }
        toast.success('Product guide created and linked');
        setNewProductName('');
        setIsCreateDialogOpen(false);
        // Keep cards visible; refresh in the background
        fetchGuides({ initial: false });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product guide');
    } finally {
      setIsCreating(false);
    }
  };

  const linkGuide = async (guideId: string) => {
    const guide = availableGuides.find(g => g.id === guideId);
    if (!guide) {
      console.error('Guide not found:', guideId);
      return;
    }

    // For products as parent, always use linkedGuides (no parent_brand_id relationship)
    // For brands as parent, use parent_brand_id for product links + linkedGuides for brands/events
    if (entityType === 'product' || guide.type === 'brand' || guide.type === 'event') {
      // Use linkedGuides for all links when parent is a product, or for brand-to-brand/event links
      if (onLinkedGuidesChange) {
        const newLinkedGuide: LinkedGuide = {
          id: crypto.randomUUID(),
          guideId: guideId,
          guideType: guide.type
        };
        onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
        
        // Immediately update local state for instant UI feedback
        setLinkedProducts(prev => [...prev, guide]);
        setAvailableGuides(prev => prev.filter(g => g.id !== guideId));
        
        const typeLabel = guide.type === 'brand' ? 'Brand' : guide.type === 'event' ? 'Event' : 'Product';
        toast.success(`${typeLabel} guide linked`);
      } else {
        toast.error('Unable to link guide - handler not available');
      }
    } else {
      // Brand -> Product: use parent_brand_id
      try {
        const { error } = await supabase
          .from('products')
          .update({ parent_brand_id: entityId })
          .eq('id', guideId);

        if (error) throw error;
        
        // Immediately update local state for instant UI feedback
        setLinkedProducts(prev => [...prev, guide]);
        setAvailableGuides(prev => prev.filter(g => g.id !== guideId));
        
        // Also add to linkedGuides for persistence
        if (onLinkedGuidesChange) {
          const newLinkedGuide: LinkedGuide = {
            id: crypto.randomUUID(),
            guideId: guideId,
            guideType: 'product'
          };
          onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
        }
        
        toast.success('Product guide linked');
      } catch (error) {
        console.error('Error linking product:', error);
        toast.error('Failed to link product guide');
      }
    }
  };

  const unlinkGuide = async (guide: GuideItem) => {
    try {
      if (guide.type === 'product') {
        // Check if linked via parent_brand_id
        const isLinkedViaParent = entityType === 'brand';

        if (isLinkedViaParent) {
          const { error } = await supabase
            .from('products')
            .update({ parent_brand_id: null })
            .eq('id', guide.id);

          if (error) throw error;
        }
      }

      // Always remove from manual links
      if (onLinkedGuidesChange) {
        const filtered = linkedGuides.filter(lg => (lg.guideId || lg.id) !== guide.id);
        onLinkedGuidesChange(filtered);
      }

      // Optimistic UI update
      setLinkedProducts(prev => prev.filter(p => p.id !== guide.id));
      setAvailableGuides(prev => [...prev, guide]);
      
      const typeLabel = guide.type === 'brand' ? 'Brand' : guide.type === 'event' ? 'Event' : 'Product';
      toast.success(`${typeLabel} guide unlinked`);
    } catch (error) {
      console.error('Error unlinking guide:', error);
      toast.error('Failed to unlink guide');
      // Refresh to restore correct state
      fetchGuides({ initial: false });
    }
  };

  const openGuide = useCallback((guide: GuideItem) => {
    if (guide.type === 'brand') {
      navigate(`/brand/${guide.slug || guide.id}`);
    } else if (guide.type === 'event') {
      navigate(`/event/${guide.slug || guide.id}`);
    } else {
      navigate(`/product/${guide.slug || guide.id}`);
    }
  }, [navigate]);

  // DnD sensors
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

  // Handle drag end - reorder the guides
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = linkedProducts.findIndex(g => g.id === active.id);
      const newIndex = linkedProducts.findIndex(g => g.id === over.id);

      const reordered = arrayMove(linkedProducts, oldIndex, newIndex);
      setLinkedProducts(reordered);

      // Persist the order to linkedGuides
      if (onLinkedGuidesChange) {
        // Create new linkedGuides array with proper order
        const newLinkedGuides: LinkedGuide[] = reordered.map(guide => {
          // Check if this guide is already in linkedGuides
          const existing = linkedGuides.find(lg => (lg.guideId || lg.id) === guide.id);
          if (existing) {
            return existing;
          }
          // For products linked via parent_brand_id, create a reference
          return {
            id: crypto.randomUUID(),
            guideId: guide.id,
            guideType: guide.type,
          };
        });
        onLinkedGuidesChange(newLinkedGuides);
      }
    }
  }, [linkedProducts, linkedGuides, onLinkedGuidesChange]);

  const availableBrands = availableGuides.filter(g => g.type === 'brand');
  const availableProductsList = availableGuides.filter(g => g.type === 'product');
  const availableEventsList = availableGuides.filter(g => g.type === 'event');

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Mobile-optimized header with stacked layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Linked Guides"
            defaultSubtitle="Brand, product, and event guides linked to this brand"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        
        {/* Controls - stack on mobile, inline on desktop - only show for admins */}
        {onLinkedGuidesChange && (
          <div className="flex flex-wrap items-center gap-2">
            {onLayoutChange && (
              <LayoutSelector
                value={layout}
                onChange={onLayoutChange}
                availableLayouts={['grid-2', 'grid-3', 'grid-4', 'large-cards']}
                size="sm"
              />
            )}
            {availableGuides.length > 0 && (
              <Select onValueChange={linkGuide}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Link existing guide..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        Brand Guides
                      </SelectLabel>
                      {availableBrands.map((guide) => (
                        <SelectItem key={guide.id} value={guide.id}>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">Brand</Badge>
                            {guide.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {availableProductsList.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        Product Guides
                      </SelectLabel>
                      {availableProductsList.map((guide) => (
                        <SelectItem key={guide.id} value={guide.id}>
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">Product</Badge>
                            {guide.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {availableEventsList.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Event Guides
                      </SelectLabel>
                      {availableEventsList.map((guide) => (
                        <SelectItem key={guide.id} value={guide.id}>
                          <span className="flex items-center gap-2">
                            <Badge className="text-xs px-1.5 py-0 bg-primary/90">Event</Badge>
                            {guide.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            )}
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="sm:inline">New Product Guide</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Product Guide</DialogTitle>
                  <DialogDescription>
                    Create a new product brand guide that will be automatically linked to this brand.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Enter product guide name..."
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProduct()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProduct} 
                    disabled={!newProductName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Guide'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 sm:h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : linkedProducts.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={linkedProducts.map(g => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className={gridClass}>
              {linkedProducts.map((guide, index) => (
                <LinkedGuideCard
                  key={guide.id}
                  guide={guide}
                  index={index}
                  onOpen={openGuide}
                  onUnlink={unlinkGuide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No guides linked</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {onLinkedGuidesChange 
              ? "Link existing brand, product, or event guides, or create a new product guide."
              : "No brand, product, or event guides are currently linked."}
          </p>
          {onLinkedGuidesChange && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Product Guide
              </Button>
            </div>
          )}
          {onLinkedGuidesChange && availableGuides.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Or use the dropdown above to link existing guides.
            </p>
          )}
        </div>
      )}

      {isRefreshing && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Updating linked guides…
        </p>
      )}
    </section>
  );
};