import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InsightItem } from '@/types/brand';

interface UseVisibilityAuditInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

/**
 * Fetches the latest visibility audit for an entity and converts
 * key results into InsightItem format for the Insights & Updates section.
 */
export function useVisibilityAuditInsights({ entityType, entityId, enabled = true }: UseVisibilityAuditInsightsOptions) {
  const [visibilityInsights, setVisibilityInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!entityId || !enabled) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_visibility_audits')
        .select('id, overall_visibility_score, search_visibility_score, ai_platform_score, social_media_score, visibility_gaps, recommendations, completed_at, status')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) { setVisibilityInsights([]); return; }

      const insights: InsightItem[] = [];
      const overall = data.overall_visibility_score ?? 0;
      const gaps = Array.isArray(data.visibility_gaps) ? data.visibility_gaps as any[] : [];
      const recs = Array.isArray(data.recommendations) ? data.recommendations as any[] : [];
      const criticalGaps = gaps.filter((g: any) => g.severity === 'critical' || g.severity === 'high');

      // Overall score insight
      insights.push({
        id: `vis-overall-${data.id}`,
        type: 'analytics',
        title: 'Visibility Score',
        summary: `Overall visibility: ${Math.round(overall)}% — Search: ${data.search_visibility_score ?? '—'}%, AI: ${data.ai_platform_score ?? '—'}%, Social: ${data.social_media_score ?? '—'}%`,
        value: `${Math.round(overall)}%`,
        valueLabel: 'Visibility',
        trend: overall >= 70 ? 'up' as const : overall >= 40 ? 'neutral' as const : 'down' as const,
        date: data.completed_at,
        priority: overall >= 70 ? 'low' : overall >= 40 ? 'medium' : 'high',
        category: 'Visibility Audit',
      });

      // Critical gaps alert
      if (criticalGaps.length > 0) {
        insights.push({
          id: `vis-gaps-${data.id}`,
          type: 'alert',
          title: 'Visibility Gaps Detected',
          summary: `${criticalGaps.length} critical/high-severity gap${criticalGaps.length !== 1 ? 's' : ''}: ${criticalGaps.slice(0, 2).map((g: any) => g.title || g.gap || g.category).join(', ')}${criticalGaps.length > 2 ? ` (+${criticalGaps.length - 2} more)` : ''}`,
          value: `${criticalGaps.length}`,
          valueLabel: 'Critical Gaps',
          trend: 'down' as const,
          date: data.completed_at,
          priority: 'high',
          category: 'Visibility Audit',
        });
      }

      // Recommendations count
      if (recs.length > 0) {
        insights.push({
          id: `vis-recs-${data.id}`,
          type: 'update',
          title: 'Visibility Recommendations',
          summary: `${recs.length} recommendation${recs.length !== 1 ? 's' : ''} to improve visibility across search, AI platforms, and social media`,
          value: `${recs.length}`,
          valueLabel: 'Actions',
          trend: 'neutral' as const,
          date: data.completed_at,
          priority: 'medium',
          category: 'Visibility Audit',
        });
      }

      setVisibilityInsights(insights);
    } catch (err) {
      console.error('Error fetching visibility audit insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  useEffect(() => { fetch(); }, [fetch]);

  return { visibilityInsights, isLoading, refetch: fetch };
}
