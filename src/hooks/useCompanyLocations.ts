/**
 * Hook to fetch and manage company locations from the shared database
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandLocation, LocationCategory, LocationStat } from '@/types/brand';

export interface CompanyLocationRow {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Maps database region to our region key format
 */
const mapRegion = (dbRegion: string): string => {
  const regionMap: Record<string, string> = {
    'europe': 'europe',
    'americas': 'americas',
    'apac': 'asiaPacific',
    'asia_pacific': 'asiaPacific',
    'asiapacific': 'asiaPacific',
    'africa_me': 'africa',
    'africa': 'africa',
  };
  return regionMap[dbRegion.toLowerCase()] || 'europe';
};

/**
 * Maps database category to LocationCategory type
 */
const mapCategory = (dbCategory: string | null): LocationCategory => {
  if (!dbCategory) return 'office';
  const categoryMap: Record<string, LocationCategory> = {
    'office': 'office',
    'studio': 'studio',
    'headquarters': 'headquarters',
    'datacenter': 'datacenter',
    'partner': 'partner',
  };
  return categoryMap[dbCategory.toLowerCase()] || 'office';
};

/**
 * Converts a database row to BrandLocation format
 */
const toBrandLocation = (row: CompanyLocationRow): BrandLocation => ({
  id: row.id,
  name: row.name,
  city: row.city,
  country: row.country,
  category: mapCategory(row.category),
  address: row.address || undefined,
  phone: row.phone || undefined,
  email: row.email || undefined,
  imageUrl: row.image_url || undefined,
  coordinates: row.latitude && row.longitude 
    ? { lat: row.latitude, lng: row.longitude }
    : undefined,
});

/**
 * Hook to fetch active company locations
 */
export const useCompanyLocations = () => {
  return useQuery({
    queryKey: ['company-locations'],
    queryFn: async (): Promise<BrandLocation[]> => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching company locations:', error);
        throw error;
      }

      return (data || []).map(toBrandLocation);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook to get company location statistics
 */
export const useCompanyLocationStats = () => {
  return useQuery({
    queryKey: ['company-location-stats'],
    queryFn: async (): Promise<LocationStat[]> => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching company locations for stats:', error);
        throw error;
      }

      const locations = data || [];
      
      // Calculate stats
      const totalLocations = locations.length;
      const uniqueCountries = new Set(locations.map(l => l.country)).size;
      const regions = new Set(locations.map(l => mapRegion(l.region)));
      const studioCount = locations.filter(l => l.category === 'studio').length;

      const stats: LocationStat[] = [
        { id: 'locations', value: totalLocations.toString(), label: 'Global Locations', icon: 'MapPin' },
        { id: 'countries', value: uniqueCountries.toString(), label: 'Countries', icon: 'Globe' },
        { id: 'regions', value: regions.size.toString(), label: 'Regions', icon: 'Globe' },
      ];

      if (studioCount > 0) {
        stats.push({ id: 'studios', value: studioCount.toString(), label: 'Recording Studios', icon: 'Mic' });
      }

      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get raw company location data (for admin purposes)
 */
export const useCompanyLocationsRaw = () => {
  return useQuery({
    queryKey: ['company-locations-raw'],
    queryFn: async (): Promise<CompanyLocationRow[]> => {
      const { data, error } = await supabase
        .from('company_locations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching company locations:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
