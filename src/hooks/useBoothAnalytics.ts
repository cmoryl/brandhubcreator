/**
 * useBoothAnalytics — CRUD hook for booth post-show analytics data
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoothAnalyticsRecord {
  id: string;
  division_id: string;
  variant_label: string;
  event_name: string | null;
  event_date: string | null;
  organization_id: string | null;
  predicted_traffic: number | null;
  predicted_dwell_time_seconds: number | null;
  predicted_peak_capacity: number | null;
  predicted_visibility_score: number | null;
  simulation_data: Record<string, any>;
  actual_leads_captured: number;
  actual_demos_given: number;
  actual_dwell_time_seconds: number | null;
  actual_traffic_estimate: number | null;
  actual_peak_visitors: number | null;
  actual_engagement_rate: number | null;
  leads_by_source: Array<{ source: string; count: number }>;
  demos_by_station: Array<{ station: string; count: number }>;
  traffic_by_hour: Array<{ hour: string; count: number }>;
  engagement_by_zone: Array<{ zone: string; score: number }>;
  top_performing_panels: Array<{ panel: string; score: number }>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoothAnalytics(divisionId?: string, variantLabel: string = 'default') {
  const [analytics, setAnalytics] = useState<BoothAnalyticsRecord | null>(null);
  const [allRecords, setAllRecords] = useState<BoothAnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!divisionId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Get latest record for this division+variant
      const { data, error } = await supabase
        .from('expo_booth_analytics')
        .select('*')
        .eq('division_id', divisionId)
        .eq('variant_label', variantLabel)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setAnalytics(data as unknown as BoothAnalyticsRecord | null);

      // Also get all records for trend analysis
      const { data: all } = await supabase
        .from('expo_booth_analytics')
        .select('*')
        .eq('division_id', divisionId)
        .order('event_date', { ascending: true });

      setAllRecords((all || []) as unknown as BoothAnalyticsRecord[]);
    } catch (e) {
      console.error('Failed to fetch booth analytics:', e);
    } finally {
      setLoading(false);
    }
  }, [divisionId, variantLabel]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const saveAnalytics = useCallback(async (
    data: Partial<BoothAnalyticsRecord>,
    organizationId?: string,
  ) => {
    if (!divisionId) return null;

    const payload = {
      ...data,
      division_id: divisionId,
      variant_label: variantLabel,
      organization_id: organizationId || null,
    };

    try {
      if (analytics?.id) {
        // Update existing
        const { error } = await supabase
          .from('expo_booth_analytics')
          .update(payload as any)
          .eq('id', analytics.id);
        if (error) throw error;
        toast.success('Analytics saved');
      } else {
        // Insert new
        const { data: created, error } = await supabase
          .from('expo_booth_analytics')
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        setAnalytics(created as unknown as BoothAnalyticsRecord);
        toast.success('Analytics record created');
      }
      await fetchAnalytics();
    } catch (e: any) {
      toast.error('Failed to save analytics: ' + (e?.message || 'Unknown error'));
    }
  }, [divisionId, variantLabel, analytics, fetchAnalytics]);

  const savePredictions = useCallback(async (
    predictions: {
      traffic: number;
      dwellTime: number;
      peakCapacity: number;
      visibilityScore: number;
      simulationData?: Record<string, any>;
    },
    organizationId?: string,
  ) => {
    return saveAnalytics({
      predicted_traffic: predictions.traffic,
      predicted_dwell_time_seconds: predictions.dwellTime,
      predicted_peak_capacity: predictions.peakCapacity,
      predicted_visibility_score: predictions.visibilityScore,
      simulation_data: predictions.simulationData || {},
    }, organizationId);
  }, [saveAnalytics]);

  return {
    analytics,
    allRecords,
    loading,
    fetchAnalytics,
    saveAnalytics,
    savePredictions,
  };
}
