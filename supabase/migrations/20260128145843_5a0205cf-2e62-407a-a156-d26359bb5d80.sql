-- Create page_views table for tracking detailed view statistics
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'brand', 'product', 'event', 'page'
  entity_id UUID,
  entity_name TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_sessions table for tracking session analytics
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for efficient querying
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_entity ON public.page_views(entity_type, entity_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only admins can view all analytics
CREATE POLICY "Admins can view all page views"
  ON public.page_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can manage their sessions"
  ON public.user_sessions FOR ALL
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Function to get user activity stats for admin dashboard
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
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
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

-- Function to get page view trends
CREATE OR REPLACE FUNCTION public.get_page_view_trends(
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
    DATE(created_at) AS view_date,
    COUNT(*) AS view_count,
    COUNT(DISTINCT user_id) AS unique_users
  FROM page_views
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND has_role(auth.uid(), 'admin')
  GROUP BY DATE(created_at)
  ORDER BY view_date;
$$;

-- Function to get top viewed content
CREATE OR REPLACE FUNCTION public.get_top_viewed_content(
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
    entity_type,
    entity_id,
    entity_name,
    COUNT(*) AS view_count,
    COUNT(DISTINCT user_id) AS unique_viewers,
    COALESCE(AVG(duration_seconds), 0) AS avg_duration
  FROM page_views
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND entity_id IS NOT NULL
    AND has_role(auth.uid(), 'admin')
  GROUP BY entity_type, entity_id, entity_name
  ORDER BY view_count DESC
  LIMIT p_limit;
$$;

-- Function to get user activity breakdown
CREATE OR REPLACE FUNCTION public.get_user_activity_breakdown(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  page_views BIGINT,
  sessions BIGINT,
  total_time_seconds BIGINT,
  last_active TIMESTAMPTZ,
  most_viewed_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email AS user_email,
    COALESCE(pv.view_count, 0) AS page_views,
    COALESCE(s.session_count, 0) AS sessions,
    COALESCE(s.total_time, 0) AS total_time_seconds,
    GREATEST(pv.last_view, s.last_session) AS last_active,
    pv.most_viewed_type
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) AS view_count,
      MAX(created_at) AS last_view,
      (SELECT entity_type FROM page_views pv2 
       WHERE pv2.user_id = p.user_id 
       GROUP BY entity_type 
       ORDER BY COUNT(*) DESC 
       LIMIT 1) AS most_viewed_type
    FROM page_views
    WHERE page_views.user_id = p.user_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  ) pv ON true
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) AS session_count,
      SUM(duration_seconds) AS total_time,
      MAX(started_at) AS last_session
    FROM user_sessions
    WHERE user_sessions.user_id = p.user_id
      AND started_at >= NOW() - (p_days || ' days')::INTERVAL
  ) s ON true
  ORDER BY page_views DESC;
END;
$$;