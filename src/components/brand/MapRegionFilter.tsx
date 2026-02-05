/**
 * MapRegionFilter - Region navigation controls for the Leaflet map
 * Allows quick navigation to Europe, Americas, Asia-Pacific, or Africa regions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useMap } from 'react-leaflet';
import { Globe, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import L from 'leaflet';

// Region bounding boxes for quick navigation
export const REGION_BOUNDS: Record<string, { bounds: L.LatLngBoundsLiteral; label: string; icon?: string }> = {
  all: { 
    bounds: [[-60, -180], [70, 180]], 
    label: 'World',
    icon: '🌍'
  },
  americas: { 
    bounds: [[-55, -170], [70, -30]], 
    label: 'Americas',
    icon: '🌎'
  },
  europe: { 
    bounds: [[35, -25], [72, 45]], 
    label: 'Europe',
    icon: '🇪🇺'
  },
  asiaPacific: { 
    bounds: [[-50, 60], [55, 180]], 
    label: 'Asia-Pacific',
    icon: '🌏'
  },
  africa: { 
    bounds: [[-35, -20], [38, 55]], 
    label: 'Africa & Middle East',
    icon: '🌍'
  },
};

export type RegionKey = keyof typeof REGION_BOUNDS;

interface MapRegionControlProps {
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  locationCounts?: Record<RegionKey, number>;
  accentColor?: string;
}

// Helper to determine which region a location belongs to
export const getLocationRegion = (lat: number, lng: number): RegionKey => {
  // Americas: roughly -170 to -30 longitude
  if (lng >= -170 && lng <= -30) return 'americas';
  
  // Europe: roughly -25 to 45 longitude and 35 to 72 latitude
  if (lng >= -25 && lng <= 45 && lat >= 35 && lat <= 72) return 'europe';
  
  // Africa & Middle East: -20 to 55 longitude and -35 to 38 latitude (excluding Europe overlap)
  if (lng >= -20 && lng <= 55 && lat >= -35 && lat < 35) return 'africa';
  if (lng >= 35 && lng <= 55 && lat >= 35 && lat <= 38) return 'africa'; // Middle East
  
  // Asia-Pacific: everything else east of 60 longitude
  if (lng >= 60 || lng < -170) return 'asiaPacific';
  
  // Default to closest region
  return 'europe';
};

// Convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 212, 255, ${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Inner component that uses the map context
const MapRegionControlInner: React.FC<MapRegionControlProps> = ({
  selectedRegion,
  onRegionChange,
  locationCounts = {},
  accentColor = '#00d4ff',
}) => {
  const map = useMap();

  const handleRegionClick = (regionKey: RegionKey) => {
    onRegionChange(regionKey);
    const region = REGION_BOUNDS[regionKey];
    if (region) {
      map.flyToBounds(region.bounds, {
        padding: [50, 50],
        maxZoom: regionKey === 'all' ? 2 : 4,
        duration: 1.5,
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
      <div 
        className="rounded-lg p-1.5 backdrop-blur-md"
        style={{
          background: 'rgba(10, 22, 40, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-1 px-2 py-1 mb-1 border-b border-white/10">
          <Compass className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Region</span>
        </div>
        
        {Object.entries(REGION_BOUNDS).map(([key, region]) => {
          const isSelected = selectedRegion === key;
          const count = locationCounts[key as RegionKey] || 0;
          
          return (
            <button
              key={key}
              onClick={() => handleRegionClick(key as RegionKey)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all",
                "hover:bg-white/10 text-xs",
                isSelected && "bg-white/10"
              )}
              style={{
                color: isSelected ? accentColor : 'rgba(255,255,255,0.7)',
                borderLeft: isSelected ? `2px solid ${accentColor}` : '2px solid transparent',
              }}
            >
              <span className="text-sm">{region.icon}</span>
              <span className="flex-1 font-medium">{region.label}</span>
              {count > 0 && (
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isSelected ? hexToRgba(accentColor, 0.2) : 'rgba(255,255,255,0.1)',
                    color: isSelected ? accentColor : 'rgba(255,255,255,0.5)',
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
};

 // Export the inner component directly - it must be used inside MapContainer
 export const MapRegionFilter = MapRegionControlInner;

export default MapRegionFilter;
