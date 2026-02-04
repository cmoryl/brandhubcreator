/**
 * GoogleMapsLocationsSection - Interactive Google Maps with GlobalLink Universe styling
 * Features: Custom styled map, animated markers, info windows, category filtering
 */

/// <reference types="@types/google.maps" />

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Plus, Edit2, Trash2, Building2, Mic, Monitor, 
  Globe, Loader2, AlertCircle
} from 'lucide-react';
import { BrandLocation, LocationCategory, LocationStat } from '@/types/brand';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';

// Google Maps API key - publishable key for client-side use
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const CATEGORY_CONFIG: Record<LocationCategory, { 
  color: string; 
  bgColor: string; 
  icon: React.ElementType;
  label: string;
  markerColor: string;
}> = {
  studio: { color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)', icon: Mic, label: 'Studios', markerColor: '#ec4899' },
  office: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', icon: Building2, label: 'Client Service & Production', markerColor: '#6b7280' },
  headquarters: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', icon: Building2, label: 'Headquarters', markerColor: '#f59e0b' },
  datacenter: { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', icon: Monitor, label: 'Data Centers', markerColor: '#22c55e' },
  partner: { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', icon: Globe, label: 'Partners', markerColor: '#8b5cf6' },
};

// Dark mode map styling for GlobalLink Universe aesthetic
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a90a4' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#6dd5ed' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4a90a4' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a7ca5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d2137' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5a9ab8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a4a6b' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a3a5a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#6dd5ed' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1a3a5a' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#6dd5ed' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1e36' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a6a8a' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
];

// City coordinates for geocoding fallback
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Milan': { lat: 45.4642, lng: 9.1900 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Shanghai': { lat: 31.2304, lng: 121.4737 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Mexico City': { lat: 19.4326, lng: -99.1332 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
};

interface GoogleMapsLocationsSectionProps {
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

// Load Google Maps script dynamically
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

export const GoogleMapsLocationsSection: React.FC<GoogleMapsLocationsSectionProps> = ({
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
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
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

  const filteredLocations = useMemo(() => {
    if (selectedCategory === 'all') return locations;
    return locations.filter(loc => loc.category === selectedCategory);
  }, [locations, selectedCategory]);

  // Get coordinates for a location
  const getCoordinates = useCallback((location: BrandLocation): { lat: number; lng: number } => {
    if (location.coordinates) {
      return { lat: location.coordinates.lat, lng: location.coordinates.lng };
    }
    return CITY_COORDINATES[location.city] || { lat: 0, lng: 0 };
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to use this feature.');
      return;
    }

    loadGoogleMapsScript()
      .then(() => {
        if (mapRef.current && !googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 30, lng: 0 },
            zoom: 2,
            styles: DARK_MAP_STYLES,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            backgroundColor: '#0a1628',
          });
          
          infoWindowRef.current = new google.maps.InfoWindow();
          setIsMapLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Google Maps load error:', error);
        setMapError(error.message);
      });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers for filtered locations
    filteredLocations.forEach((location) => {
      const coords = getCoordinates(location);
      const categoryConfig = CATEGORY_CONFIG[location.category];

      // Create custom marker icon
      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: categoryConfig.markerColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 10,
      };

      const marker = new google.maps.Marker({
        position: coords,
        map: googleMapRef.current!,
        icon: markerIcon,
        title: location.name,
        animation: google.maps.Animation.DROP,
      });

      // Add click listener for info window
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          const content = `
            <div style="padding: 8px; min-width: 180px; color: #000;">
              <h3 style="margin: 0 0 4px; font-weight: 600; font-size: 14px;">${location.name}</h3>
              <p style="margin: 0 0 4px; font-size: 12px; color: #666;">${location.city}, ${location.country}</p>
              ${location.description ? `<p style="margin: 0; font-size: 11px; color: #888;">${location.description}</p>` : ''}
              <div style="margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${categoryConfig.markerColor};"></span>
                <span style="font-size: 10px; color: #666;">${categoryConfig.label}</span>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(googleMapRef.current!, marker);
        }
      });

      // Add hover effect
      marker.addListener('mouseover', () => {
        marker.setIcon({
          ...markerIcon,
          scale: 14,
        });
      });

      marker.addListener('mouseout', () => {
        marker.setIcon(markerIcon);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredLocations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredLocations.forEach(location => {
        const coords = getCoordinates(location);
        bounds.extend(coords);
      });
      googleMapRef.current.fitBounds(bounds, 50);
      
      // Limit zoom level
      const listener = google.maps.event.addListener(googleMapRef.current, 'idle', () => {
        const currentZoom = googleMapRef.current?.getZoom();
        if (currentZoom && currentZoom > 6) {
          googleMapRef.current?.setZoom(6);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [isMapLoaded, filteredLocations, getCoordinates]);

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
    };
    onLocationStatsChange?.([...locationStats, newStat]);
    setStatFormData({ label: '', value: '' });
    setIsAddStatDialogOpen(false);
  };

  const handleEditStat = () => {
    if (editingStatIndex === null || !statFormData.label || !statFormData.value) return;
    const updated = [...locationStats];
    updated[editingStatIndex] = { ...updated[editingStatIndex], ...statFormData } as LocationStat;
    onLocationStatsChange?.(updated);
    setEditingStatIndex(null);
    setStatFormData({ label: '', value: '' });
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

        {/* Google Map */}
        <div className="relative h-[500px]">
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Map Unavailable</p>
                <p className="text-gray-400 text-sm max-w-md">{mapError}</p>
              </div>
            </div>
          ) : !isMapLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : null}
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ opacity: isMapLoaded && !mapError ? 1 : 0 }}
          />
        </div>

        {/* Stats section */}
        {(locationStats.length > 0 || canEdit) && (
          <div className="p-6 border-t border-white/10">
            <div className="flex flex-wrap gap-6">
              {locationStats.map((stat, index) => (
                <motion.div
                  key={stat.id || index}
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                  {canEdit && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 bg-white/10"
                        onClick={() => {
                          setEditingStatIndex(index);
                          setStatFormData(stat);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 bg-red-500/20 text-red-400"
                        onClick={() => handleDeleteStat(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddStatDialogOpen(true)}
                  className="bg-transparent border-dashed border-white/20 text-gray-400 hover:bg-white/5"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stat
                </Button>
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
                />
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
                />
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
