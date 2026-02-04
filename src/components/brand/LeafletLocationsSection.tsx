/**
 * LeafletLocationsSection - Interactive Map with OpenStreetMap (No API Key Required)
 * Features: Custom styled map, animated markers, popups, category filtering, region navigation
 * Uses Leaflet.js with free OpenStreetMap tiles
 */

import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Edit2, Trash2, Building2, Mic, Monitor, Globe,
  Film, Music, Headphones, Radio, Video, Camera, Tv,
  Speaker, Volume2, Disc, Play, Clapperboard, Award,
  Users, MapPin, Briefcase, Star, Zap, LucideProps
} from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { BrandLocation, LocationCategory, LocationStat } from '@/types/brand';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapRegionFilter, RegionKey, getLocationRegion, REGION_BOUNDS } from './MapRegionFilter';

// Available icons for location stats
const STAT_ICONS = [
  { name: 'Mic', label: 'Microphone', Icon: Mic },
  { name: 'Film', label: 'Film', Icon: Film },
  { name: 'Music', label: 'Music', Icon: Music },
  { name: 'Headphones', label: 'Headphones', Icon: Headphones },
  { name: 'Radio', label: 'Radio', Icon: Radio },
  { name: 'Video', label: 'Video', Icon: Video },
  { name: 'Camera', label: 'Camera', Icon: Camera },
  { name: 'Tv', label: 'TV', Icon: Tv },
  { name: 'Speaker', label: 'Speaker', Icon: Speaker },
  { name: 'Volume2', label: 'Volume', Icon: Volume2 },
  { name: 'Disc', label: 'Disc', Icon: Disc },
  { name: 'Play', label: 'Play', Icon: Play },
  { name: 'Clapperboard', label: 'Clapperboard', Icon: Clapperboard },
  { name: 'Award', label: 'Award', Icon: Award },
  { name: 'Users', label: 'Users', Icon: Users },
  { name: 'MapPin', label: 'Location', Icon: MapPin },
  { name: 'Briefcase', label: 'Briefcase', Icon: Briefcase },
  { name: 'Building2', label: 'Building', Icon: Building2 },
  { name: 'Globe', label: 'Globe', Icon: Globe },
  { name: 'Star', label: 'Star', Icon: Star },
  { name: 'Zap', label: 'Zap', Icon: Zap },
  { name: 'Monitor', label: 'Monitor', Icon: Monitor },
] as const;

