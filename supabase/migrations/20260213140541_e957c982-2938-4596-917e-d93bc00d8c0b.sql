
-- Drop existing overly permissive SELECT policies on audit_logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can view audit logs base table" ON public.audit_logs;
DROP POLICY IF EXISTS "Only authenticated admins can view audit logs" ON public.audit_logs;

-- Restrict base table SELECT to admins (needed for view + direct super_admin access)
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Recreate safe view WITHOUT sensitive fields (ip_address, browser, session_id, target_user_email, target_user_id)
DROP VIEW IF EXISTS public.audit_logs_safe;
CREATE VIEW public.audit_logs_safe
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  user_email,
  brand_id,
  entity_type,
  action_type,
  entity_name,
  details,
  outcome,
  old_value,
  new_value,
  organization_id,
  created_at
FROM public.audit_logs;
