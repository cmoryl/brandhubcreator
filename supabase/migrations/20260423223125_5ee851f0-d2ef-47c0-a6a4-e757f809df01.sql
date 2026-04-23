DO $$
DECLARE
  v_base_url text := 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/image-assets/';
  v_new_assets jsonb;
BEGIN
  v_new_assets := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Micro Rim — Orb Edge Detail', 'url', v_base_url || 'orb-micro-rim.png', 'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Top-Down — Concentric Orb', 'url', v_base_url || 'orb-top-down.png', 'size', '925 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Low Angle — Orb Horizon', 'url', v_base_url || 'orb-low-angle.png', 'size', '1.0 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Three-Quarter — Orb Curvature', 'url', v_base_url || 'orb-three-quarter.png', 'size', '972 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Core Zoom — Orb Plasma Detail', 'url', v_base_url || 'orb-core-zoom.png', 'size', '1.7 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Half Frame — Orb with Negative Space', 'url', v_base_url || 'orb-half-frame.png', 'size', '852 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Dutch Angle — Orb in Motion', 'url', v_base_url || 'orb-dutch-angle.png', 'size', '997 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Crescent — Orb Eclipse Edge', 'url', v_base_url || 'orb-crescent.png', 'size', '983 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Dual Orbs — Perspective Pair', 'url', v_base_url || 'orb-dual-perspective.png', 'size', '908 KB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Vertical Micro — Orb Gradient Portrait', 'url', v_base_url || 'orb-vertical-micro.png', 'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text)
  );

  UPDATE public.brands
  SET guide_data = jsonb_set(
    COALESCE(guide_data, '{}'::jsonb),
    '{imageAssets}',
    COALESCE(guide_data->'imageAssets', '[]'::jsonb) || v_new_assets
  ),
  updated_at = now()
  WHERE slug = 'transperfect';
END $$;