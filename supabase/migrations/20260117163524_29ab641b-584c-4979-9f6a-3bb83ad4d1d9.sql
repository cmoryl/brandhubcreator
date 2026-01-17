-- Drop the duplicate policies that were added; the existing ones are sufficient
DROP POLICY IF EXISTS "Users can view brands they own or in their organizations" ON public.brands;
DROP POLICY IF EXISTS "Users can view products they own or in their organizations" ON public.products;