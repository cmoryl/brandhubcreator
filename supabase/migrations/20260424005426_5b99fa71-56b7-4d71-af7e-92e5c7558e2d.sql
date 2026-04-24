DO $$
DECLARE
  v_base text := 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/image-assets/';
  v_new jsonb;
BEGIN
  v_new := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 21:9 — Cyan to Purple Field',  'url', v_base||'orb-superzoom-cyan-purple-21x9.png',   'size', '1.4 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 16:9 — Purple to Magenta Field','url', v_base||'orb-superzoom-purple-magenta-16x9.png','size', '786 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 1:1 — Core Bloom Hotspot',     'url', v_base||'orb-superzoom-core-bloom-1x1.png',     'size', '1.0 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 9:16 — Full Sweep Vertical',   'url', v_base||'orb-superzoom-fullsweep-9x16.png',     'size', '846 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 21:9 — Magenta into Void',     'url', v_base||'orb-superzoom-magenta-void-21x9.png',  'size', '727 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 3:2 — Electric Midtones',      'url', v_base||'orb-superzoom-electric-mid-3x2.png',   'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 16:9 — Diagonal Color Sweep',  'url', v_base||'orb-superzoom-diagonal-sweep-16x9.png','size', '983 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Super Zoom 4:5 — Purple Haze Social',     'url', v_base||'orb-superzoom-purple-haze-4x5.png',    'size', '1.0 MB', 'type', 'image/png', 'uploadedAt', now()::text)
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