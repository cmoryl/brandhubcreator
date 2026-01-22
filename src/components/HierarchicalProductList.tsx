import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Package, Palette, Type, Image, Clock, Star, Upload, Trash2, ArrowRight, Layers, GitBranch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProductGuide, LinkedGuideReference } from '@/types/brand';
import { cn } from '@/lib/utils';

interface HierarchicalProductListProps {
  products: ProductGuide[];
  canEdit: boolean;
  isRecentlyUpdated: (item: ProductGuide) => boolean;
  toggleFavorite: (id: string, type: 'product') => void;
  onDeleteClick: (id: string, type: 'product', e: React.MouseEvent) => void;
  onImageUpload: (productId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
}

interface ProductHierarchy {
  parent: ProductGuide;
  children: ProductGuide[];
}

export const HierarchicalProductList = ({
  products,
  canEdit,
  isRecentlyUpdated,
  toggleFavorite,
  onDeleteClick,
  onImageUpload,
  fileInputRefs,
}: HierarchicalProductListProps) => {
  const navigate = useNavigate();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // Build hierarchy: find parent products (those with linkedGuides) and their children
  const { hierarchies, standaloneProducts } = useMemo(() => {
    const childIds = new Set<string>();
    const parentMap = new Map<string, ProductHierarchy>();

    // First pass: identify all products that have linked guides (parents)
    products.forEach(product => {
      const linkedGuides = (product as any).linkedGuides as LinkedGuideReference[] | undefined;
      if (linkedGuides && linkedGuides.length > 0) {
        // This is a parent product
        const childProducts: ProductGuide[] = [];
        linkedGuides.forEach(link => {
          if (link.guideType === 'product') {
            const child = products.find(p => p.id === link.guideId);
            if (child) {
              childProducts.push(child);
              childIds.add(child.id);
            }
          }
        });
        if (childProducts.length > 0) {
          parentMap.set(product.id, {
            parent: product,
            children: childProducts,
          });
        }
      }
    });

    // Build hierarchies array
    const hierarchies: ProductHierarchy[] = [];
    parentMap.forEach((hierarchy) => {
      // Only include if parent is not itself a child of another product
      if (!childIds.has(hierarchy.parent.id)) {
        hierarchies.push(hierarchy);
      }
    });

    // Sort hierarchies by parent name
    hierarchies.sort((a, b) => a.parent.hero.name.localeCompare(b.parent.hero.name));

    // Find standalone products (not a parent with children, and not a child)
    const standaloneProducts = products.filter(p => 
      !parentMap.has(p.id) && !childIds.has(p.id)
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { hierarchies, standaloneProducts };
  }, [products]);

  const toggleExpand = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const triggerImageUpload = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = fileInputRefs.current.get(productId);
    if (input) {
      input.click();
    }
  };

  const renderProductCard = (product: ProductGuide, index: number, isChild: boolean = false) => (
    <Card 
      key={product.id}
      className={cn(
        "group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg hover-lift card-animate",
        isChild && "border-l-4 border-l-primary/30"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <CardContent className="p-0">
        {/* Cover Image / Color Preview */}
        <div className={cn("relative overflow-hidden", isChild ? "h-32" : "h-44")}>
          {product.hero.coverImage ? (
            <OptimizedImage 
              src={product.hero.coverImage} 
              alt={product.hero.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              objectFit="cover"
              priority={index < 3}
            />
          ) : (
            <div className="w-full h-full flex">
              {product.colors.length > 0 ? (
                product.colors.slice(0, 4).map((color) => (
                  <div 
                    key={color.id} 
                    className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                    style={{ backgroundColor: color.hex }}
                  />
                ))
              ) : (
                <div className="flex-1 bg-gradient-to-br from-muted to-muted/50" />
              )}
            </div>
          )}
          
          {/* Recently Updated Badge */}
          {isRecentlyUpdated(product) && (
            <Badge className="absolute top-3 right-12 gap-1 bg-accent text-accent-foreground">
              <Clock className="h-3 w-3" />
              Recently Updated
            </Badge>
          )}

          {/* Favorite Button */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-3 right-3 h-8 w-8 ${product.isFavorite ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' : 'bg-white/90 hover:bg-white'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id, 'product');
            }}
          >
            <Star className={`h-4 w-4 ${product.isFavorite ? 'fill-current' : ''}`} />
          </Button>

          {/* Product Badge */}
          <Badge variant="secondary" className={cn("absolute top-3 left-3 gap-1", isChild && "bg-primary/10 text-primary")}>
            {isChild ? <GitBranch className="h-3 w-3" /> : <Package className="h-3 w-3" />}
            {isChild ? 'Sub-Product' : 'Product'}
          </Badge>

          {/* Overlay Actions - Only show for admins */}
          {canEdit && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <input
                ref={(el) => { if (el) fileInputRefs.current.set(product.id, el); }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onImageUpload(product.id, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={(e) => triggerImageUpload(product.id, e)}
              >
                <Upload className="h-3.5 w-3.5" />
                {product.hero.coverImage ? 'Change' : 'Add'} Cover
              </Button>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className={cn("p-5", isChild && "p-4")}>
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className={cn("font-semibold text-foreground truncate", isChild ? "text-lg" : "text-xl")}>
                {product.hero.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {product.hero.tagline}
              </p>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                onClick={(e) => onDeleteClick(product.id, 'product', e)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{product.colors.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
              <Type className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{product.typography.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
              <Image className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{product.logos.length}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Updated {product.updatedAt.toLocaleDateString()}
            </p>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Parent Products with Children */}
      {hierarchies.map((hierarchy, hierIndex) => {
        const isExpanded = expandedParents.has(hierarchy.parent.id);
        
        return (
          <div key={hierarchy.parent.id} className="space-y-4">
            {/* Parent Product Header */}
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(hierarchy.parent.id)}>
              <div className="flex items-center gap-4">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <Layers className="h-4 w-4" />
                    <span className="font-medium">{hierarchy.children.length} Sub-Products</span>
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Parent Card - Always visible */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {/* Parent with special styling */}
                <Card 
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden bg-card shadow-lg hover-lift card-animate ring-2 ring-primary/20"
                  onClick={() => navigate(`/product/${hierarchy.parent.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="relative h-44 overflow-hidden">
                      {hierarchy.parent.hero.coverImage ? (
                        <OptimizedImage 
                          src={hierarchy.parent.hero.coverImage} 
                          alt={hierarchy.parent.hero.name}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          objectFit="cover"
                          priority={hierIndex < 2}
                        />
                      ) : (
                        <div className="w-full h-full flex">
                          {hierarchy.parent.colors.length > 0 ? (
                            hierarchy.parent.colors.slice(0, 4).map((color) => (
                              <div 
                                key={color.id} 
                                className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                                style={{ backgroundColor: color.hex }}
                              />
                            ))
                          ) : (
                            <div className="flex-1 bg-gradient-to-br from-muted to-muted/50" />
                          )}
                        </div>
                      )}
                      
                      {isRecentlyUpdated(hierarchy.parent) && (
                        <Badge className="absolute top-3 right-12 gap-1 bg-accent text-accent-foreground">
                          <Clock className="h-3 w-3" />
                          Recently Updated
                        </Badge>
                      )}

                      <Button
                        variant="secondary"
                        size="icon"
                        className={`absolute top-3 right-3 h-8 w-8 ${hierarchy.parent.isFavorite ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' : 'bg-white/90 hover:bg-white'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(hierarchy.parent.id, 'product');
                        }}
                      >
                        <Star className={`h-4 w-4 ${hierarchy.parent.isFavorite ? 'fill-current' : ''}`} />
                      </Button>

                      <Badge className="absolute top-3 left-3 gap-1 bg-primary text-primary-foreground">
                        <Layers className="h-3 w-3" />
                        Parent Product
                      </Badge>

                      {canEdit && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <input
                            ref={(el) => { if (el) fileInputRefs.current.set(hierarchy.parent.id, el); }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onImageUpload(hierarchy.parent.id, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => triggerImageUpload(hierarchy.parent.id, e)}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {hierarchy.parent.hero.coverImage ? 'Change' : 'Add'} Cover
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate text-xl">
                            {hierarchy.parent.hero.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {hierarchy.parent.hero.tagline}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                            onClick={(e) => onDeleteClick(hierarchy.parent.id, 'product', e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{hierarchy.parent.colors.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Type className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{hierarchy.parent.typography.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Image className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{hierarchy.parent.logos.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md">
                          <GitBranch className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">{hierarchy.children.length}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Updated {hierarchy.parent.updatedAt.toLocaleDateString()}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Children - Collapsible */}
              <CollapsibleContent>
                <div className="mt-4 pl-4 sm:pl-8 border-l-2 border-primary/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {hierarchy.children.map((child, childIndex) => 
                      renderProductCard(child, childIndex, true)
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}

      {/* Standalone Products */}
      {standaloneProducts.length > 0 && (
        <div className="space-y-4">
          {hierarchies.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Other Products</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {standaloneProducts.map((product, index) => 
              renderProductCard(product, index, false)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
