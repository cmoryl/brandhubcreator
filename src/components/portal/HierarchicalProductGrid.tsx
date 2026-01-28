/**
 * Hierarchical Product Grid
 * Displays products with master products first, followed by their sub-products in collapsible sections
 */

import React, { useMemo, useState, useCallback, memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PortalProduct } from '@/hooks/usePortalData';
import { cn } from '@/lib/utils';

interface ProductHierarchy {
  masterProducts: PortalProduct[];
  subProductIds: Set<string>;
  subProductsByParent: Map<string, PortalProduct[]>;
  standaloneProducts: PortalProduct[];
}

interface SubProductCardProps {
  product: PortalProduct;
  fallbackGradient: string;
  onNavigate: (slug: string) => void;
}

// Memoized sub-product mini card - defined outside to prevent recreation
const SubProductCard = memo(({ product, fallbackGradient, onNavigate }: SubProductCardProps) => {
  const hero = product.hero || { name: product.name, tagline: '' };
  const colors = product.colors;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(product.slug || product.id);
      }}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          {/* Mini thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 ring-1 ring-border/50">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                objectFit="cover"
              />
            ) : (
              <div 
                className="w-full h-full flex"
                style={{ background: colors?.[0]?.hex || fallbackGradient }}
              />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">
              {hero.name}
            </h4>
            {hero.tagline && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {hero.tagline}
              </p>
            )}
          </div>
          
          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
});
SubProductCard.displayName = 'SubProductCard';

interface StandaloneProductCardProps {
  product: PortalProduct;
  fallbackGradient: string;
  onNavigate: (slug: string) => void;
}

// Memoized standalone product card
const StandaloneProductCard = memo(({ product, fallbackGradient, onNavigate }: StandaloneProductCardProps) => {
  const hero = product.hero || { name: product.name, tagline: '' };
  const colors = product.colors;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-md"
      onClick={() => onNavigate(product.slug || product.id)}
    >
      <CardContent className="p-0">
        <div className="relative h-32 sm:h-36 overflow-hidden">
          {hero.coverImage ? (
            <OptimizedImage 
              src={hero.coverImage} 
              alt={hero.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              objectFit="cover"
            />
          ) : (
            <div className="w-full h-full flex">
              {colors && colors.length > 0 ? (
                colors.slice(0, 4).map((color) => (
                  <div 
                    key={color.id} 
                    className="flex-1"
                    style={{ backgroundColor: color.hex }}
                  />
                ))
              ) : (
                <div className="flex-1" style={{ background: fallbackGradient }} />
              )}
            </div>
          )}
          <Badge className="absolute top-2 right-2 gap-1 bg-green-500/90 text-white text-[10px]">
            <Globe className="h-2.5 w-2.5" />
            Public
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-accent transition-colors line-clamp-1">
            {hero.name}
          </h3>
          {hero.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {hero.tagline}
            </p>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 p-0 h-auto text-accent hover:text-primary hover:bg-transparent text-xs">
            View
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
StandaloneProductCard.displayName = 'StandaloneProductCard';

interface MasterProductSectionProps {
  product: PortalProduct;
  subProducts: PortalProduct[];
  fallbackGradient: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (slug: string) => void;
}

// Memoized master product section
const MasterProductSection = memo(({ 
  product, 
  subProducts, 
  fallbackGradient, 
  isExpanded, 
  onToggle,
  onNavigate 
}: MasterProductSectionProps) => {
  const hero = product.hero || { name: product.name, tagline: '' };
  const colors = product.colors;

  return (
    <div className="space-y-3">
      {/* Master product card - full width with gradient accent */}
      <Card 
        className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg relative ring-2 ring-accent/30"
      >
        {/* Accent gradient overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
          <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-accent/40 via-primary/20 to-accent/40 opacity-60" />
        </div>
        
        <CardContent className="p-0 relative">
          <div className="flex flex-col md:flex-row">
            {/* Image section - clickable to navigate */}
            <div 
              className="relative h-48 md:h-auto md:w-2/5 overflow-hidden cursor-pointer"
              onClick={() => onNavigate(product.slug || product.id)}
            >
              {hero.coverImage ? (
                <OptimizedImage 
                  src={hero.coverImage} 
                  alt={hero.name}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  objectFit="cover"
                  priority
                />
              ) : (
                <div className="w-full h-full min-h-[200px] flex">
                  {colors && colors.length > 0 ? (
                    colors.slice(0, 4).map((color) => (
                      <div 
                        key={color.id} 
                        className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))
                  ) : (
                    <div className="flex-1" style={{ background: fallbackGradient }} />
                  )}
                </div>
              )}
              
              {/* Badges */}
              <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white text-xs">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            </div>
            
            {/* Content section */}
            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                  Product Suite
                </span>
              </div>
              <h3 
                className="font-bold text-xl md:text-2xl text-foreground mb-2 group-hover:text-accent transition-colors cursor-pointer"
                onClick={() => onNavigate(product.slug || product.id)}
              >
                {hero.name}
              </h3>
              {hero.tagline && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {hero.tagline}
                </p>
              )}
              
              {/* Color dots */}
              {colors && colors.length > 0 && (
                <div className="flex gap-1.5 mb-4">
                  {colors.slice(0, 5).map((color) => (
                    <div 
                      key={color.id}
                      className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                  {colors.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{colors.length - 5}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 p-0 h-auto text-accent hover:text-primary hover:bg-transparent"
                  onClick={() => onNavigate(product.slug || product.id)}
                >
                  View Master Guidelines
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                
                {subProducts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle();
                    }}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    {subProducts.length} Sub-Product{subProducts.length !== 1 ? 's' : ''}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Collapsible Sub-products grid */}
      {subProducts.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleContent className="animate-accordion-down">
            <div className="pl-4 md:pl-8 border-l-2 border-accent/30 pt-2">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium flex items-center gap-2">
                <Layers className="h-3 w-3" />
                Sub-Products in {hero.name}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subProducts.map((subProduct) => (
                  <SubProductCard 
                    key={subProduct.id} 
                    product={subProduct} 
                    fallbackGradient={fallbackGradient}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
});
MasterProductSection.displayName = 'MasterProductSection';

interface HierarchicalProductGridProps {
  products: PortalProduct[];
  orgColors: {
    primary: string;
    secondary: string;
  };
}

export const HierarchicalProductGrid = memo(forwardRef<HTMLDivElement, HierarchicalProductGridProps>(({ products, orgColors }, ref) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Stable navigation callback
  const handleNavigate = useCallback((slug: string) => {
    navigate(`/product/${slug}`);
  }, [navigate]);

  // Stable toggle callback creator
  const createToggleHandler = useCallback((id: string) => () => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Build product hierarchy
  const hierarchy = useMemo((): ProductHierarchy => {
    const subProductIds = new Set<string>();
    const subProductsByParent = new Map<string, PortalProduct[]>();
    
    // First pass: identify all sub-products
    // Handle both 'type' and 'guideType' formats for backward compatibility
    products.forEach(product => {
      const linkedProducts = (product.linkedGuides || []).filter(g => 
        g.type === 'product' || g.guideType === 'product'
      );
      linkedProducts.forEach(linked => {
        const linkedId = linked.id || linked.guideId;
        if (!linkedId) return;
        subProductIds.add(linkedId);
        const existing = subProductsByParent.get(product.id) || [];
        const subProduct = products.find(p => p.id === linkedId);
        if (subProduct) {
          existing.push(subProduct);
          subProductsByParent.set(product.id, existing);
        }
      });
    });

    // Categorize products
    const masterProducts: PortalProduct[] = [];
    const standaloneProducts: PortalProduct[] = [];

    products.forEach(product => {
      const isSubProduct = subProductIds.has(product.id);
      const hasSubs = subProductsByParent.has(product.id);

      if (isSubProduct) {
        // Skip - will be shown under parent
        return;
      } else if (hasSubs) {
        masterProducts.push(product);
      } else {
        standaloneProducts.push(product);
      }
    });

    return {
      masterProducts,
      subProductIds,
      subProductsByParent,
      standaloneProducts,
    };
  }, [products]);

  const fallbackGradient = useMemo(
    () => `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`,
    [orgColors.primary, orgColors.secondary]
  );

  return (
    <div ref={ref} className="space-y-8">
      {/* Product Suites section - shown above standalone products */}
      {hierarchy.masterProducts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Product Suites
          </h3>
          <div className="space-y-8">
            {hierarchy.masterProducts.map((product) => (
              <MasterProductSection 
                key={product.id} 
                product={product}
                subProducts={hierarchy.subProductsByParent.get(product.id) || []}
                fallbackGradient={fallbackGradient}
                isExpanded={expandedSections.has(product.id)}
                onToggle={createToggleHandler(product.id)}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Standalone products */}
      {hierarchy.standaloneProducts.length > 0 && (
        <div>
          {hierarchy.masterProducts.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Other Products
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {hierarchy.standaloneProducts.map((product) => (
              <StandaloneProductCard 
                key={product.id} 
                product={product} 
                fallbackGradient={fallbackGradient}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}));

HierarchicalProductGrid.displayName = 'HierarchicalProductGrid';
