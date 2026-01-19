-- Fix security issues identified in security scan

-- 1. Enable RLS on public_organization_info view and allow public access
-- (Views inherit from base table, but we need to ensure proper access)

-- 2. Update organization_members_safe view to hide sensitive data
-- First check if it exists and recreate without sensitive fields
DROP VIEW IF EXISTS public.organization_members_safe;

CREATE OR REPLACE VIEW public.organization_members_safe AS
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
  -- NOTE: invite_token is intentionally excluded for security
FROM public.organization_members;

-- Enable RLS on the view (for postgres 15+)
ALTER VIEW public.organization_members_safe SET (security_invoker = on);

-- 3. Add explicit policy to deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Enable RLS on public_organization_info view 
-- and allow anonymous read for public portal
ALTER VIEW public.public_organization_info SET (security_invoker = on);

-- 5. Grant access to the views for authenticated and anon roles
GRANT SELECT ON public.organization_members_safe TO authenticated;
GRANT SELECT ON public.public_organization_info TO anon, authenticated;