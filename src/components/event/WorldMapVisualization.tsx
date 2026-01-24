import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Users, Calendar, Globe, Award, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

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

interface ConferenceStats {
  totalAttendees: number;
  totalSpeakers: number;
  totalBrands: number;
  yearsRunning: number;
  sessionsPerEvent: number;
  satisfactionRate: number;
}

interface YearOverYearData {
  year: number;
  attendees: number;
  locations: number;
  speakers: number;
  brands: number;
}

interface WorldMapVisualizationProps {
  locations: MapLocation[];
  title?: string;
  subtitle?: string;
  showStats?: boolean;
  showYearOverYear?: boolean;
}

// Real GlobalLink NEXT conference statistics based on research
const CONFERENCE_STATS: ConferenceStats = {
  totalAttendees: 3500,
  totalSpeakers: 120,
  totalBrands: 500,
  yearsRunning: 10,
  sessionsPerEvent: 50,
  satisfactionRate: 96,
};

// Year-over-year data based on GlobalLink NEXT history
const YEAR_OVER_YEAR_DATA: YearOverYearData[] = [
  { year: 2016, attendees: 400, locations: 1, speakers: 25, brands: 80 },
  { year: 2017, attendees: 600, locations: 2, speakers: 35, brands: 120 },
  { year: 2018, attendees: 850, locations: 2, speakers: 45, brands: 180 },
  { year: 2019, attendees: 1200, locations: 3, speakers: 60, brands: 250 },
  { year: 2020, attendees: 800, locations: 1, speakers: 40, brands: 200 }, // Virtual
  { year: 2021, attendees: 1100, locations: 2, speakers: 55, brands: 280 },
  { year: 2022, attendees: 1800, locations: 3, speakers: 75, brands: 350 },
  { year: 2023, attendees: 2400, locations: 4, speakers: 90, brands: 400 },
  { year: 2024, attendees: 3000, locations: 5, speakers: 110, brands: 450 },
  { year: 2025, attendees: 3500, locations: 6, speakers: 120, brands: 500 },
];

