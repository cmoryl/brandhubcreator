/**
 * useImageryStrategyAudit — Fetch and trigger imagery strategy audits
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImageryAuditResult {
  id: string;
  entity_id: string;
  entity_type: string;
  organization_id: string;
  overall_score: number;
  diversity_score: number;
  authenticity_score: number;
  cultural_context_score: number;
  action_orientation_score: number;
  inclusive_prompting_score: number;
  stock_dependency: string;
  stop_signals_detected: string[];
  go_signals_present: string[];
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    dimension: string;
  }>;
  images_analyzed: number;
  created_at: string;
}

export function useImageryStrategyAudit(entityId?: string, entityType?: string) {
  const [latestAudit, setLatestAudit] = useState<ImageryAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const fetchLatest = useCallback(async () => {
    if (!entityId || !entityType) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('imagery_strategy_audits')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLatestAudit(data as unknown as ImageryAuditResult);
      }
    } catch (err) {
      console.error('[useImageryStrategyAudit] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const runAudit = useCallback(async (organizationId: string) => {
    if (!entityId || !entityType) return false;
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('imagery-strategy-audit', {
        body: { entityId, entityType, organizationId },
      });

      if (error) {
        toast.error('Imagery audit failed');
        console.error('[useImageryStrategyAudit] invoke error:', error);
        return false;
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit reached. Please try again later.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add funds.');
        } else {
          toast.error(data.error);
        }
        return false;
      }

      toast.success('Imagery audit completed');
      if (data?.audit) {
        setLatestAudit(data.audit as ImageryAuditResult);
      } else {
        await fetchLatest();
      }
      return true;
    } catch (err) {
      console.error('[useImageryStrategyAudit] error:', err);
      toast.error('Failed to run imagery audit');
      return false;
    } finally {
      setIsRunning(false);
    }
  }, [entityId, entityType, fetchLatest]);

  return { latestAudit, isLoading, isRunning, runAudit, refresh: fetchLatest };
}

/**
 * usePortfolioImageryAudits — Fetch all imagery audits for an organization (AI Center)
 */
export function usePortfolioImageryAudits(organizationId?: string) {
  const [audits, setAudits] = useState<ImageryAuditResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      // Get latest audit per entity
      const { data, error } = await supabase
        .from('imagery_strategy_audits')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        // Deduplicate: keep only latest per entity
        const seen = new Set<string>();
        const unique = (data as unknown as ImageryAuditResult[]).filter(a => {
          const key = `${a.entity_id}-${a.entity_type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAudits(unique);
      }
    } catch (err) {
      console.error('[usePortfolioImageryAudits] error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Aggregated metrics
  const avgOverall = audits.length > 0 ? audits.reduce((a, b) => a + (b.overall_score || 0), 0) / audits.length : 0;
  const avgDiversity = audits.length > 0 ? audits.reduce((a, b) => a + (b.diversity_score || 0), 0) / audits.length : 0;
  const avgAuthenticity = audits.length > 0 ? audits.reduce((a, b) => a + (b.authenticity_score || 0), 0) / audits.length : 0;
  const avgCultural = audits.length > 0 ? audits.reduce((a, b) => a + (b.cultural_context_score || 0), 0) / audits.length : 0;
  const avgAction = audits.length > 0 ? audits.reduce((a, b) => a + (b.action_orientation_score || 0), 0) / audits.length : 0;
  const avgPrompting = audits.length > 0 ? audits.reduce((a, b) => a + (b.inclusive_prompting_score || 0), 0) / audits.length : 0;

  const allStopSignals = audits.flatMap(a => Array.isArray(a.stop_signals_detected) ? a.stop_signals_detected : []);
  const allGoSignals = audits.flatMap(a => Array.isArray(a.go_signals_present) ? a.go_signals_present : []);

  // Frequency counts
  const stopFrequency = allStopSignals.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
  const goFrequency = allGoSignals.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);

  return {
    audits, isLoading, refresh: fetchAll,
    avgOverall, avgDiversity, avgAuthenticity, avgCultural, avgAction, avgPrompting,
    stopFrequency, goFrequency,
  };
}
