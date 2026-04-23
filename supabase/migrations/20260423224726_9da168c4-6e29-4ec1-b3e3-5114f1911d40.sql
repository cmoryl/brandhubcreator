DO $$
DECLARE
  v_base text := 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/image-assets/';
  v_new jsonb;
BEGIN
  v_new := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Collision Cluster — Five Orbs Touching', 'url', v_base||'orb-collision-cluster.png', 'size', '1.3 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Venn Intersect — Three Orbs Overlapping', 'url', v_base||'orb-venn-intersect.png', 'size', '1.3 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Edge Rim Macro — Orb Horizon', 'url', v_base||'orb-edge-rim-macro.png', 'size', '1.2 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Contact Point — Two Orbs Kissing', 'url', v_base||'orb-contact-point.png', 'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Bubble Pack — Seven Orbs in Equilibrium', 'url', v_base||'orb-bubble-pack.png', 'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Overlap Zone Macro — Lens of Light', 'url', v_base||'orb-overlap-zone-macro.png', 'size', '1.7 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Collision Chain — Four Orbs in a Row', 'url', v_base||'orb-collision-chain.png', 'size', '1.1 MB', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Gradient Skin Abstract — Orb Surface Macro', 'url', v_base||'orb-gradient-skin-abstract.png', 'size', '1.9 MB', 'type', 'image/png', 'uploadedAt', now()::text)
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