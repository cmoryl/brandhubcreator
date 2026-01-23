/**
 * usePortalData Hook
 * Manages public portal data fetching with optimized performance
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationService } from '@/lib/organization/service';
import { OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/lib/organization/types';

export interface PortalOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  portalSettings: OrganizationPortalSettings;
}

export interface PortalBrand {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  updatedAt: string;
  hero?: {
    name: string;
    tagline: string;
    coverImage?: string;
  };
  colors?: Array<{ id: string; hex: string }>;
}

export interface PortalProduct {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  parentBrandId: string | null;
  updatedAt: string;
  hero?: {
    name: string;
    tagline: string;
    coverImage?: string;
  };
  colors?: Array<{ id: string; hex: string }>;
}

export interface PortalEvent {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  parentBrandId: string | null;
  updatedAt: string;
  hero?: {
    name: string;
    tagline: string;
    coverImage?: string;
  };
  eventDetails?: {
    eventName: string;
    eventDates: string;
    location: string;
  };
  colors?: Array<{ id: string; hex: string }>;
}

interface PortalDataState {
  organization: PortalOrganization | null;
  brands: PortalBrand[];
  products: PortalProduct[];
  events: PortalEvent[];
  isLoading: boolean;
  error: string | null;
}

interface PortalDataActions {
  refetch: () => Promise<void>;
}

export type UsePortalDataReturn = PortalDataState & PortalDataActions;

// Optimized select queries - only fetch card-relevant data
const BRAND_CARD_SELECT = 'id, name, slug, is_public, updated_at, hero:guide_data->hero, colors:guide_data->colors';
const PRODUCT_CARD_SELECT = 'id, name, slug, is_public, parent_brand_id, updated_at, hero:guide_data->hero, colors:guide_data->colors';
const EVENT_CARD_SELECT = 'id, name, slug, is_public, parent_brand_id, updated_at, hero:guide_data->hero, colors:guide_data->colors, eventDetails:guide_data->eventDetails';

export const usePortalData = (slug: string | undefined): UsePortalDataReturn => {
  const [organization, setOrganization] = useState<PortalOrganization | null>(null);
  const [brands, setBrands] = useState<PortalBrand[]>([]);
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  const fetchContent = useCallback(async (orgId: string) => {
    const brandsQuery = (supabase
      .from('brands')
      .select(BRAND_CARD_SELECT as any)
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .order('updated_at', { ascending: false }) as unknown) as PromiseLike<any>;

    const productsQuery = (supabase
      .from('products')
      .select(PRODUCT_CARD_SELECT as any)
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .order('updated_at', { ascending: false }) as unknown) as PromiseLike<any>;

    const eventsQuery = (supabase
      .from('events')
      .select(EVENT_CARD_SELECT as any)
      .eq('organization_id', orgId)
      .eq('is_public', true)
      .order('updated_at', { ascending: false }) as unknown) as PromiseLike<any>;

    const [brandsRes, productsRes, eventsRes] = await Promise.all([
      brandsQuery,
      productsQuery,
      eventsQuery,
    ]);

    const mappedBrands: PortalBrand[] = (brandsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublic: row.is_public,
      updatedAt: row.updated_at,
      hero: row.hero ?? undefined,
      colors: row.colors ?? undefined,
    }));

    const mappedProducts: PortalProduct[] = (productsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublic: row.is_public,
      parentBrandId: row.parent_brand_id,
      updatedAt: row.updated_at,
      hero: row.hero ?? undefined,
      colors: row.colors ?? undefined,
    }));

    const mappedEvents: PortalEvent[] = (eventsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublic: row.is_public,
      parentBrandId: row.parent_brand_id,
      updatedAt: row.updated_at,
      hero: row.hero ?? undefined,
      eventDetails: row.eventDetails ?? undefined,
      colors: row.colors ?? undefined,
    }));

    return { brands: mappedBrands, products: mappedProducts, events: mappedEvents };
  }, []);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setError('Organization not found');
      setIsLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);

    try {
      // Fetch organization data
      const orgData = await OrganizationService.fetchPublicPortalOrg(slug);

      if (fetchIdRef.current !== fetchId) return;

      if (!orgData) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      const portalOrg: PortalOrganization = {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        logoUrl: orgData.logoUrl,
        primaryColor: orgData.primaryColor,
        secondaryColor: orgData.secondaryColor,
        accentColor: orgData.accentColor,
        portalSettings: orgData.portalSettings || DEFAULT_PORTAL_SETTINGS,
      };

      setOrganization(portalOrg);

      // Fetch content
      const content = await fetchContent(orgData.id);

      if (fetchIdRef.current !== fetchId) return;

      setBrands(content.brands);
      setProducts(content.products);
      setEvents(content.events);
      setError(null);
    } catch (err) {
      if (fetchIdRef.current !== fetchId) return;
      console.error('[usePortalData] Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBrands([]);
      setProducts([]);
      setEvents([]);
    } finally {
      if (fetchIdRef.current === fetchId) {
        setIsLoading(false);
      }
    }
  }, [slug, fetchContent]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch on tab focus
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (organization) {
          fetchContent(organization.id).then(content => {
            setBrands(content.brands);
            setProducts(content.products);
            setEvents(content.events);
          }).catch(console.error);
        }
      }, 300);
    };

    const onFocus = () => debouncedRefetch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') debouncedRefetch();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [organization, fetchContent]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    organization,
    brands,
    products,
    events,
    isLoading,
    error,
    refetch,
  };
};

// Helper hook for filtering portal data
export const useFilteredPortalData = (
  brands: PortalBrand[],
  products: PortalProduct[],
  events: PortalEvent[],
  searchQuery: string
) => {
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(brand => {
      const hero = brand.hero || { name: brand.name, tagline: '' };
      return (
        brand.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query)
      );
    });
  }, [brands, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product => {
      const hero = product.hero || { name: product.name, tagline: '' };
      return (
        product.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(event => {
      const hero = event.hero || { name: event.name, tagline: '' };
      const eventDetails = event.eventDetails || { eventName: '', eventDates: '', location: '' };
      return (
        event.name.toLowerCase().includes(query) ||
        hero.name?.toLowerCase().includes(query) ||
        hero.tagline?.toLowerCase().includes(query) ||
        eventDetails.eventName?.toLowerCase().includes(query) ||
        eventDetails.location?.toLowerCase().includes(query)
      );
    });
  }, [events, searchQuery]);

  const totalResults = filteredBrands.length + filteredProducts.length + filteredEvents.length;

  return {
    filteredBrands,
    filteredProducts,
    filteredEvents,
    totalResults,
  };
};