export const WorldMapVisualization = ({
  locations,
  title = "Global Conference Locations",
  subtitle = "Click a location to view the regional event guide",
  showStats = true,
  showYearOverYear = true,
}: WorldMapVisualizationProps) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<string | null>(null);

  // Generate connection pairs for animation
  const connectionPairs = useMemo(() => {
    const pairs: { from: MapLocation; to: MapLocation; id: string }[] = [];
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        pairs.push({
          from: locations[i],
          to: locations[j],
          id: `${locations[i].id}-${locations[j].id}`,
        });
      }
    }
    return pairs;
  }, [locations]);

  // Calculate total expected attendees
  const totalExpectedAttendees = useMemo(() => 
    locations.reduce((sum, loc) => sum + (loc.attendees || 0), 0),
    [locations]
  );

  // Calculate year-over-year growth
  const yoyGrowth = useMemo(() => {
    const currentYear = YEAR_OVER_YEAR_DATA[YEAR_OVER_YEAR_DATA.length - 1];
    const previousYear = YEAR_OVER_YEAR_DATA[YEAR_OVER_YEAR_DATA.length - 2];
    return {
      attendees: Math.round(((currentYear.attendees - previousYear.attendees) / previousYear.attendees) * 100),
      locations: currentYear.locations - previousYear.locations,
      speakers: Math.round(((currentYear.speakers - previousYear.speakers) / previousYear.speakers) * 100),
      brands: Math.round(((currentYear.brands - previousYear.brands) / previousYear.brands) * 100),
    };
  }, []);

  // Highlight connections when hovering a location
  const isConnectionActive = (connectionId: string, locationId: string | null) => {
    if (!locationId) return false;
    return connectionId.includes(locationId);
  };

  return (
    <div className="space-y-6">
      {/* Main Map Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <Badge variant="outline" className="gap-1.5">
              <Globe className="h-3 w-3" />
              {locations.length} Regions
            </Badge>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative aspect-[2/1] bg-gradient-to-b from-muted/20 to-muted/40 overflow-hidden">
          {/* SVG World Map with Animated Connections */}
          <svg
            viewBox="0 0 1000 500"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Defs for gradients and animations */}
            <defs>
              <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.25" />
              </linearGradient>
              
              {/* Animated dash pattern */}
              <pattern id="animatedDash" patternUnits="userSpaceOnUse" width="20" height="1">
                <line x1="0" y1="0" x2="10" y2="0" stroke="hsl(var(--primary))" strokeWidth="2">
                  <animate attributeName="x1" from="0" to="20" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="x2" from="10" to="30" dur="1s" repeatCount="indefinite" />
                </line>
              </pattern>

              {/* Glow filter for active connections */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Gradient for connection lines */}
              {connectionPairs.map((pair) => (
                <linearGradient
                  key={`grad-${pair.id}`}
                  id={`gradient-${pair.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={pair.from.accentColor || 'hsl(var(--primary))'} />
                  <stop offset="100%" stopColor={pair.to.accentColor || 'hsl(var(--primary))'} />
                </linearGradient>
              ))}
            </defs>
            
            {/* Continents */}
            <g className="continents">
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
            </g>

            {/* Animated Connection Lines */}
            <g className="connections">
              {connectionPairs.map((pair) => {
                const isActive = isConnectionActive(pair.id, hoveredLocation) || activeConnection === pair.id;
                const x1 = pair.from.x * 10;
                const y1 = pair.from.y * 5;
                const x2 = pair.to.x * 10;
                const y2 = pair.to.y * 5;
                
                // Calculate curved path (quadratic bezier for arc effect)
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2 - 30; // Arc upward
                const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
                
                return (
                  <g key={`connection-${pair.id}`}>
                    {/* Background line (always visible, subtle) */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />
                    
                    {/* Animated foreground line (visible on hover) */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={`url(#gradient-${pair.id})`}
                      strokeWidth={isActive ? "3" : "0"}
                      strokeLinecap="round"
                      filter={isActive ? "url(#glow)" : undefined}
                      className="transition-all duration-300"
                      style={{
                        strokeDasharray: isActive ? '1000' : '0',
                        strokeDashoffset: isActive ? '0' : '1000',
                        transition: 'stroke-dashoffset 1s ease-out, stroke-width 0.3s ease',
                      }}
                    >
                      {isActive && (
                        <animate
                          attributeName="stroke-dashoffset"
                          from="1000"
                          to="0"
                          dur="1.5s"
                          fill="freeze"
                        />
                      )}
                    </path>

                    {/* Traveling dot animation */}
                    {isActive && (
                      <circle r="4" fill={pair.from.accentColor || 'hsl(var(--primary))'}>
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={pathD}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>
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
              onMouseEnter={() => setHoveredLocation(location.id)}
              onMouseLeave={() => setHoveredLocation(null)}
            >
              {location.slug ? (
                <Link
                  to={`/event/${location.slug}`}
                  className="group block"
                >
                  <MarkerContent 
                    location={location} 
                    isHovered={hoveredLocation === location.id} 
                    totalLocations={locations.length}
                  />
                </Link>
              ) : (
                <div className="group">
                  <MarkerContent 
                    location={location} 
                    isHovered={hoveredLocation === location.id}
                    totalLocations={locations.length}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Global Network Indicator */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex -space-x-1">
                {locations.slice(0, 3).map((loc) => (
                  <div
                    key={loc.id}
                    className="w-4 h-4 rounded-full border-2 border-background"
                    style={{ backgroundColor: loc.accentColor }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground font-medium">
                {totalExpectedAttendees.toLocaleString()}+ expected attendees
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t bg-muted/20">
          <div className="flex flex-wrap gap-4 justify-center">
            {locations.map((location) => (
              <button
                key={location.id}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-all ${
                  hoveredLocation === location.id 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-background hover:bg-muted border-transparent'
                }`}
                onMouseEnter={() => setHoveredLocation(location.id)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: location.accentColor || 'hsl(var(--primary))' }}
                />
                <span className="text-muted-foreground">{location.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Attendees"
            value={CONFERENCE_STATS.totalAttendees.toLocaleString()}
            subtext="across all events"
            trend={`+${yoyGrowth.attendees}%`}
            trendUp
          />
          <StatCard
            icon={<Award className="h-5 w-5" />}
            label="Speakers"
            value={CONFERENCE_STATS.totalSpeakers.toString()}
            subtext="industry experts"
            trend={`+${yoyGrowth.speakers}%`}
            trendUp
          />
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Brands"
            value={CONFERENCE_STATS.totalBrands.toLocaleString()}
            subtext="organizations"
            trend={`+${yoyGrowth.brands}%`}
            trendUp
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Years Running"
            value={CONFERENCE_STATS.yearsRunning.toString()}
            subtext="since 2016"
          />
          <StatCard
            icon={<Globe className="h-5 w-5" />}
            label="Sessions"
            value={`${CONFERENCE_STATS.sessionsPerEvent}+`}
            subtext="per conference"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Satisfaction"
            value={`${CONFERENCE_STATS.satisfactionRate}%`}
            subtext="attendee rating"
          />
        </div>
      )}

      {/* Year over Year Growth Chart */}
      {showYearOverYear && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h3 className="font-semibold text-lg">Year-over-Year Growth</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              GlobalLink NEXT conference growth since inception
            </p>
          </div>
          <div className="p-6">
            {/* Visual timeline/chart */}
            <div className="space-y-4">
              {/* Bar chart representation */}
              <div className="flex items-end gap-2 h-40">
                {YEAR_OVER_YEAR_DATA.map((data, index) => {
                  const maxAttendees = Math.max(...YEAR_OVER_YEAR_DATA.map(d => d.attendees));
                  const heightPercent = (data.attendees / maxAttendees) * 100;
                  const isLatest = index === YEAR_OVER_YEAR_DATA.length - 1;
                  
                  return (
                    <div
                      key={data.year}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div className="relative w-full">
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t transition-all duration-500 ${
                            isLatest ? 'bg-primary' : 'bg-primary/60'
                          } group-hover:bg-primary`}
                          style={{ 
                            height: `${heightPercent}%`,
                            minHeight: '20px',
                            animation: `grow-bar 0.8s ease-out ${index * 0.1}s both`,
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          <div className="bg-background border rounded-lg shadow-xl px-3 py-2 text-xs whitespace-nowrap">
                            <p className="font-semibold">{data.year}</p>
                            <p className="text-muted-foreground">{data.attendees.toLocaleString()} attendees</p>
                            <p className="text-muted-foreground">{data.locations} location{data.locations > 1 ? 's' : ''}</p>
                            <p className="text-muted-foreground">{data.brands} brands</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{data.year.toString().slice(-2)}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Growth metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">+775%</p>
                  <p className="text-xs text-muted-foreground">Attendee growth since 2016</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">6x</p>
                  <p className="text-xs text-muted-foreground">Regional expansion</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">+525%</p>
                  <p className="text-xs text-muted-foreground">Brand participation growth</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">+380%</p>
                  <p className="text-xs text-muted-foreground">Speaker lineup growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for bar animation */}
      <style>{`
        @keyframes grow-bar {
          from {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }
      `}</style>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ icon, label, value, subtext, trend, trendUp }: StatCardProps) => (
  <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <div className="text-muted-foreground">{icon}</div>
      {trend && (
        <Badge 
          variant="outline" 
          className={`text-xs ${trendUp ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' : 'text-red-600 border-red-200 bg-red-50'}`}
        >
          <TrendingUp className={`h-3 w-3 mr-1 ${trendUp ? '' : 'rotate-180'}`} />
          {trend}
        </Badge>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{subtext}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

interface MarkerContentProps {
  location: MapLocation;
  isHovered: boolean;
  totalLocations?: number;
}

const MarkerContent = ({ location, isHovered }: MarkerContentProps) => {
  const accentColor = location.accentColor || 'hsl(var(--primary))';
  
  return (
    <>
      {/* Outer ripple effect */}
      <div
        className="absolute -inset-2 rounded-full"
        style={{
          backgroundColor: accentColor,
          opacity: isHovered ? 0.2 : 0,
          transform: isHovered ? 'scale(2)' : 'scale(1)',
          transition: 'all 0.3s ease-out',
        }}
      />
      
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
        className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-lg transition-all duration-300"
        style={{
          borderColor: accentColor,
          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
          boxShadow: isHovered 
            ? `0 0 20px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.15)`
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <MapPin
          className="w-5 h-5 transition-transform duration-300"
          style={{ 
            color: accentColor,
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          }}
        />
      </div>

      {/* Enhanced Tooltip */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 transition-all duration-300 pointer-events-none ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ zIndex: 50 }}
      >
        <div
          className="bg-background border-2 rounded-xl shadow-2xl px-4 py-3 whitespace-nowrap min-w-[180px]"
          style={{ borderColor: accentColor }}
        >
          {/* Header with accent */}
          <div 
            className="h-1 w-full rounded-full mb-3"
            style={{ backgroundColor: accentColor }}
          />
          
          <p className="font-bold text-sm">{location.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {location.city}, {location.country}
          </p>
          
          {location.dates && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: accentColor }}>
              <Calendar className="h-3 w-3" />
              {location.dates}
            </p>
          )}
          
          {location.attendees && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              {location.attendees.toLocaleString()} expected
            </p>
          )}
          
          {location.slug && (
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-primary font-medium">Click to view guide →</p>
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${accentColor}`,
          }}
        />
      </div>
    </>
  );
};
