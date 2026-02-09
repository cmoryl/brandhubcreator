import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CompetitiveAnalysisReport, CompetitiveAnalysisReportData, EntityType } from '@/types/competitiveAnalysis';

interface UseCompetitiveAnalysisOptions {
  entityType: EntityType;
  entityId: string;
  organizationId?: string | null;
}

export function useCompetitiveAnalysis({ entityType, entityId, organizationId }: UseCompetitiveAnalysisOptions) {
  const [reports, setReports] = useState<CompetitiveAnalysisReport[]>([]);
  const [latestReport, setLatestReport] = useState<CompetitiveAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing reports for this entity
  const fetchReports = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('competitive_analysis_reports')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Type cast since we know the structure
      const typedReports = (data || []).map(report => ({
        ...report,
        report_data: report.report_data as unknown as CompetitiveAnalysisReportData,
        competitors: (report.competitors || []) as string[],
      })) as CompetitiveAnalysisReport[];

      setReports(typedReports);
      setLatestReport(typedReports[0] || null);
    } catch (err) {
      console.error('Error fetching competitive analysis reports:', err);
      setError('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  // Generate a new competitive analysis report
  const generateReport = useCallback(async (
    competitors: string[], 
    regionalContext?: { region?: string; country?: string }
  ) => {
    if (!entityId) {
      toast.error('Entity ID is required');
      return null;
    }

    if (competitors.length === 0) {
      toast.error('Please add at least one competitor');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error('Please sign in to generate reports');
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competitive-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entityType,
            entityId,
            organizationId,
            competitors: competitors.slice(0, 10), // Limit to 10 competitors
            region: regionalContext?.region,
            country: regionalContext?.country,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('API credits exhausted. Please add credits to continue.');
        }
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      
      if (result.report) {
        const typedReport = {
          ...result.report,
          report_data: result.report.report_data as CompetitiveAnalysisReportData,
          competitors: (result.report.competitors || []) as string[],
        } as CompetitiveAnalysisReport;

        setReports(prev => [typedReport, ...prev]);
        setLatestReport(typedReport);
        toast.success('Competitive analysis report generated successfully');
        return typedReport;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      console.error('Error generating competitive analysis:', err);
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [entityType, entityId, organizationId]);

  // Delete a report
  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('competitive_analysis_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) throw deleteError;

      setReports(prev => prev.filter(r => r.id !== reportId));
      if (latestReport?.id === reportId) {
        const remaining = reports.filter(r => r.id !== reportId);
        setLatestReport(remaining[0] || null);
      }
      toast.success('Report deleted');
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    }
  }, [latestReport, reports]);

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    latestReport,
    isLoading,
    isGenerating,
    error,
    generateReport,
    deleteReport,
    refetch: fetchReports,
  };
}
