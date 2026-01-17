-- Drop the old view and recreate with security_invoker=on for proper RLS enforcement
DROP VIEW IF EXISTS public.public_organization_info;

CREATE VIEW public.public_organization_info
WITH (security_invoker = on) AS
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