import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Package, Layers, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useBrands } from '@/contexts/BrandContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface GuideItem {
  id: string;
  name: string;
  guide_data: unknown;
  type: 'brand' | 'product';
}

interface LinkedGuide {
  id: string;
  guideId: string;
  guideType: 'brand' | 'product';
}

interface ProductsSectionProps {
  brandId: string;
  linkedGuides?: LinkedGuide[];
  onLinkedGuidesChange?: (guides: LinkedGuide[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const ProductsSection = ({ 
  brandId, 
  linkedGuides = [],
  onLinkedGuidesChange,
  customSubtitle, 
  onSubtitleChange 
}: ProductsSectionProps) => {
  const [allGuides, setAllGuides] = useState<GuideItem[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<GuideItem[]>([]);
  const [availableGuides, setAvailableGuides] = useState<GuideItem[]>([]);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addProduct, brands } = useBrands();

  useEffect(() => {
    fetchGuides();
  }, [brandId, linkedGuides]);

  const fetchGuides = async () => {
    setIsLoading(true);
    try {
      // Fetch products linked via parent_brand_id
      const { data: linkedByParent, error: linkedError } = await supabase
        .from('products')
        .select('id, name, guide_data')
        .eq('parent_brand_id', brandId);

      if (linkedError) throw linkedError;

      // Fetch all products not linked to any brand (available to link)
      const { data: availableProducts, error: availableError } = await supabase
        .from('products')
        .select('id, name, guide_data')
        .is('parent_brand_id', null);

      if (availableError) throw availableError;

      // Fetch all brands except current one
      const { data: allBrands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, guide_data')
        .neq('id', brandId);

      if (brandsError) throw brandsError;

      // Combine linked products with manually linked guides
      const linkedProductItems: GuideItem[] = (linkedByParent || []).map(p => ({
        ...p,
        type: 'product' as const
      }));

      // Get manually linked guides from linkedGuides prop
      const manuallyLinkedIds = linkedGuides.map(lg => lg.guideId);
      
      // Fetch manually linked brands
      const manuallyLinkedBrands = (allBrands || [])
        .filter(b => manuallyLinkedIds.includes(b.id))
        .map(b => ({ ...b, type: 'brand' as const }));

      // Fetch manually linked products (that aren't already linked via parent_brand_id)
      const manuallyLinkedProducts = (availableProducts || [])
        .filter(p => manuallyLinkedIds.includes(p.id))
        .map(p => ({ ...p, type: 'product' as const }));

      // Combine all linked items
      const allLinked = [
        ...linkedProductItems,
        ...manuallyLinkedBrands,
        ...manuallyLinkedProducts
      ];

      // Remove duplicates
      const uniqueLinked = allLinked.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      setLinkedProducts(uniqueLinked);

      // Available guides = all brands + unlinked products, minus what's already linked
      const linkedIds = uniqueLinked.map(l => l.id);
      const availableBrandItems: GuideItem[] = (allBrands || [])
        .filter(b => !linkedIds.includes(b.id))
        .map(b => ({ ...b, type: 'brand' as const }));
      
      const availableProductItems: GuideItem[] = (availableProducts || [])
        .filter(p => !linkedIds.includes(p.id))
        .map(p => ({ ...p, type: 'product' as const }));

      setAvailableGuides([...availableBrandItems, ...availableProductItems]);
      setAllGuides([...availableBrandItems, ...availableProductItems]);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to load guides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    
    setIsCreating(true);
    try {
      const product = await addProduct(newProductName.trim(), brandId);
      if (product) {
        toast.success('Product guide created and linked');
        setNewProductName('');
        setIsCreateDialogOpen(false);
        fetchGuides();
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
    if (!guide) return;

    if (guide.type === 'product') {
      // For products, update parent_brand_id
      try {
        const { error } = await supabase
          .from('products')
          .update({ parent_brand_id: brandId })
          .eq('id', guideId);

        if (error) throw error;
        toast.success('Product guide linked');
        fetchGuides();
      } catch (error) {
        console.error('Error linking product:', error);
        toast.error('Failed to link product guide');
      }
    } else {
      // For brands, add to linkedGuides
      if (onLinkedGuidesChange) {
        const newLinkedGuide: LinkedGuide = {
          id: crypto.randomUUID(),
          guideId: guideId,
          guideType: 'brand'
        };
        onLinkedGuidesChange([...linkedGuides, newLinkedGuide]);
        toast.success('Brand guide linked');
      }
    }
  };

  const unlinkGuide = async (guide: GuideItem) => {
    if (guide.type === 'product') {
      // Check if linked via parent_brand_id or manually
      const isLinkedViaParent = linkedProducts.some(p => 
        p.id === guide.id && p.type === 'product'
      );

      if (isLinkedViaParent) {
        try {
          const { error } = await supabase
            .from('products')
            .update({ parent_brand_id: null })
            .eq('id', guide.id);

          if (error) throw error;
          toast.success('Product guide unlinked');
          fetchGuides();
        } catch (error) {
          console.error('Error unlinking product:', error);
          toast.error('Failed to unlink product guide');
        }
      }
    }

    // Also remove from manual links if present
    if (onLinkedGuidesChange) {
      const filtered = linkedGuides.filter(lg => lg.guideId !== guide.id);
      if (filtered.length !== linkedGuides.length) {
        onLinkedGuidesChange(filtered);
        if (guide.type === 'brand') {
          toast.success('Brand guide unlinked');
        }
      }
    }
  };

  const openGuide = (guide: GuideItem) => {
    if (guide.type === 'brand') {
      navigate(`/brand/${guide.id}`);
    } else {
      navigate(`/product/${guide.id}`);
    }
  };

  const availableBrands = availableGuides.filter(g => g.type === 'brand');
  const availableProducts = availableGuides.filter(g => g.type === 'product');

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Product Guides"
            defaultSubtitle="Brand and product guides linked to this brand"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        
        <div className="flex items-center gap-2">
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
                {availableProducts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      Product Guides
                    </SelectLabel>
                    {availableProducts.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">Product</Badge>
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Product Guide
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : linkedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {linkedProducts.map((guide, index) => {
            const guideData = guide.guide_data as any;
            const heroImage = guideData?.hero?.coverImage || guideData?.hero?.logoUrl;
            const logoUrl = guideData?.hero?.logoUrl;
            const tagline = guideData?.hero?.tagline;
            const primaryColor = guideData?.colors?.[0]?.hex;
            
            return (
              <div
                key={guide.id}
                className="group relative bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => openGuide(guide)}
              >
                {/* Guide Image/Cover */}
                <div 
                  className="relative h-40 overflow-hidden"
                  style={{ 
                    background: heroImage 
                      ? `url(${heroImage}) center/cover` 
                      : primaryColor 
                        ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)` 
                        : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                  }}
                >
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant={guide.type === 'brand' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {guide.type === 'brand' ? (
                        <><Layers className="h-3 w-3 mr-1" />Brand</>
                      ) : (
                        <><Package className="h-3 w-3 mr-1" />Product</>
                      )}
                    </Badge>
                  </div>
                  
                  {/* Logo overlay if different from cover */}
                  {logoUrl && heroImage !== logoUrl && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 bg-background/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                      <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  
                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGuide(guide);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-destructive hover:text-white hover:border-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unlink {guide.type === 'brand' ? 'Brand' : 'Product'} Guide</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "{guide.name}" from this brand guide. The {guide.type} guide itself will not be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => unlinkGuide(guide)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Unlink
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Guide Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                    {guide.name}
                  </h3>
                  {tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {tagline}
                    </p>
                  )}
                  
                  {/* Color swatches preview */}
                  {guideData?.colors?.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {guideData.colors.slice(0, 5).map((color: any, i: number) => (
                        <div 
                          key={i}
                          className="w-5 h-5 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                      {guideData.colors.length > 5 && (
                        <span className="text-xs text-muted-foreground self-center ml-1">
                          +{guideData.colors.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No guides linked</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Link existing brand or product guides, or create a new product guide.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Product Guide
            </Button>
          </div>
          {availableGuides.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Or use the dropdown above to link existing guides.
            </p>
          )}
        </div>
      )}
    </section>
  );
};