-- =====================================================
-- FIX: Organizations anonymous access - restrict columns
-- =====================================================

-- Drop the current policy that exposes too much
DROP POLICY IF EXISTS "Anon can read minimal org data for public portal" ON public.organizations;

-- The get_public_portal_org() SECURITY DEFINER function is now the ONLY way
-- for anonymous users to access organization data. No direct table access.
-- This means we don't need an anon policy at all - they must use the function.

-- However, the public portal code may still do direct queries
-- Let's update brand_intelligence to properly check entity ownership
DROP POLICY IF EXISTS "Users can view intelligence for their org brands" ON public.brand_intelligence;

CREATE POLICY "Users can view intelligence for their brands"
ON public.brand_intelligence
FOR SELECT
TO authenticated
USING (
  -- Admin access
  has_role(auth.uid(), 'admin')
  OR
  -- Org member access
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR
  -- Personal brand/product access - check entity ownership
  (organization_id IS NULL AND EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = brand_intelligence.entity_id 
    AND b.user_id = auth.uid()
    UNION
    SELECT 1 FROM public.products p 
    WHERE p.id = brand_intelligence.entity_id 
    AND p.user_id = auth.uid()
  ))
);