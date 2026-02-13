-- Create a function to extract lightweight text-only context from guide_data
-- This runs server-side so it never loads the full JSONB into edge function memory
CREATE OR REPLACE FUNCTION public.get_entity_text_context(
  p_table text,
  p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_guide jsonb;
  v_name text;
BEGIN
  -- Fetch entity name and extract text fields from guide_data server-side
  IF p_table = 'brands' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM brands WHERE id = p_id;
  ELSIF p_table = 'products' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM products WHERE id = p_id;
  ELSIF p_table = 'events' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM events WHERE id = p_id;
  ELSE
    RETURN NULL;
  END IF;

  IF v_guide IS NULL THEN
    RETURN jsonb_build_object('name', v_name);
  END IF;

  -- Extract ONLY lightweight text fields — no images, no binary data
  v_result := jsonb_build_object(
    'name', v_name,
    'hero_name', v_guide->'hero'->>'name',
    'hero_tagline', v_guide->'hero'->>'tagline',
    'mission', v_guide->'identity'->>'missionStatement',
    'archetype', v_guide->'identity'->>'archetype',
    'tone_of_voice', v_guide->'identity'->'toneOfVoice',
    'primary_tagline', v_guide->'tagline'->>'primary',
    'industry', v_guide->>'industry',
    'colors', (
      SELECT jsonb_agg(jsonb_build_object('name', c->>'name', 'hex', c->>'hex', 'role', c->>'role'))
      FROM jsonb_array_elements(COALESCE(v_guide->'colors', '[]'::jsonb)) AS c
      LIMIT 10
    ),
    'values', (
      SELECT jsonb_agg(c->>'text')
      FROM jsonb_array_elements(COALESCE(v_guide->'values', '[]'::jsonb)) AS c
      WHERE c->>'text' IS NOT NULL
      LIMIT 5
    ),
    'services', (
      SELECT jsonb_agg(c->>'name')
      FROM jsonb_array_elements(COALESCE(v_guide->'services', '[]'::jsonb)) AS c
      WHERE c->>'name' IS NOT NULL
      LIMIT 5
    ),
    'typography', (
      SELECT jsonb_agg(COALESCE(c->>'fontFamily', c->>'family'))
      FROM jsonb_array_elements(COALESCE(v_guide->'typography', '[]'::jsonb)) AS c
      LIMIT 4
    ),
    'logos_count', jsonb_array_length(COALESCE(v_guide->'logos', '[]'::jsonb)),
    'imagery_count', jsonb_array_length(COALESCE(v_guide->'imagery', '[]'::jsonb)),
    'patterns_count', jsonb_array_length(COALESCE(v_guide->'patterns', '[]'::jsonb)),
    'brochures_count', jsonb_array_length(COALESCE(v_guide->'brochures', '[]'::jsonb)),
    'icons_count', jsonb_array_length(COALESCE(v_guide->'brandIcons', '[]'::jsonb))
  );

  RETURN v_result;
END;
$$;