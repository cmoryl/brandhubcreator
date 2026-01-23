-- Fix: Allow authenticated users to also view public products (not just org members)
-- Currently authenticated users can only see products they own or are org members of

DROP POLICY IF EXISTS "Users can view their own or org products" ON public.products;

CREATE POLICY "Users can view their own, org, or public products" 
ON public.products 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR ((organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id))
  OR (is_public = true)
);