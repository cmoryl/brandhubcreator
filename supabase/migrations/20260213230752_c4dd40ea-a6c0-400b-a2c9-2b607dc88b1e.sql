-- Create a function to update a specific section of guide_data using jsonb_set
CREATE OR REPLACE FUNCTION public.update_guide_section(
  p_table text,
  p_id uuid,
  p_section text,
  p_data text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_json jsonb;
BEGIN
  v_json := p_data::jsonb;
  
  IF p_table = 'brands' THEN
    UPDATE brands SET guide_data = jsonb_set(COALESCE(guide_data, '{}'::jsonb), ARRAY[p_section], v_json)
    WHERE id = p_id;
  ELSIF p_table = 'products' THEN
    UPDATE products SET guide_data = jsonb_set(COALESCE(guide_data, '{}'::jsonb), ARRAY[p_section], v_json)
    WHERE id = p_id;
  ELSIF p_table = 'events' THEN
    UPDATE events SET guide_data = jsonb_set(COALESCE(guide_data, '{}'::jsonb), ARRAY[p_section], v_json)
    WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;
END;
$$;