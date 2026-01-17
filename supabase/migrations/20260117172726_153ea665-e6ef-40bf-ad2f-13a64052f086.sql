-- Create a secure view for anonymous access that only exposes branding-relevant fields
CREATE VIEW public.public_organization_info AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color
FROM public.organizations
WHERE EXISTS (
  SELECT 1 FROM public.brands
  WHERE brands.organization_id = organizations.id
  AND brands.is_public = true
);

-- Grant SELECT to authenticated and anon roles for the view
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;

-- Drop the old anonymous policy that exposed all columns
DROP POLICY IF EXISTS "Anonymous can view organizations with public brands" ON public.organizations;