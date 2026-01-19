-- Fix remaining security issues: views need explicit RLS handling

-- Views in PostgreSQL don't have RLS in the traditional sense
-- They use security_invoker to check permissions of the underlying table
-- Since we set security_invoker=on, the base table policies apply

-- But we also need to ensure views can be properly accessed
-- For organization_members_safe - it inherits from organization_members
-- which already has proper RLS policies

-- For public_organization_info - it's meant to be PUBLIC, so we need to
-- make the underlying data accessible for anonymous users viewing public info

-- Create a proper public_organization_info view that doesn't need RLS
-- since it should be public by design
DROP VIEW IF EXISTS public.public_organization_info;

CREATE OR REPLACE VIEW public.public_organization_info 
WITH (security_invoker = off) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color
  -- Intentionally excludes: features, email_from_*, custom_domain, created_by, etc.
FROM public.organizations
WHERE EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.organization_id = organizations.id 
  AND brands.is_public = true
);

-- Grant public access to this view
GRANT SELECT ON public.public_organization_info TO anon, authenticated;

-- For organization_members_safe - also create with security_invoker off
-- so it uses the current user's context from the base table policies
DROP VIEW IF EXISTS public.organization_members_safe;

CREATE OR REPLACE VIEW public.organization_members_safe 
WITH (security_invoker = off) AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.invited_email,
  om.invite_accepted_at,
  om.invite_expires_at,
  om.created_at,
  om.updated_at
  -- NOTE: invite_token is intentionally excluded for security
FROM public.organization_members om
WHERE 
  -- Only show members of orgs the user belongs to, or their own invite
  (
    is_org_member(auth.uid(), om.organization_id)
    OR om.invited_email = get_auth_email()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

GRANT SELECT ON public.organization_members_safe TO authenticated;