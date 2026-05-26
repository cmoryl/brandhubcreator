DO $$
DECLARE
  v_base text := 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/image-assets/';
  v_new jsonb;
BEGIN
  v_new := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Ultrawide 21:9 — Cinematic Equator',     'url', v_base||'orb-crop-ultrawide-21x9.png', 'size', '893 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Portrait 9:16 — Top Anchor Mobile',      'url', v_base||'orb-crop-portrait-9x16.png',  'size', '830 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Square 1:1 — Centered Hero',             'url', v_base||'orb-crop-square-centered.png','size', '947 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Widescreen 16:9 — Left Anchor',          'url', v_base||'orb-crop-16x9-left.png',     'size', '933 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Widescreen 16:9 — Right Anchor',         'url', v_base||'orb-crop-16x9-right.png',    'size', '894 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Photo 4:3 — Setting Sun Horizon',        'url', v_base||'orb-crop-4x3-horizon.png',   'size', '928 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Social 4:5 — Instagram Portrait',        'url', v_base||'orb-crop-4x5-social.png',    'size', '957 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Editorial 3:2 — Rule of Thirds',         'url', v_base||'orb-crop-3x2-thirds.png',    'size', '769 KB', 'type', 'image/png', 'uploadedAt', now()::text)
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