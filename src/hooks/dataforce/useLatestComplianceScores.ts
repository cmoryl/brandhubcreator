/**
 * useLatestComplianceScores
 * Fetches the latest compliance score per entity from dataforce_compliance_jobs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceWeightedBy {
  archetype?: string | null;
  industry?: string | null;
  hints?: string[];
}

export interface ComplianceScoreEntry {
  score: number;
  status: string;
  date: string;
  weightedBy?: ComplianceWeightedBy | null;
}

export function useLatestComplianceScores(organizationId?: string | null) {
  return useQuery({
    queryKey: ['latest-compliance-scores', organizationId],
    queryFn: async () => {
      if (!organizationId) return new Map<string, ComplianceScoreEntry>();

      const { data, error } = await supabase
        .from('dataforce_compliance_jobs')
        .select('entity_id, compliance_score, status, created_at, weighted_by')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate to latest per entity
      const map = new Map<string, ComplianceScoreEntry>();
      for (const row of (data || []) as Array<Record<string, unknown>>) {
        const entityId = row.entity_id as string;
        const score = row.compliance_score as number | null;
        if (!map.has(entityId) && score != null) {
          map.set(entityId, {
            score,
            status: (row.status as string) || 'completed',
            date: row.created_at as string,
            weightedBy: (row.weighted_by as ComplianceWeightedBy | null) ?? null,
          });
        }
      }
      return map;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
