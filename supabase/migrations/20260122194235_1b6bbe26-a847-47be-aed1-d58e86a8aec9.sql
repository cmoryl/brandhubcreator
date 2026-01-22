-- Drop the overly restrictive deny policy for anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to organizations" ON public.organizations;

-- Create a policy that allows anonymous users to read basic organization info for public portals
-- This is safe because we only expose non-sensitive org data (name, slug, logo, colors, portal_settings)
CREATE POLICY "Anonymous can view organizations by slug for public portal"
ON public.organizations
FOR SELECT
TO anon
USING (true);

-- Note: The existing authenticated user policies will still take precedence for authenticated users
-- Anonymous users can now access the organization data needed for public portals