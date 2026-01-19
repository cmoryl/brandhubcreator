-- Fix Security Definer View warning by recreating as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.organization_members_safe;

-- Recreate view without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE VIEW public.organization_members_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  organization_id,
  user_id,
  role,
  invited_email,
  invite_accepted_at,
  invite_expires_at,
  created_at,
  updated_at
FROM public.organization_members;

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.organization_members_safe TO authenticated;