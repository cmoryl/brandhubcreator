-- Fix security definer view warnings by switching to security_invoker = on
-- This ensures the view uses the CALLING user's permissions, not the definer's

DROP VIEW IF EXISTS public.public_organization_info;
DROP VIEW IF EXISTS public.organization_members_safe;

-- For public_organization_info - we need it to be publicly accessible
-- But security_invoker=on means RLS from base table applies
-- Solution: Use a SECURITY DEFINER function to bypass RLS safely for public data only

CREATE OR REPLACE FUNCTION public.get_public_organization_info(_org_id uuid DEFAULT NULL, _slug text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  accent_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo_url,
    o.favicon_url,
    o.primary_color,
    o.secondary_color,
    o.accent_color
  FROM public.organizations o
  WHERE 
    -- Must have public brands to be visible
    EXISTS (
      SELECT 1 FROM public.brands b 
      WHERE b.organization_id = o.id AND b.is_public = true
    )
    -- Filter by id or slug if provided
    AND (
      (_org_id IS NULL AND _slug IS NULL)
      OR (_org_id IS NOT NULL AND o.id = _org_id)
      OR (_slug IS NOT NULL AND o.slug = _slug)
    )
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_organization_info TO anon, authenticated;

-- Create a simple view that uses security_invoker for organization members (safe)
CREATE OR REPLACE VIEW public.organization_members_safe
WITH (security_invoker = on) AS
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
  -- invite_token intentionally excluded
FROM public.organization_members;

-- Recreate public_organization_info as a simple view with security_invoker
CREATE OR REPLACE VIEW public.public_organization_info
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color
FROM public.organizations
WHERE EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.organization_id = organizations.id 
  AND brands.is_public = true
);

-- Grant SELECT on views
GRANT SELECT ON public.organization_members_safe TO authenticated;
GRANT SELECT ON public.public_organization_info TO anon, authenticated;