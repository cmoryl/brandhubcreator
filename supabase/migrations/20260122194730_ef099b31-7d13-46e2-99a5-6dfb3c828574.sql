-- Fix brands RLS: Remove the ALL deny policy (which blocks SELECT too) and add specific write-only deny policies
DROP POLICY IF EXISTS "Deny anonymous write access to brands" ON public.brands;

-- Create specific deny policies for write operations only
CREATE POLICY "Deny anonymous insert to brands"
ON public.brands
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update to brands"
ON public.brands
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete to brands"
ON public.brands
FOR DELETE
TO anon
USING (false);

-- Fix products RLS: Same approach
DROP POLICY IF EXISTS "Deny anonymous write access to products" ON public.products;

CREATE POLICY "Deny anonymous insert to products"
ON public.products
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update to products"
ON public.products
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous delete to products"
ON public.products
FOR DELETE
TO anon
USING (false);