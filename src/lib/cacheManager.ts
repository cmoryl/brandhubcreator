/**
 * Cache Manager
 * Centralized utility for managing all application caches
 */

import { QueryClient } from '@tanstack/react-query';

// Cache keys
export const CACHE_KEYS = {
  BRANDS: 'brandhub_guides_cache_v1',
  EVENTS: 'brandhub_events_cache_v1',
} as const;

// Portal data cache (imported from usePortalData)
let portalDataCache: Map<string, { data: unknown; timestamp: number }> | null = null;

/**
 * Register the portal data cache Map for external clearing
 */
export const registerPortalCache = (cache: Map<string, { data: unknown; timestamp: number }>) => {
  portalDataCache = cache;
};

export interface CacheStats {
  localStorageSize: number;
  localStorageItems: {
    brands: { exists: boolean; savedAt: Date | null; itemCount: number };
    events: { exists: boolean; savedAt: Date | null; itemCount: number };
  };
  portalCacheItems: number;
}

/**
 * Get statistics about cached data
 */
export const getCacheStats = (): CacheStats => {
  let localStorageSize = 0;
  
  // Calculate total localStorage size
  try {
    for (const key of Object.keys(localStorage)) {
      const value = localStorage.getItem(key);
      if (value) {
        localStorageSize += key.length + value.length;
      }
    }
  } catch {
    // Ignore errors
  }

  // Parse brands cache
  let brandsStats = { exists: false, savedAt: null as Date | null, itemCount: 0 };
  try {
    const raw = localStorage.getItem(CACHE_KEYS.BRANDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      brandsStats = {
        exists: true,
        savedAt: parsed.savedAt ? new Date(parsed.savedAt) : null,
        itemCount: (parsed.brands?.length || 0) + (parsed.products?.length || 0),
      };
    }
  } catch {
    // Ignore parsing errors
  }

  // Parse events cache
  let eventsStats = { exists: false, savedAt: null as Date | null, itemCount: 0 };
  try {
    const raw = localStorage.getItem(CACHE_KEYS.EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      eventsStats = {
        exists: true,
        savedAt: parsed.savedAt ? new Date(parsed.savedAt) : null,
        itemCount: parsed.events?.length || 0,
      };
    }
  } catch {
    // Ignore parsing errors
  }

  return {
    localStorageSize,
    localStorageItems: {
      brands: brandsStats,
      events: eventsStats,
    },
    portalCacheItems: portalDataCache?.size || 0,
  };
};

/**
 * Clear localStorage caches (brands and events)
 */
export const clearLocalStorageCaches = (): { brands: boolean; events: boolean } => {
  let brands = false;
  let events = false;

  try {
    if (localStorage.getItem(CACHE_KEYS.BRANDS)) {
      localStorage.removeItem(CACHE_KEYS.BRANDS);
      brands = true;
    }
  } catch {
    // Ignore errors
  }

  try {
    if (localStorage.getItem(CACHE_KEYS.EVENTS)) {
      localStorage.removeItem(CACHE_KEYS.EVENTS);
      events = true;
    }
  } catch {
    // Ignore errors
  }

  return { brands, events };
};

/**
 * Clear the portal data in-memory cache
 */
export const clearPortalCache = (): number => {
  if (!portalDataCache) return 0;
  const size = portalDataCache.size;
  portalDataCache.clear();
  return size;
};

/**
 * Clear all caches and optionally invalidate React Query
 */
export const clearAllCaches = async (
  queryClient?: QueryClient
): Promise<{
  localStorageCleared: { brands: boolean; events: boolean };
  portalCacheCleared: number;
  reactQueryInvalidated: boolean;
}> => {
  // Clear localStorage
  const localStorageCleared = clearLocalStorageCaches();

  // Clear portal cache
  const portalCacheCleared = clearPortalCache();

  // Invalidate React Query cache
  let reactQueryInvalidated = false;
  if (queryClient) {
    try {
      await queryClient.invalidateQueries();
      reactQueryInvalidated = true;
    } catch {
      // Ignore errors
    }
  }

  return {
    localStorageCleared,
    portalCacheCleared,
    reactQueryInvalidated,
  };
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
