-- Remove overly permissive public SELECT policies on brands and products
-- The existing organization-based policies will handle access

DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;