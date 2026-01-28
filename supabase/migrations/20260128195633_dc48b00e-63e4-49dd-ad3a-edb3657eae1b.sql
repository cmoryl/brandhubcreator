-- Function to get page view trends for external viewers only (non-organization members)
CREATE OR REPLACE FUNCTION public.get_external_viewer_trends(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  view_date DATE,
  view_count BIGINT,
  unique_users BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(pv.created_at) AS view_date,
    COUNT(*) AS view_count,
    COUNT(DISTINCT pv.user_id) AS unique_users
  FROM page_views pv
  WHERE pv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND has_role(auth.uid(), 'admin')
    AND (
      pv.user_id IS NULL  -- Anonymous viewers
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    )
  GROUP BY DATE(pv.created_at)
  ORDER BY view_date;
$$;

-- Function to get top viewed content by external viewers only
CREATE OR REPLACE FUNCTION public.get_external_top_content(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  view_count BIGINT,
  unique_viewers BIGINT,
  avg_duration NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pv.entity_type,
    pv.entity_id,
    pv.entity_name,
    COUNT(*) AS view_count,
    COUNT(DISTINCT pv.user_id) AS unique_viewers,
    COALESCE(AVG(pv.duration_seconds), 0) AS avg_duration
  FROM page_views pv
  WHERE pv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND pv.entity_id IS NOT NULL
    AND has_role(auth.uid(), 'admin')
    AND (
      pv.user_id IS NULL  -- Anonymous viewers
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    )
  GROUP BY pv.entity_type, pv.entity_id, pv.entity_name
  ORDER BY view_count DESC
  LIMIT p_limit;
$$;

-- Function to get external viewer stats summary
CREATE OR REPLACE FUNCTION public.get_external_viewer_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_views BIGINT,
  unique_viewers BIGINT,
  anonymous_views BIGINT,
  avg_duration NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) AS total_views,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_viewers,
    COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous_views,
    COALESCE(AVG(duration_seconds), 0) AS avg_duration
  FROM page_views pv
  WHERE pv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND has_role(auth.uid(), 'admin')
    AND (
      pv.user_id IS NULL  -- Anonymous viewers
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    );
$$;