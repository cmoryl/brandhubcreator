/**
 * Bias Awareness Hook
 * Manages bias awareness scans and scores for entities
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BiasAwarenessScan {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  inclusion_score: number;
  language_score: number;
  visual_score: number;
  accessibility_score: number;
  ai_governance_score: number;
  findings: Array<{
    dimension: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    priority: string;
    dimension: string;
    action: string;
    impact: string;
  }>;
  language_analysis: Record<string, unknown>;
  visual_analysis: Record<string, unknown>;
  accessibility_analysis: Record<string, unknown>;
  ai_governance_analysis: Record<string, unknown>;
  persona_coverage: Record<string, unknown>;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useBiasAwareness(
  entityId: string | null | undefined,
  entityType: 'brand' | 'product' | 'event',
  entityName: string,
  organizationId: string | null | undefined
) {
  const [latestScan, setLatestScan] = useState<BiasAwarenessScan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchLatestScan = useCallback(async () => {
    if (!entityId || !entityType) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bias_awareness_scans')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setLatestScan(data as unknown as BiasAwarenessScan);
        // If still processing, start polling
        if (data.status === 'processing' || data.status === 'pending') {
          startPolling(data.id);
        }
      }
    } catch (err) {
      console.error('[BiasAwareness] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    fetchLatestScan();
  }, [fetchLatestScan]);

  const startPolling = useCallback((scanId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsScanning(true);

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('bias_awareness_scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (!data) return;

        if (data.status === 'completed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setIsScanning(false);
          setLatestScan(data as unknown as BiasAwarenessScan);
          toast.success(`Bias awareness scan complete: ${data.inclusion_score}/100`);
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setIsScanning(false);
          setLatestScan(data as unknown as BiasAwarenessScan);
          toast.error(data.error_message || 'Scan failed');
        }
      } catch (err) {
        console.error('[BiasAwareness] Poll error:', err);
      }
    }, 2500);
  }, []);

  const startScan = useCallback(async () => {
    if (!entityId || !organizationId) {
      toast.error('Missing entity or organization context');
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('bias-awareness-scan', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.scan_id) throw new Error('No scan ID returned');

      toast.info('Bias awareness scan started...');
      startPolling(data.scan_id);
    } catch (err) {
      setIsScanning(false);
      const msg = err instanceof Error ? err.message : 'Failed to start scan';
      toast.error(msg);
    }
  }, [entityId, entityType, entityName, organizationId, startPolling]);

  return {
    latestScan,
    isLoading,
    isScanning,
    startScan,
    refetch: fetchLatestScan,
  };
}

/**
 * Hook for fetching latest bias scores across all entities in an org
 * (Similar to useLatestComplianceScores)
 */
export function useLatestBiasScores(organizationId?: string | null) {
  const [scores, setScores] = useState<Map<string, { score: number; date: string }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) return;

    const fetchScores = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('bias_awareness_scans')
          .select('entity_id, inclusion_score, status, created_at')
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const map = new Map<string, { score: number; date: string }>();
        for (const row of data || []) {
          if (!map.has(row.entity_id) && row.inclusion_score != null) {
            map.set(row.entity_id, {
              score: Number(row.inclusion_score),
              date: row.created_at,
            });
          }
        }
        setScores(map);
      } catch (err) {
        console.error('[BiasAwareness] Score fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [organizationId]);

  return { scores, isLoading };
}
