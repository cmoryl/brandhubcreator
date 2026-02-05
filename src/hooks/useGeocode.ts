/**
 * Geocoding hook using OpenStreetMap's Nominatim API (free, no API key required)
 * https://nominatim.org/release-docs/develop/api/Search/
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
  };
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    state?: string;
  };
}

/**
 * Hook to geocode addresses/cities to coordinates using OpenStreetMap Nominatim
 */
export const useGeocode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Geocode an address or city name to coordinates
   * @param query - Address, city name, or full location string
   * @returns Promise with geocoding result or null if not found
   */
  const geocode = useCallback(async (query: string): Promise<GeocodingResult | null> => {
    if (!query.trim()) {
      setError('Please enter an address or city name');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Nominatim API with proper headers
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            // Nominatim requires a valid User-Agent
            'User-Agent': 'BrandHub/1.0 (https://brandhubcreator.lovable.app)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const results: NominatimResponse[] = await response.json();

      if (results.length === 0) {
        setError('Location not found. Try a different search term.');
        toast({
          title: 'Location not found',
          description: 'Try entering the city name with country, e.g., "London, UK"',
          variant: 'destructive',
        });
        return null;
      }

      const result = results[0];
      const geocodedResult: GeocodingResult = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address ? {
          city: result.address.city || result.address.town || result.address.village || result.address.municipality,
          country: result.address.country,
          state: result.address.state,
        } : undefined,
      };

      setIsLoading(false);
      return geocodedResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to geocode location';
      setError(errorMessage);
      console.error('Geocoding error:', err);
      toast({
        title: 'Geocoding failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  }, [toast]);

  /**
   * Build a search query from city, country, and optional address
   */
  const buildQuery = useCallback((city: string, country: string, address?: string): string => {
    const parts = [address, city, country].filter(Boolean);
    return parts.join(', ');
  }, []);

  return {
    geocode,
    buildQuery,
    isLoading,
    error,
  };
};
