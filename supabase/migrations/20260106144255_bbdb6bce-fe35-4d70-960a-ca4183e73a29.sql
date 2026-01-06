-- Fix: Recreate all RLS policies as PERMISSIVE instead of RESTRICTIVE
-- This changes from AND logic (all policies must pass) to OR logic (any matching policy passes)

-- =====================
-- PROFILES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================
-- USER_ROLES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- BRANDS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Users can create their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;

CREATE POLICY "Anyone can view brands"
  ON public.brands
  AS PERMISSIVE
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own brands"
  ON public.brands
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
  ON public.brands
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
  ON public.brands
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================
-- PRODUCTS TABLE
-- =====================
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Anyone can view products"
  ON public.products
  AS PERMISSIVE
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own products"
  ON public.products
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);