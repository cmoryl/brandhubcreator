/**
 * usePortalData Hook
 * Manages public portal data fetching with optimized performance
 * 
 * Performance optimizations:
 * - Parallel data fetching for brands, products, events
 * - JSON-path selection to minimize payload size
 * - Debounced refetch on tab focus
 * - Request deduplication via fetchIdRef
 * - Memoized content mapping
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

export interface PortalLinkedGuide {
  id: string;
  type: 'brand' | 'product' | 'event';
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
  linkedGuides?: PortalLinkedGuide[];
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
  linkedGuides?: PortalLinkedGuide[];
}

export interface PortalLinkedEvent {
  id: string;
  type: 'event';
  slug: string;
  name: string;
  region?: string;
  accentColor?: string;
  location?: string;
  dates?: string;
  venue?: string;
  attendees?: number;
  coverImage?: string;
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
  linkedGuides?: PortalLinkedEvent[];
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

// Optimized select queries - only fetch card-relevant data with minimal JSON paths
const BRAND_CARD_SELECT = 'id, name, slug, is_public, updated_at, hero:guide_data->hero, colors:guide_data->colors, linkedGuides:guide_data->linkedGuides';
const PRODUCT_CARD_SELECT = 'id, name, slug, is_public, parent_brand_id, updated_at, hero:guide_data->hero, colors:guide_data->colors, linkedGuides:guide_data->linkedGuides';
const EVENT_CARD_SELECT = 'id, name, slug, is_public, parent_brand_id, updated_at, hero:guide_data->hero, colors:guide_data->colors, eventDetails:guide_data->eventDetails, linkedGuides:guide_data->linkedGuides';

// Cache for recently fetched data to prevent duplicate requests
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000; // 1 second - fast to pick up changes quickly

export const usePortalData = (slug: string | undefined): UsePortalDataReturn => {
  const [organization, setOrganization] = useState<PortalOrganization | null>(null);
  const [brands, setBrands] = useState<PortalBrand[]>([]);
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup realtime subscription
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const fetchContent = useCallback(async (orgId: string, useCache = true) => {
    // Check cache first
    const cacheKey = `portal-content-${orgId}`;
    const cached = dataCache.get(cacheKey);
    if (useCache && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Parallel fetch with optimized queries
    const [brandsRes, productsRes, eventsRes] = await Promise.all([
      supabase
        .from('brands')
        .select(BRAND_CARD_SELECT as any)
        .eq('organization_id', orgId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('products')
        .select(PRODUCT_CARD_SELECT as any)
        .eq('organization_id', orgId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false }),
      supabase
        .from('events')
        .select(EVENT_CARD_SELECT as any)
        .eq('organization_id', orgId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false }),
    ]);

    const mappedBrands: PortalBrand[] = (brandsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublic: row.is_public,
      updatedAt: row.updated_at,
      hero: row.hero ?? undefined,
      colors: row.colors ?? undefined,
      linkedGuides: Array.isArray(row.linkedGuides) 
        ? row.linkedGuides.map((g: any) => ({ id: g.id, type: g.type }))
        : undefined,
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
      linkedGuides: Array.isArray(row.linkedGuides) 
        ? row.linkedGuides.map((g: any) => ({ id: g.id, type: g.type }))
        : undefined,
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
      linkedGuides: Array.isArray(row.linkedGuides) 
        ? row.linkedGuides.filter((g: any) => g.type === 'event')
        : undefined,
    }));

    const result = { brands: mappedBrands, products: mappedProducts, events: mappedEvents };
    
    // Update cache
    dataCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
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

  // Realtime subscription for auto-updating when new guides are added
  useEffect(() => {
    if (!organization?.id) return;

    const orgId = organization.id;
    
    // Create a debounced refetch to avoid rapid re-fetches
    let refetchTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedRealtimeRefetch = () => {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      refetchTimeout = setTimeout(async () => {
        if (isMountedRef.current) {
          console.log('[usePortalData] Realtime update detected, refetching...');
          try {
            const content = await fetchContent(orgId, false); // Bypass cache
            if (isMountedRef.current) {
              setBrands(content.brands);
              setProducts(content.products);
              setEvents(content.events);
            }
          } catch (err) {
            console.error('[usePortalData] Realtime refetch error:', err);
          }
        }
      }, 300); // 300ms debounce for realtime updates
    };

    // Subscribe to changes on brands, products, and events tables
    const channel = supabase
      .channel(`portal-updates-${orgId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'brands',
          filter: `organization_id=eq.${orgId}`
        },
        () => debouncedRealtimeRefetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `organization_id=eq.${orgId}`
        },
        () => debouncedRealtimeRefetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
          filter: `organization_id=eq.${orgId}`
        },
        () => debouncedRealtimeRefetch()
      )
      .subscribe((status) => {
        console.log('[usePortalData] Realtime subscription status:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (refetchTimeout) clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [organization?.id, fetchContent]);

  // Refetch on tab focus with longer debounce and cache bypass
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isRefetching = false;

    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (isRefetching) return;
      
      debounceTimer = setTimeout(async () => {
        if (organization && isMountedRef.current) {
          isRefetching = true;
          try {
            // Bypass cache on focus refetch to get fresh data
            const content = await fetchContent(organization.id, false);
            if (isMountedRef.current) {
              setBrands(content.brands);
              setProducts(content.products);
              setEvents(content.events);
            }
          } catch (err) {
            console.error('[usePortalData] Refetch error:', err);
          } finally {
            isRefetching = false;
          }
        }
      }, 500); // Longer debounce for focus events
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
// Excludes sub-events (events that are linked from other parent events) from main grid
export const useFilteredPortalData = (
  brands: PortalBrand[],
  products: PortalProduct[],
  events: PortalEvent[],
  searchQuery: string
) => {
  // Build set of sub-event IDs (events linked from other events)
  const subEventIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(event => {
      // Check linkedGuides array - these are sub-events that belong to this parent
      const guides = event.linkedGuides;
      if (guides && Array.isArray(guides)) {
        guides.forEach((linked: any) => {
          // linked could be PortalLinkedEvent with id property
          const linkedId = typeof linked === 'string' ? linked : linked?.id;
          if (linkedId) {
            ids.add(linkedId);
          }
        });
      }
    });
    return ids;
  }, [events]);

  // Filter to only show master/parent events (exclude sub-events)
  const masterEvents = useMemo(() => {
    return events.filter(event => !subEventIds.has(event.id));
  }, [events, subEventIds]);

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
    if (!searchQuery.trim()) return masterEvents;
    const query = searchQuery.toLowerCase();
    return masterEvents.filter(event => {
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
  }, [masterEvents, searchQuery]);

  const totalResults = filteredBrands.length + filteredProducts.length + filteredEvents.length;

  return {
    filteredBrands,
    filteredProducts,
    filteredEvents,
    totalResults,
  };
};