// Get icon component by name
const getStatIcon = (iconName?: string) => {
  if (!iconName) return null;
  const iconConfig = STAT_ICONS.find(i => i.name === iconName);
  return iconConfig?.Icon || null;
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

// Lighten a hex color
const lightenHex = (hex: string, percent: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = Math.min(255, Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * percent));
  const g = Math.min(255, Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * percent));
  const b = Math.min(255, Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

// City coordinates for geocoding fallback
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Munich': { lat: 48.1351, lng: 11.5820 },
  'Frankfurt': { lat: 50.1109, lng: 8.6821 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Milan': { lat: 45.4642, lng: 9.1900 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Stockholm': { lat: 59.3293, lng: 18.0686 },
  'Copenhagen': { lat: 55.6761, lng: 12.5683 },
  'Dublin': { lat: 53.3498, lng: -6.2603 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Shanghai': { lat: 31.2304, lng: 121.4737 },
  'Beijing': { lat: 39.9042, lng: 116.4074 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Mexico City': { lat: 19.4326, lng: -99.1332 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  'Johannesburg': { lat: -26.2041, lng: 28.0473 },
  'Cairo': { lat: 30.0444, lng: 31.2357 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Nairobi': { lat: -1.2921, lng: 36.8219 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Manila': { lat: 14.5995, lng: 120.9842 },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Warsaw': { lat: 52.2297, lng: 21.0122 },
  'Prague': { lat: 50.0755, lng: 14.4378 },
  'Vienna': { lat: 48.2082, lng: 16.3738 },
  'Zurich': { lat: 47.3769, lng: 8.5417 },
  'Geneva': { lat: 46.2044, lng: 6.1432 },
  'Brussels': { lat: 50.8503, lng: 4.3517 },
  'Lisbon': { lat: 38.7223, lng: -9.1393 },
  'Athens': { lat: 37.9838, lng: 23.7275 },
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Moscow': { lat: 55.7558, lng: 37.6173 },
};

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

// Component to fit bounds to markers
const FitBounds: React.FC<{ locations: { lat: number; lng: number }[] }> = ({ locations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [map, locations]);
  
  return null;
};

interface LeafletLocationsSectionProps {
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

export const LeafletLocationsSection: React.FC<LeafletLocationsSectionProps> = ({
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
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
  const [editingLocation, setEditingLocation] = useState<BrandLocation | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatIndex, setEditingStatIndex] = useState<number | null>(null);
  const [isAddStatDialogOpen, setIsAddStatDialogOpen] = useState(false);
  const [statFormData, setStatFormData] = useState<Partial<LocationStat>>({ label: '', value: '' });
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<BrandLocation>>({
    category: 'office',
    city: '',
    country: '',
    name: '',
    description: '',
  });

  // Get coordinates for a location
  const getCoordinates = (location: BrandLocation): { lat: number; lng: number } => {
    if (location.coordinates) {
      return { lat: location.coordinates.lat, lng: location.coordinates.lng };
    }
    return CITY_COORDINATES[location.city] || { lat: 0, lng: 0 };
  };

  const filteredLocations = useMemo(() => {
    let filtered = locations;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }
    return filtered;
  }, [locations, selectedCategory]);

  // Count locations by region
  const regionCounts = useMemo(() => {
    const counts: Record<RegionKey, number> = {
      all: locations.length,
      americas: 0,
      europe: 0,
      asiaPacific: 0,
      africa: 0,
    };
    
    locations.forEach(loc => {
      const coords = getCoordinates(loc);
      if (coords.lat !== 0 || coords.lng !== 0) {
        const region = getLocationRegion(coords.lat, coords.lng);
        counts[region]++;
      }
    });
    
    return counts;
  }, [locations]);

  const markerPositions = useMemo(() => 
    filteredLocations.map(loc => getCoordinates(loc)),
    [filteredLocations]
  );

  const handleAddLocation = () => {
    if (!formData.city || !formData.country) return;
    
    const cityCoords = CITY_COORDINATES[formData.city];
    const newLocation: BrandLocation = {
      id: crypto.randomUUID(),
      name: formData.name || formData.city,
      city: formData.city,
      country: formData.country,
      category: formData.category as LocationCategory || 'office',
      description: formData.description,
      coordinates: cityCoords ? { lat: cityCoords.lat, lng: cityCoords.lng } : formData.coordinates,
    };

    onLocationsChange?.([...locations, newLocation]);
    setFormData({ category: 'office', city: '', country: '', name: '', description: '' });
    setIsAddDialogOpen(false);
    toast({ title: 'Location added', description: `${newLocation.name} has been added to the map.` });
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
    toast({ title: 'Location updated' });
  };

  const handleDeleteLocation = (id: string) => {
    onLocationsChange?.(locations.filter(loc => loc.id !== id));
    toast({ title: 'Location removed' });
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

  const handleAddStat = () => {
    if (!statFormData.label || !statFormData.value) return;
    const newStat: LocationStat = {
      id: crypto.randomUUID(),
      label: statFormData.label,
      value: statFormData.value,
      icon: statFormData.icon,
    };
    onLocationStatsChange?.([...locationStats, newStat]);
    setStatFormData({ label: '', value: '', icon: undefined });
    setIsAddStatDialogOpen(false);
  };

  const handleEditStat = () => {
    if (editingStatIndex === null || !statFormData.label || !statFormData.value) return;
    const updated = [...locationStats];
    updated[editingStatIndex] = { ...updated[editingStatIndex], ...statFormData } as LocationStat;
    onLocationStatsChange?.(updated);
    setEditingStatIndex(null);
    setStatFormData({ label: '', value: '', icon: undefined });
  };

  const handleDeleteStat = (index: number) => {
    const updated = locationStats.filter((_, i) => i !== index);
    onLocationStatsChange?.(updated);
  };

  const canEdit = !!onLocationsChange;

  // Count locations by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: locations.length };
    locations.forEach(loc => {
      counts[loc.category] = (counts[loc.category] || 0) + 1;
    });
    return counts;
  }, [locations]);

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

      {/* Add CSS for marker pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        .leaflet-container {
          background: #0a1628 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div 
        className="relative overflow-hidden rounded-2xl"
        style={{ 
          background: 'linear-gradient(135deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header with title and controls */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {isEditingTitle && canEdit ? (
                <Input
                  value={sectionTitle}
                  onChange={(e) => onSectionTitleChange?.(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="text-xl font-bold bg-transparent border-cyan-500/30 text-white max-w-md"
                />
              ) : (
                <h3 
                  className={cn(
                    "text-xl font-bold uppercase tracking-wide text-white",
                    canEdit && "cursor-pointer hover:text-cyan-400 transition-colors"
                  )}
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
                  className="mt-2 bg-transparent border-cyan-500/30 text-gray-300 max-w-lg"
                  rows={2}
                />
              ) : (
                <p 
                  className={cn(
                    "text-gray-400 mt-1",
                    canEdit && "cursor-pointer hover:text-gray-300 transition-colors"
                  )}
                  onClick={() => canEdit && setIsEditingDescription(true)}
                >
                  {sectionDescription}
                </p>
              )}
            </div>
            
            {canEdit && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "text-xs",
                selectedCategory === 'all' 
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:bg-white/5'
              )}
            >
              All ({categoryCounts.all || 0})
            </Button>
            {(Object.entries(CATEGORY_CONFIG) as [LocationCategory, typeof CATEGORY_CONFIG[LocationCategory]][]).map(([key, config]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedCategory === key ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(key)}
                className="text-xs bg-transparent border-white/10 hover:bg-white/5"
                style={{ 
                  borderColor: selectedCategory === key ? config.color : undefined,
                  color: selectedCategory === key ? config.color : undefined,
                }}
              >
                <config.icon className="h-3 w-3 mr-1.5" />
                {config.label} ({categoryCounts[key] || 0})
              </Button>
            ))}
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="h-[500px] relative">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full"
            style={{ background: '#0a1628' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {/* Dark themed tile layer - CartoDB Dark Matter (free, no API key) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Fit bounds to markers - only on initial load, not when using region filter */}
            {markerPositions.length > 0 && selectedRegion === 'all' && (
              <FitBounds locations={markerPositions} />
            )}
            
            {/* Region navigation control */}
            <MapRegionFilter
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
              locationCounts={regionCounts}
              accentColor={accentColor}
            />
            
            {/* Location markers */}
            {filteredLocations.map((location) => {
              const coords = getCoordinates(location);
              const categoryConfig = CATEGORY_CONFIG[location.category];
              const icon = createColoredIcon(categoryConfig.color);
              
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
                          style={{ backgroundColor: categoryConfig.color }}
                        />
                        <span className="text-xs text-gray-500">{categoryConfig.label}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Stats section - prominent display with glow effects */}
        {(locationStats.length > 0 || canEdit) && (
          <div className="p-6 border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {locationStats.map((stat, index) => {
                const StatIcon = getStatIcon(stat.icon);
                const lighterAccent = lightenHex(accentColor, 0.2);
                return (
                  <motion.div
                    key={stat.id || index}
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div 
                      className="text-center p-4 rounded-xl transition-all"
                      style={{
                        background: `linear-gradient(to bottom right, ${hexToRgba(accentColor, 0.1)}, transparent)`,
                        border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                        boxShadow: `0 0 20px ${hexToRgba(accentColor, 0.1)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.4);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.2);
                      }}
                    >
                      {StatIcon && (
                        <div className="flex justify-center mb-2">
                          <StatIcon 
                            className="h-6 w-6" 
                            style={{ 
                              color: accentColor,
                              filter: `drop-shadow(0 0 6px ${hexToRgba(accentColor, 0.5)})` 
                            }}
                          />
                        </div>
                      )}
                      <p 
                        className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent"
                        style={{ 
                          backgroundImage: `linear-gradient(to right, ${accentColor}, ${lighterAccent})`,
                          textShadow: `0 0 30px ${hexToRgba(accentColor, 0.5)}`,
                          filter: `drop-shadow(0 0 8px ${hexToRgba(accentColor, 0.3)})`
                        }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 font-medium">{stat.label}</p>
                    </div>
                    {canEdit && (
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-white/10 hover:bg-white/20"
                          onClick={() => {
                            setEditingStatIndex(index);
                            setStatFormData(stat);
                          }}
                        >
                          <Edit2 className="h-3 w-3 text-white" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          onClick={() => handleDeleteStat(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {canEdit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: locationStats.length * 0.1 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setIsAddStatDialogOpen(true)}
                    className="w-full h-full min-h-[88px] bg-transparent border-dashed border-white/20 text-gray-400 hover:bg-white/5 transition-all"
                    style={{
                      '--hover-border': hexToRgba(accentColor, 0.3),
                      '--hover-text': accentColor,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.3);
                      e.currentTarget.style.color = accentColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Stat
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Locations list */}
        {locations.length > 0 && (
          <div className="p-6 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredLocations.map((location) => {
                const categoryConfig = CATEGORY_CONFIG[location.category];
                return (
                  <motion.div
                    key={location.id}
                    className="relative group p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: categoryConfig.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{location.name}</p>
                        <p className="text-gray-400 text-xs truncate">{location.city}, {location.country}</p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-white/10"
                          onClick={() => openEditDialog(location)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-red-500/20 text-red-400"
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="bg-white/5 border-white/10 text-white"
                  list="city-suggestions"
                />
                <datalist id="city-suggestions">
                  {Object.keys(CITY_COORDINATES).map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Location Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="HQ East Coast (optional)"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as LocationCategory })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={!formData.city || !formData.country}>
                Add Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  list="city-suggestions-edit"
                />
                <datalist id="city-suggestions-edit">
                  {Object.keys(CITY_COORDINATES).map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Location Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as LocationCategory })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingLocation(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditLocation} disabled={!formData.city || !formData.country}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stat Dialog */}
      <Dialog open={isAddStatDialogOpen} onOpenChange={setIsAddStatDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Statistic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Value *</Label>
                <Input
                  value={statFormData.value}
                  onChange={(e) => setStatFormData({ ...statFormData, value: e.target.value })}
                  placeholder="130+"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Label *</Label>
                <Input
                  value={statFormData.label}
                  onChange={(e) => setStatFormData({ ...statFormData, label: e.target.value })}
                  placeholder="Recording Rooms"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Icon (optional)</Label>
              <ScrollArea className="h-[120px] rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="grid grid-cols-7 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatFormData({ ...statFormData, icon: undefined })}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center justify-center",
                      !statFormData.icon 
                        ? "bg-cyan-500/30 border border-cyan-500/50" 
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    )}
                  >
                    <span className="text-xs text-gray-400">None</span>
                  </button>
                  {STAT_ICONS.map(({ name, label, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setStatFormData({ ...statFormData, icon: name })}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        statFormData.icon === name 
                          ? "bg-cyan-500/30 border border-cyan-500/50" 
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      )}
                      title={label}
                    >
                      <Icon className="h-5 w-5 text-gray-300" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddStatDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStat} disabled={!statFormData.label || !statFormData.value}>
                Add Stat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stat Dialog */}
      <Dialog open={editingStatIndex !== null} onOpenChange={(open) => !open && setEditingStatIndex(null)}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Statistic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Value *</Label>
                <Input
                  value={statFormData.value}
                  onChange={(e) => setStatFormData({ ...statFormData, value: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Label *</Label>
                <Input
                  value={statFormData.label}
                  onChange={(e) => setStatFormData({ ...statFormData, label: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Icon (optional)</Label>
              <ScrollArea className="h-[120px] rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="grid grid-cols-7 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatFormData({ ...statFormData, icon: undefined })}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center justify-center",
                      !statFormData.icon 
                        ? "bg-cyan-500/30 border border-cyan-500/50" 
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    )}
                  >
                    <span className="text-xs text-gray-400">None</span>
                  </button>
                  {STAT_ICONS.map(({ name, label, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setStatFormData({ ...statFormData, icon: name })}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        statFormData.icon === name 
                          ? "bg-cyan-500/30 border border-cyan-500/50" 
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      )}
                      title={label}
                    >
                      <Icon className="h-5 w-5 text-gray-300" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingStatIndex(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditStat} disabled={!statFormData.label || !statFormData.value}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
