import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InsightItem } from '@/types/brand';

interface UseComplianceAuditInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

/**
 * Fetches the latest DataForce compliance audit for an entity
 * and converts it into InsightItem cards for the Insights & Updates section.
 */
export function useComplianceAuditInsights({ entityType, entityId, enabled = true }: UseComplianceAuditInsightsOptions) {
  const [complianceInsights, setComplianceInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompliance = useCallback(async () => {
    if (!entityId || !enabled) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dataforce_compliance_jobs')
        .select('id, entity_name, entity_type, compliance_score, assets_scanned, issues_found, issues_data, status, created_at')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data || data.compliance_score == null) {
        setComplianceInsights([]);
        return;
      }

      const score = data.compliance_score;
      const issues = data.issues_found ?? 0;
      const assets = data.assets_scanned ?? 0;

      const priorityFromScore = score >= 80 ? 'low' as const : score >= 60 ? 'medium' as const : 'high' as const;
      const trendFromScore = score >= 80 ? 'up' as const : score >= 60 ? 'neutral' as const : 'down' as const;

      const insights: InsightItem[] = [];

      // Main compliance score card
      insights.push({
        id: `compliance-score-${data.id}`,
        type: 'analytics',
        title: 'Brand Cohesion Audit Score',
        summary: `Latest audit scored ${score}/100 with ${issues} issue${issues !== 1 ? 's' : ''} found across ${assets} asset${assets !== 1 ? 's' : ''} scanned.`,
        value: `${score}`,
        valueLabel: 'Cohesion Score',
        trend: trendFromScore,
        trendValue: score >= 80 ? 'Healthy' : score >= 60 ? 'Needs Work' : 'Critical',
        date: data.created_at,
        priority: priorityFromScore,
        category: 'DataForce Compliance',
      });

      // Issues breakdown if there are issues
      if (issues > 0) {
        const issuesData = data.issues_data as any;
        const issuesList = Array.isArray(issuesData) ? issuesData : [];
        const highSeverity = issuesList.filter((i: any) => i?.severity === 'high' || i?.severity === 'critical').length;

        insights.push({
          id: `compliance-issues-${data.id}`,
          type: 'alert',
          title: 'Compliance Issues Detected',
          summary: highSeverity > 0
            ? `${highSeverity} high-severity issue${highSeverity !== 1 ? 's' : ''} require immediate attention out of ${issues} total`
            : `${issues} compliance issue${issues !== 1 ? 's' : ''} identified — review recommended`,
          value: `${issues}`,
          valueLabel: 'Issues Found',
          trend: 'down' as const,
          date: data.created_at,
          priority: highSeverity > 0 ? 'high' : 'medium',
          category: 'DataForce Compliance',
        });
      }

      setComplianceInsights(insights);
    } catch (err) {
      console.error('Error fetching compliance audit insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  return { complianceInsights, isLoading, refetch: fetchCompliance };
}
