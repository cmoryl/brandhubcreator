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
  -- Tag the four named secondaries with role=secondary, isSecondary=true, ordered
  SELECT COALESCE(guide_data->'colors','[]'::jsonb)
  INTO v_colors FROM public.brands WHERE slug='transperfect';

  SELECT jsonb_agg(
    CASE
      WHEN c->>'hex' ILIKE '#C2A3FF' THEN c || jsonb_build_object('role','secondary','isSecondary',true,'order',3,'usage','Secondary — depth and flexibility, complements core blues')
      WHEN c->>'hex' ILIKE '#A1FBF9' THEN c || jsonb_build_object('role','secondary','isSecondary',true,'order',4,'usage','Secondary — adds light and clarity to interface accents')
      WHEN c->>'hex' ILIKE '#FFEB66' THEN c || jsonb_build_object('role','secondary','isSecondary',true,'order',5,'usage','Secondary — energetic accent for highlights and callouts')
      WHEN c->>'hex' ILIKE '#FF9B70' THEN c || jsonb_build_object('role','secondary','isSecondary',true,'order',6,'usage','Secondary — warm accent, contrast against the cool blue base')
      ELSE c
    END
  )
  INTO v_updated_colors
  FROM jsonb_array_elements(v_colors) c;

  -- Append reference image to imageAssets
  SELECT COALESCE(guide_data->'imageAssets','[]'::jsonb)
  INTO v_existing_assets FROM public.brands WHERE slug='transperfect';

  v_new_asset := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', '/orbs/tp-brand-colors-secondary.png',
    'name', 'Brand Colors — Secondary (Lavender, Turquoise, Yellow, Orange)',
    'category', 'reference',
    'tags', jsonb_build_array('brand-colors','secondary','lavender','turquoise','yellow','orange','palette','reference'),
    'description', 'Secondary brand colors — Lavender #C2A3FF, Turquoise #A1FBF9, Yellow #FFEB66, Orange #FF9B70. Add flexibility, depth and warmth to the core blue palette.',
    'createdAt', now()
  );

  -- Add/replace "Brand Colors — Secondary" section in approvedImagery
  SELECT COALESCE(guide_data->'approvedImagery'->'sections','[]'::jsonb)
  INTO v_existing_sections FROM public.brands WHERE slug='transperfect';

  v_new_section := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Brand Colors — Secondary',
    'description', 'Secondary brand colors. Lavender, Turquoise, Yellow, and Orange complement the core blues and expand the range of expression across contexts. Each tone includes extended shades within the full web color scheme.',
    'images', jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'url', '/orbs/tp-brand-colors-secondary.png',
        'category', 'reference',
        'tags', jsonb_build_array('brand-colors','secondary','lavender','turquoise','yellow','orange','palette'),
        'description', 'Lavender #C2A3FF (Pantone 2655 C) · Turquoise #A1FBF9 (Pantone 317 C) · Yellow #FFEB66 (Pantone 100 C) · Orange #FF9B70 (Pantone 164 C).',
        'createdAt', now()
      )
    )
  );

  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_sections) s WHERE s->>'name' = 'Brand Colors — Secondary') THEN
    SELECT jsonb_agg(CASE WHEN s->>'name' = 'Brand Colors — Secondary' THEN v_new_section ELSE s END)
    INTO v_updated_sections
    FROM jsonb_array_elements(v_existing_sections) s;
  ELSE
    -- Place right after Primary if present, else at top
    v_updated_sections := jsonb_build_array(v_new_section) || v_existing_sections;
  END IF;

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