/**
 * useRealtimeUpdates Hook
 * Provides real-time subscriptions for collaborative editing
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface RealtimeEvent<T = unknown> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: T;
  oldRecord?: T;
  timestamp: string;
}

interface UseRealtimeUpdatesOptions {
  table: 'brands' | 'products' | 'events';
  filter?: { column: string; value: string };
  enabled?: boolean;
  onInsert?: (record: unknown) => void;
  onUpdate?: (record: unknown, oldRecord: unknown) => void;
  onDelete?: (record: unknown) => void;
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  connectionError: string | null;
}

export const useRealtimeUpdates = ({
  table,
  filter,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeUpdatesOptions): UseRealtimeUpdatesReturn => {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleChange = useCallback(
    (payload: { eventType: string; table: string; new: unknown; old: unknown }) => {
      const event: RealtimeEvent = {
        type: payload.eventType as RealtimeEvent['type'],
        table: payload.table,
        record: payload.new,
        oldRecord: payload.old,
        timestamp: new Date().toISOString(),
      };

      setLastEvent(event);

      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new);
          break;
        case 'UPDATE':
          onUpdate?.(payload.new, payload.old);
          break;
        case 'DELETE':
          onDelete?.(payload.old);
          break;
      }
    },
    [onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const channelName = filter
      ? `${table}-${filter.column}-${filter.value}`
      : `${table}-all`;

    // Build filter for subscription
    const filterString = filter ? `${filter.column}=eq.${filter.value}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterString,
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          logger.realtime(`Subscribed to ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Failed to connect to realtime updates');
          console.error(`[Realtime] Error on ${channelName}`);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        logger.realtime(`Unsubscribing from ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter?.column, filter?.value, enabled, user, handleChange]);

  return {
    isConnected,
    lastEvent,
    connectionError,
  };
};

/**
 * useRealtimeBrandUpdates - Specialized hook for brand realtime updates
 */
export const useRealtimeBrandUpdates = (
  brandId: string | undefined,
  onUpdate?: (brand: unknown) => void
) => {
  return useRealtimeUpdates({
    table: 'brands',
    filter: brandId ? { column: 'id', value: brandId } : undefined,
    enabled: !!brandId,
    onUpdate,
  });
};

/**
 * useRealtimeOrgUpdates - Specialized hook for organization content updates
 */
export const useRealtimeOrgUpdates = (
  organizationId: string | undefined,
  callbacks?: {
    onBrandChange?: (brand: unknown, type: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onProductChange?: (product: unknown, type: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onEventChange?: (event: unknown, type: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  }
) => {
  const brandsRealtime = useRealtimeUpdates({
    table: 'brands',
    filter: organizationId ? { column: 'organization_id', value: organizationId } : undefined,
    enabled: !!organizationId,
    onInsert: (r) => callbacks?.onBrandChange?.(r, 'INSERT'),
    onUpdate: (r) => callbacks?.onBrandChange?.(r, 'UPDATE'),
    onDelete: (r) => callbacks?.onBrandChange?.(r, 'DELETE'),
  });

  const productsRealtime = useRealtimeUpdates({
    table: 'products',
    filter: organizationId ? { column: 'organization_id', value: organizationId } : undefined,
    enabled: !!organizationId,
    onInsert: (r) => callbacks?.onProductChange?.(r, 'INSERT'),
    onUpdate: (r) => callbacks?.onProductChange?.(r, 'UPDATE'),
    onDelete: (r) => callbacks?.onProductChange?.(r, 'DELETE'),
  });

  const eventsRealtime = useRealtimeUpdates({
    table: 'events',
    filter: organizationId ? { column: 'organization_id', value: organizationId } : undefined,
    enabled: !!organizationId,
    onInsert: (r) => callbacks?.onEventChange?.(r, 'INSERT'),
    onUpdate: (r) => callbacks?.onEventChange?.(r, 'UPDATE'),
    onDelete: (r) => callbacks?.onEventChange?.(r, 'DELETE'),
  });

  return {
    brands: brandsRealtime,
    products: productsRealtime,
    events: eventsRealtime,
    isFullyConnected:
      brandsRealtime.isConnected &&
      productsRealtime.isConnected &&
      eventsRealtime.isConnected,
  };
};
