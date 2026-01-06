-- Add is_public column to brands and products
ALTER TABLE public.brands ADD COLUMN is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Create new policies: only org members OR public brands can be viewed
CREATE POLICY "Users can view their brands or public brands"
ON public.brands
FOR SELECT
USING (
  is_public = true 
  OR user_id = auth.uid() 
  OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
);

CREATE POLICY "Users can view their products or public products"
ON public.products
FOR SELECT
USING (
  is_public = true 
  OR user_id = auth.uid() 
  OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
);