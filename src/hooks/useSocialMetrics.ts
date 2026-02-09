/**
 * Hook for managing social metrics data
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SocialMetricsSnapshot, 
  SocialMetricsInput, 
  AggregatedSocialMetrics,
  SocialMetricsTrend
} from '@/types/socialMetrics';
import { toast } from 'sonner';

interface UseSocialMetricsProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId?: string | null;
}

export const useSocialMetrics = ({ entityId, entityType, organizationId }: UseSocialMetricsProps) => {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<SocialMetricsSnapshot[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedSocialMetrics | null>(null);
  const [trends, setTrends] = useState<SocialMetricsTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch latest snapshots per platform
  const fetchSnapshots = useCallback(async () => {
    if (!entityId) return;
    
    try {
      const { data, error } = await supabase
        .from('social_metrics_snapshots')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('snapshot_date', { ascending: false });
      
      if (error) throw error;
      
      // Get latest snapshot per platform
      const latestByPlatform = new Map<string, SocialMetricsSnapshot>();
      (data || []).forEach((snapshot: SocialMetricsSnapshot) => {
        if (!latestByPlatform.has(snapshot.platform)) {
          latestByPlatform.set(snapshot.platform, snapshot);
        }
      });
      
      setSnapshots(Array.from(latestByPlatform.values()));
    } catch (error) {
      console.error('[SocialMetrics] Failed to fetch snapshots:', error);
    }
  }, [entityId, entityType]);

  // Fetch aggregated metrics
  const fetchAggregated = useCallback(async () => {
    if (!entityId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_aggregated_social_metrics', {
          p_entity_id: entityId,
          p_entity_type: entityType
        });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAggregated(data[0] as AggregatedSocialMetrics);
      }
    } catch (error) {
      console.error('[SocialMetrics] Failed to fetch aggregated metrics:', error);
    }
  }, [entityId, entityType]);

  // Fetch trends
  const fetchTrends = useCallback(async (platform?: string, months = 6) => {
    if (!entityId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_social_metrics_trends', {
          p_entity_id: entityId,
          p_entity_type: entityType,
          p_platform: platform || null,
          p_months: months
        });
      
      if (error) throw error;
      setTrends((data || []) as SocialMetricsTrend[]);
    } catch (error) {
      console.error('[SocialMetrics] Failed to fetch trends:', error);
    }
  }, [entityId, entityType]);

  // Save new snapshot
  const saveSnapshot = useCallback(async (input: SocialMetricsInput): Promise<boolean> => {
    if (!user?.id || !entityId) {
      toast.error('Authentication required');
      return false;
    }
    
    setIsSaving(true);
    
    try {
      const snapshotData = {
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId,
        platform: input.platform,
        followers_count: input.followers_count || 0,
        engagement_rate: input.engagement_rate || 0,
        posts_count: input.posts_count || 0,
        avg_likes_per_post: input.avg_likes_per_post || 0,
        avg_comments_per_post: input.avg_comments_per_post || 0,
        avg_shares_per_post: input.avg_shares_per_post || 0,
        follower_growth_percent: input.follower_growth_percent || 0,
        reach_count: input.reach_count || 0,
        impressions_count: input.impressions_count || 0,
        viral_coefficient: input.viral_coefficient || 0,
        sentiment_score: input.sentiment_score || 0,
        positive_mentions: input.positive_mentions || 0,
        negative_mentions: input.negative_mentions || 0,
        neutral_mentions: input.neutral_mentions || 0,
        brand_mentions_count: input.brand_mentions_count || 0,
        share_of_voice_percent: input.share_of_voice_percent || 0,
        referral_traffic_count: input.referral_traffic_count || 0,
        organic_reach_count: input.organic_reach_count || 0,
        earned_media_value: input.earned_media_value || 0,
        notes: input.notes || null,
        period_type: input.period_type || 'monthly',
        data_source: 'manual',
        created_by: user.id
      };

      const { error } = await supabase
        .from('social_metrics_snapshots')
        .upsert(snapshotData, {
          onConflict: 'entity_id,entity_type,platform,snapshot_date'
        });
      
      if (error) throw error;
      
      toast.success(`${input.platform} metrics saved`);
      
      // Refresh data
      await Promise.all([fetchSnapshots(), fetchAggregated()]);
      return true;
    } catch (error) {
      console.error('[SocialMetrics] Failed to save snapshot:', error);
      toast.error('Failed to save metrics');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, entityId, entityType, organizationId, fetchSnapshots, fetchAggregated]);

  // Delete snapshot
  const deleteSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('social_metrics_snapshots')
        .delete()
        .eq('id', snapshotId);
      
      if (error) throw error;
      
      toast.success('Metrics deleted');
      await Promise.all([fetchSnapshots(), fetchAggregated()]);
      return true;
    } catch (error) {
      console.error('[SocialMetrics] Failed to delete snapshot:', error);
      toast.error('Failed to delete metrics');
      return false;
    }
  }, [fetchSnapshots, fetchAggregated]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchSnapshots(), fetchAggregated(), fetchTrends()]);
      setIsLoading(false);
    };
    
    if (entityId) {
      load();
    }
  }, [entityId, fetchSnapshots, fetchAggregated, fetchTrends]);

  return {
    snapshots,
    aggregated,
    trends,
    isLoading,
    isSaving,
    saveSnapshot,
    deleteSnapshot,
    fetchTrends,
    refetch: () => Promise.all([fetchSnapshots(), fetchAggregated()])
  };
};
