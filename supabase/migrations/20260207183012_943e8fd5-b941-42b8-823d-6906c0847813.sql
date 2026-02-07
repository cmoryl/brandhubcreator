-- Fix the audit_logs_safe view to use security_invoker to respect RLS
DROP VIEW IF EXISTS public.audit_logs_safe;

CREATE VIEW public.audit_logs_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  brand_id,
  entity_type,
  action_type,
  entity_name,
  details,
  outcome,
  device_type,
  organization_id,
  created_at
FROM public.audit_logs;