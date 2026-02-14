
-- 1. Fix profiles: Drop the overly permissive "Deny anonymous" ALL policy
-- that grants any authenticated user access to ALL rows for ALL operations
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- 2. Fix audit_logs_safe view: Recreate with security_invoker=on
-- so RLS on the base audit_logs table is enforced
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
