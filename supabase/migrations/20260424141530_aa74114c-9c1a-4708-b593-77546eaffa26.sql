DO $$
DECLARE
  v_colors jsonb;
  v_updated_colors jsonb;
  v_existing_sections jsonb;
  v_updated_sections jsonb;
  v_existing_assets jsonb;
  v_new_section jsonb;
  v_new_asset jsonb;
BEGIN
  -- 1. Tag Blue 500 / Blue 800 with role=primary, others as secondary/extended
  SELECT COALESCE(guide_data->'colors', '[]'::jsonb)
  INTO v_colors FROM public.brands WHERE slug='transperfect';

  SELECT jsonb_agg(
    CASE
      WHEN c->>'hex' ILIKE '#003FC7' THEN c || jsonb_build_object('role','primary','isPrimary',true,'order',1)
      WHEN c->>'hex' ILIKE '#03002C' THEN c || jsonb_build_object('role','primary','isPrimary',true,'order',2)
      WHEN COALESCE(c->>'role','') = '' THEN c || jsonb_build_object('role','secondary')
      ELSE c
    END
  )
  INTO v_updated_colors
  FROM jsonb_array_elements(v_colors) c;

  -- 2. Append reference image to imageAssets
  SELECT COALESCE(guide_data->'imageAssets','[]'::jsonb)
  INTO v_existing_assets FROM public.brands WHERE slug='transperfect';

  v_new_asset := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', '/orbs/tp-brand-colors-primary.png',
    'name', 'Brand Colors — Primary (Blue 500 + Blue 800)',
    'category', 'reference',
    'tags', jsonb_build_array('brand-colors','primary','blue-500','blue-800','palette','reference'),
    'description', 'Primary brand color reference: Blue 500 #003FC7 (vibrant) and Blue 800 #03002C (grounded). The two blues form the foundation of the TransPerfect web color scheme.',
    'createdAt', now()
  );

  -- 3. Add/replace "Brand Colors" section in approvedImagery
  SELECT COALESCE(guide_data->'approvedImagery'->'sections','[]'::jsonb)
  INTO v_existing_sections FROM public.brands WHERE slug='transperfect';

  v_new_section := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Brand Colors — Primary',
    'description', 'Official primary brand colors. Two blues form the foundation of the palette: Blue 500 #003FC7 (vibrant, energetic) and Blue 800 #03002C (darker, grounded).',
    'images', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'url', '/orbs/tp-brand-colors-primary.png',
        'category', 'reference',
        'tags', jsonb_build_array('brand-colors','primary','blue-500','blue-800','palette'),
        'description', 'Primary palette: Blue 500 (#003FC7 / RGB 0·63·199 / Pantone 2728 C) + Blue 800 (#03002C / RGB 3·0·44 / Pantone 282 C).',
        'createdAt', now()
      )
    )
  );

  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_sections) s WHERE s->>'name' = 'Brand Colors — Primary') THEN
    SELECT jsonb_agg(CASE WHEN s->>'name' = 'Brand Colors — Primary' THEN v_new_section ELSE s END)
    INTO v_updated_sections
    FROM jsonb_array_elements(v_existing_sections) s;
  ELSE
    v_updated_sections := jsonb_build_array(v_new_section) || v_existing_sections;
  END IF;

  -- 4. Apply all updates
  UPDATE public.brands
  SET guide_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(guide_data,'{}'::jsonb),
        '{colors}',
        v_updated_colors,
        true
      ),
      '{imageAssets}',
      v_existing_assets || jsonb_build_array(v_new_asset),
      true
    ),
    '{approvedImagery,sections}',
    v_updated_sections,
    true
  )
  WHERE slug='transperfect';
END $$;