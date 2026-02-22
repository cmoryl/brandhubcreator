/**
 * useRecentEntityViews Hook
 * Fetches the user's most recently viewed entity IDs from page_views
 * Used to personalize portal ordering (most recently viewed first).
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRecentEntityViewsReturn {
  recentEntityIds: string[];
  isLoading: boolean;
}

export function useRecentEntityViews(
  userId: string | undefined,
  organizationId: string | undefined | null
): UseRecentEntityViewsReturn {
  const [recentEntityIds, setRecentEntityIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !organizationId) {
      setRecentEntityIds([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        // Fetch the user's most recent entity views (distinct entities, ordered by recency)
        const { data, error } = await supabase
          .from('page_views')
          .select('entity_id, created_at')
          .eq('user_id', userId)
          .in('entity_type', ['brand', 'product', 'event'])
          .not('entity_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (cancelled || error) return;

        // Deduplicate: keep first occurrence (most recent) of each entity_id
        const seen = new Set<string>();
        const ordered: string[] = [];
        for (const row of data || []) {
          if (row.entity_id && !seen.has(row.entity_id)) {
            seen.add(row.entity_id);
            ordered.push(row.entity_id);
          }
        }

        setRecentEntityIds(ordered);
      } catch (err) {
        console.error('[useRecentEntityViews] Error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, organizationId]);

  return { recentEntityIds, isLoading };
}
