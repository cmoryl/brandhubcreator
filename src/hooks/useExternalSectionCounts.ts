/**
 * useExternalSectionCounts Hook
 * Fetches counts of automated insight sources AND DB-backed section data
 * to supplement the health calculator's guide_data-only scoring.
 * 
 * Sources counted:
 *  - Insights: competitive_analysis_reports, brand_intelligence, compliance, bias, website
 *  - Presentations: presentation_templates table
 *  - Social Metrics: social_metrics_snapshots table
 *  
 * Accepts an optional `refreshTrigger` (e.g. a timestamp or counter) so that
 * callers can force a re-fetch after mutations without a full page reload.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ExternalSectionCounts } from '@/lib/brandHealthCalculator';

export function useExternalSectionCounts(
  entityId: string | undefined,
  entityType: string = 'brand',
  refreshTrigger?: number
): ExternalSectionCounts & { isLoaded: boolean } {
  const [counts, setCounts] = useState<ExternalSectionCounts>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setCounts({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Fetch all counts in parallel
        const [competitive, intelligence, compliance, bias, website, presentations, socialMetrics] = await Promise.all([
          supabase
            .from('competitive_analysis_reports')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId),
          supabase
            .from('brand_intelligence')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId),
          supabase
            .from('dataforce_compliance_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId)
            .eq('status', 'completed'),
          supabase
            .from('bias_awareness_scans')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId)
            .eq('status', 'completed'),
          supabase
            .from('website_analysis_reports')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId),
          supabase
            .from('presentation_templates')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId)
            .eq('entity_type', entityType),
          supabase
            .from('social_metrics_snapshots')
            .select('id', { count: 'exact', head: true })
            .eq('entity_id', entityId)
            .eq('entity_type', entityType),
        ]);

        if (cancelled) return;

        // Count how many external insight SOURCES have data (not total records)
        const insightSourceCount = [
          (competitive.count ?? 0) > 0 ? 1 : 0,
          (intelligence.count ?? 0) > 0 ? 1 : 0,
          (compliance.count ?? 0) > 0 ? 1 : 0,
          (bias.count ?? 0) > 0 ? 1 : 0,
          (website.count ?? 0) > 0 ? 1 : 0,
        ].reduce((sum, v) => sum + v, 0);

        setCounts({
          insightSourceCount,
          presentationTemplatesCount: presentations.count ?? 0,
          socialMetricsCount: socialMetrics.count ?? 0,
        });
        setIsLoaded(true);
      } catch (err) {
        console.error('[useExternalSectionCounts] Error:', err);
        setIsLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [entityId, entityType, refreshTrigger]);

  return { ...counts, isLoaded };
}
