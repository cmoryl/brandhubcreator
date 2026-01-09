-- Allow anonymous users to view organizations that have at least one public brand
-- This enables the public brand portal to load organization info

CREATE POLICY "Anonymous can view organizations with public brands"
ON public.organizations
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.organization_id = organizations.id
    AND brands.is_public = true
  )
);