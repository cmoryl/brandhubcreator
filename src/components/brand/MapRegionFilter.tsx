 /**
  * MapRegionFilter - Region navigation controls for the Leaflet map
  * Allows quick navigation to Europe, Americas, Asia-Pacific, or Africa regions
 * IMPORTANT: This component receives the map instance as a prop to avoid
 * top-level react-leaflet imports that cause hydration errors on mobile.
  */
 
 import React from 'react';
 import { Compass } from 'lucide-react';
 import { cn } from '@/lib/utils';
import { REGION_BOUNDS, RegionKey, getLocationRegion, hexToRgba } from './mapRegionTypes';
 
// Re-export types for backwards compatibility
export { REGION_BOUNDS, getLocationRegion } from './mapRegionTypes';
export type { RegionKey } from './mapRegionTypes';
 
 interface MapRegionControlProps {
   selectedRegion: RegionKey;
   onRegionChange: (region: RegionKey) => void;
   locationCounts?: Record<RegionKey, number>;
   accentColor?: string;
  map?: any; // Leaflet map instance passed from parent
 }
 
 /**
  * MapRegionFilter component - renders region navigation controls
 * Receives map instance as prop to avoid react-leaflet import issues
  */
 export const MapRegionFilter: React.FC<MapRegionControlProps> = ({
   selectedRegion,
   onRegionChange,
   locationCounts = {},
   accentColor = '#00d4ff',
  map,
 }) => {
   const handleRegionClick = (regionKey: RegionKey) => {
     onRegionChange(regionKey);
     const region = REGION_BOUNDS[regionKey];
     if (region && map) {
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
           <Compass className="h-3 w-3 text-muted-foreground" />
           <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Region</span>
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
 
 export default MapRegionFilter;
