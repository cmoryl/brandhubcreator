/**
 * LeafletMapWrapper - Client-side only map component
 * 
 * Uses vanilla Leaflet API directly to avoid react-leaflet's context issues
 * that cause "render2 is not a function" errors.
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BrandLocation, LocationCategory } from '@/types/brand';
import { REGION_BOUNDS, RegionKey, hexToRgba } from './mapRegionTypes';
import { cn } from '@/lib/utils';
import { Compass } from 'lucide-react';

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
const RegionFilter: React.FC<{
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  locationCounts: Record<RegionKey, number>;
  accentColor: string;
}> = memo(({ selectedRegion, onRegionChange, locationCounts, accentColor }) => {
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
          <Compass className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Region</span>
        </div>
        
        {Object.entries(REGION_BOUNDS).map(([key, region]) => {
          const isSelected = selectedRegion === key;
          const count = locationCounts[key as RegionKey] || 0;
          
          return (
            <button
              key={key}
              onClick={() => onRegionChange(key as RegionKey)}
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
});

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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isReady, setIsReady] = useState(false);
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

  // Create map when ready
  useEffect(() => {
    if (!isReady || !mapContainerRef.current || mapRef.current) return;
    
    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      mapRef.current = map;
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isReady]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredLocations.forEach(location => {
      const coords = getCoordinates(location);
      const config = categoryConfig[location.category];
      const icon = createColoredIcon(config.color);
      
      const marker = L.marker([coords.lat, coords.lng], { icon })
        .bindPopup(`
          <div style="min-width: 180px;">
            <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${location.name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${location.city}, ${location.country}</p>
            ${location.description ? `<p style="font-size: 12px; color: #888;">${location.description}</p>` : ''}
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${config.color};"></span>
              <span style="font-size: 12px; color: #888;">${config.label}</span>
            </div>
          </div>
        `)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Fit bounds if showing all and has markers
    if (selectedRegion === 'all' && markerPositions.length > 0) {
      try {
        const bounds = L.latLngBounds(markerPositions.map(p => [p.lat, p.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      } catch (e) {
        console.warn('FitBounds error:', e);
      }
    }
  }, [filteredLocations, markerPositions, selectedRegion, getCoordinates, categoryConfig]);

  // Handle region changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    const region = REGION_BOUNDS[selectedRegion];
    if (region) {
      mapRef.current.flyToBounds(region.bounds as L.LatLngBoundsExpression, {
        padding: [50, 50],
        maxZoom: selectedRegion === 'all' ? 2 : 4,
        duration: 1.5,
      });
    }
  }, [selectedRegion]);

  if (!isReady) {
    return <MapLoadingState />;
  }

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ background: '#0a1628' }}
      />
      <RegionFilter
        selectedRegion={selectedRegion}
        onRegionChange={onRegionChange}
        locationCounts={regionCounts}
        accentColor={accentColor}
      />
    </div>
  );
};

export default LeafletMapWrapper;
