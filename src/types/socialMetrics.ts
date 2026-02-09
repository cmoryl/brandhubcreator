/**
 * Types for Social Metrics Tracking System
 */

export interface SocialMetricsSnapshot {
  id: string;
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string | null;
  platform: string;
  
  // Core Metrics
  followers_count: number;
  engagement_rate: number;
  posts_count: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  avg_shares_per_post: number;
  
  // Growth Metrics
  follower_growth_percent: number;
  reach_count: number;
  impressions_count: number;
  viral_coefficient: number;
  
  // Sentiment Metrics
  sentiment_score: number; // -100 to 100
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  brand_mentions_count: number;
  share_of_voice_percent: number;
  
  // Word of Mouth / Viewer Metrics
  referral_traffic_count: number;
  organic_reach_count: number;
  earned_media_value: number;
  
  // Metadata
  snapshot_date: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  data_source: 'manual' | 'api' | 'estimated';
  notes: string | null;
  
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface SocialMetricsInput {
  platform: string;
  
  // Core Metrics
  followers_count?: number;
  engagement_rate?: number;
  posts_count?: number;
  avg_likes_per_post?: number;
  avg_comments_per_post?: number;
  avg_shares_per_post?: number;
  
  // Growth Metrics
  follower_growth_percent?: number;
  reach_count?: number;
  impressions_count?: number;
  viral_coefficient?: number;
  
  // Sentiment Metrics
  sentiment_score?: number;
  positive_mentions?: number;
  negative_mentions?: number;
  neutral_mentions?: number;
  brand_mentions_count?: number;
  share_of_voice_percent?: number;
  
  // Word of Mouth
  referral_traffic_count?: number;
  organic_reach_count?: number;
  earned_media_value?: number;
  
  notes?: string;
  period_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface AggregatedSocialMetrics {
  total_followers: number;
  avg_engagement_rate: number;
  total_mentions: number;
  avg_sentiment: number;
  avg_growth_rate: number;
  top_platform: string;
  platforms_count: number;
  latest_snapshot_date: string | null;
}

export interface SocialMetricsTrend {
  snapshot_date: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  follower_growth_percent: number;
  sentiment_score: number;
  brand_mentions_count: number;
}

export type MetricCategory = 'core' | 'growth' | 'sentiment' | 'wordOfMouth';

export const METRIC_CATEGORIES: Record<MetricCategory, { label: string; metrics: string[] }> = {
  core: {
    label: 'Core Metrics',
    metrics: ['followers_count', 'engagement_rate', 'posts_count', 'avg_likes_per_post', 'avg_comments_per_post', 'avg_shares_per_post']
  },
  growth: {
    label: 'Growth Metrics', 
    metrics: ['follower_growth_percent', 'reach_count', 'impressions_count', 'viral_coefficient']
  },
  sentiment: {
    label: 'Sentiment Metrics',
    metrics: ['sentiment_score', 'positive_mentions', 'negative_mentions', 'neutral_mentions', 'brand_mentions_count', 'share_of_voice_percent']
  },
  wordOfMouth: {
    label: 'Word of Mouth',
    metrics: ['referral_traffic_count', 'organic_reach_count', 'earned_media_value']
  }
};

export const METRIC_LABELS: Record<string, string> = {
  followers_count: 'Followers',
  engagement_rate: 'Engagement Rate (%)',
  posts_count: 'Posts',
  avg_likes_per_post: 'Avg Likes/Post',
  avg_comments_per_post: 'Avg Comments/Post',
  avg_shares_per_post: 'Avg Shares/Post',
  follower_growth_percent: 'Follower Growth (%)',
  reach_count: 'Reach',
  impressions_count: 'Impressions',
  viral_coefficient: 'Viral Coefficient',
  sentiment_score: 'Sentiment Score',
  positive_mentions: 'Positive Mentions',
  negative_mentions: 'Negative Mentions',
  neutral_mentions: 'Neutral Mentions',
  brand_mentions_count: 'Brand Mentions',
  share_of_voice_percent: 'Share of Voice (%)',
  referral_traffic_count: 'Referral Traffic',
  organic_reach_count: 'Organic Reach',
  earned_media_value: 'Earned Media Value ($)'
};
