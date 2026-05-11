/**
 * Hierarchical Brand Grid
 * Displays brands with master brands first, followed by their sub-brands in collapsible sections
 */

import React, { useMemo, useState, useCallback, memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Layers, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PortalBrand } from '@/hooks/usePortalData';
import { ComplianceScoreBadge } from '@/components/dataforce/ComplianceScoreBadge';
import { SkillReadinessBadge } from '@/components/brand/SkillReadinessBadge';
import { ComplianceScoreEntry } from '@/hooks/dataforce/useLatestComplianceScores';
import { cn } from '@/lib/utils';

interface BrandHierarchy {
  masterBrands: PortalBrand[];
  subBrandIds: Set<string>;
  subBrandsByParent: Map<string, PortalBrand[]>;
  standaloneBrands: PortalBrand[];
}

interface SubBrandCardProps {
  brand: PortalBrand;
  fallbackGradient: string;
  onNavigate: (slug: string) => void;
  complianceScore?: number | null;
}

// Memoized sub-brand mini card - defined outside to prevent recreation
const SubBrandCard = memo(forwardRef<HTMLDivElement, SubBrandCardProps>(({ brand, fallbackGradient, onNavigate, complianceScore }, ref) => {
  const hero = brand.hero || { name: brand.name, tagline: '' };
  const colors = brand.colors;

  return (
    <Card 
      ref={ref}
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(brand.slug || brand.id);
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
          
          {/* Arrow + compliance */}
          <div className="flex items-center gap-2 shrink-0">
            {complianceScore != null && (
              <ComplianceScoreBadge score={complianceScore} size="sm" />
            )}
            <SkillReadinessBadge entityType="brand" entityId={brand.id} compact />
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}));
SubBrandCard.displayName = 'SubBrandCard';

interface StandaloneBrandCardProps {
  brand: PortalBrand;
  fallbackGradient: string;
  onNavigate: (slug: string) => void;
  complianceScore?: number | null;
}

// Memoized standalone brand card
const StandaloneBrandCard = memo(forwardRef<HTMLDivElement, StandaloneBrandCardProps>(({ brand, fallbackGradient, onNavigate, complianceScore }, ref) => {
  const hero = brand.hero || { name: brand.name, tagline: '' };
  const colors = brand.colors;

  return (
    <Card 
      ref={ref}
      className="group cursor-pointer hover:shadow-xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-md"
      onClick={() => onNavigate(brand.slug || brand.id)}
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
          <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {hero.name}
          </h3>
          {hero.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {hero.tagline}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-1.5 p-0 h-auto text-primary hover:text-accent hover:bg-transparent text-xs">
              View
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Button>
            <div className="flex items-center gap-2">
              {complianceScore != null && (
                <ComplianceScoreBadge score={complianceScore} size="sm" />
              )}
              <SkillReadinessBadge entityType="brand" entityId={brand.id} compact />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}));
StandaloneBrandCard.displayName = 'StandaloneBrandCard';

interface MasterBrandSectionProps {
  brand: PortalBrand;
  subBrands: PortalBrand[];
  fallbackGradient: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (slug: string) => void;
  complianceScores?: Map<string, ComplianceScoreEntry>;
}

// Memoized master brand section
const MasterBrandSection = memo(({ 
  brand, 
  subBrands, 
  fallbackGradient, 
  isExpanded, 
  onToggle,
  onNavigate,
  complianceScores,
}: MasterBrandSectionProps) => {
  const hero = brand.hero || { name: brand.name, tagline: '' };
  const colors = brand.colors;

  return (
    <div className="space-y-3">
      {/* Master brand card - full width with gradient accent */}
      <Card 
        className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg relative"
      >
        {/* Accent gradient overlay - inset to prevent corner dead zones */}
        <div className="absolute inset-0 rounded-lg pointer-events-none z-10 overflow-hidden">
          <div className="absolute inset-0 rounded-lg ring-2 ring-inset ring-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
        </div>
        
        <CardContent className="p-0 relative">
          <div className="flex flex-col md:flex-row md:min-h-[220px]">
            {/* Image section - clickable to navigate */}
            <div 
              className="relative h-48 md:h-auto md:w-2/5 md:min-h-[220px] overflow-hidden cursor-pointer"
              onClick={() => onNavigate(brand.slug || brand.id)}
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
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                  Brand Hub
                </span>
              </div>
              <h3 
                className="font-bold text-xl md:text-2xl text-foreground mb-2 group-hover:text-primary transition-colors cursor-pointer"
                onClick={() => onNavigate(brand.slug || brand.id)}
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
                  className="gap-2 p-0 h-auto text-primary hover:text-accent hover:bg-transparent"
                  onClick={() => onNavigate(brand.slug || brand.id)}
                >
                  View Brand Guidelines
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                {complianceScores?.get(brand.id) != null && (
                  <ComplianceScoreBadge score={complianceScores.get(brand.id)!.score} size="sm" />
                )}
                <SkillReadinessBadge entityType="brand" entityId={brand.id} compact />
                
                {subBrands.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle();
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {subBrands.length} Sub-Brand{subBrands.length !== 1 ? 's' : ''}
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
      
      {/* Collapsible Sub-brands grid */}
      {subBrands.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleContent className="animate-accordion-down">
            <div className="pl-4 md:pl-8 border-l-2 border-primary/30 pt-2">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Sub-Brands in {hero.name}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {subBrands.map((subBrand) => (
                  <SubBrandCard 
                    key={subBrand.id} 
                    brand={subBrand} 
                    fallbackGradient={fallbackGradient}
                    onNavigate={onNavigate}
                    complianceScore={complianceScores?.get(subBrand.id)?.score}
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
MasterBrandSection.displayName = 'MasterBrandSection';

interface HierarchicalBrandGridProps {
  brands: PortalBrand[];
  orgColors: {
    primary: string;
    secondary: string;
  };
  complianceScores?: Map<string, ComplianceScoreEntry>;
}

export const HierarchicalBrandGrid = memo(forwardRef<HTMLDivElement, HierarchicalBrandGridProps>(({ brands, orgColors, complianceScores }, ref) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Stable navigation callback
  const handleNavigate = useCallback((slug: string) => {
    navigate(`/brand/${slug}`);
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

  // Build brand hierarchy
  const hierarchy = useMemo((): BrandHierarchy => {
    const subBrandIds = new Set<string>();
    const subBrandsByParent = new Map<string, PortalBrand[]>();
    
    // First pass: identify all sub-brands (linked brands within linkedGuides)
    // Handle both formats:
    // - Newer format: { id, name, slug, type }
    // - Legacy format: { guideId, guideType, id } where id is the link entry id
    brands.forEach(brand => {
      const linkedGuides = brand.linkedGuides || [];
      const linkedBrands = linkedGuides.filter((g: any) => 
        g.type === 'brand' || g.guideType === 'brand'
      );
      
      linkedBrands.forEach((linked: any) => {
        // Get the actual brand ID from either format
        const linkedBrandId = linked.guideId || linked.id;
        if (!linkedBrandId) return;
        
        subBrandIds.add(linkedBrandId);
        const existing = subBrandsByParent.get(brand.id) || [];
        const subBrand = brands.find(b => b.id === linkedBrandId);
        if (subBrand) {
          existing.push(subBrand);
          subBrandsByParent.set(brand.id, existing);
        }
      });
    });

    // Categorize brands
    const masterBrands: PortalBrand[] = [];
    const standaloneBrands: PortalBrand[] = [];

    brands.forEach(brand => {
      const isSubBrand = subBrandIds.has(brand.id);
      const hasSubs = subBrandsByParent.has(brand.id);

      if (isSubBrand) {
        // Skip - will be shown under parent
        return;
      } else if (hasSubs) {
        masterBrands.push(brand);
      } else {
        standaloneBrands.push(brand);
      }
    });

    return {
      masterBrands,
      subBrandIds,
      subBrandsByParent,
      standaloneBrands,
    };
  }, [brands]);

  const fallbackGradient = useMemo(
    () => `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`,
    [orgColors.primary, orgColors.secondary]
  );

  // If no hierarchy, just show all brands as standalone
  if (hierarchy.masterBrands.length === 0) {
    return (
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {brands.map((brand) => (
          <StandaloneBrandCard 
            key={brand.id} 
            brand={brand} 
            fallbackGradient={fallbackGradient}
            onNavigate={handleNavigate}
            complianceScore={complianceScores?.get(brand.id)?.score}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-8">
      {/* Master brands with their sub-brands */}
      {hierarchy.masterBrands.length > 0 && (
        <div className="space-y-8">
          {hierarchy.masterBrands.map((brand) => (
              <MasterBrandSection 
                key={brand.id} 
                brand={brand}
                subBrands={hierarchy.subBrandsByParent.get(brand.id) || []}
                fallbackGradient={fallbackGradient}
                isExpanded={expandedSections.has(brand.id)}
                onToggle={createToggleHandler(brand.id)}
                onNavigate={handleNavigate}
                complianceScores={complianceScores}
              />
          ))}
        </div>
      )}

      {/* Standalone brands */}
      {hierarchy.standaloneBrands.length > 0 && (
        <div>
          {hierarchy.masterBrands.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Other Brands
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {hierarchy.standaloneBrands.map((brand) => (
              <StandaloneBrandCard 
                key={brand.id} 
                brand={brand} 
                fallbackGradient={fallbackGradient}
                onNavigate={handleNavigate}
                complianceScore={complianceScores?.get(brand.id)?.score}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}));

HierarchicalBrandGrid.displayName = 'HierarchicalBrandGrid';
