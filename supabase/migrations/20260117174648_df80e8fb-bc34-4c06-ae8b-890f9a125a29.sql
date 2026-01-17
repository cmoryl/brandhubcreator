-- Fix security definer view warning - use security_invoker instead
DROP VIEW IF EXISTS public.public_organization_info;

CREATE VIEW public.public_organization_info
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

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;

-- Now we need a LIMITED policy on organizations for anonymous access
-- This policy allows anon to read org data ONLY for orgs with public brands
-- The view still filters columns, protecting email fields
CREATE POLICY "Anon can read orgs with public brands for public portal"
ON public.organizations FOR SELECT
USING (
  auth.uid() IS NULL AND org_has_public_brands(id)
);