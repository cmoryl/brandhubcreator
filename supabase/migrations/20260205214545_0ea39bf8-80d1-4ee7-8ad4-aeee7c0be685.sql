-- Create RPC function to get card-relevant data for linked guides
-- This extracts only hero and colors from guide_data to avoid timeout on large JSONB fields

CREATE OR REPLACE FUNCTION public.get_guide_card_data(
  p_table_name TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  hero_data JSONB,
  colors_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table_name = 'products' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.guide_data->'hero' AS hero_data,
      p.guide_data->'colors' AS colors_data
    FROM products p
    WHERE (p_exclude_id IS NULL OR p.id != p_exclude_id);
  ELSIF p_table_name = 'brands' THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.name,
      b.slug,
      b.guide_data->'hero' AS hero_data,
      b.guide_data->'colors' AS colors_data
    FROM brands b
    WHERE (p_exclude_id IS NULL OR b.id != p_exclude_id);
  ELSIF p_table_name = 'events' THEN
    RETURN QUERY
    SELECT 
      e.id,
      e.name,
      e.slug,
      e.guide_data->'hero' AS hero_data,
      e.guide_data->'colors' AS colors_data
    FROM events e
    WHERE (p_exclude_id IS NULL OR e.id != p_exclude_id);
  END IF;
END;
$$;

-- Create a function specifically for linked products by parent
CREATE OR REPLACE FUNCTION public.get_linked_products_card_data(
  p_parent_brand_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  hero_data JSONB,
  colors_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.guide_data->'hero' AS hero_data,
    p.guide_data->'colors' AS colors_data
  FROM products p
  WHERE p.parent_brand_id = p_parent_brand_id;
END;
$$;