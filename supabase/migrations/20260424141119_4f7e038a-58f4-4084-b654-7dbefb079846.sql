DO $$
DECLARE
  v_brand_id uuid;
  v_guide jsonb;
  v_sections jsonb;
  v_section_idx int;
  v_visual_logic jsonb;
  v_ref_image jsonb;
  v_ref_asset jsonb;
BEGIN
  SELECT id, guide_data INTO v_brand_id, v_guide FROM public.brands WHERE slug = 'transperfect' LIMIT 1;
  IF v_brand_id IS NULL THEN RAISE NOTICE 'No transperfect brand found'; RETURN; END IF;

  -- The structured Visual Logic framework (read by the AI brain via get_entity_text_context)
  v_visual_logic := jsonb_build_object(
    'title', 'Visual Logic',
    'subtitle', 'The following principles define how transformation takes visual form',
    'referenceImage', '/orbs/tp-visual-logic-reference.png',
    'pillars', jsonb_build_array(
      jsonb_build_object(
        'name', 'Connection',
        'description', 'Human and visual connections that express understanding, partnership and clarity.',
        'appliesTo', 'photography, brand visuals',
        'guidance', 'Use real, intimate human portraits with soft focus and warm presence. Do not abstract or orb-ify people.'
      ),
      jsonb_build_object(
        'name', 'Transformation',
        'description', 'Gradients and rhythm introduce a sense of transformation and continuous movement.',
        'appliesTo', 'layout, brand visuals, motion',
        'guidance', 'Use smooth cyan to violet gradients and flowing rhythm. The canonical orb/gradient set in /orbs/tp-*.png embodies this principle.'
      ),
      jsonb_build_object(
        'name', 'Materiality',
        'description', 'Glass-like translucency enhances clarity and subtly reacts to the background, reinforcing transformation.',
        'appliesTo', 'buttons, hover effects, photography, brand visuals',
        'guidance', 'Apply frosted-glass discs, lens-like translucency, and blurred refraction over real photography. Soft edges only.'
      )
    )
  );

  -- Store under guide_data.visualLogic AND inside identity for editor surfacing
  v_guide := jsonb_set(COALESCE(v_guide, '{}'::jsonb), '{visualLogic}', v_visual_logic, true);

  -- Mirror into identity.visualPrinciples so identity-aware UIs pick it up
  v_guide := jsonb_set(
    v_guide,
    '{identity,visualPrinciples}',
    v_visual_logic->'pillars',
    true
  );

  -- Register reference image in imageAssets (downloadable library)
  v_ref_asset := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', 'Visual Logic — 3 Pillars Reference',
    'url', '/orbs/tp-visual-logic-reference.png',
    'thumbnailUrl', '/orbs/tp-visual-logic-reference.png',
    'category', 'reference',
    'description', 'Connection · Transformation · Materiality — the three principles that define how TransPerfect takes visual form',
    'createdAt', now()
  );
  v_guide := jsonb_set(
    v_guide,
    '{imageAssets}',
    COALESCE(v_guide->'imageAssets', '[]'::jsonb) || jsonb_build_array(v_ref_asset)
  );

  -- Add to a "Visual Logic Principles" section in approvedImagery
  v_ref_image := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'url', '/orbs/tp-visual-logic-reference.png',
    'description', 'Visual Logic — Connection (human portraits), Transformation (gradients & rhythm), Materiality (glass-like translucency)',
    'tags', jsonb_build_array('visual-logic','reference','principles','framework'),
    'category', 'reference',
    'createdAt', now()
  );

  v_sections := COALESCE(v_guide->'approvedImagery'->'sections', '[]'::jsonb);
  v_section_idx := NULL;
  FOR i IN 0..(jsonb_array_length(v_sections) - 1) LOOP
    IF v_sections->i->>'name' = 'Visual Logic Principles' THEN
      v_section_idx := i;
      EXIT;
    END IF;
  END LOOP;

  IF v_section_idx IS NULL THEN
    -- Prepend so it appears at the top of the gallery as the foundational reference
    v_sections := jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', 'Visual Logic Principles',
      'description', 'The three principles that define how TransPerfect takes visual form: Connection, Transformation, Materiality. All other imagery should express one or more of these.',
      'images', jsonb_build_array(v_ref_image)
    )) || v_sections;
  ELSE
    v_sections := jsonb_set(
      v_sections,
      ARRAY[v_section_idx::text, 'images'],
      COALESCE(v_sections->v_section_idx->'images', '[]'::jsonb) || jsonb_build_array(v_ref_image)
    );
  END IF;

  v_guide := jsonb_set(v_guide, '{approvedImagery,sections}', v_sections, true);

  UPDATE public.brands SET guide_data = v_guide WHERE id = v_brand_id;
  RAISE NOTICE 'Added Visual Logic framework to TransPerfect brand %', v_brand_id;
END $$;