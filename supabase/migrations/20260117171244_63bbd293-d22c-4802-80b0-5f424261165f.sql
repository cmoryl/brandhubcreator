-- Add approval columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid;

-- Create index for faster queries on approval status
CREATE INDEX idx_profiles_is_approved ON public.profiles(is_approved);

-- Allow admins to update any profile (for approval)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));