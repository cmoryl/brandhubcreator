/**
 * LeafletMapWrapper - Client-side only map component
 * 
 * CRITICAL: To prevent "render2 is not a function" errors, we:
 * 1. Use static imports (not dynamic) for react-leaflet
 * 2. Gate rendering with a client-side-only check
 * 3. Wait for multiple render cycles before showing the map
 * 
 * The parent component MUST lazy-load this file via React.lazy()
 */

import React, { useEffect, useState, useRef, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BrandLocation, LocationCategory } from '@/types/brand';
import { MapRegionFilter } from './MapRegionFilter';
import type { RegionKey } from './mapRegionTypes';

// Fix default marker icons immediately
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

// FitBounds component
const FitBounds: React.FC<{ locations: { lat: number; lng: number }[] }> = memo(({ locations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0 && map) {
      try {
        const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      } catch (e) {
        console.warn('FitBounds error:', e);
      }
    }
  }, [map, locations]);
  
  return null;
});

FitBounds.displayName = 'FitBounds';

// MapRegionFilter wrapper that passes map instance
const MapRegionFilterWithMap: React.FC<{
  selectedRegion: RegionKey;
  onRegionChange: (region: RegionKey) => void;
  locationCounts: Record<RegionKey, number>;
  accentColor: string;
}> = memo((props) => {
  const map = useMap();
  return <MapRegionFilter {...props} map={map} />;
});

MapRegionFilterWithMap.displayName = 'MapRegionFilterWithMap';

// Loading component
const MapLoadingState: React.FC<{ message?: string }> = ({ message = 'Loading map...' }) => (
  <div className="h-full w-full flex items-center justify-center bg-muted/20">
    <div className="text-muted-foreground text-sm">{message}</div>
  </div>
);

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
  // Wait for client-side hydration to complete
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    mountedRef.current = true;
    
    // Wait for multiple animation frames to ensure React is fully hydrated
    let raf1: number;
    let raf2: number;
    let raf3: number;
    
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

  if (!isReady) {
    return <MapLoadingState />;
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full"
      style={{ background: '#0a1628' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {markerPositions.length > 0 && selectedRegion === 'all' && (
        <FitBounds locations={markerPositions} />
      )}
      
      <MapRegionFilterWithMap
        selectedRegion={selectedRegion}
        onRegionChange={onRegionChange}
        locationCounts={regionCounts}
        accentColor={accentColor}
      />
      
      {filteredLocations.map((location) => {
        const coords = getCoordinates(location);
        const config = categoryConfig[location.category];
        const icon = createColoredIcon(config.color);
        
        return (
          <Marker
            key={location.id}
            position={[coords.lat, coords.lng]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-semibold text-sm mb-1">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{location.city}, {location.country}</p>
                {location.description && (
                  <p className="text-xs text-gray-500">{location.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-gray-500">{config.label}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LeafletMapWrapper;
