DO $$
DECLARE
  v_existing_sections jsonb;
  v_updated_sections jsonb;
  v_new_section jsonb;
  v_new_asset jsonb;
  v_existing_assets jsonb;
BEGIN
  SELECT COALESCE(guide_data->'approvedImagery'->'sections', '[]'::jsonb)
  INTO v_existing_sections
  FROM public.brands WHERE slug = 'transperfect';

  v_new_section := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Visual Assets Overview',
    'description', 'The four core assets that bring the TransPerfect web identity to life: Colors, Typography, Icon style, and Motion style.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'url', '/orbs/tp-visual-assets-overview.png',
        'category', 'reference',
        'tags', jsonb_build_array('visual-assets','colors','typography','icons','motion','overview','reference'),
        'description', 'Visual assets overview — Colors (deep navy + electric blue + accent palette), Typography (Geist Sans), Icon style (outlined on navy), Motion style (cubic arc with accent dot).',
        'createdAt', now()
      )
    )
  );

  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_sections) s WHERE s->>'name' = 'Visual Assets Overview') THEN
    SELECT jsonb_agg(
      CASE WHEN s->>'name' = 'Visual Assets Overview' THEN v_new_section ELSE s END
    )
    INTO v_updated_sections
    FROM jsonb_array_elements(v_existing_sections) s;
  ELSE
    v_updated_sections := jsonb_build_array(v_new_section) || v_existing_sections;
  END IF;

  SELECT COALESCE(guide_data->'imageAssets', '[]'::jsonb)
  INTO v_existing_assets
  FROM public.brands WHERE slug = 'transperfect';

  v_new_asset := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', '/orbs/tp-visual-assets-overview.png',
    'name', 'Visual Assets Overview',
    'category', 'reference',
    'tags', jsonb_build_array('visual-assets','colors','typography','icons','motion','overview'),
    'description', 'Core asset overview: Colors, Typography (Geist Sans), Icon style, Motion style.',
    'createdAt', now()
  );

  UPDATE public.brands
  SET guide_data = jsonb_set(
    jsonb_set(
      COALESCE(guide_data, '{}'::jsonb),
      '{approvedImagery,sections}',
      v_updated_sections,
      true
    ),
    '{imageAssets}',
    v_existing_assets || jsonb_build_array(v_new_asset),
    true
  )
  WHERE slug = 'transperfect';
END $$;