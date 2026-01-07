-- Deny anonymous access to profiles table
-- This explicitly blocks the 'anon' role from accessing profile data
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);