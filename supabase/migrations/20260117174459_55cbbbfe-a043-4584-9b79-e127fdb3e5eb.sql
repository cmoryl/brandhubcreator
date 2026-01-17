-- Fix 1: Profiles table - restrict SELECT to only own profile OR admin
DROP POLICY IF EXISTS "Require authentication for profiles select" ON public.profiles;

CREATE POLICY "Users can only view own profile or admins all"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix 2: public_organization_info is a VIEW, not a table
-- Views with security_invoker=on inherit RLS from base tables
-- The view already has security_invoker=on, so it respects organizations RLS
-- But we need to ensure proper RLS on organizations table for public access

-- Add an RLS policy to organizations that allows reading ONLY the public-facing fields
-- via the public_organization_info view (which is already restricted to orgs with public brands)
-- Since the view uses security_invoker=on, anonymous users need a path to read org data

-- For truly public organization info (for public brand pages), we need controlled access
-- The view already filters to only orgs with public brands, but anon needs SELECT on organizations

-- Create a function to check if an org has public brands
CREATE OR REPLACE FUNCTION public.org_has_public_brands(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brands
    WHERE organization_id = _org_id
    AND is_public = true
  )
$$;

-- Add policy for anonymous to read orgs that have public brands (for public brand pages)
CREATE POLICY "Anonymous can read orgs with public brands"
ON public.organizations FOR SELECT
USING (
  org_has_public_brands(id)
);

-- Fix 3: Audit logs INSERT - validate brand ownership
DROP POLICY IF EXISTS "Authenticated users can insert own audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert audit logs for their brands"
ON public.audit_logs FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = audit_logs.brand_id
    AND (
      brands.user_id = auth.uid()
      OR (brands.organization_id IS NOT NULL AND is_org_member(auth.uid(), brands.organization_id))
    )
  )
);