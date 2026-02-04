/**
 * LocationsSection - Interactive World Map with GlobalLink Universe styling
 * Features: Animated markers, hover details, category filtering, stats display
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Plus, Edit2, Trash2, Building2, Mic, Monitor, 
  Globe, ChevronRight, X, Sparkles, GripVertical
} from 'lucide-react';
import { BrandLocation, LocationCategory, LocationStat } from '@/types/brand';
import { SectionHeader } from './SectionHeader';

// World map coordinates (percentage-based for 2:1 aspect ratio map)
// These correspond to the detailed SVG world map with viewBox 0 0 2000 1000
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  // North America
  'New York': { x: 26, y: 32 },
  'Los Angeles': { x: 14, y: 36 },
  'San Francisco': { x: 12, y: 34 },
  'Chicago': { x: 22, y: 32 },
  'Miami': { x: 24, y: 42 },
  'Toronto': { x: 24, y: 30 },
  'Vancouver': { x: 12, y: 28 },
  'Seattle': { x: 13, y: 28 },
  'Denver': { x: 18, y: 34 },
  'Dallas': { x: 20, y: 38 },
  'Atlanta': { x: 24, y: 36 },
  'Boston': { x: 27, y: 30 },
  'Washington DC': { x: 26, y: 34 },
  'Montreal': { x: 26, y: 28 },
  'Mexico City': { x: 19, y: 48 },
  'Buenos Aires': { x: 31, y: 82 },
  'São Paulo': { x: 34, y: 74 },
  'Rio de Janeiro': { x: 36, y: 72 },
  'Lima': { x: 26, y: 68 },
  'Bogotá': { x: 26, y: 58 },
  'Santiago': { x: 28, y: 80 },
  // Europe
  'London': { x: 45, y: 26 },
  'Paris': { x: 47, y: 28 },
  'Berlin': { x: 51, y: 26 },
  'Munich': { x: 50, y: 28 },
  'Frankfurt': { x: 49, y: 27 },
  'Amsterdam': { x: 48, y: 25 },
  'Brussels': { x: 48, y: 26 },
  'Madrid': { x: 44, y: 34 },
  'Barcelona': { x: 47, y: 33 },
  'Milan': { x: 50, y: 30 },
  'Rome': { x: 51, y: 33 },
  'Stockholm': { x: 53, y: 20 },
  'Oslo': { x: 50, y: 19 },
  'Copenhagen': { x: 51, y: 23 },
  'Warsaw': { x: 55, y: 25 },
  'Prague': { x: 52, y: 27 },
  'Vienna': { x: 53, y: 28 },
  'Zurich': { x: 49, y: 29 },
  'Geneva': { x: 48, y: 30 },
  'Dublin': { x: 43, y: 24 },
  'Edinburgh': { x: 44, y: 22 },
  'Lisbon': { x: 42, y: 35 },
  'Valencia': { x: 45, y: 35 },
  'Rennes': { x: 45, y: 28 },
  'Lyon': { x: 48, y: 30 },
  'Tourcoing': { x: 47, y: 26 },
  'Angoulême': { x: 46, y: 30 },
  'Athens': { x: 56, y: 35 },
  'Istanbul': { x: 58, y: 33 },
  'Moscow': { x: 60, y: 22 },
  'St. Petersburg': { x: 58, y: 19 },
  'Kiev': { x: 58, y: 26 },
  // Africa
  'Cape Town': { x: 54, y: 82 },
  'Johannesburg': { x: 56, y: 76 },
  'Nairobi': { x: 60, y: 55 },
  'Lagos': { x: 48, y: 52 },
  'Cairo': { x: 58, y: 40 },
  'Casablanca': { x: 43, y: 38 },
  'Accra': { x: 46, y: 52 },
  // Middle East
  'Dubai': { x: 66, y: 42 },
  'Tel Aviv': { x: 59, y: 38 },
  'Riyadh': { x: 64, y: 44 },
  'Doha': { x: 66, y: 44 },
  'Abu Dhabi': { x: 66, y: 44 },
  // Asia
  'Tokyo': { x: 88, y: 34 },
  'Osaka': { x: 87, y: 36 },
  'Singapore': { x: 77, y: 55 },
  'Hong Kong': { x: 80, y: 42 },
  'Shanghai': { x: 82, y: 38 },
  'Beijing': { x: 80, y: 32 },
  'Seoul': { x: 84, y: 34 },
  'Taipei': { x: 82, y: 42 },
  'Mumbai': { x: 68, y: 48 },
  'Pune': { x: 69, y: 49 },
  'Delhi': { x: 70, y: 42 },
  'Bangalore': { x: 70, y: 54 },
  'Chennai': { x: 71, y: 54 },
  'Kolkata': { x: 73, y: 46 },
  'Ho Chi Minh City': { x: 78, y: 52 },
  'Hanoi': { x: 78, y: 46 },
  'Bangkok': { x: 76, y: 50 },
  'Jakarta': { x: 78, y: 60 },
  'Kuala Lumpur': { x: 77, y: 54 },
  'Manila': { x: 82, y: 50 },
  // Oceania
  'Sydney': { x: 90, y: 80 },
  'Melbourne': { x: 88, y: 82 },
  'Brisbane': { x: 91, y: 76 },
  'Perth': { x: 80, y: 78 },
  'Auckland': { x: 96, y: 82 },
  'Wellington': { x: 97, y: 85 },
};

const CATEGORY_CONFIG: Record<LocationCategory, { 
  color: string; 
  bgColor: string; 
  icon: React.ElementType;
  label: string;
}> = {
  studio: { color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', icon: Mic, label: 'Studios' },
  office: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', icon: Building2, label: 'Client Service & Production' },
  headquarters: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', icon: Building2, label: 'Headquarters' },
  datacenter: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', icon: Monitor, label: 'Data Centers' },
  partner: { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', icon: Globe, label: 'Partners' },
};

interface LocationsMapProps {
  locations: BrandLocation[];
  hoveredLocation: string | null;
  onHover: (id: string | null) => void;
  onClick: (location: BrandLocation) => void;
  accentColor?: string;
}

// SVG World Map Component with animated markers
const LocationsMap: React.FC<LocationsMapProps> = ({
  locations,
  hoveredLocation,
  onHover,
  onClick,
  accentColor = '#00d4ff',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get coordinates for a location
  const getCoordinates = (location: BrandLocation) => {
    if (location.coordinates) {
      // Convert lat/lng to x/y percentage
      const x = ((location.coordinates.lng + 180) / 360) * 100;
      const y = ((90 - location.coordinates.lat) / 180) * 100;
      return { x, y };
    }
    // Fallback to city lookup
    return CITY_COORDINATES[location.city] || { x: 50, y: 50 };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[2/1] overflow-hidden rounded-xl"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 100%)' }}
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* World Map SVG - Detailed Geographic Outline */}
      <svg
        viewBox="0 0 2000 1000"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0d2137" />
          </linearGradient>
          <linearGradient id="mapStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor={accentColor} floodOpacity="0.3"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Detailed world map paths - realistic continental outlines */}
        <g fill="url(#mapGradient)" stroke="url(#mapStrokeGradient)" strokeWidth="1.5" opacity="0.85" filter="url(#mapGlow)">
          {/* North America */}
          <path d="M170,130 L195,115 L245,100 L290,95 L340,85 L385,90 L420,100 L455,115 L485,135 L510,160 L525,185 L535,215 L540,250 L535,285 L525,320 L510,350 L490,380 L465,405 L435,425 L400,440 L360,450 L320,455 L280,455 L245,450 L215,440 L190,425 L170,400 L155,370 L145,335 L140,295 L140,255 L145,215 L155,175 L170,145 Z" />
          {/* Greenland */}
          <path d="M580,70 L620,65 L660,70 L695,85 L720,110 L735,145 L740,185 L730,225 L710,260 L680,285 L645,295 L605,290 L575,270 L555,240 L545,200 L545,160 L555,125 L575,95 Z" />
          {/* Central America & Caribbean */}
          <path d="M310,455 L340,465 L365,480 L385,500 L400,525 L410,550 L415,575 L410,595 L395,610 L375,620 L350,625 L325,620 L305,610 L290,595 L280,575 L275,550 L280,525 L290,505 L305,485 Z" />
          {/* South America */}
          <path d="M400,620 L435,630 L465,650 L490,680 L510,720 L525,765 L535,815 L540,870 L535,920 L520,965 L495,1000 L460,1020 L420,1030 L375,1025 L335,1010 L300,985 L275,950 L255,905 L245,855 L245,800 L255,750 L275,705 L305,665 L345,635 L380,620 Z" />
          {/* Europe */}
          <path d="M900,185 L935,175 L975,170 L1015,175 L1050,190 L1080,215 L1100,250 L1110,290 L1105,330 L1090,365 L1065,395 L1030,420 L990,435 L945,440 L900,430 L860,410 L830,380 L810,345 L800,305 L805,265 L820,230 L845,200 L875,185 Z" />
          {/* Scandinavia */}
          <path d="M975,85 L1010,80 L1040,90 L1065,110 L1080,140 L1085,175 L1075,205 L1055,230 L1025,245 L990,250 L955,240 L925,220 L905,190 L895,155 L900,120 L920,95 L950,85 Z" />
          {/* UK & Ireland */}
          <path d="M830,220 L850,210 L875,215 L895,230 L905,255 L900,280 L885,300 L860,315 L830,320 L805,310 L790,290 L785,265 L795,240 L815,225 Z" />
          <path d="M795,245 L815,240 L830,250 L835,270 L825,290 L805,300 L785,295 L775,275 L780,255 Z" />
          {/* Africa */}
          <path d="M890,440 L940,435 L990,445 L1035,470 L1075,505 L1105,550 L1125,605 L1135,665 L1135,730 L1125,795 L1105,855 L1075,905 L1035,945 L985,975 L930,990 L870,985 L815,965 L770,930 L735,880 L715,820 L705,755 L710,690 L725,630 L755,575 L795,530 L840,495 L880,465 Z" />
          {/* Middle East */}
          <path d="M1100,350 L1145,340 L1190,345 L1230,365 L1260,395 L1280,435 L1285,480 L1275,525 L1250,565 L1210,595 L1165,610 L1115,605 L1075,585 L1050,550 L1040,505 L1045,460 L1065,420 L1095,385 Z" />
          {/* Russia / Northern Asia */}
          <path d="M1080,80 L1180,65 L1290,55 L1400,50 L1510,55 L1610,70 L1700,95 L1770,130 L1820,175 L1850,230 L1860,290 L1850,350 L1820,400 L1770,440 L1700,470 L1620,485 L1530,490 L1440,480 L1350,460 L1270,430 L1200,390 L1145,340 L1105,285 L1080,225 L1070,165 L1075,110 Z" />
          {/* India & Southeast Asia */}
          <path d="M1280,440 L1325,430 L1375,435 L1420,455 L1460,490 L1490,535 L1510,590 L1520,650 L1515,710 L1495,765 L1460,810 L1410,840 L1355,855 L1295,850 L1245,825 L1205,785 L1180,735 L1165,680 L1165,620 L1180,565 L1210,515 L1250,475 Z" />
          {/* China & East Asia */}
          <path d="M1440,280 L1510,265 L1585,265 L1655,280 L1715,310 L1765,355 L1800,410 L1820,475 L1820,545 L1800,610 L1760,665 L1705,710 L1640,740 L1565,755 L1490,750 L1420,730 L1360,695 L1315,645 L1285,585 L1275,520 L1280,455 L1305,395 L1350,345 L1405,305 Z" />
          {/* Japan */}
          <path d="M1790,340 L1820,330 L1855,335 L1885,355 L1905,385 L1915,425 L1910,465 L1890,500 L1860,525 L1820,540 L1780,535 L1745,515 L1725,485 L1720,445 L1730,405 L1755,370 Z" />
          {/* Southeast Asian Islands */}
          <path d="M1520,700 L1570,690 L1625,695 L1675,720 L1720,760 L1755,815 L1775,880 L1770,945 L1740,1000 L1690,1040 L1625,1060 L1555,1055 L1490,1030 L1440,985 L1410,925 L1400,860 L1415,795 L1450,740 L1500,700 Z" />
          {/* Australia */}
          <path d="M1580,780 L1650,760 L1725,765 L1795,790 L1855,835 L1900,895 L1925,965 L1930,1040 L1910,1110 L1865,1170 L1805,1215 L1730,1240 L1650,1245 L1575,1225 L1510,1185 L1465,1125 L1440,1055 L1445,980 L1475,910 L1525,850 L1585,805 Z" />
          {/* New Zealand */}
          <path d="M1915,1000 L1940,990 L1965,1000 L1985,1025 L1995,1060 L1990,1100 L1975,1135 L1950,1160 L1920,1170 L1890,1165 L1865,1145 L1850,1115 L1850,1080 L1865,1045 L1890,1020 Z" />
        </g>
        
        {/* Additional detail lines for depth */}
        <g fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.25">
          {/* Continental shelf/coastline details */}
          <path d="M175,140 C220,125 280,110 340,100 S450,120 510,170" />
          <path d="M540,270 C530,320 500,380 440,430" />
          <path d="M410,600 C450,640 490,700 520,790" />
          <path d="M905,195 C950,185 1000,185 1050,205" />
          <path d="M1090,95 C1200,75 1400,65 1600,85" />
          <path d="M1600,800 C1700,790 1800,820 1870,880" />
        </g>
      </svg>

      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {locations.slice(0, 20).map((loc, i) => {
          const coords = getCoordinates(loc);
          const nextLoc = locations[(i + 1) % locations.length];
          const nextCoords = getCoordinates(nextLoc);
          return (
            <motion.line
              key={`line-${loc.id}`}
              x1={`${coords.x}%`}
              y1={`${coords.y}%`}
              x2={`${nextCoords.x}%`}
              y2={`${nextCoords.y}%`}
              stroke={accentColor}
              strokeWidth="0.3"
              opacity="0.15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: i * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Location markers */}
      {locations.map((location, index) => {
        const coords = getCoordinates(location);
        const isHovered = hoveredLocation === location.id;
        const categoryConfig = CATEGORY_CONFIG[location.category];
        
        return (
          <motion.div
            key={location.id}
            className="absolute cursor-pointer"
            style={{ 
              left: `${coords.x}%`, 
              top: `${coords.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              delay: index * 0.02 
            }}
            onMouseEnter={() => onHover(location.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(location)}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                backgroundColor: categoryConfig.color,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{ 
                scale: isHovered ? [1, 2.5, 1] : [1, 1.8, 1],
                opacity: isHovered ? [0.4, 0, 0.4] : [0.2, 0, 0.2],
              }}
              transition={{ 
                duration: isHovered ? 1 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Main dot */}
            <motion.div
              className="relative rounded-full shadow-lg"
              style={{ 
                backgroundColor: categoryConfig.color,
                width: isHovered ? 14 : 10,
                height: isHovered ? 14 : 10,
                boxShadow: `0 0 ${isHovered ? 15 : 8}px ${categoryConfig.color}`,
              }}
              animate={{ scale: isHovered ? 1.3 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />

            {/* Hover tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  style={{ 
                    left: coords.x > 70 ? 'auto' : '100%',
                    right: coords.x > 70 ? '100%' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginLeft: coords.x > 70 ? 0 : 8,
                    marginRight: coords.x > 70 ? 8 : 0,
                  }}
                  initial={{ opacity: 0, scale: 0.8, x: coords.x > 70 ? 10 : -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div 
                    className="px-3 py-2 rounded-lg whitespace-nowrap backdrop-blur-sm"
                    style={{ 
                      background: 'rgba(10, 22, 40, 0.95)',
                      border: `1px solid ${categoryConfig.color}40`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 10px ${categoryConfig.color}30`,
                    }}
                  >
                    <p className="text-white font-semibold text-sm">{location.name}</p>
                    <p className="text-gray-400 text-xs">{location.city}, {location.country}</p>
                    {location.description && (
                      <p className="text-gray-500 text-xs mt-1 max-w-[200px]">{location.description}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Ambient glow effects */}
      <div 
        className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full blur-[80px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` }}
      />
    </div>
  );
};

interface LocationsSectionProps {
  locations?: BrandLocation[];
  locationStats?: LocationStat[];
  onLocationsChange?: (locations: BrandLocation[]) => void;
  onLocationStatsChange?: (stats: LocationStat[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  accentColor?: string;
  sectionTitle?: string;
  sectionDescription?: string;
  onSectionTitleChange?: (title: string) => void;
  onSectionDescriptionChange?: (description: string) => void;
}

export const LocationsSection: React.FC<LocationsSectionProps> = ({
  locations = [],
  locationStats = [],
  onLocationsChange,
  onLocationStatsChange,
  customSubtitle,
  onSubtitleChange,
  accentColor = '#00d4ff',
  sectionTitle = 'Our Locations',
  sectionDescription = 'We have multiple owned and operated facilities in different locations across the globe.',
  onSectionTitleChange,
  onSectionDescriptionChange,
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [editingLocation, setEditingLocation] = useState<BrandLocation | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<BrandLocation>>({
    category: 'office',
    city: '',
    country: '',
    name: '',
    description: '',
  });

  const filteredLocations = useMemo(() => {
    if (selectedCategory === 'all') return locations;
    return locations.filter(loc => loc.category === selectedCategory);
  }, [locations, selectedCategory]);

  // Group locations by category for the list
  const locationsByCategory = useMemo(() => {
    const grouped: Record<LocationCategory, BrandLocation[]> = {
      studio: [],
      office: [],
      headquarters: [],
      datacenter: [],
      partner: [],
    };
    locations.forEach(loc => {
      if (grouped[loc.category]) {
        grouped[loc.category].push(loc);
      }
    });
    return grouped;
  }, [locations]);

  const handleAddLocation = () => {
    if (!formData.city || !formData.country) return;
    
    const newLocation: BrandLocation = {
      id: crypto.randomUUID(),
      name: formData.name || formData.city,
      city: formData.city,
      country: formData.country,
      category: formData.category as LocationCategory || 'office',
      description: formData.description,
      coordinates: formData.coordinates,
    };

    onLocationsChange?.([...locations, newLocation]);
    setFormData({ category: 'office', city: '', country: '', name: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditLocation = () => {
    if (!editingLocation || !formData.city || !formData.country) return;
    
    const updated = locations.map(loc => 
      loc.id === editingLocation.id 
        ? { ...loc, ...formData } as BrandLocation
        : loc
    );
    
    onLocationsChange?.(updated);
    setEditingLocation(null);
    setFormData({ category: 'office', city: '', country: '', name: '', description: '' });
  };

  const handleDeleteLocation = (id: string) => {
    onLocationsChange?.(locations.filter(loc => loc.id !== id));
  };

  const openEditDialog = (location: BrandLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      city: location.city,
      country: location.country,
      category: location.category,
      description: location.description,
      coordinates: location.coordinates,
    });
  };

  const canEdit = !!onLocationsChange;

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="Locations" 
        defaultSubtitle="Interactive map of global facilities and locations"
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ 
          background: 'linear-gradient(135deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Animated border glow */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`,
            animation: 'shimmer 3s infinite',
          }}
        />

        {/* Curved accent line */}
        <svg 
          className="absolute left-0 top-0 h-full w-16 pointer-events-none opacity-60"
          viewBox="0 0 60 400"
          preserveAspectRatio="none"
        >
          <path 
            d="M30 0 Q50 100 30 200 Q10 300 30 400"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
          />
          <path 
            d="M25 0 Q45 100 25 200 Q5 300 25 400"
            fill="none"
            stroke={accentColor}
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Info & List */}
          <div className="space-y-6">
            {/* Editable title */}
            <div className="space-y-2">
              {isEditingTitle && canEdit ? (
                <Input
                  value={sectionTitle}
                  onChange={(e) => onSectionTitleChange?.(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="text-xl font-bold bg-transparent border-cyan-500/30 text-white"
                />
              ) : (
                <h3 
                  className={cn(
                    "text-xl font-bold uppercase tracking-wide",
                    canEdit && "cursor-pointer hover:text-cyan-400 transition-colors"
                  )}
                  style={{ color: accentColor }}
                  onClick={() => canEdit && setIsEditingTitle(true)}
                >
                  {sectionTitle}
                </h3>
              )}

              {isEditingDescription && canEdit ? (
                <Textarea
                  value={sectionDescription}
                  onChange={(e) => onSectionDescriptionChange?.(e.target.value)}
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                  className="text-sm bg-transparent border-cyan-500/30 text-gray-400"
                  rows={3}
                />
              ) : (
                <p 
                  className={cn(
                    "text-gray-400 text-sm",
                    canEdit && "cursor-pointer hover:text-gray-300 transition-colors"
                  )}
                  onClick={() => canEdit && setIsEditingDescription(true)}
                >
                  {sectionDescription}
                </p>
              )}
            </div>

            {/* Category legend */}
            <div className="space-y-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const count = locationsByCategory[key as LocationCategory]?.length || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key as LocationCategory)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-all w-full text-left",
                      selectedCategory === key ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-gray-300 uppercase text-xs tracking-wide">
                      {config.label}
                    </span>
                    <span className="text-gray-500 ml-auto">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Facilities list */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold uppercase text-sm tracking-wide">
                Facilities Located In:
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredLocations
                  .sort((a, b) => a.city.localeCompare(b.city))
                  .map(location => {
                    const config = CATEGORY_CONFIG[location.category];
                    return (
                      <motion.div
                        key={location.id}
                        className={cn(
                          "group flex items-center justify-between py-1 transition-colors cursor-pointer",
                          hoveredLocation === location.id ? "text-white" : "text-gray-400 hover:text-gray-200"
                        )}
                        onMouseEnter={() => setHoveredLocation(location.id)}
                        onMouseLeave={() => setHoveredLocation(null)}
                        style={{ color: hoveredLocation === location.id ? config.color : undefined }}
                      >
                        <span className="text-sm">{location.city}</span>
                        {canEdit && (
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditDialog(location); }}
                              className="p-1 hover:text-cyan-400"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteLocation(location.id); }}
                              className="p-1 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </div>

            {/* Add button */}
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Location</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="e.g. New York"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          placeholder="e.g. United States"
                          value={formData.country || ''}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Name (optional)</Label>
                      <Input
                        placeholder="e.g. NYC Recording Studio"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(v) => setFormData({ ...formData, category: v as LocationCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                {config.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        placeholder="Brief description of this location..."
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleAddLocation} className="w-full">
                      Add Location
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2 space-y-6">
            <LocationsMap
              locations={filteredLocations}
              hoveredLocation={hoveredLocation}
              onHover={setHoveredLocation}
              onClick={(loc) => canEdit && openEditDialog(loc)}
              accentColor={accentColor}
            />

            {/* Stats Row */}
            {locationStats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 pt-4 border-t border-white/10">
                {locationStats.map((stat, index) => (
                  <motion.div
                    key={stat.id}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stat.value}
                      {stat.suffix && <span style={{ color: accentColor }}>{stat.suffix}</span>}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Stats editing */}
            {canEdit && locationStats.length === 0 && (
              <div className="text-center py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-cyan-400"
                  onClick={() => onLocationStatsChange?.([
                    { id: crypto.randomUUID(), value: '130', suffix: '+', label: 'Recording Rooms' },
                    { id: crypto.randomUUID(), value: '51', suffix: '+', label: 'Mixing Rooms' },
                    { id: crypto.randomUUID(), value: '3', label: 'Dolby Atmos Rooms' },
                  ])}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Add Location Stats
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom description */}
        {locations.length > 0 && (
          <motion.p 
            className="relative z-10 mt-8 text-sm text-gray-500 max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            In communication, we refer to all facilities as "our studios" and/or by location. 
            We communicate externally as a unified brand when talking about our work or facilities.
          </motion.p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="e.g. New York"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="e.g. United States"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. NYC Recording Studio"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v as LocationCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this location..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditLocation} className="flex-1">
                Save Changes
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (editingLocation) {
                    handleDeleteLocation(editingLocation.id);
                    setEditingLocation(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shimmer animation keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LocationsSection;
