/**
 * usePersistedAdminData Hook
 * 
 * Provides persistent caching for admin analytics and reports.
 * Stores data in localStorage with timestamps so users can see:
 * - When data was last refreshed
 * - Cached results when navigating between admin sections
 * 
 * Data expires after the configured TTL (default 30 minutes).
 */

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PersistedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UsePersistedAdminDataOptions {
  /** Time-to-live in milliseconds (default: 30 minutes) */
  ttl?: number;
  /** Whether to auto-load cached data on mount */
  autoLoad?: boolean;
}

interface UsePersistedAdminDataReturn<T> {
  /** The cached data (null if not loaded or expired) */
  data: T | null;
  /** Whether data is currently being loaded/refreshed */
  isLoading: boolean;
  /** Timestamp when data was last refreshed */
  lastRunAt: Date | null;
  /** Human-readable "last run" string (e.g., "5 minutes ago") */
  lastRunLabel: string | null;
  /** Whether the cached data has expired */
  isExpired: boolean;
  /** Save new data to cache */
  saveData: (newData: T) => void;
  /** Clear the cache */
  clearData: () => void;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
  /** Refresh the last run label (call periodically to update relative time) */
  refreshLabel: () => void;
}

const STORAGE_PREFIX = 'admin_analytics_';

export function usePersistedAdminData<T>(
  key: string,
  options: UsePersistedAdminDataOptions = {}
): UsePersistedAdminDataReturn<T> {
  const { ttl = 30 * 60 * 1000, autoLoad = true } = options; // 30 min default
  
  const storageKey = `${STORAGE_PREFIX}${key}`;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [lastRunLabel, setLastRunLabel] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(true);

  const updateLabel = useCallback(() => {
    if (lastRunAt) {
      setLastRunLabel(formatDistanceToNow(lastRunAt, { addSuffix: true }));
    } else {
      setLastRunLabel(null);
    }
  }, [lastRunAt]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!autoLoad) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        const now = Date.now();
        
        // Check if data is expired
        if (parsed.expiresAt > now) {
          setData(parsed.data);
          setLastRunAt(new Date(parsed.timestamp));
          setIsExpired(false);
        } else {
          // Data expired but still show last run time
          setData(parsed.data);
          setLastRunAt(new Date(parsed.timestamp));
          setIsExpired(true);
        }
      }
    } catch (error) {
      console.warn(`Failed to load persisted data for ${key}:`, error);
    }
  }, [storageKey, autoLoad, key]);

  // Update the label periodically
  useEffect(() => {
    updateLabel();
    const interval = setInterval(updateLabel, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateLabel]);

  const saveData = useCallback((newData: T) => {
    const now = Date.now();
    const persisted: PersistedData<T> = {
      data: newData,
      timestamp: now,
      expiresAt: now + ttl,
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(persisted));
      setData(newData);
      setLastRunAt(new Date(now));
      setIsExpired(false);
    } catch (error) {
      console.warn(`Failed to save persisted data for ${key}:`, error);
    }
  }, [storageKey, ttl, key]);

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setData(null);
      setLastRunAt(null);
      setLastRunLabel(null);
      setIsExpired(true);
    } catch (error) {
      console.warn(`Failed to clear persisted data for ${key}:`, error);
    }
  }, [storageKey, key]);

  const refreshLabel = useCallback(() => {
    updateLabel();
  }, [updateLabel]);

  return {
    data,
    isLoading,
    lastRunAt,
    lastRunLabel,
    isExpired,
    saveData,
    clearData,
    setIsLoading,
    refreshLabel,
  };
}

/**
 * Format a "last run" message for display
 */
export function formatLastRunMessage(lastRunLabel: string | null, isExpired?: boolean): string {
  if (!lastRunLabel) return '';
  return `Last run ${lastRunLabel}${isExpired ? ' (stale)' : ''}`;
}