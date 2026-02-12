import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InsightItem } from '@/types/brand';

interface UseBrandIntelligenceInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

export interface BrandIntelligenceDetail {
  brand_summary: string | null;
  market_position: string | null;
  target_audience: any;
  competitive_advantages: string[];
  brand_voice_profile: any;
  growth_recommendations: any[];
  analysis_count: number;
  last_analyzed_at: string | null;
  localization_readiness_score: number | null;
  feedback_score: number | null;
}

/**
 * Fetches brand intelligence data for an entity and converts key stats
 * into InsightItem format for display in the Insights & Updates section.
 */
export function useBrandIntelligenceInsights({ entityType, entityId, enabled = true }: UseBrandIntelligenceInsightsOptions) {
  const [intelligenceInsights, setIntelligenceInsights] = useState<InsightItem[]>([]);
  const [intelligenceDetail, setIntelligenceDetail] = useState<BrandIntelligenceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIntelligence = useCallback(async () => {
    if (!entityId || !enabled) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_intelligence')
        .select('id, entity_type, brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, analysis_count, last_analyzed_at, cultural_insights, localization_readiness_score, feedback_score')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.last_analyzed_at) {
        setIntelligenceInsights([]);
        setIntelligenceDetail(null);
        return;
      }

      // Store full detail for the dialog
      const advantages = Array.isArray(data.competitive_advantages) ? data.competitive_advantages as string[] : [];
      const recommendations = Array.isArray(data.growth_recommendations) ? data.growth_recommendations as any[] : [];

      setIntelligenceDetail({
        brand_summary: data.brand_summary,
        market_position: data.market_position,
        target_audience: data.target_audience,
        competitive_advantages: advantages,
        brand_voice_profile: data.brand_voice_profile,
        growth_recommendations: recommendations,
        analysis_count: data.analysis_count,
        last_analyzed_at: data.last_analyzed_at,
        localization_readiness_score: data.localization_readiness_score,
        feedback_score: data.feedback_score,
      });

      const insights: InsightItem[] = [];

      // Market Position insight
      if (data.brand_summary || data.market_position) {
        insights.push({
          id: `brain-summary-${data.id}`,
          type: 'report',
          title: 'Brand Intelligence Summary',
          summary: data.brand_summary || data.market_position || 'AI analysis available',
          value: `${data.analysis_count}`,
          valueLabel: 'Analyses Run',
          date: data.last_analyzed_at,
          priority: 'medium',
          category: 'Brand Intelligence',
        });
      }

      // Competitive advantages
      if (advantages.length > 0) {
        insights.push({
          id: `brain-advantages-${data.id}`,
          type: 'analytics',
          title: 'Competitive Advantages',
          summary: advantages.slice(0, 3).join(' • ') + (advantages.length > 3 ? ` (+${advantages.length - 3} more)` : ''),
          value: `${advantages.length}`,
          valueLabel: 'Key Advantages',
          trend: 'up' as const,
          date: data.last_analyzed_at,
          priority: 'low',
          category: 'Brand Intelligence',
        });
      }

      // Cultural readiness
      if (data.localization_readiness_score != null) {
        const score = data.localization_readiness_score;
        insights.push({
          id: `brain-cultural-${data.id}`,
          type: 'analytics',
          title: 'Cultural Readiness Score',
          summary: 'Global market readiness based on brand intelligence analysis',
          value: `${score}%`,
          valueLabel: 'Readiness',
          trend: score >= 70 ? 'up' as const : score >= 40 ? 'neutral' as const : 'down' as const,
          date: data.last_analyzed_at,
          priority: score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high',
          category: 'Cultural Intelligence',
        });
      }

      // Growth recommendations count
      if (recommendations.length > 0) {
        const highPriority = recommendations.filter((r: any) => r?.priority === 'high').length;
        insights.push({
          id: `brain-growth-${data.id}`,
          type: 'update',
          title: 'Growth Recommendations',
          summary: highPriority > 0
            ? `${highPriority} high-priority recommendation${highPriority !== 1 ? 's' : ''} identified by AI analysis`
            : `${recommendations.length} strategic recommendation${recommendations.length !== 1 ? 's' : ''} from AI analysis`,
          value: `${recommendations.length}`,
          valueLabel: 'Recommendations',
          trend: highPriority > 0 ? 'up' as const : 'neutral' as const,
          date: data.last_analyzed_at,
          priority: highPriority > 0 ? 'high' : 'medium',
          category: 'Brand Intelligence',
        });
      }

      // Voice profile
      const voice = data.brand_voice_profile as any;
      if (voice && voice.communication_style) {
        const tones = Array.isArray(voice.tone) ? voice.tone : [];
        insights.push({
          id: `brain-voice-${data.id}`,
          type: 'report',
          title: 'Brand Voice Profile',
          summary: `Style: ${voice.communication_style}${tones.length > 0 ? ` • Tone: ${tones.slice(0, 3).join(', ')}` : ''}`,
          date: data.last_analyzed_at,
          priority: 'low',
          category: 'Brand Intelligence',
        });
      }

      setIntelligenceInsights(insights);
    } catch (err) {
      console.error('Error fetching brand intelligence insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return { intelligenceInsights, intelligenceDetail, isLoading, refetch: fetchIntelligence };
}
