-- =============================================
-- FIX: Protect invite_token from direct queries
-- =============================================

-- Step 1: Create a safe view that excludes invite_token
CREATE OR REPLACE VIEW public.organization_members_safe AS
SELECT 
  id,
  organization_id,
  user_id,
  role,
  invited_email,
  invite_accepted_at,
  invite_expires_at,
  created_at,
  updated_at
FROM public.organization_members;

-- Step 2: Create SECURITY DEFINER function for token validation
-- This allows validating and accepting invites without exposing tokens
CREATE OR REPLACE FUNCTION public.validate_and_accept_invite(
  p_invite_token text,
  p_user_id uuid
)
RETURNS TABLE(
  member_id uuid,
  org_id uuid,
  member_role text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate token and return member info if valid
  RETURN QUERY
  UPDATE public.organization_members
  SET 
    user_id = p_user_id,
    invite_accepted_at = NOW(),
    invite_token = NULL
  WHERE 
    invite_token = p_invite_token
    AND user_id IS NULL
    AND invite_expires_at > NOW()
  RETURNING id, organization_id, role;
END;
$$;

-- Step 3: Create function to check if a token is valid (without exposing it)
CREATE OR REPLACE FUNCTION public.is_valid_invite_token(p_token text)
RETURNS TABLE(
  is_valid boolean,
  org_name text,
  invited_role text,
  invited_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true AS is_valid,
    o.name AS org_name,
    om.role AS invited_role,
    om.invited_email
  FROM public.organization_members om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.invite_token = p_token
    AND om.user_id IS NULL
    AND om.invite_expires_at > NOW()
  LIMIT 1;
$$;

-- Step 4: Grant execute on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_and_accept_invite(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_invite_token(text) TO authenticated;

-- Step 5: Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.organization_members_safe TO authenticated;