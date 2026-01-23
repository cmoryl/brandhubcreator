-- Fix 1: Restrict organizations anonymous access to only public portal fields
-- Drop the overly permissive anonymous policy
DROP POLICY IF EXISTS "Anonymous can view organizations by slug for public portal" ON public.organizations;

-- Create a restrictive policy that only allows anonymous access when needed for public portal
-- The actual data should be accessed through the secure RPC function get_public_portal_org
CREATE POLICY "Anonymous access denied for organizations"
ON public.organizations
FOR SELECT
USING (false);

-- Note: Anonymous access for public portal is handled via get_public_portal_org RPC function
-- which only returns minimal safe fields (id, name, slug, logo_url, colors, portal_settings)

-- Fix 2: Restrict audit_logs access - users should not see email/IP of other users
-- Drop existing user policy that allows viewing own logs (which may contain other users' emails)
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Create stricter policy - users can only see logs where THEY are the actor
-- This prevents seeing other users' email addresses in shared resource interactions
CREATE POLICY "Users can view only their own actions"
ON public.audit_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Fix 3: For audit_logs, update the insert RPC to not store IP addresses for privacy
-- We'll modify the insert_audit_log function to exclude IP capture
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_brand_id uuid DEFAULT NULL::uuid, 
  p_entity_type text DEFAULT NULL::text, 
  p_action_type text DEFAULT NULL::text, 
  p_entity_name text DEFAULT NULL::text, 
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user email from profiles (only for admin visibility, not stored in logs for regular users)
  SELECT email INTO v_user_email FROM public.profiles WHERE user_id = v_user_id;
  
  -- Validate brand access if brand_id provided
  IF p_brand_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.brands b
      LEFT JOIN public.organization_members om ON om.organization_id = b.organization_id
      WHERE b.id = p_brand_id
      AND (
        om.user_id = v_user_id
        OR b.organization_id IS NULL
        OR public.has_role(v_user_id, 'admin')
      )
    ) THEN
      RAISE EXCEPTION 'Access denied to brand';
    END IF;
  END IF;
  
  -- Insert the audit log - intentionally NOT storing IP address for privacy
  -- user_email is stored but only visible to admins via RLS
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    brand_id,
    entity_type,
    action_type,
    entity_name,
    details
    -- ip_address intentionally omitted for privacy compliance
  ) VALUES (
    v_user_id,
    v_user_email,
    p_brand_id,
    p_entity_type,
    p_action_type,
    p_entity_name,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Fix 4: Ensure profiles table has strict access - verify current policies are sufficient
-- The current policies already restrict profiles to: own profile OR admin
-- Just verify the "Deny anonymous access" policy is working correctly
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);