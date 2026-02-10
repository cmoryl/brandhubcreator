-- Fix get_admin_user_stats to also allow super_admin role
CREATE OR REPLACE FUNCTION public.get_admin_user_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  new_users BIGINT,
  total_sessions BIGINT,
  avg_session_duration NUMERIC,
  total_page_views BIGINT,
  most_viewed_entity_type TEXT,
  most_viewed_entity_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
  -- Only admins or super_admins can call this function
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT COUNT(DISTINCT user_id) AS total_users FROM profiles
  ),
  active_stats AS (
    SELECT COUNT(DISTINCT user_id) AS active_users
    FROM page_views
    WHERE created_at >= v_cutoff_date AND user_id IS NOT NULL
  ),
  new_user_stats AS (
    SELECT COUNT(*) AS new_users
    FROM profiles
    WHERE created_at >= v_cutoff_date
  ),
  session_stats AS (
    SELECT 
      COUNT(*) AS total_sessions,
      COALESCE(AVG(duration_seconds), 0) AS avg_duration
    FROM user_sessions
    WHERE started_at >= v_cutoff_date
  ),
  view_stats AS (
    SELECT COUNT(*) AS total_views
    FROM page_views
    WHERE created_at >= v_cutoff_date
  ),
  popular_content AS (
    SELECT entity_type, entity_name, COUNT(*) as view_count
    FROM page_views
    WHERE created_at >= v_cutoff_date
      AND entity_type IS NOT NULL
      AND entity_name IS NOT NULL
    GROUP BY entity_type, entity_name
    ORDER BY view_count DESC
    LIMIT 1
  )
  SELECT 
    us.total_users,
    COALESCE(ast.active_users, 0),
    COALESCE(nus.new_users, 0),
    COALESCE(ss.total_sessions, 0),
    COALESCE(ss.avg_duration, 0),
    COALESCE(vs.total_views, 0),
    pc.entity_type,
    pc.entity_name
  FROM user_stats us
  CROSS JOIN active_stats ast
  CROSS JOIN new_user_stats nus
  CROSS JOIN session_stats ss
  CROSS JOIN view_stats vs
  LEFT JOIN popular_content pc ON true;
END;
$$;