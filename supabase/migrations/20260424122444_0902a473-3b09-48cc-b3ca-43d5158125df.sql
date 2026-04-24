DO $$
DECLARE
  v_base text := 'https://brandhubcreator.lovable.app/orbs-white/';
  v_new jsonb;
BEGIN
  v_new := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 1:1 — Centered Hero Orb',         'url', v_base||'orb-white-centered-1x1.png',         'size', '1.0 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 16:9 — Floating Hero Orb',         'url', v_base||'orb-white-hero-16x9.png',             'size', '720 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 21:9 — Trio Lineup',               'url', v_base||'orb-white-trio-21x9.png',             'size', '1.3 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 9:16 — Portrait Anchor',           'url', v_base||'orb-white-portrait-9x16.png',         'size', '780 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 16:9 — Right Anchor',              'url', v_base||'orb-white-right-anchor-16x9.png',     'size', '690 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 1:1 — 3×3 Grid',                   'url', v_base||'orb-white-grid-3x3.png',             'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 3:2 — Macro Edge',                 'url', v_base||'orb-white-macro-3x2.png',            'size', '950 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'White Mode 16:9 — Asymmetric Duo',            'url', v_base||'orb-white-duo-asymmetric-16x9.png',   'size', '880 KB', 'type', 'image/png', 'uploadedAt', now()::text)
  );

  UPDATE public.brands
  SET guide_data = jsonb_set(
    COALESCE(guide_data, '{}'::jsonb),
    '{imageAssets}',
    COALESCE(guide_data->'imageAssets', '[]'::jsonb) || v_new
  ),
  updated_at = now()
  WHERE slug = 'transperfect';
END $$;