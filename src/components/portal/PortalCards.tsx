/**
 * Portal Card Components
 * Reusable card components for the organization portal
 * 
 * Features:
 * - Optimized image loading with priority for visible cards
 * - Keyboard navigation support via focusedIndex
 * - Responsive srcset generation for different viewports
 * - Smooth hover animations
 */

import React, { memo } from 'react';
import { ArrowRight, Globe, Calendar, Layers, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PortalBrand, PortalProduct, PortalEvent, PortalLinkedGuide } from '@/hooks/usePortalData';
import { ComplianceScoreBadge } from '@/components/dataforce/ComplianceScoreBadge';
import { SkillReadinessBadge } from '@/components/brand/SkillReadinessBadge';
import { cn } from '@/lib/utils';

interface CardColors {
  primary: string;
  secondary: string;
}

interface BrandCardProps {
  brand: PortalBrand;
  index: number;
  orgColors: CardColors;
  isFocused?: boolean;
  complianceScore?: number | null;
}

interface ProductCardProps {
  product: PortalProduct;
  index: number;
  orgColors: CardColors;
  isFocused?: boolean;
}

interface EventCardProps {
  event: PortalEvent;
  index: number;
  orgColors: CardColors;
  isFocused?: boolean;
}

interface ColorStripesProps {
  colors?: Array<{ id: string; hex: string }>;
  fallbackGradient: string;
}

const ColorStripes = React.forwardRef<HTMLDivElement, ColorStripesProps>(
  ({ colors, fallbackGradient }, ref) => (
    <div ref={ref} className="w-full h-full flex">
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
  )
);
ColorStripes.displayName = 'ColorStripes';

interface ColorDotsProps {
  colors?: Array<{ id: string; hex: string }>;
}

const ColorDots = React.forwardRef<HTMLDivElement, ColorDotsProps>(
  ({ colors }, ref) => {
    if (!colors || colors.length === 0) return null;
    
    return (
      <div ref={ref} className="flex gap-1 mb-3 sm:mb-4">
        {colors.slice(0, 5).map((color) => (
          <div 
            key={color.id}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-background shadow-sm"
            style={{ backgroundColor: color.hex }}
          />
        ))}
        {colors.length > 5 && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground">
            +{colors.length - 5}
          </div>
        )}
      </div>
    );
  }
);
ColorDots.displayName = 'ColorDots';

