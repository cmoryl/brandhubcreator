/**
 * Hierarchical Event Card Component
 * Displays master events with nested sub-events underneath
 */

import React, { memo, useState } from 'react';
import { ArrowRight, Globe, Calendar, ChevronDown, ChevronUp, MapPin, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PortalEvent, PortalLinkedEvent } from '@/hooks/usePortalData';
import { cn } from '@/lib/utils';

interface CardColors {
  primary: string;
  secondary: string;
}

interface HierarchicalEventCardProps {
  event: PortalEvent;
  index: number;
  orgColors: CardColors;
  isFocused?: boolean;
}

interface SubEventItemProps {
  subEvent: PortalLinkedEvent;
  accentColor?: string;
}

const SubEventItem = memo(({ subEvent, accentColor }: SubEventItemProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/event/${subEvent.slug}`)}
      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors text-left group"
      style={{ borderColor: accentColor ? `${accentColor}40` : undefined }}
    >
      {/* Region indicator */}
      {subEvent.region && (
        <div
          className="w-2 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: subEvent.accentColor || accentColor || 'hsl(var(--primary))' }}
        />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">
          {subEvent.name}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {subEvent.region && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {subEvent.region}
            </span>
          )}
          {subEvent.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {subEvent.location}
            </span>
          )}
          {subEvent.dates && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {subEvent.dates}
            </span>
          )}
        </div>
      </div>
      
      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
});
SubEventItem.displayName = 'SubEventItem';

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

export const HierarchicalEventCard = memo(React.forwardRef<HTMLDivElement, HierarchicalEventCardProps>(
  ({ event, index, orgColors, isFocused = false }, ref) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const hero = event.hero || { name: event.name, tagline: '' };
    const eventDetails = event.eventDetails || { eventName: '', eventDates: '', location: '' };
    const colors = event.colors;
    const linkedGuides = event.linkedGuides || [];
    const subEventCount = linkedGuides.length;
    const hasSubEvents = subEventCount > 0;
    const fallbackGradient = `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.secondary})`;

    return (
      <div className="space-y-2">
        <Card 
          ref={ref}
          className={cn(
            "group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg",
            isFocused && "ring-2 ring-primary ring-offset-2",
            hasSubEvents && "ring-2 ring-accent/30"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => navigate(`/event/${event.slug || event.id}`)}
          role="gridcell"
          tabIndex={-1}
          aria-label={`${hero.name || eventDetails.eventName} event brand kit`}
        >
          <CardContent className="p-0">
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
              {hasSubEvents && (
                <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 gap-1 bg-accent/90 text-accent-foreground text-xs">
                  <Calendar className="h-3 w-3" />
                  {subEventCount} Region{subEventCount !== 1 ? 's' : ''}
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
              
              {/* Color dots */}
              {colors && colors.length > 0 && (
                <div className="flex gap-1 mb-3 sm:mb-4">
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
              )}
              
              <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-accent hover:text-accent/80 text-sm">
                View Guidelines
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sub-events collapsible section */}
        {hasSubEvents && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground h-9"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  {subEventCount} Regional Event{subEventCount !== 1 ? 's' : ''}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-1">
              {linkedGuides.map((subEvent) => (
                <SubEventItem
                  key={subEvent.id}
                  subEvent={subEvent}
                  accentColor={orgColors.primary}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }
));
HierarchicalEventCard.displayName = 'HierarchicalEventCard';
