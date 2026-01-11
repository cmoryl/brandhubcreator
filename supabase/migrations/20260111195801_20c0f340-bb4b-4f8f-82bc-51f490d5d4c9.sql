-- Drop the existing policy that shows public brands to all authenticated users
DROP POLICY IF EXISTS "Users can view their brands or public brands" ON public.brands;

-- Create new policy: authenticated users only see their own or their org's brands
CREATE POLICY "Users can view their own or org brands"
ON public.brands
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  ((organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id))
);

-- Keep the anonymous policy for public brands (external sharing still works)
-- This policy already exists: "Anonymous can view public brands"