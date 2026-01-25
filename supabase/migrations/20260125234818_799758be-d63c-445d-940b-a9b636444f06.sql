-- Drop the existing overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can only view own profile or admins all" ON public.profiles;

-- Create a more restrictive policy: users can ONLY view their own profile
-- Admins still need access, but through a separate policy
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Separate policy for admins to view all profiles (for admin functionality)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);