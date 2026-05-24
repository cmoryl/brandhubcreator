/**
 * Phase 6 — Icon usage tracking + collaborative-filter trending.
 * Logs every meaningful pick (add, kit_added, removed, exported) to
 * `icon_usage_events` and exposes a hook for surfacing trending icons by
 * industry. RLS-scoped to the organization; no-ops when unauthenticated or
 * when organizationId is missing (e.g. demo/static guides).
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type IconUsageAction = 'added' | 'removed' | 'exported' | 'kit_added';

export interface IconUsageEvent {
  organizationId?: string | null;
  brandId?: string | null;
  industry?: string | null;
  sectionId: string;
  pack: string;
  iconName: string;
  action: IconUsageAction;
  /** Optional context tag — e.g. kit id, 'ai-search', 'suggested'. */
  source?: string | null;
}

export interface TrendingIcon {
  pack: string;
  icon_name: string;
  uses: number;
}

/** Logs a single usage event. Best-effort: silently swallows errors. */
export async function logIconUsage(event: IconUsageEvent): Promise<void> {
  if (!event.organizationId) return; // org scope required by RLS
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    await supabase.from('icon_usage_events').insert({
      organization_id: event.organizationId,
      brand_id: event.brandId ?? null,
      user_id: userId,
      industry: event.industry ?? null,
      section_id: event.sectionId,
      pack: event.pack,
      icon_name: event.iconName,
      action: event.action,
      source: event.source ?? null,
    });
  } catch (e) {
    logger.debug('[iconUsage] log failed', e);
  }
}

/** Convenience hook returning a stable logger callback. */
export function useIconUsageLogger() {
  return useCallback((event: IconUsageEvent) => {
    void logIconUsage(event);
  }, []);
}

/**
 * Hook — fetches top N most-added icons for a (industry, section) tuple.
 * Aggregates client-side after a small query (limited to recent rows).
 */
export function useTrendingIcons(opts: {
  industry?: string | null;
  sectionId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { industry, sectionId, limit = 12, enabled = true } = opts;
  const [items, setItems] = useState<TrendingIcon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        let query = supabase
          .from('icon_usage_events')
          .select('pack, icon_name, industry, section_id, action')
          .in('action', ['added', 'kit_added'])
          .order('created_at', { ascending: false })
          .limit(1000);
        if (industry) query = query.eq('industry', industry);
        if (sectionId) query = query.eq('section_id', sectionId);
        const { data, error } = await query;
        if (error || !data) {
          if (alive) setItems([]);
          return;
        }
        const counts = new Map<string, { pack: string; icon_name: string; uses: number }>();
        for (const row of data as Array<{ pack: string; icon_name: string }>) {
          const key = `${row.pack}/${row.icon_name}`;
          const cur = counts.get(key);
          if (cur) cur.uses += 1;
          else counts.set(key, { pack: row.pack, icon_name: row.icon_name, uses: 1 });
        }
        const sorted = Array.from(counts.values())
          .sort((a, b) => b.uses - a.uses)
          .slice(0, limit);
        if (alive) setItems(sorted);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [industry, sectionId, limit, enabled]);

  return { items, loading };
}