// Memoized brand card for performance
export const PortalBrandCard = memo(React.forwardRef<HTMLDivElement, BrandCardProps>(
  ({ brand, index, orgColors, isFocused = false, complianceScore }, ref) => {
    const navigate = useNavigate();
    const hero = brand.hero || { name: brand.name, tagline: '' };
    const colors = brand.colors;
    const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;
    
    // Check if this is a master brand (has linked products/events)
    const linkedCount = (brand.linkedGuides || []).length;
    const isMasterBrand = linkedCount > 0;

    return (
      <Card 
        ref={ref}
        className={cn(
          "group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg relative",
          isFocused && "ring-2 ring-primary ring-offset-2",
          isMasterBrand && "ring-2 ring-primary/30"
        )}
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/brand/${brand.slug || brand.id}`)}
        role="gridcell"
        tabIndex={-1}
        aria-label={`${hero.name} brand guidelines${isMasterBrand ? ` - includes ${linkedCount} linked guides` : ''}`}
      >
        {/* Master brand indicator ring */}
        {isMasterBrand && (
          <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
            <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-primary/40 via-accent/20 to-primary/40 opacity-60" />
          </div>
        )}
        
        <CardContent className="p-0 relative">
          <div className="relative h-36 sm:h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 6}
                sizes="portalCard"
                autoSrcset
              />
            ) : (
              <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
            )}
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 gap-1 bg-green-500/90 text-white text-xs">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
            
            {/* Master brand badge - left side */}
            {isMasterBrand && (
              <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 gap-1 bg-primary/90 text-primary-foreground text-xs shadow-lg">
                <Layers className="h-3 w-3" />
                {linkedCount} Guide{linkedCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 group-hover:text-accent transition-colors line-clamp-1">
              {hero.name}
            </h3>
            {hero.tagline && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                {hero.tagline}
              </p>
            )}
            <ColorDots colors={colors} />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-primary hover:bg-transparent text-sm">
                View Guidelines
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <div className="flex items-center gap-2">
                <ComplianceScoreBadge score={complianceScore} size="sm" />
                <SkillReadinessBadge entityType="brand" entityId={brand.id} compact />
                {isMasterBrand && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Brand Hub
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
));
PortalBrandCard.displayName = 'PortalBrandCard';

// Memoized product card for performance
export const PortalProductCard = memo(React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, index, orgColors, isFocused = false }, ref) => {
    const navigate = useNavigate();
    const hero = product.hero || { name: product.name, tagline: '' };
    const colors = product.colors;
    const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;
    
    // Check if this is a master product (has linked sub-products)
    const linkedProductCount = (product.linkedGuides || []).filter(g => g.type === 'product').length;
    const isMasterProduct = linkedProductCount > 0;

    return (
      <Card 
        ref={ref}
        className={cn(
          "group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg relative",
          isFocused && "ring-2 ring-primary ring-offset-2",
          isMasterProduct && "ring-2 ring-accent/30"
        )}
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/product/${product.slug || product.id}`)}
        role="gridcell"
        tabIndex={-1}
        aria-label={`${hero.name} product guidelines${isMasterProduct ? ` - includes ${linkedProductCount} sub-products` : ''}`}
      >
        {/* Master product indicator ring */}
        {isMasterProduct && (
          <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
            <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-accent/40 via-primary/20 to-accent/40 opacity-60" />
          </div>
        )}
        
        <CardContent className="p-0 relative">
          <div className="relative h-36 sm:h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 6}
                sizes="portalCard"
                autoSrcset
              />
            ) : (
              <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
            )}
            
            {/* Right-side badges */}
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 gap-1 bg-green-500/90 text-white text-xs">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
            
            {/* Master product badge - left side */}
            {isMasterProduct && (
              <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 gap-1 bg-accent/90 text-accent-foreground text-xs shadow-lg">
                <Layers className="h-3 w-3" />
                {linkedProductCount} Sub-Product{linkedProductCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 group-hover:text-accent transition-colors line-clamp-1 flex-1">
                {hero.name}
              </h3>
              {isMasterProduct && (
                <Package className="h-4 w-4 text-accent shrink-0 mt-1" />
              )}
            </div>
            {hero.tagline && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                {hero.tagline}
              </p>
            )}
            <ColorDots colors={colors} />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-primary hover:bg-transparent text-sm">
                View Guidelines
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              {isMasterProduct && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Product Suite
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
));
PortalProductCard.displayName = 'PortalProductCard';

// Memoized event card for performance
export const PortalEventCard = memo(React.forwardRef<HTMLDivElement, EventCardProps>(
  ({ event, index, orgColors, isFocused = false }, ref) => {
    const navigate = useNavigate();
    const hero = event.hero || { name: event.name, tagline: '' };
    const eventDetails = event.eventDetails || { eventName: '', eventDates: '', location: '' };
    const colors = event.colors;
    const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;
    
    // Check if this is a master event (has regional sub-events)
    const linkedEventCount = (event.linkedGuides || []).length;
    const isMasterEvent = linkedEventCount > 0;

    return (
      <Card 
        ref={ref}
        className={cn(
          "group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg relative",
          isFocused && "ring-2 ring-primary ring-offset-2",
          isMasterEvent && "ring-2 ring-secondary/40"
        )}
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => navigate(`/event/${event.slug || event.id}`)}
        role="gridcell"
        tabIndex={-1}
        aria-label={`${hero.name || eventDetails.eventName} event brand kit${isMasterEvent ? ` - includes ${linkedEventCount} regional events` : ''}`}
      >
        {/* Master event indicator ring */}
        {isMasterEvent && (
          <div className="absolute inset-0 rounded-lg pointer-events-none z-10">
            <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-secondary/40 via-primary/20 to-secondary/40 opacity-60" />
          </div>
        )}
        
        <CardContent className="p-0 relative">
          <div className="relative h-36 sm:h-44 overflow-hidden">
            {hero.coverImage ? (
              <OptimizedImage 
                src={hero.coverImage} 
                alt={hero.name}
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
                priority={index < 6}
                sizes="portalCard"
                autoSrcset
              />
            ) : (
              <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
            )}
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 gap-1 bg-green-500/90 text-white text-xs">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
            
            {/* Event type badge - left side */}
            {isMasterEvent ? (
              <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 gap-1 bg-secondary/90 text-secondary-foreground text-xs shadow-lg">
                <Layers className="h-3 w-3" />
                {linkedEventCount} Region{linkedEventCount !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 gap-1 bg-primary/90 text-primary-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Event
              </Badge>
            )}
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1 group-hover:text-accent transition-colors line-clamp-1">
              {hero.name || eventDetails.eventName}
            </h3>
            {eventDetails.eventDates && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                {eventDetails.eventDates}
              </p>
            )}
            {eventDetails.location && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                📍 {eventDetails.location}
              </p>
            )}
            <ColorDots colors={colors} />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-primary hover:bg-transparent text-sm">
                View Guidelines
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              {isMasterEvent && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Global Event
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
));
PortalEventCard.displayName = 'PortalEventCard';
