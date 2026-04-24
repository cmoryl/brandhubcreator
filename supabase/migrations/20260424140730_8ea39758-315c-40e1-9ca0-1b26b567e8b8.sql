DO $$
DECLARE
  v_brand_id uuid;
  v_guide jsonb;
  v_sections jsonb;
  v_section_idx int;
  v_new_images jsonb;
  v_new_assets jsonb;
BEGIN
  SELECT id, guide_data INTO v_brand_id, v_guide FROM public.brands WHERE slug = 'transperfect' LIMIT 1;
  IF v_brand_id IS NULL THEN RAISE NOTICE 'No transperfect brand found'; RETURN; END IF;

  -- Build new approved-imagery image objects (all type "do")
  v_new_images := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-hero-dome-2400x1500.png', 'description', 'Hero dome — cyan luminous arc on blue-violet (2400x1500)', 'tags', jsonb_build_array('hero','orb','light-mode','dome'), 'category', 'hero', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-hero-dome-3000x1300.png', 'description', 'Hero dome wide banner — cyan luminous arc (3000x1300)', 'tags', jsonb_build_array('hero','orb','banner','light-mode'), 'category', 'hero', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-card-portrait-2400x2600.png', 'description', 'Card portrait — diagonal navy to violet to cyan light sweep (2400x2600)', 'tags', jsonb_build_array('card','portrait','dark-mode','sweep'), 'category', 'card', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-casestudy-duo-2400x1290.png', 'description', 'Case study duo — twin violet and cyan spheres on light background (2400x1290)', 'tags', jsonb_build_array('case-study','duo','light-mode','spheres'), 'category', 'case-study', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-casestudy-banner-3000x624.png', 'description', 'Case study banner — single right-anchored violet sphere (3000x624)', 'tags', jsonb_build_array('case-study','banner','light-mode','wide'), 'category', 'case-study', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'url', '/orbs/tp-illustrative-duo-2400x1500.png', 'description', 'Illustrative duo — twin violet and cyan spheres on deep navy (2400x1500)', 'tags', jsonb_build_array('illustrative','duo','dark-mode','spheres'), 'category', 'illustrative', 'createdAt', now())
  );

  -- Build matching image assets (downloadable library)
  v_new_assets := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Hero Dome 2400x1500', 'url', '/orbs/tp-hero-dome-2400x1500.png', 'thumbnailUrl', '/orbs/tp-hero-dome-2400x1500.png', 'category', 'hero', 'aspectRatio', '8:5', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Hero Dome Banner 3000x1300', 'url', '/orbs/tp-hero-dome-3000x1300.png', 'thumbnailUrl', '/orbs/tp-hero-dome-3000x1300.png', 'category', 'hero', 'aspectRatio', '30:13', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Card Portrait 2400x2600', 'url', '/orbs/tp-card-portrait-2400x2600.png', 'thumbnailUrl', '/orbs/tp-card-portrait-2400x2600.png', 'category', 'card', 'aspectRatio', '12:13', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Case Study Duo 2400x1290', 'url', '/orbs/tp-casestudy-duo-2400x1290.png', 'thumbnailUrl', '/orbs/tp-casestudy-duo-2400x1290.png', 'category', 'case-study', 'aspectRatio', '80:43', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Case Study Banner 3000x624', 'url', '/orbs/tp-casestudy-banner-3000x624.png', 'thumbnailUrl', '/orbs/tp-casestudy-banner-3000x624.png', 'category', 'case-study', 'aspectRatio', '125:26', 'createdAt', now()),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'TP Illustrative Duo 2400x1500', 'url', '/orbs/tp-illustrative-duo-2400x1500.png', 'thumbnailUrl', '/orbs/tp-illustrative-duo-2400x1500.png', 'category', 'illustrative', 'aspectRatio', '8:5', 'createdAt', now())
  );

  -- Append to imageAssets array
  v_guide := jsonb_set(
    COALESCE(v_guide, '{}'::jsonb),
    '{imageAssets}',
    COALESCE(v_guide->'imageAssets', '[]'::jsonb) || v_new_assets
  );

  -- Find or create "Brand Orbs & Gradients" section in approvedImagery
  v_sections := COALESCE(v_guide->'approvedImagery'->'sections', '[]'::jsonb);
  v_section_idx := NULL;
  FOR i IN 0..(jsonb_array_length(v_sections) - 1) LOOP
    IF v_sections->i->>'name' = 'Brand Orbs & Gradients' THEN
      v_section_idx := i;
      EXIT;
    END IF;
  END LOOP;

  IF v_section_idx IS NULL THEN
    v_sections := v_sections || jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', 'Brand Orbs & Gradients',
      'description', 'Canonical luminous orb and gradient imagery — the foundation of all TransPerfect visual storytelling',
      'images', v_new_images
    ));
  ELSE
    v_sections := jsonb_set(
      v_sections,
      ARRAY[v_section_idx::text, 'images'],
      COALESCE(v_sections->v_section_idx->'images', '[]'::jsonb) || v_new_images
    );
  END IF;

  v_guide := jsonb_set(v_guide, '{approvedImagery,sections}', v_sections, true);

  UPDATE public.brands SET guide_data = v_guide WHERE id = v_brand_id;
  RAISE NOTICE 'Added 6 orb images to TransPerfect brand %', v_brand_id;
END $$;