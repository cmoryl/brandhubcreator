import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InsightItem } from '@/types/brand';

interface UseBiasAwarenessInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

/**
 * Fetches the latest bias awareness scan for an entity and converts
 * key scores into InsightItem format for the Insights & Updates section.
 */
export function useBiasAwarenessInsights({ entityType, entityId, enabled = true }: UseBiasAwarenessInsightsOptions) {
  const [biasInsights, setBiasInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBiasInsights = useCallback(async () => {
    if (!entityId || !enabled) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bias_awareness_scans')
        .select('id, inclusion_score, language_score, visual_score, accessibility_score, ai_governance_score, findings, persona_coverage, status, completed_at')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.completed_at) {
        setBiasInsights([]);
        return;
      }

      const insights: InsightItem[] = [];
      const score = Number(data.inclusion_score);
      const trend = score >= 80 ? 'up' as const : score >= 60 ? 'neutral' as const : 'down' as const;
      const priority = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

      // Overall inclusion score card
      insights.push({
        id: `bias-inclusion-${data.id}`,
        type: 'analytics',
        title: 'Bias & Inclusion Score',
        summary: `Overall inclusion score across language, visual, accessibility & AI governance dimensions`,
        value: `${Math.round(score)}%`,
        valueLabel: 'Inclusion',
        trend,
        date: data.completed_at,
        priority,
        category: 'Bias Awareness',
      });

      // Dimension breakdown card
      const dims = [
        { label: 'Language', score: Number(data.language_score) },
        { label: 'Visual', score: Number(data.visual_score) },
        { label: 'Accessibility', score: Number(data.accessibility_score) },
        { label: 'AI Governance', score: Number(data.ai_governance_score) },
      ].filter(d => !isNaN(d.score));

      const weakest = dims.reduce((a, b) => a.score < b.score ? a : b, dims[0]);
      if (weakest && weakest.score < 80) {
        insights.push({
          id: `bias-weakest-${data.id}`,
          type: 'update',
          title: `${weakest.label} Needs Attention`,
          summary: `${weakest.label} dimension scored ${Math.round(weakest.score)}/100 — lowest across bias awareness dimensions`,
          value: `${Math.round(weakest.score)}`,
          valueLabel: weakest.label,
          trend: weakest.score >= 60 ? 'neutral' as const : 'down' as const,
          date: data.completed_at,
          priority: weakest.score < 60 ? 'high' : 'medium',
          category: 'Bias Awareness',
        });
      }

      // Findings count
      const findings = Array.isArray(data.findings) ? data.findings : [];
      const critical = findings.filter((f: any) => f?.severity === 'critical' || f?.severity === 'high').length;
      if (findings.length > 0) {
        insights.push({
          id: `bias-findings-${data.id}`,
          type: 'report',
          title: 'Inclusion Findings',
          summary: critical > 0
            ? `${critical} high-priority finding${critical !== 1 ? 's' : ''} require attention across bias dimensions`
            : `${findings.length} finding${findings.length !== 1 ? 's' : ''} identified in latest bias scan`,
          value: `${findings.length}`,
          valueLabel: 'Findings',
          trend: critical > 0 ? 'down' as const : 'neutral' as const,
          date: data.completed_at,
          priority: critical > 0 ? 'high' : 'low',
          category: 'Bias Awareness',
        });
      }

      // Persona spectrum coverage
      const coverage = data.persona_coverage as any;
      if (coverage?.coverage_percentage != null) {
        const pct = Math.round(Number(coverage.coverage_percentage));
        insights.push({
          id: `bias-persona-${data.id}`,
          type: 'analytics',
          title: 'Persona Spectrum Coverage',
          summary: 'Microsoft Persona Spectrum coverage across permanent, temporary & situational constraints',
          value: `${pct}%`,
          valueLabel: 'Coverage',
          trend: pct >= 70 ? 'up' as const : pct >= 40 ? 'neutral' as const : 'down' as const,
          date: data.completed_at,
          priority: pct >= 70 ? 'low' : pct >= 40 ? 'medium' : 'high',
          category: 'Bias Awareness',
        });
      }

      setBiasInsights(insights);
    } catch (err) {
      console.error('Error fetching bias awareness insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  useEffect(() => {
    fetchBiasInsights();
  }, [fetchBiasInsights]);

  return { biasInsights, isLoading };
}
