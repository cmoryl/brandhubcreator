-- Fix 1: Tighten profiles table RLS - users can only see their own profile
-- Drop existing policies first (with IF EXISTS for safety)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with proper restrictions
-- Users can only view their own profile (prevents email harvesting)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins and super admins can view all profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Fix 2: Update function to mask emails for non-admin members
CREATE OR REPLACE FUNCTION public.get_organization_members_safe(p_org_id uuid)
RETURNS TABLE(
  id uuid, 
  organization_id uuid, 
  user_id uuid, 
  role text, 
  invited_email text, 
  invite_expires_at timestamp with time zone, 
  invite_accepted_at timestamp with time zone, 
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    -- Mask email for non-admins: show full email only if admin or it's their own invite
    CASE 
      WHEN is_org_admin(auth.uid(), p_org_id) 
           OR has_role(auth.uid(), 'admin')
           OR is_super_admin(auth.uid())
           OR om.invited_email = get_auth_email()
      THEN om.invited_email
      ELSE CONCAT('***@', split_part(om.invited_email, '@', 2))
    END AS invited_email,
    om.invite_expires_at,
    om.invite_accepted_at,
    om.created_at
  FROM public.organization_members om
  WHERE om.organization_id = p_org_id
  AND (
    is_org_member(auth.uid(), p_org_id)
    OR om.invited_email = get_auth_email()
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );
$$;

-- Fix 3: Ensure lead_submissions SELECT is admin-only (drop any existing open policies)
DROP POLICY IF EXISTS "Anyone can view lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Public can view lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Admins can view lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.lead_submissions;

-- Recreate admin-only view policy
CREATE POLICY "Admins can view all submissions"
ON public.lead_submissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));