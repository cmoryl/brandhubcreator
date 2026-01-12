-- Apply same fix for products table
DROP POLICY IF EXISTS "Users can view their products or public products" ON public.products;

-- Create new policy: authenticated users only see their own or their org's products
CREATE POLICY "Users can view their own or org products"
ON public.products
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  ((organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id))
);