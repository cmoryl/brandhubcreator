DO $$
DECLARE
  v_base text := '/orbs/';
  v_new jsonb := jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Macro Zoom — 1:1 (Dark)', 'url', v_base||'orb-dark-macro-1x1.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Cascade Trio — 21:9 (Dark)', 'url', v_base||'orb-dark-cascade-21x9.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Corner Anchor — 16:9 (Dark)', 'url', v_base||'orb-dark-corner-anchor-16x9.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Top Fade Portrait — 9:16 (White)', 'url', v_base||'orb-white-top-fade-9x16.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Lineup Five — 21:9 (White)', 'url', v_base||'orb-white-lineup-21x9.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Half Bleed — 3:2 (Dark)', 'url', v_base||'orb-dark-half-bleed-3x2.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Quad Grid — 1:1 (White)', 'url', v_base||'orb-white-quad-grid-1x1.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text),
    jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Orb Overlap Merge — 4:3 (Dark)', 'url', v_base||'orb-dark-overlap-4x3.png', 'size', 'From Library', 'type', 'image/png', 'uploadedAt', now()::text)
  );
BEGIN
  UPDATE public.brands
  SET guide_data = jsonb_set(
    COALESCE(guide_data, '{}'::jsonb),
    '{imageAssets}',
    COALESCE(guide_data->'imageAssets', '[]'::jsonb) || v_new
  )
  WHERE slug = 'transperfect';
END $$;