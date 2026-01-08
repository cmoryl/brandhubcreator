-- Drop the restrictive anonymous deny policy for SELECT
DROP POLICY IF EXISTS "Deny anonymous access to brands" ON public.brands;

-- Create new restrictive policy that only denies anonymous for non-SELECT operations
CREATE POLICY "Deny anonymous write access to brands"
ON public.brands
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create a permissive policy allowing anonymous to view public brands
CREATE POLICY "Anonymous can view public brands"
ON public.brands
FOR SELECT
TO anon
USING (is_public = true);

-- Do the same for products
DROP POLICY IF EXISTS "Deny anonymous access to products" ON public.products;

CREATE POLICY "Deny anonymous write access to products"
ON public.products
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Anonymous can view public products"
ON public.products
FOR SELECT
TO anon
USING (is_public = true);