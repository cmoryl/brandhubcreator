/**
 * useSocialMetricsInsights - Converts social metrics aggregated data
 * into InsightItem format for the Insights & Updates section.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InsightItem } from '@/types/brand';


interface UseSocialMetricsInsightsOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  enabled?: boolean;
}

export function useSocialMetricsInsights({ entityType, entityId, enabled = true }: UseSocialMetricsInsightsOptions) {
  const [socialInsights, setSocialInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSocialInsights = useCallback(async () => {
    if (!entityId || !enabled) return;

    setIsLoading(true);
    try {
      const { data: aggData, error: aggError } = await supabase
        .rpc('get_aggregated_social_metrics', {
          p_entity_id: entityId,
          p_entity_type: entityType,
        });

      if (aggError) throw aggError;

      const agg = aggData?.[0];
      if (!agg || agg.platforms_count === 0) {
        setSocialInsights([]);
        return;
      }

      // Format follower count
      const formatNumber = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return String(n);
      };

      const insights: InsightItem[] = [];

      // Main social performance card
      insights.push({
        id: `social-performance-${entityId}`,
        type: 'analytics',
        title: 'Social Media Performance',
        summary: `Tracking ${agg.platforms_count} platform${agg.platforms_count !== 1 ? 's' : ''}. Top platform: ${agg.top_platform}. Average engagement rate: ${agg.avg_engagement_rate.toFixed(2)}%.`,
        value: formatNumber(agg.total_followers),
        valueLabel: 'Total Followers',
        trend: agg.avg_growth_rate > 0 ? 'up' : agg.avg_growth_rate < 0 ? 'down' : 'neutral',
        trendValue: `${agg.avg_growth_rate >= 0 ? '+' : ''}${agg.avg_growth_rate.toFixed(1)}% growth`,
        date: agg.latest_snapshot_date || new Date().toISOString(),
        priority: agg.avg_engagement_rate >= 3 ? 'low' : agg.avg_engagement_rate >= 1 ? 'medium' : 'high',
        category: 'Social Performance',
        icon: 'TrendingUp',
      });

      // Sentiment card if available
      if (agg.avg_sentiment > 0) {
        const sentimentLabel = agg.avg_sentiment >= 80 ? 'Excellent' : agg.avg_sentiment >= 60 ? 'Good' : agg.avg_sentiment >= 40 ? 'Fair' : 'Needs Attention';
        insights.push({
          id: `social-sentiment-${entityId}`,
          type: 'analytics',
          title: 'Brand Sentiment',
          summary: `Average sentiment score across ${agg.platforms_count} platform${agg.platforms_count !== 1 ? 's' : ''}. ${agg.total_mentions > 0 ? `${formatNumber(agg.total_mentions)} total mentions tracked.` : ''}`,
          value: `${Math.round(agg.avg_sentiment)}%`,
          valueLabel: sentimentLabel,
          trend: agg.avg_sentiment >= 60 ? 'up' : agg.avg_sentiment >= 40 ? 'neutral' : 'down',
          date: agg.latest_snapshot_date || new Date().toISOString(),
          priority: agg.avg_sentiment >= 60 ? 'low' : agg.avg_sentiment >= 40 ? 'medium' : 'high',
          category: 'Social Performance',
          icon: 'Heart',
        });
      }

      setSocialInsights(insights);
    } catch (err) {
      console.error('[SocialMetricsInsights] Error fetching:', err);
      setSocialInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  useEffect(() => {
    fetchSocialInsights();
  }, [fetchSocialInsights]);

  return { socialInsights, isLoading, refetch: fetchSocialInsights };
}
