-- Fix: Allow authenticated users to also view public brands (not just org members)
-- Currently authenticated users can only see brands they own or are org members of
-- This prevents logged-in users from viewing public brands from other orgs

DROP POLICY IF EXISTS "Users can view their own or org brands" ON public.brands;

CREATE POLICY "Users can view their own, org, or public brands" 
ON public.brands 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR ((organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id))
  OR (is_public = true)
);