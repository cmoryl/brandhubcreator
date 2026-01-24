-- =====================================================
-- SECURITY HARDENING: Create secure public data functions
-- These functions return only public-safe fields, hiding user_ids and org_ids
-- =====================================================

-- Function to get public brand data (safe for anonymous access)
CREATE OR REPLACE FUNCTION public.get_public_brand_data(p_slug text DEFAULT NULL, p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  is_public boolean,
  guide_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.is_public,
    -- Sanitize guide_data: remove any internal metadata
    b.guide_data - 'internalNotes' - 'draftStatus' AS guide_data,
    b.created_at,
    b.updated_at
  FROM public.brands b
  WHERE b.is_public = true
  AND (p_slug IS NULL OR b.slug = p_slug)
  AND (p_org_id IS NULL OR b.organization_id = p_org_id);
$$;

-- Function to get public product data (safe for anonymous access)
CREATE OR REPLACE FUNCTION public.get_public_product_data(p_slug text DEFAULT NULL, p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  is_public boolean,
  guide_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.is_public,
    p.guide_data - 'internalNotes' - 'draftStatus' AS guide_data,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.is_public = true
  AND (p_slug IS NULL OR p.slug = p_slug)
  AND (p_org_id IS NULL OR p.organization_id = p_org_id);
$$;

-- Function to get public event data (safe for anonymous access)
CREATE OR REPLACE FUNCTION public.get_public_event_data(p_slug text DEFAULT NULL, p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  is_public boolean,
  guide_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.name,
    e.slug,
    e.is_public,
    e.guide_data - 'internalNotes' - 'draftStatus' AS guide_data,
    e.created_at,
    e.updated_at
  FROM public.events e
  WHERE e.is_public = true
  AND (p_slug IS NULL OR e.slug = p_slug)
  AND (p_org_id IS NULL OR e.organization_id = p_org_id);
$$;

-- Function to get organization public portal data (minimal safe fields)
CREATE OR REPLACE FUNCTION public.get_portal_org_safe(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  portal_settings jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo_url,
    o.primary_color,
    o.secondary_color,
    o.accent_color,
    -- Only expose safe portal settings, not features or email config
    jsonb_build_object('heroFullWidth', COALESCE((o.portal_settings->>'heroFullWidth')::boolean, false))
  FROM public.organizations o
  WHERE o.slug = p_slug
  AND EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.organization_id = o.id AND b.is_public = true
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_brand_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_product_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_event_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_org_safe TO anon, authenticated;