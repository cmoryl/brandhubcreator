/**
 * LeafletMapWrapper - Client-side only map component
 * 
 * Uses vanilla Leaflet API directly to avoid react-leaflet's context issues
 * that cause "render2 is not a function" errors.
 * 
 * Supports full theme customization: tile styles, marker colors, and UI overlays.
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { BrandLocation, LocationCategory } from '@/types/brand';
import { REGION_BOUNDS, RegionKey, hexToRgba } from './mapRegionTypes';
import { cn } from '@/lib/utils';
import { Compass } from 'lucide-react';
import { MapThemeConfig, MAP_TILE_CONFIGS, DEFAULT_MAP_THEME } from '@/types/mapTheme';

// Dynamically inject Leaflet CSS only when this component loads
// This prevents render-blocking on pages that don't use maps
const LEAFLET_CSS_ID = 'leaflet-dynamic-css';
if (typeof document !== 'undefined' && !document.getElementById(LEAFLET_CSS_ID)) {
  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(link);
}

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CategoryConfig {
  color: string;
  bgColor: string;
  label: string;
}

interface LeafletMapWrapperProps {
  filteredLocations: BrandLocation[];
  markerPositions: { lat: number; lng: number }[];
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  regionCounts: Record<RegionKey, number>;
  accentColor: string;
  getCoordinates: (location: BrandLocation) => { lat: number; lng: number };
  categoryConfig: Record<LocationCategory, CategoryConfig>;
  /** Optional map theme configuration */
  mapTheme?: MapThemeConfig;
}

// Create custom colored marker icons
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${color}60;
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Loading component
const MapLoadingState: React.FC<{ message?: string }> = ({ message = 'Loading map...' }) => (
  <div className="h-full w-full flex items-center justify-center bg-muted/20">
    <div className="text-muted-foreground text-sm">{message}</div>
  </div>
);

// Region filter component (vanilla, no react-leaflet)
interface RegionFilterProps {
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  locationCounts: Record<RegionKey, number>;
  accentColor: string;
  panelBackground?: string;
  panelText?: string;
  borderColor?: string;
}

