/**
 * useExternalSectionCounts Hook
 * Fetches counts of automated insight sources from database tables
 * to supplement the health calculator's guide_data-only scoring.
 * 
 * Sources counted for Insights & Updates:
 *  - competitive_analysis_reports
 *  - brand_intelligence
 *  - dataforce_compliance_jobs (completed)
 *  - bias_awareness_scans (completed)
 *  - website_analysis_reports
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ExternalSectionCounts } from '@/lib/brandHealthCalculator';

export function useExternalSectionCounts(
  entityId: string | undefined,
  entityType: string = 'brand'
): ExternalSectionCounts {
  const [counts, setCounts] = useState<ExternalSectionCounts>({});

  useEffect(() => {
    if (!entityId) {
      setCounts({});
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Fetch all counts in parallel
        const [competitive, intelligence, compliance, bias, website] = await Promise.all([
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

        setCounts({ insightSourceCount });
      } catch (err) {
        console.error('[useExternalSectionCounts] Error:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [entityId, entityType]);

  return counts;
}
