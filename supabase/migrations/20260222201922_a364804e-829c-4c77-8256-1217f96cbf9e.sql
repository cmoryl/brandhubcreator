-- Fix page_views RLS policy to allow super_admin (not just admin)
DROP POLICY IF EXISTS "Admins can view all page views" ON public.page_views;
CREATE POLICY "Admins can view all page views" 
ON public.page_views 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also fix user_sessions admin-only SELECT policy for consistency
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also add a policy allowing users to read their own page views
CREATE POLICY "Users can view their own page views"
ON public.page_views
FOR SELECT
USING (auth.uid() = user_id);