const RegionFilter = memo(React.forwardRef<HTMLDivElement, RegionFilterProps>(({ 
  selectedRegion, 
  onRegionChange, 
  locationCounts, 
  accentColor,
  panelBackground = 'rgba(10, 22, 40, 0.9)',
  panelText = 'rgba(255,255,255,0.7)',
  borderColor = 'rgba(255,255,255,0.1)',
}, ref) => {
  return (
    <div ref={ref} className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
      <div 
        className="rounded-lg p-1.5 backdrop-blur-md"
        style={{
          background: panelBackground,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-1 px-2 py-1 mb-1" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <Compass className="h-3 w-3" style={{ color: panelText }} />
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: panelText }}>Region</span>
        </div>
        
        {Object.entries(REGION_BOUNDS).map(([key, region]) => {
          const isSelected = selectedRegion === key;
          const count = locationCounts[key as RegionKey] || 0;
          
          return (
            <button
              key={key}
              onClick={() => onRegionChange(key as RegionKey)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all text-xs",
              )}
              style={{
                color: isSelected ? accentColor : panelText,
                borderLeft: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
                background: isSelected ? hexToRgba(accentColor, 0.1) : 'transparent',
              }}
            >
              <span className="text-sm">{region.icon}</span>
              <span className="flex-1 font-medium">{region.label}</span>
              {count > 0 && (
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isSelected ? hexToRgba(accentColor, 0.2) : hexToRgba(panelText, 0.1),
                    color: isSelected ? accentColor : panelText,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}));

RegionFilter.displayName = 'RegionFilter';

export const LeafletMapWrapper: React.FC<LeafletMapWrapperProps> = ({
  filteredLocations,
  markerPositions,
  selectedRegion,
  onRegionChange,
  regionCounts,
  accentColor,
  getCoordinates,
  categoryConfig,
  mapTheme = DEFAULT_MAP_THEME,
}) => {
  const theme = mapTheme || DEFAULT_MAP_THEME;
  const tileConfig = MAP_TILE_CONFIGS[theme.tileStyle];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const mountedRef = useRef(false);

  // Initialize map on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    mountedRef.current = true;
    
    // Triple-tick delay for safety
    let raf1: number, raf2: number, raf3: number;
    
    raf1 = requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      raf2 = requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        raf3 = requestAnimationFrame(() => {
          if (mountedRef.current) {
            setIsReady(true);
          }
        });
      });
    });
    
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
    };
  }, []);

  // Tile layer ref to allow updates
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Create map when ready
  useEffect(() => {
    if (!isReady || !mapContainerRef.current || mapRef.current) return;
    
    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: false,
      });

      const layer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
      }).addTo(map);
      
      tileLayerRef.current = layer;
      mapRef.current = map;
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [isReady]);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    
    // Remove old tile layer and add new one
    tileLayerRef.current.remove();
    const newLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
    }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [theme.tileStyle, tileConfig.url, tileConfig.attribution]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers with theme colors
    filteredLocations.forEach(location => {
      const coords = getCoordinates(location);
      // Use theme marker colors if available, fallback to categoryConfig
      const markerColor = theme.markerColors[location.category] || categoryConfig[location.category].color;
      const icon = createColoredIcon(markerColor);
      
      const marker = L.marker([coords.lat, coords.lng], { icon })
        .bindPopup(`
          <div style="min-width: 180px;">
            <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${location.name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${location.city}, ${location.country}</p>
            ${location.description ? `<p style="font-size: 12px; color: #888;">${location.description}</p>` : ''}
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${markerColor};"></span>
              <span style="font-size: 12px; color: #888;">${categoryConfig[location.category].label}</span>
            </div>
          </div>
        `)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Always fit to show all markers when in 'all' view and has data
    if (selectedRegion === 'all' && markerPositions.length > 0) {
      try {
        const bounds = L.latLngBounds(markerPositions.map(p => [p.lat, p.lng]));
        // Use flyToBounds for smoother animation when data loads
        mapRef.current.flyToBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 4,
          duration: 1.2,
        });
      } catch (e) {
        console.warn('FitBounds error:', e);
      }
    }
  }, [filteredLocations, markerPositions, selectedRegion, getCoordinates, categoryConfig, theme.markerColors]);

  // Handle region changes (only for non-'all' regions, 'all' is handled in markers effect)
  useEffect(() => {
    if (!mapRef.current || selectedRegion === 'all') return;
    
    const region = REGION_BOUNDS[selectedRegion];
    if (region) {
      mapRef.current.flyToBounds(region.bounds as L.LatLngBoundsExpression, {
        padding: [50, 50],
        maxZoom: 4,
        duration: 1.5,
      });
    }
  }, [selectedRegion]);

  // Determine map background based on tile style
  const mapBackground = theme.tileStyle === 'light' ? '#e5e7eb' : 
                        theme.tileStyle === 'satellite' ? '#1a2e1a' : '#0a1628';

  // Activate map on click
  const handleActivateMap = () => {
    if (!isActivated && mapRef.current) {
      mapRef.current.scrollWheelZoom.enable();
      mapRef.current.dragging.enable();
      setIsActivated(true);
    }
  };

  // Deactivate when mouse leaves
  const handleMouseLeave = () => {
    if (isActivated && mapRef.current) {
      mapRef.current.scrollWheelZoom.disable();
      mapRef.current.dragging.disable();
      setIsActivated(false);
    }
  };

  if (!isReady) {
    return <MapLoadingState />;
  }

  return (
    <div className="relative h-full w-full" onMouseLeave={handleMouseLeave}>
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ background: mapBackground }}
        onClick={handleActivateMap}
      />
      {/* Click-to-activate overlay */}
      {!isActivated && (
        <div
          className="absolute inset-0 z-[999] flex items-center justify-center cursor-pointer bg-foreground/5 transition-opacity duration-300 hover:bg-foreground/10"
          onClick={handleActivateMap}
        >
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-border/50 flex items-center gap-2 text-sm text-muted-foreground pointer-events-none">
            <Compass className="h-4 w-4" />
            Click to interact with map
          </div>
        </div>
      )}
      <RegionFilter
        selectedRegion={selectedRegion}
        onRegionChange={onRegionChange}
        locationCounts={regionCounts}
        accentColor={theme.uiTheme.accentColor || accentColor}
        panelBackground={theme.uiTheme.panelBackground}
        panelText={theme.uiTheme.panelText}
        borderColor={theme.uiTheme.borderColor}
      />
    </div>
  );
};

export default LeafletMapWrapper;
