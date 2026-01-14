-- Add policy to allow admins to view all organizations
CREATE POLICY "Admins can view all organizations"
ON public.organizations
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to view all organization members
CREATE POLICY "Admins can view all organization members"
ON public.organization_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to view all brands
CREATE POLICY "Admins can view all brands"
ON public.brands
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to view all products
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles via admin role"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));