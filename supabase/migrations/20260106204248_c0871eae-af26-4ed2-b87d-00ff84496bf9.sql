-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view brands in their organizations" ON public.brands;

-- Create a new public SELECT policy that allows anyone to view brands
-- This enables share links to work for all users
CREATE POLICY "Anyone can view brands" 
ON public.brands 
FOR SELECT 
USING (true);

-- Do the same for products table
DROP POLICY IF EXISTS "Users can view products in their organizations" ON public.products;

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);