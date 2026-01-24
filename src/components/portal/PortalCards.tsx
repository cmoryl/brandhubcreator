/**
 * Portal Card Components
 * Reusable card components for the organization portal
 */

import { ArrowRight, Globe, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PortalBrand, PortalProduct, PortalEvent } from '@/hooks/usePortalData';

interface CardColors {
  primary: string;
  secondary: string;
}

interface BrandCardProps {
  brand: PortalBrand;
  index: number;
  orgColors: CardColors;
}

interface ProductCardProps {
  product: PortalProduct;
  index: number;
  orgColors: CardColors;
}

interface EventCardProps {
  event: PortalEvent;
  index: number;
  orgColors: CardColors;
}

import React from 'react';

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
      <div ref={ref} className="flex gap-1 mb-4">
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
    );
  }
);
ColorDots.displayName = 'ColorDots';

export const PortalBrandCard = ({ brand, index, orgColors }: BrandCardProps) => {
  const navigate = useNavigate();
  const hero = brand.hero || { name: brand.name, tagline: '' };
  const colors = brand.colors;
  const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => navigate(`/brand/${brand.slug || brand.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative h-44 overflow-hidden">
          {hero.coverImage ? (
            <OptimizedImage 
              src={hero.coverImage} 
              alt={hero.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              objectFit="cover"
              priority={index < 3}
            />
          ) : (
            <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
          )}
          <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
            {hero.name}
          </h3>
          {hero.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {hero.tagline}
            </p>
          )}
          <ColorDots colors={colors} />
          <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
            View Guidelines
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const PortalProductCard = ({ product, index, orgColors }: ProductCardProps) => {
  const navigate = useNavigate();
  const hero = product.hero || { name: product.name, tagline: '' };
  const colors = product.colors;
  const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => navigate(`/product/${product.slug || product.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative h-44 overflow-hidden">
          {hero.coverImage ? (
            <OptimizedImage 
              src={hero.coverImage} 
              alt={hero.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              objectFit="cover"
              priority={index < 3}
            />
          ) : (
            <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
          )}
          <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
            {hero.name}
          </h3>
          {hero.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {hero.tagline}
            </p>
          )}
          <ColorDots colors={colors} />
          <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
            View Guidelines
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const PortalEventCard = ({ event, index, orgColors }: EventCardProps) => {
  const navigate = useNavigate();
  const hero = event.hero || { name: event.name, tagline: '' };
  const eventDetails = event.eventDetails || { eventName: '', eventDates: '', location: '' };
  const colors = event.colors;
  const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => navigate(`/event/${event.slug || event.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative h-44 overflow-hidden">
          {hero.coverImage ? (
            <OptimizedImage 
              src={hero.coverImage} 
              alt={hero.name}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              objectFit="cover"
              priority={index < 3}
            />
          ) : (
            <ColorStripes colors={colors} fallbackGradient={fallbackGradient} />
          )}
          <Badge className="absolute top-3 right-3 gap-1 bg-green-500/90 text-white">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
          <Badge className="absolute top-3 left-3 gap-1 bg-primary/90 text-primary-foreground">
            <Calendar className="h-3 w-3" />
            Event
          </Badge>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
            {hero.name || eventDetails.eventName}
          </h3>
          {eventDetails.eventDates && (
            <p className="text-sm text-muted-foreground mb-1">
              {eventDetails.eventDates}
            </p>
          )}
          {eventDetails.location && (
            <p className="text-sm text-muted-foreground mb-2">
              📍 {eventDetails.location}
            </p>
          )}
          <ColorDots colors={colors} />
          <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80">
            View Guidelines
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
