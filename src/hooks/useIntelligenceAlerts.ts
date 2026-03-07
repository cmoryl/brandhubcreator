/**
 * Intelligence Alerts Hook
 * Manages fetching, acknowledging, and dismissing intelligence alerts
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type IntelligenceCadence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface IntelligenceAlert {
  id: string;
  organization_id: string;
  entity_id: string | null;
  entity_type: string | null;
  entity_name: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export function useIntelligenceAlerts(organizationId: string | null | undefined) {
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cadence, setCadence] = useState<IntelligenceCadence>('monthly');
  const [isCadenceLoading, setIsCadenceLoading] = useState(false);

  const fetchAlerts = useCallback(async (showAll = false) => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('intelligence_alerts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!showAll) {
        query = query.eq('acknowledged', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      const typed = (data || []) as unknown as IntelligenceAlert[];
      setAlerts(typed);
      setUnacknowledgedCount(typed.filter(a => !a.acknowledged).length);
    } catch (err) {
      console.error('[IntelligenceAlerts] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        } as any)
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a
      ));
      setUnacknowledgedCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to acknowledge alert');
    }
  }, []);

  const acknowledgeAll = useCallback(async () => {
    if (!organizationId) return;
    try {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        } as any)
        .eq('organization_id', organizationId)
        .eq('acknowledged', false);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true, acknowledged_at: new Date().toISOString() })));
      setUnacknowledgedCount(0);
      toast.success('All alerts acknowledged');
    } catch (err) {
      toast.error('Failed to acknowledge alerts');
    }
  }, [organizationId]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('intelligence_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => {
        const removed = prev.find(a => a.id === alertId);
        if (removed && !removed.acknowledged) {
          setUnacknowledgedCount(c => Math.max(0, c - 1));
        }
        return prev.filter(a => a.id !== alertId);
      });
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  }, []);

  const triggerScheduledRun = useCallback(async () => {
    if (!organizationId) return;
    try {
      const { error } = await supabase.functions.invoke('scheduled-intelligence', {
        body: { organization_id: organizationId, triggered_by: 'manual' },
      });
      if (error) throw new Error(error.message);
      toast.success('Scheduled intelligence run started');
      // Refresh alerts after a delay to allow processing
      setTimeout(() => fetchAlerts(), 10000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger run';
      toast.error(msg);
    }
  }, [organizationId, fetchAlerts]);

  const fetchCadence = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_intelligence_cadence');
      if (error) throw error;
      if (data) setCadence(data as IntelligenceCadence);
    } catch (err) {
      console.error('[IntelligenceAlerts] Cadence fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCadence();
  }, [fetchCadence]);

  const updateCadence = useCallback(async (newCadence: IntelligenceCadence) => {
    setIsCadenceLoading(true);
    try {
      const { error } = await supabase.rpc('update_intelligence_cadence', { p_cadence: newCadence });
      if (error) throw error;
      setCadence(newCadence);
      toast.success(`Intelligence cadence updated to ${newCadence}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update cadence';
      toast.error(msg);
    } finally {
      setIsCadenceLoading(false);
    }
  }, []);

  return {
    alerts,
    unacknowledgedCount,
    isLoading,
    fetchAlerts,
    acknowledgeAlert,
    acknowledgeAll,
    deleteAlert,
    triggerScheduledRun,
    cadence,
    isCadenceLoading,
    updateCadence,
  };
}
