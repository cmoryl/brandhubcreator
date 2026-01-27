-- Create a safe view for audit_logs that excludes sensitive PII (email, IP address)
-- This view is for regular users to see their own activity without exposing sensitive data

CREATE VIEW public.audit_logs_safe
WITH (security_invoker=on) AS
  SELECT 
    id,
    brand_id,
    user_id,
    entity_type,
    action_type,
    entity_name,
    details,
    created_at
    -- Excludes: user_email, ip_address (sensitive PII)
  FROM public.audit_logs;

-- Drop the existing permissive policies that allow users to see sensitive data
DROP POLICY IF EXISTS "Users can view only their own actions" ON public.audit_logs;

-- Create a restrictive policy: only admins can SELECT from the base table
-- Regular users will use the safe view
CREATE POLICY "Only admins can view audit logs base table" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment explaining the security model
COMMENT ON VIEW public.audit_logs_safe IS 'Safe view of audit_logs that excludes sensitive PII (user_email, ip_address). Use this view for non-admin access.';