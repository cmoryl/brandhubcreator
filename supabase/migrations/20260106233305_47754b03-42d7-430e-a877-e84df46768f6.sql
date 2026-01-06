-- Create a security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop and recreate the problematic policies that reference auth.users

-- Fix organization_members SELECT policy
DROP POLICY IF EXISTS "Users can view members of their organizations or their invites" ON public.organization_members;
CREATE POLICY "Users can view members of their organizations or their invites"
ON public.organization_members
FOR SELECT
USING (
  is_org_member(auth.uid(), organization_id) 
  OR (invited_email = get_auth_email())
);

-- Fix organization_members UPDATE policy for accepting invites
DROP POLICY IF EXISTS "Users can accept their own invites" ON public.organization_members;
CREATE POLICY "Users can accept their own invites"
ON public.organization_members
FOR UPDATE
USING (
  (user_id IS NULL) 
  AND (invited_email = get_auth_email())
)
WITH CHECK (user_id = auth.uid());