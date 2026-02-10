/**
 * useLatestComplianceScores
 * Fetches the latest compliance score per entity from dataforce_compliance_jobs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceScoreEntry {
  score: number;
  status: string;
  date: string;
}

export function useLatestComplianceScores(organizationId?: string | null) {
  return useQuery({
    queryKey: ['latest-compliance-scores', organizationId],
    queryFn: async () => {
      if (!organizationId) return new Map<string, ComplianceScoreEntry>();

      const { data, error } = await supabase
        .from('dataforce_compliance_jobs')
        .select('entity_id, compliance_score, status, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate to latest per entity
      const map = new Map<string, ComplianceScoreEntry>();
      for (const row of data || []) {
        if (!map.has(row.entity_id) && row.compliance_score != null) {
          map.set(row.entity_id, {
            score: row.compliance_score,
            status: row.status || 'completed',
            date: row.created_at,
          });
        }
      }
      return map;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
