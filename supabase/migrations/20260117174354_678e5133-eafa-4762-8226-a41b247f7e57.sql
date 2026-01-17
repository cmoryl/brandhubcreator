-- Fix profiles table: Ensure anonymous users cannot access ANY data
-- The issue is that RESTRICTIVE policies need proper handling

-- Drop duplicate admin policy
DROP POLICY IF EXISTS "Admins can view all profiles via admin role" ON public.profiles;

-- Recreate the deny policy to be more explicit about blocking anon role
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Add explicit check that user must be authenticated for SELECT
CREATE POLICY "Require authentication for profiles select"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
));

-- Drop the individual select policies since we consolidated above
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Fix audit_logs table: Ensure only authenticated admins can view
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Create a new policy that explicitly requires authentication AND admin role
CREATE POLICY "Only authenticated admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Ensure insert policy also requires authentication
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert own audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);