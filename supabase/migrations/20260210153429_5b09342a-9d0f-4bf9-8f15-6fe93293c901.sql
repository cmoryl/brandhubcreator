-- Fix all admin-only functions to also allow super_admin role

-- get_user_activity_breakdown
CREATE OR REPLACE FUNCTION public.get_user_activity_breakdown(p_days integer DEFAULT 30)
RETURNS TABLE(user_id uuid, user_email text, page_views bigint, sessions bigint, total_time_seconds bigint, last_active timestamp with time zone, most_viewed_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')) THEN
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

-- get_page_view_trends
CREATE OR REPLACE FUNCTION public.get_page_view_trends(p_days integer DEFAULT 30)
RETURNS TABLE(view_date date, view_count bigint, unique_users bigint)
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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  GROUP BY DATE(created_at)
  ORDER BY view_date;
$$;

-- get_top_viewed_content
CREATE OR REPLACE FUNCTION public.get_top_viewed_content(p_days integer DEFAULT 30, p_limit integer DEFAULT 10)
RETURNS TABLE(entity_type text, entity_id uuid, entity_name text, view_count bigint, unique_viewers bigint, avg_duration numeric)
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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  GROUP BY entity_type, entity_id, entity_name
  ORDER BY view_count DESC
  LIMIT p_limit;
$$;

-- get_external_viewer_trends
CREATE OR REPLACE FUNCTION public.get_external_viewer_trends(p_days integer DEFAULT 30)
RETURNS TABLE(view_date date, view_count bigint, unique_users bigint)
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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    AND (
      pv.user_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    )
  GROUP BY DATE(pv.created_at)
  ORDER BY view_date;
$$;

-- get_external_viewer_stats
CREATE OR REPLACE FUNCTION public.get_external_viewer_stats(p_days integer DEFAULT 30)
RETURNS TABLE(total_views bigint, unique_viewers bigint, anonymous_views bigint, avg_duration numeric)
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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    AND (
      pv.user_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    );
$$;

-- get_external_top_content
CREATE OR REPLACE FUNCTION public.get_external_top_content(p_days integer DEFAULT 30, p_limit integer DEFAULT 10)
RETURNS TABLE(entity_type text, entity_id uuid, entity_name text, view_count bigint, unique_viewers bigint, avg_duration numeric)
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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    AND (
      pv.user_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = pv.user_id
      )
    )
  GROUP BY pv.entity_type, pv.entity_id, pv.entity_name
  ORDER BY view_count DESC
  LIMIT p_limit;
$$;

-- admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  IF has_role(target_user_id, 'admin') OR has_role(target_user_id, 'super_admin') THEN
    RAISE EXCEPTION 'Cannot delete another admin user';
  END IF;

  DELETE FROM public.organization_members WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN true;
END;
$$;