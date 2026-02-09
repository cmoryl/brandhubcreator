-- Create social metrics snapshots table for historical tracking
CREATE TABLE public.social_metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Core Metrics
  followers_count BIGINT DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_likes_per_post INTEGER DEFAULT 0,
  avg_comments_per_post INTEGER DEFAULT 0,
  avg_shares_per_post INTEGER DEFAULT 0,
  
  -- Growth Metrics
  follower_growth_percent NUMERIC(6,2) DEFAULT 0,
  reach_count BIGINT DEFAULT 0,
  impressions_count BIGINT DEFAULT 0,
  viral_coefficient NUMERIC(5,3) DEFAULT 0,
  
  -- Sentiment Metrics
  sentiment_score NUMERIC(5,2) DEFAULT 0, -- -100 to 100
  positive_mentions INTEGER DEFAULT 0,
  negative_mentions INTEGER DEFAULT 0,
  neutral_mentions INTEGER DEFAULT 0,
  brand_mentions_count INTEGER DEFAULT 0,
  share_of_voice_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Word of Mouth / Viewer Metrics
  referral_traffic_count INTEGER DEFAULT 0,
  organic_reach_count BIGINT DEFAULT 0,
  earned_media_value NUMERIC(12,2) DEFAULT 0,
  
  -- Metadata
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  data_source TEXT DEFAULT 'manual', -- 'manual', 'api', 'estimated'
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one snapshot per platform per date per entity
  UNIQUE(entity_id, entity_type, platform, snapshot_date)
);

-- Create index for efficient querying
CREATE INDEX idx_social_metrics_entity ON public.social_metrics_snapshots(entity_id, entity_type);
CREATE INDEX idx_social_metrics_date ON public.social_metrics_snapshots(snapshot_date DESC);
CREATE INDEX idx_social_metrics_platform ON public.social_metrics_snapshots(platform);
CREATE INDEX idx_social_metrics_org ON public.social_metrics_snapshots(organization_id);

-- Enable RLS
ALTER TABLE public.social_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view metrics for entities they have access to"
ON public.social_metrics_snapshots
FOR SELECT
USING (
  -- Check brand access
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM brands b
    LEFT JOIN organization_members om ON om.organization_id = b.organization_id
    WHERE b.id = entity_id
    AND (om.user_id = auth.uid() OR b.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
  OR
  -- Check product access
  (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM products p
    LEFT JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = entity_id
    AND (om.user_id = auth.uid() OR p.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
  OR
  -- Check event access
  (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM events e
    LEFT JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = entity_id
    AND (om.user_id = auth.uid() OR e.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
);

CREATE POLICY "Users can insert metrics for entities they have access to"
ON public.social_metrics_snapshots
FOR INSERT
WITH CHECK (
  -- Same access check as SELECT
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM brands b
    LEFT JOIN organization_members om ON om.organization_id = b.organization_id
    WHERE b.id = entity_id
    AND (om.user_id = auth.uid() OR b.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
  OR
  (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM products p
    LEFT JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = entity_id
    AND (om.user_id = auth.uid() OR p.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
  OR
  (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM events e
    LEFT JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = entity_id
    AND (om.user_id = auth.uid() OR e.organization_id IS NULL OR has_role(auth.uid(), 'admin'))
  ))
);

CREATE POLICY "Users can update their own metrics"
ON public.social_metrics_snapshots
FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own metrics"
ON public.social_metrics_snapshots
FOR DELETE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_social_metrics_updated_at
  BEFORE UPDATE ON public.social_metrics_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get social metrics trends
CREATE OR REPLACE FUNCTION public.get_social_metrics_trends(
  p_entity_id UUID,
  p_entity_type TEXT,
  p_platform TEXT DEFAULT NULL,
  p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
  snapshot_date DATE,
  platform TEXT,
  followers_count BIGINT,
  engagement_rate NUMERIC,
  follower_growth_percent NUMERIC,
  sentiment_score NUMERIC,
  brand_mentions_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.snapshot_date,
    s.platform,
    s.followers_count,
    s.engagement_rate,
    s.follower_growth_percent,
    s.sentiment_score,
    s.brand_mentions_count
  FROM social_metrics_snapshots s
  WHERE s.entity_id = p_entity_id
    AND s.entity_type = p_entity_type
    AND (p_platform IS NULL OR s.platform = p_platform)
    AND s.snapshot_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  ORDER BY s.snapshot_date DESC, s.platform;
$$;

-- Function to get aggregated social metrics for Brand Intelligence
CREATE OR REPLACE FUNCTION public.get_aggregated_social_metrics(
  p_entity_id UUID,
  p_entity_type TEXT
)
RETURNS TABLE (
  total_followers BIGINT,
  avg_engagement_rate NUMERIC,
  total_mentions INTEGER,
  avg_sentiment NUMERIC,
  avg_growth_rate NUMERIC,
  top_platform TEXT,
  platforms_count INTEGER,
  latest_snapshot_date DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH latest_per_platform AS (
    SELECT DISTINCT ON (platform) *
    FROM social_metrics_snapshots
    WHERE entity_id = p_entity_id AND entity_type = p_entity_type
    ORDER BY platform, snapshot_date DESC
  ),
  aggregated AS (
    SELECT
      COALESCE(SUM(followers_count), 0) AS total_followers,
      COALESCE(AVG(engagement_rate), 0) AS avg_engagement_rate,
      COALESCE(SUM(brand_mentions_count), 0) AS total_mentions,
      COALESCE(AVG(sentiment_score), 0) AS avg_sentiment,
      COALESCE(AVG(follower_growth_percent), 0) AS avg_growth_rate,
      COUNT(*) AS platforms_count,
      MAX(snapshot_date) AS latest_snapshot_date
    FROM latest_per_platform
  ),
  top_platform AS (
    SELECT platform
    FROM latest_per_platform
    ORDER BY followers_count DESC
    LIMIT 1
  )
  SELECT 
    a.total_followers,
    a.avg_engagement_rate,
    a.total_mentions::INTEGER,
    a.avg_sentiment,
    a.avg_growth_rate,
    COALESCE(tp.platform, 'None') AS top_platform,
    a.platforms_count::INTEGER,
    a.latest_snapshot_date
  FROM aggregated a
  LEFT JOIN top_platform tp ON true;
$$;