DO $$
DECLARE
  v_base text := 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/image-assets/';
  v_new jsonb;
BEGIN
  v_new := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Top Sliver — Atmospheric Arc',         'url', v_base||'orb-rim-top-sliver.png',     'size', '933 KB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Bottom Arc — Underside Glow',          'url', v_base||'orb-rim-bottom-arc.png',    'size', '1.3 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Left Curve — Quarter Horizon',         'url', v_base||'orb-rim-left-curve.png',    'size', '1.3 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Right Curve — Magenta Hot-Spot',       'url', v_base||'orb-rim-right-curve.png',   'size', '1.0 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Diagonal Slice — Cinematic Horizon',   'url', v_base||'orb-rim-diagonal.png',      'size', '1.1 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Terminator Macro — Edge Banding',      'url', v_base||'orb-rim-terminator.png',    'size', '1.9 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Vertical Seam — Portrait Arc',         'url', v_base||'orb-rim-vertical-seam.png', 'size', '1.1 MB',  'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Rim Quarter Arc — Crescent of Light',      'url', v_base||'orb-rim-quarter-arc.png',   'size', '970 KB',  'type', 'image/png', 'uploadedAt', now()::text)
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