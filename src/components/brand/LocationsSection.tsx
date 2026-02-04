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

// World map coordinates (simplified for major cities)
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  // North America
  'New York': { x: 28, y: 35 },
  'Los Angeles': { x: 12, y: 38 },
  'San Francisco': { x: 10, y: 36 },
  'Chicago': { x: 22, y: 34 },
  'Miami': { x: 24, y: 42 },
  'Toronto': { x: 24, y: 32 },
  'Vancouver': { x: 10, y: 30 },
  'Mexico City': { x: 18, y: 46 },
  'Buenos Aires': { x: 30, y: 76 },
  // Europe
  'London': { x: 48, y: 28 },
  'Paris': { x: 50, y: 30 },
  'Berlin': { x: 54, y: 28 },
  'Munich': { x: 53, y: 30 },
  'Amsterdam': { x: 51, y: 27 },
  'Brussels': { x: 51, y: 29 },
  'Madrid': { x: 47, y: 34 },
  'Barcelona': { x: 50, y: 34 },
  'Milan': { x: 52, y: 32 },
  'Rome': { x: 54, y: 34 },
  'Stockholm': { x: 56, y: 22 },
  'Copenhagen': { x: 53, y: 25 },
  'Warsaw': { x: 58, y: 27 },
  'Vienna': { x: 55, y: 30 },
  'Zurich': { x: 52, y: 31 },
  'Dublin': { x: 45, y: 27 },
  'Lisbon': { x: 44, y: 36 },
  'Valencia': { x: 48, y: 36 },
  'Rennes': { x: 48, y: 30 },
  'Tourcoing': { x: 50, y: 28 },
  'Angoulême': { x: 48, y: 32 },
  // Africa
  'Cape Town': { x: 56, y: 78 },
  'Nairobi': { x: 62, y: 54 },
  'Lagos': { x: 50, y: 52 },
  'Casablanca': { x: 45, y: 38 },
  // Asia
  'Tokyo': { x: 88, y: 36 },
  'Singapore': { x: 78, y: 54 },
  'Hong Kong': { x: 80, y: 42 },
  'Shanghai': { x: 82, y: 38 },
  'Beijing': { x: 80, y: 34 },
  'Seoul': { x: 84, y: 36 },
  'Mumbai': { x: 70, y: 46 },
  'Pune': { x: 71, y: 47 },
  'Delhi': { x: 71, y: 42 },
  'Ho Chi Minh City': { x: 78, y: 50 },
  'Bangkok': { x: 76, y: 48 },
  // Oceania
  'Sydney': { x: 90, y: 74 },
  'Melbourne': { x: 88, y: 76 },
  'Auckland': { x: 96, y: 76 },
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

      {/* World Map SVG */}
      <svg
        viewBox="0 0 100 50"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0d2137" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Simplified world map paths */}
        <g fill="url(#mapGradient)" stroke={accentColor} strokeWidth="0.1" opacity="0.8">
          {/* North America */}
          <path d="M5,15 L35,12 L38,25 L35,35 L25,45 L15,42 L8,35 L3,25 Z" />
          {/* South America */}
          <path d="M20,48 L32,45 L35,55 L32,70 L25,80 L18,75 L16,60 Z" />
          {/* Europe */}
          <path d="M42,18 L62,15 L65,28 L58,35 L45,38 L40,30 Z" />
          {/* Africa */}
          <path d="M42,38 L60,35 L68,50 L62,72 L48,75 L40,60 L38,45 Z" />
          {/* Asia */}
          <path d="M62,12 L95,10 L98,25 L92,42 L75,50 L65,45 L60,30 Z" />
          {/* Australia */}
          <path d="M80,55 L95,52 L98,65 L92,75 L78,72 L75,62 Z" />
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
