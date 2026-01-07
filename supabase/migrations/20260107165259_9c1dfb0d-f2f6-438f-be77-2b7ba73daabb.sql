-- Create a function to check if an organization slug is taken
-- This is a SECURITY DEFINER function so it can check across all orgs
CREATE OR REPLACE FUNCTION public.is_slug_taken(check_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE slug = check_slug
  )
$$;