import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { InsightItem } from '@/types/brand';
import type { CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';

interface UseCompetitiveInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

export interface CompetitiveInsightItem extends InsightItem {
  /** The raw report ID (without the 'competitive-' prefix) */
  reportId: string;
  /** Full report data for viewing */
  reportData: CompetitiveAnalysisReportData | null;
  /** Competitors analyzed in this report */
  competitors: string[];
}

/**
 * Fetches competitive analysis reports for an entity and converts them
 * into InsightItem format for display in the Insights & Updates section.
 */
export function useCompetitiveInsights({ entityType, entityId, enabled = true }: UseCompetitiveInsightsOptions) {
  const [competitiveInsights, setCompetitiveInsights] = useState<CompetitiveInsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!entityId || !enabled) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitive_analysis_reports')
        .select('id, entity_type, score, competitors, created_at, updated_at, report_data, status')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const insights: CompetitiveInsightItem[] = (data || []).map((report) => {
        const reportData = report.report_data as unknown as CompetitiveAnalysisReportData | null;
        const execSummary = reportData?.executiveSummary;
        const overview = execSummary?.overview || '';
        const competitors = Array.isArray(report.competitors) ? report.competitors as string[] : [];
        const score = report.score as number | null;

        return {
          id: `competitive-${report.id}`,
          reportId: report.id,
          type: 'analytics' as const,
          title: `Competitive Analysis${competitors.length > 0 ? ` vs ${competitors.slice(0, 2).join(', ')}${competitors.length > 2 ? ` +${competitors.length - 2}` : ''}` : ''}`,
          summary: overview
            ? overview.length > 200 ? overview.slice(0, 200) + '…' : overview
            : `Competitive analysis report covering ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}.`,
          value: score != null ? `${score}` : undefined,
          valueLabel: score != null ? 'Competitive Score' : undefined,
          trend: score != null ? (score >= 70 ? 'up' : score >= 40 ? 'neutral' : 'down') : undefined,
          date: report.created_at,
          priority: score != null ? (score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high') : 'medium',
          category: 'Competitive Intelligence',
          reportData,
          competitors,
        };
      });

      setCompetitiveInsights(insights);
    } catch (err) {
      console.error('Error fetching competitive insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('competitive_analysis_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setCompetitiveInsights(prev => prev.filter(i => i.reportId !== reportId));
      toast.success('Competitive analysis report deleted');
    } catch (err) {
      console.error('Error deleting competitive report:', err);
      toast.error('Failed to delete report');
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { competitiveInsights, isLoading, refetch: fetchReports, deleteReport };
}
