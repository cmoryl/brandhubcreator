 /**
  * LeafletMapWrapper - Client-side only map component
  * This wrapper ensures the map is only rendered after full client-side mount
  * to prevent "render2 is not a function" errors from react-leaflet's context.
  * Uses dynamic imports and double-tick mounting for maximum safety.
  */
 
 import React, { useEffect, useState, useRef } from 'react';
 import { BrandLocation, LocationCategory } from '@/types/brand';
import type { RegionKey } from './mapRegionTypes';
 
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
 const createColoredIcon = (color: string, L: any) => {
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
   // Track mounting state - use double-tick for safety
   const [isReady, setIsReady] = useState(false);
   const mountedRef = useRef(false);
   
   // Lazy load Leaflet components
   const [LeafletComponents, setLeafletComponents] = useState<{
     MapContainer: any;
     TileLayer: any;
     Marker: any;
     Popup: any;
     L: any;
     MapRegionFilter: any;
     FitBounds: React.FC<{ locations: { lat: number; lng: number }[] }>;
   } | null>(null);
 
   useEffect(() => {
     // Only run on client
     if (typeof window === 'undefined') return;
     mountedRef.current = true;
     
     // Double-tick to ensure DOM is fully ready
     const timer = requestAnimationFrame(() => {
       if (mountedRef.current) {
         setIsReady(true);
       }
     });
     
     return () => {
       mountedRef.current = false;
       cancelAnimationFrame(timer);
     };
   }, []);
 
   // Dynamically import Leaflet only when ready
   useEffect(() => {
     if (!isReady) return;
     
     let cancelled = false;
     
     const loadLeaflet = async () => {
       try {
         const [reactLeaflet, leafletModule, mapRegionFilterModule] = await Promise.all([
           import('react-leaflet'),
           import('leaflet'),
           import('./MapRegionFilter'),
         ]);
         
         // Import CSS
         await import('leaflet/dist/leaflet.css');
         
         const L = leafletModule.default;
         
         // Fix default marker icons
         delete (L.Icon.Default.prototype as any)._getIconUrl;
         L.Icon.Default.mergeOptions({
           iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
           iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
           shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
         });
         
         // Create FitBounds component with access to useMap
         const FitBounds: React.FC<{ locations: { lat: number; lng: number }[] }> = ({ locations }) => {
           const map = reactLeaflet.useMap();
           
           React.useEffect(() => {
             if (locations.length > 0) {
               const bounds = L.latLngBounds(locations.map((loc: { lat: number; lng: number }) => [loc.lat, loc.lng]));
               map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
             }
           }, [map, locations]);
           
           return null;
         };
         
          // Create wrapper for MapRegionFilter that passes map instance
          const MapRegionFilterWithMap: React.FC<any> = (props) => {
            const map = reactLeaflet.useMap();
            return React.createElement(mapRegionFilterModule.MapRegionFilter, { ...props, map });
          };
          
         if (!cancelled) {
           setLeafletComponents({
             MapContainer: reactLeaflet.MapContainer,
             TileLayer: reactLeaflet.TileLayer,
             Marker: reactLeaflet.Marker,
             Popup: reactLeaflet.Popup,
             L,
              MapRegionFilter: MapRegionFilterWithMap,
             FitBounds,
           });
         }
       } catch (error) {
         console.error('Failed to load Leaflet:', error);
       }
     };
     
     loadLeaflet();
     
     return () => {
       cancelled = true;
     };
   }, [isReady]);
 
   // Loading state
   if (!isReady || !LeafletComponents) {
     return (
       <div className="h-full w-full flex items-center justify-center" style={{ background: '#0a1628' }}>
         <div className="text-white/50 text-sm">Loading map...</div>
       </div>
     );
   }
 
   const { MapContainer, TileLayer, Marker, Popup, L, MapRegionFilter, FitBounds } = LeafletComponents;
 
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
       
       <MapRegionFilter
         selectedRegion={selectedRegion}
         onRegionChange={onRegionChange}
         locationCounts={regionCounts}
         accentColor={accentColor}
       />
       
       {filteredLocations.map((location) => {
         const coords = getCoordinates(location);
         const config = categoryConfig[location.category];
         const icon = createColoredIcon(config.color, L);
         
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