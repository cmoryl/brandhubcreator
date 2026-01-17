-- Fix: Organizations table - the policy exposes email_from_name and email_from_address to anonymous users
-- We should restrict the anonymous policy to only allow reading via the public_organization_info view
-- which doesn't include email fields

-- Drop the overly permissive anonymous policy
DROP POLICY IF EXISTS "Anonymous can read orgs with public brands" ON public.organizations;

-- The public_organization_info view already excludes email fields and has security_invoker=on
-- For it to work, anon needs SELECT on organizations, but we want to limit what columns they can effectively see
-- Since RLS is row-level not column-level, we need a different approach

-- Option: Use the view properly - the view already filters columns AND has security_invoker=on
-- The issue is the view queries organizations table, so we need a minimal policy for that

-- Create a policy that only allows anonymous SELECT when accessing through the view context
-- Since we can't distinguish view vs direct access in RLS, we'll need the view to use a security definer function

-- Better approach: Make the view security_barrier and remove security_invoker
DROP VIEW IF EXISTS public.public_organization_info;

CREATE VIEW public.public_organization_info
WITH (security_barrier = true) AS
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

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;

-- Now organizations table itself doesn't need an anonymous policy
-- The view will work because it's not using security_invoker anymore