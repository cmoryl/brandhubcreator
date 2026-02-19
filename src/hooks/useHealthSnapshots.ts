/**
 * Hook for health snapshot longitudinal analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface HealthSnapshot {
  snapshot_date: string;
  brand_health_score: number | null;
  compliance_score: number | null;
  bias_inclusion_score: number | null;
  website_score: number | null;
  competitive_score: number | null;
  score_deltas: Record<string, number | null>;
  period_type: string;
  triggered_by: string;
}

interface OrgHealthSummary {
  snapshot_date: string;
  avg_health_score: number | null;
  avg_compliance_score: number | null;
  avg_bias_score: number | null;
  avg_website_score: number | null;
  entity_count: number;
}

export function useHealthSnapshots(entityId?: string, entityType: string = 'brand') {
  const { organization } = useOrganization();
  const [trends, setTrends] = useState<HealthSnapshot[]>([]);
  const [orgSummary, setOrgSummary] = useState<OrgHealthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const fetchTrends = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_health_trends', {
        p_entity_id: entityId,
        p_entity_type: entityType,
        p_months: 12,
      });
      if (error) throw error;
      setTrends((data as unknown as HealthSnapshot[]) || []);
    } catch (err) {
      console.error('Failed to fetch health trends:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  const fetchOrgSummary = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_org_health_summary', {
        p_org_id: organization.id,
        p_months: 12,
      });
      if (error) throw error;
      setOrgSummary((data as unknown as OrgHealthSummary[]) || []);
    } catch (err) {
      console.error('Failed to fetch org health summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const captureSnapshot = useCallback(async (targetEntityId?: string, targetEntityType?: string) => {
    if (!organization?.id) return;
    setIsCapturing(true);
    try {
      const payload: Record<string, string> = { organization_id: organization.id, triggered_by: 'manual' };
      if (targetEntityId && targetEntityType) {
        payload.entity_id = targetEntityId;
        payload.entity_type = targetEntityType;
      }

      const { data, error } = await supabase.functions.invoke('health-snapshot', { body: payload });
      if (error) throw error;
      
      toast.success(data?.count 
        ? `Captured ${data.count} health snapshots` 
        : 'Health snapshot captured successfully'
      );
      
      // Refresh data
      if (entityId) fetchTrends();
      fetchOrgSummary();
    } catch (err: any) {
      console.error('Failed to capture snapshot:', err);
      toast.error('Failed to capture health snapshot');
    } finally {
      setIsCapturing(false);
    }
  }, [organization?.id, entityId, fetchTrends, fetchOrgSummary]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);
  useEffect(() => { fetchOrgSummary(); }, [fetchOrgSummary]);

  return { trends, orgSummary, isLoading, isCapturing, captureSnapshot, refreshTrends: fetchTrends, refreshOrgSummary: fetchOrgSummary };
}
