 /**
  * Map Region Types and Helpers
  * Separated from MapRegionFilter to allow importing without react-leaflet dependency
  */
 
// Define bounds type inline to avoid any leaflet import
type LatLngBoundsLiteral = [[number, number], [number, number]];
 
 // Region bounding boxes for quick navigation
export const REGION_BOUNDS: Record<string, { bounds: LatLngBoundsLiteral; label: string; icon?: string }> = {
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
 export const hexToRgba = (hex: string, alpha: number): string => {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   if (!result) return `rgba(0, 212, 255, ${alpha})`;
   const r = parseInt(result[1], 16);
   const g = parseInt(result[2], 16);
   const b = parseInt(result[3], 16);
   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
 };