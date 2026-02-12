/**
 * MapThemePreview - Live real-time map preview for theme editing
 * Uses vanilla Leaflet to render a mini map that updates as theme settings change.
 */

import React, { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { MapThemeConfig, MAP_TILE_CONFIGS } from '@/types/mapTheme';
import { cn } from '@/lib/utils';

// Dynamically inject Leaflet CSS
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

// Sample locations for preview
const SAMPLE_LOCATIONS = [
  { name: 'New York', lat: 40.7128, lng: -74.006, category: 'headquarters' as const },
  { name: 'London', lat: 51.5074, lng: -0.1278, category: 'office' as const },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, category: 'studio' as const },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, category: 'partner' as const },
  { name: 'Berlin', lat: 52.52, lng: 13.405, category: 'datacenter' as const },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, category: 'office' as const },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, category: 'studio' as const },
];

const createMarkerIcon = (color: string, style: string = 'circle', size: number = 20, pulse: boolean = true) => {
  let html = '';
  const pulseHtml = pulse ? `
    <div style="
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: ${color};
      opacity: 0.25;
      animation: pulse 2s infinite;
    "></div>
  ` : '';

  switch (style) {
    case 'pin':
      html = `
        <div style="
          width: ${size}px; height: ${size * 1.4}px;
          background: ${color}; border: 2px solid white;
          border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;
      break;
    case 'dot':
      html = `
        <div style="
          width: ${size * 0.6}px; height: ${size * 0.6}px;
          background: ${color}; border-radius: 50%;
          box-shadow: 0 0 8px ${color}80;
        "></div>
      `;
      break;
    case 'ring':
      html = `
        <div style="
          width: ${size}px; height: ${size}px;
          background: transparent; border: 3px solid ${color};
          border-radius: 50%; box-shadow: 0 0 8px ${color}40;
        ">
          <div style="
            width: ${size * 0.4}px; height: ${size * 0.4}px;
            background: ${color}; border-radius: 50%;
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
      `;
      break;
    case 'diamond':
      html = `
        <div style="
          width: ${size * 0.7}px; height: ${size * 0.7}px;
          background: ${color}; border: 2px solid white;
          transform: rotate(45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;
      break;
    default: // circle
      html = `
        <div style="
          width: ${size}px; height: ${size}px;
          background: ${color}; border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${color}60;
          position: relative;
        ">${pulseHtml}</div>
      `;
      break;
  }

  return L.divIcon({
    className: 'custom-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface MapThemePreviewProps {
  theme: MapThemeConfig;
  className?: string;
  height?: string;
}

export const MapThemePreview = memo(({ theme, className, height = '280px' }: MapThemePreviewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [30, 10],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Inject pulse animation
    if (!document.getElementById('marker-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'marker-pulse-style';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .custom-marker { background: transparent !important; border: none !important; }
      `;
      document.head.appendChild(style);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const tileConfig = MAP_TILE_CONFIGS[theme.tileStyle];
    if (!tileConfig) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: '',
      maxZoom: 18,
    }).addTo(map);
  }, [theme.tileStyle]);

  // Update markers when colors/style change
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;

    markers.clearLayers();

    const markerStyle = theme.uiTheme.markerStyle || 'circle';
    const markerSize = theme.uiTheme.markerSize || 20;
    const markerPulse = theme.uiTheme.markerPulse !== false;

    SAMPLE_LOCATIONS.forEach(loc => {
      const color = theme.markerColors[loc.category] || '#6b7280';
      const icon = createMarkerIcon(color, markerStyle, markerSize, markerPulse);
      const marker = L.marker([loc.lat, loc.lng], { icon });
      marker.bindTooltip(loc.name, { direction: 'top', offset: [0, -10] });
      markers.addLayer(marker);
    });
  }, [theme.markerColors, theme.uiTheme.markerStyle, theme.uiTheme.markerSize, theme.uiTheme.markerPulse]);

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-border", className)}>
      <div ref={mapRef} style={{ height, width: '100%' }} />
      
      {/* Simulated UI overlay to preview panel theme */}
      <div
        className="absolute bottom-3 left-3 rounded-lg px-3 py-2 text-xs z-[1000] pointer-events-none"
        style={{
          background: theme.uiTheme.panelBackground,
          color: theme.uiTheme.panelText,
          borderColor: theme.uiTheme.borderColor,
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <div className="font-medium mb-1" style={{ color: theme.uiTheme.accentColor }}>
          Theme Preview
        </div>
        <div className="flex gap-2 items-center">
          {Object.entries(theme.markerColors).slice(0, 3).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-[10px]">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated button overlay */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
        <div
          className={cn(
            "px-3 py-1.5 text-xs font-medium",
            theme.uiTheme.buttonStyle === 'pill' && 'rounded-full',
            theme.uiTheme.buttonStyle === 'square' && 'rounded-none',
            theme.uiTheme.buttonStyle === 'ghost' && 'bg-transparent border',
            (!theme.uiTheme.buttonStyle || theme.uiTheme.buttonStyle === 'rounded') && 'rounded-md',
          )}
          style={{
            backgroundColor: theme.uiTheme.buttonStyle === 'ghost' ? 'transparent' : theme.uiTheme.accentColor,
            color: theme.uiTheme.buttonStyle === 'ghost' ? theme.uiTheme.accentColor : '#fff',
            borderColor: theme.uiTheme.accentColor,
            borderWidth: theme.uiTheme.buttonStyle === 'ghost' ? '1px' : '0',
            borderStyle: 'solid',
          }}
        >
          Filter
        </div>
      </div>
    </div>
  );
});

MapThemePreview.displayName = 'MapThemePreview';

/**
 * Small static tile preview thumbnail for preset cards
 */
export const TilePreviewThumb = memo(({ tileStyle, size = 80 }: { tileStyle: string; size?: number }) => {
  const config = MAP_TILE_CONFIGS[tileStyle as keyof typeof MAP_TILE_CONFIGS];
  if (!config) return null;

  // Use a static tile image from the tile server
  const tileUrl = config.url
    .replace('{s}', 'a')
    .replace('{z}', '3')
    .replace('{x}', '4')
    .replace('{y}', '2')
    .replace('{r}', '');

  return (
    <div
      className="rounded-md overflow-hidden border border-border/50"
      style={{ width: size, height: size * 0.6 }}
    >
      <img
        src={tileUrl}
        alt={config.label}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
});

TilePreviewThumb.displayName = 'TilePreviewThumb';
