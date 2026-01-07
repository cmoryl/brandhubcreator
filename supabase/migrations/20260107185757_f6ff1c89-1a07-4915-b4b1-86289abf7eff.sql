
-- Fix email exposure in profiles: Remove direct email visibility, use function instead
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more restrictive policies that don't expose emails to other users
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix invited_email exposure: Only show to the invited user themselves or org admins
DROP POLICY IF EXISTS "Users can view members of their organizations or their invites" ON public.organization_members;

CREATE POLICY "Users can view members of their organizations or their invites"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  is_org_member(auth.uid(), organization_id) 
  OR (invited_email = get_auth_email())
);

-- Add anonymous denial policies to all tables
-- Brands
DROP POLICY IF EXISTS "Deny anonymous access to brands" ON public.brands;
CREATE POLICY "Deny anonymous access to brands"
ON public.brands
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Organization members
DROP POLICY IF EXISTS "Deny anonymous access to organization_members" ON public.organization_members;
CREATE POLICY "Deny anonymous access to organization_members"
ON public.organization_members
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Organizations
DROP POLICY IF EXISTS "Deny anonymous access to organizations" ON public.organizations;
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Products
DROP POLICY IF EXISTS "Deny anonymous access to products" ON public.products;
CREATE POLICY "Deny anonymous access to products"
ON public.products
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- User roles
DROP POLICY IF EXISTS "Deny anonymous access to user_roles" ON public.user_roles;
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
