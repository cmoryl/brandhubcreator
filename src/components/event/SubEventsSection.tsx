import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ExternalLink, Globe, Building2 } from 'lucide-react';
import { WorldMapVisualization } from './WorldMapVisualization';

export interface LinkedEventGuide {
  id: string;
  type: 'event';
  slug: string;
  name: string;
  region?: string;
  accentColor?: string;
  location?: string;
  dates?: string;
  venue?: string;
  attendees?: number;
  coverImage?: string;
}

interface SubEventsSectionProps {
  linkedGuides: LinkedEventGuide[];
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const REGION_ICONS: Record<string, React.ReactNode> = {
  'USA': <span className="text-base">🇺🇸</span>,
  'EMEA': <span className="text-base">🇪🇺</span>,
  'APAC': <span className="text-base">🌏</span>,
  'LATAM': <span className="text-base">🌎</span>,
};

const getRegionIcon = (region?: string) => {
  if (!region) return <Globe className="h-4 w-4" />;
  return REGION_ICONS[region.toUpperCase()] || <Globe className="h-4 w-4" />;
};

// Map region to approximate world map coordinates (percentage-based)
const getMapCoordinates = (region?: string, location?: string): { x: number; y: number } => {
  // Default coordinates by region
  const regionCoords: Record<string, { x: number; y: number }> = {
    'USA': { x: 18, y: 38 },      // San Francisco area
    'EMEA': { x: 48, y: 28 },     // London/Europe
    'APAC': { x: 78, y: 52 },     // Singapore area
    'LATAM': { x: 25, y: 65 },    // South America
  };

  if (region && regionCoords[region.toUpperCase()]) {
    return regionCoords[region.toUpperCase()];
  }

  // Fallback based on location string
  if (location) {
    const loc = location.toLowerCase();
    if (loc.includes('san francisco') || loc.includes('california')) return { x: 15, y: 38 };
    if (loc.includes('new york')) return { x: 22, y: 36 };
    if (loc.includes('london')) return { x: 48, y: 26 };
    if (loc.includes('singapore')) return { x: 78, y: 55 };
    if (loc.includes('tokyo') || loc.includes('japan')) return { x: 85, y: 38 };
    if (loc.includes('sydney') || loc.includes('australia')) return { x: 88, y: 72 };
  }

  return { x: 50, y: 50 }; // Center fallback
};

export const SubEventsSection = ({
  linkedGuides,
  customSubtitle,
  onSubtitleChange,
}: SubEventsSectionProps) => {
  const eventGuides = useMemo(
    () => linkedGuides.filter((g) => g.type === 'event'),
    [linkedGuides]
  );

  // Transform linked guides to map locations
  const mapLocations = useMemo(() => {
    return eventGuides.map((event) => {
      const coords = getMapCoordinates(event.region, event.location);
      // Parse city and country from location string
      const locationParts = event.location?.split(',') || [];
      const city = locationParts[0]?.trim() || event.location || 'TBD';
      const country = locationParts[1]?.trim() || event.region || '';

      return {
        id: event.id,
        name: event.name,
        city,
        country,
        slug: event.slug,
        accentColor: event.accentColor,
        dates: event.dates,
        attendees: event.attendees,
        x: coords.x,
        y: coords.y,
      };
    });
  }, [eventGuides]);

  if (eventGuides.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
          Regional Events
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {customSubtitle || "Explore GlobalLink NEXT conferences by region"}
        </p>
      </div>

      {/* Visual indicator this is a parent-child relationship */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/50">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Master Event Guide</span> — 
          The regional events below inherit branding from this guide
        </p>
      </div>

      {/* World Map Visualization with Statistics */}
      {mapLocations.length > 0 && (
        <WorldMapVisualization
          locations={mapLocations}
          title="Global Conference Locations"
          subtitle="Hover to see connections • Click a location to view the regional event guide"
          showStats={true}
          showYearOverYear={true}
        />
      )}

      {/* Grid of sub-events with clear visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventGuides.map((event) => (
          <Link
            key={event.id}
            to={`/event/${event.slug}`}
            className="group block"
          >
            <Card
              className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2"
              style={{
                borderColor: event.accentColor || 'hsl(var(--border))',
              }}
            >
              {/* Cover image with overlay */}
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${event.accentColor}20` }}
                  >
                    {getRegionIcon(event.region)}
                  </div>
                )}
                
                {/* Region badge - prominent positioning */}
                {event.region && (
                  <Badge
                    className="absolute top-3 left-3 gap-1.5 text-white font-semibold shadow-lg"
                    style={{
                      backgroundColor: event.accentColor || 'hsl(var(--primary))',
                    }}
                  >
                    {getRegionIcon(event.region)}
                    {event.region}
                  </Badge>
                )}

                {/* Sub-event indicator */}
                <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Sub-event
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {event.dates && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{event.dates}</span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  {event.attendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>{event.attendees.toLocaleString()} expected</span>
                    </div>
                  )}
                </div>

                {/* Accent color indicator bar */}
                <div
                  className="h-1 w-full rounded-full mt-3"
                  style={{
                    backgroundColor: event.accentColor || 'hsl(var(--primary))',
                  }}
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Legend/Help text */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        {eventGuides.map((event) => (
          event.region && event.accentColor && (
            <div key={event.id} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: event.accentColor }}
              />
              <span>{event.region}</span>
            </div>
          )
        ))}
      </div>
    </section>
  );
};
