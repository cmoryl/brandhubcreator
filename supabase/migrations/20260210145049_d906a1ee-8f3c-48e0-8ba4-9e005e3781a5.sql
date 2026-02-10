-- Function to get org slug/name by ID, accessible to anon users
-- Only returns data if the org has at least one public entity
CREATE OR REPLACE FUNCTION public.get_org_slug_by_id(p_org_id UUID)
RETURNS TABLE(slug TEXT, name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.slug, o.name
  FROM organizations o
  WHERE o.id = p_org_id
    AND (
      EXISTS (SELECT 1 FROM brands b WHERE b.organization_id = o.id AND b.is_public = true)
      OR EXISTS (SELECT 1 FROM products p WHERE p.organization_id = o.id AND p.is_public = true)
      OR EXISTS (SELECT 1 FROM events e WHERE e.organization_id = o.id AND e.is_public = true)
    )
  LIMIT 1;
$$;