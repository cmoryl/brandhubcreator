-- Drop the restrictive anonymous policy
DROP POLICY IF EXISTS "Anonymous access denied for organizations" ON public.organizations;

-- Allow anonymous users to view organizations that have public brands
-- This enables the public portal to work for unauthenticated visitors
CREATE POLICY "Anonymous can view orgs with public brands"
ON public.organizations
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.organization_id = organizations.id
    AND brands.is_public = true
  )
  OR EXISTS (
    SELECT 1 FROM public.products
    WHERE products.organization_id = organizations.id
    AND products.is_public = true
  )
  OR EXISTS (
    SELECT 1 FROM public.events
    WHERE events.organization_id = organizations.id
    AND events.is_public = true
  )
);