import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

interface MapLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  slug?: string;
  accentColor?: string;
  dates?: string;
  attendees?: number;
  // Approximate percentage positions on the map
  x: number;
  y: number;
}

interface WorldMapVisualizationProps {
  locations: MapLocation[];
  title?: string;
  subtitle?: string;
}

export const WorldMapVisualization = ({
  locations,
  title = "Global Conference Locations",
  subtitle = "Click a location to view the regional event guide",
}: WorldMapVisualizationProps) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Map Container */}
      <div className="relative aspect-[2/1] bg-gradient-to-b from-muted/20 to-muted/40 overflow-hidden">
        {/* Simple SVG World Map Outline */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Simplified world map paths - continents */}
          <defs>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          
          {/* North America */}
          <path
            d="M50,80 L180,60 L220,100 L240,180 L200,220 L160,200 L140,240 L100,220 L80,180 L40,160 L30,120 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* South America */}
          <path
            d="M160,260 L200,240 L230,280 L240,350 L200,420 L160,400 L140,320 L150,280 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* Europe */}
          <path
            d="M420,80 L500,60 L540,80 L560,120 L540,160 L500,180 L460,160 L440,120 L420,100 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* Africa */}
          <path
            d="M440,180 L520,160 L560,200 L580,280 L540,360 L480,380 L440,340 L420,260 L430,200 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* Asia */}
          <path
            d="M560,60 L720,40 L820,80 L880,120 L900,180 L860,220 L780,200 L700,220 L640,180 L600,200 L560,160 L540,120 L560,80 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          
          {/* Australia */}
          <path
            d="M780,320 L860,300 L920,340 L900,400 L840,420 L780,400 L760,360 Z"
            fill="url(#landGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />

          {/* Connection lines between locations */}
          {locations.length > 1 && (
            <g>
              {locations.map((loc, i) => {
                if (i === 0) return null;
                const prevLoc = locations[i - 1];
                return (
                  <line
                    key={`line-${loc.id}`}
                    x1={prevLoc.x * 10}
                    y1={prevLoc.y * 5}
                    x2={loc.x * 10}
                    y2={loc.y * 5}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Location Markers */}
        {locations.map((location) => (
          <div
            key={location.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
            }}
          >
            {location.slug ? (
              <Link
                to={`/event/${location.slug}`}
                className="group block"
                onMouseEnter={() => setHoveredLocation(location.id)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                <MarkerContent location={location} isHovered={hoveredLocation === location.id} />
              </Link>
            ) : (
              <div
                className="group"
                onMouseEnter={() => setHoveredLocation(location.id)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                <MarkerContent location={location} isHovered={hoveredLocation === location.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t bg-muted/20">
        <div className="flex flex-wrap gap-4 justify-center">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: location.accentColor || 'hsl(var(--primary))' }}
              />
              <span className="text-muted-foreground">{location.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MarkerContentProps {
  location: MapLocation;
  isHovered: boolean;
}

const MarkerContent = ({ location, isHovered }: MarkerContentProps) => {
  const accentColor = location.accentColor || 'hsl(var(--primary))';
  
  return (
    <>
      {/* Pulse animation */}
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{
          backgroundColor: accentColor,
          opacity: 0.3,
          animationDuration: '2s',
        }}
      />
      
      {/* Marker pin */}
      <div
        className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-lg transition-all duration-200"
        style={{
          borderColor: accentColor,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        <MapPin
          className="w-5 h-5"
          style={{ color: accentColor }}
        />
      </div>

      {/* Tooltip */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 transition-all duration-200 pointer-events-none ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div
          className="bg-background border rounded-lg shadow-xl px-4 py-3 whitespace-nowrap"
          style={{ borderColor: accentColor }}
        >
          <p className="font-semibold text-sm">{location.name}</p>
          <p className="text-xs text-muted-foreground">
            {location.city}, {location.country}
          </p>
          {location.dates && (
            <p className="text-xs mt-1" style={{ color: accentColor }}>
              {location.dates}
            </p>
          )}
          {location.attendees && (
            <p className="text-xs text-muted-foreground">
              {location.attendees.toLocaleString()} attendees expected
            </p>
          )}
          {location.slug && (
            <p className="text-xs text-primary mt-1">Click to view →</p>
          )}
        </div>
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${accentColor}`,
          }}
        />
      </div>
    </>
  );
};
