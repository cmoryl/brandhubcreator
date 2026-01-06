-- Create security definer functions for org membership checks
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Fix organization_members policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners and admins can manage members" ON public.organization_members;

CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members 
FOR SELECT 
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org owners and admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (public.is_org_admin(auth.uid(), organization_id));

-- Fix brands SELECT policies
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Users can view brands in their organizations" ON public.brands;

CREATE POLICY "Anyone can view brands" 
ON public.brands 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view brands in their organizations" 
ON public.brands 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  public.is_org_member(auth.uid(), organization_id)
);

-- Fix products SELECT policies
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can view products in their organizations" ON public.products;

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view products in their organizations" 
ON public.products 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  public.is_org_member(auth.uid(), organization_id)
);