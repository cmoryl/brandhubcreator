UPDATE public.brands
SET guide_data = jsonb_set(
  guide_data,
  '{emailBanners}',
  COALESCE(
    (SELECT jsonb_agg(b) FROM jsonb_array_elements(guide_data->'emailBanners') b WHERE COALESCE(b->>'imageUrl','') <> ''),
    '[]'::jsonb
  )
)
WHERE guide_data ? 'emailBanners'
  AND jsonb_typeof(guide_data->'emailBanners') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(guide_data->'emailBanners') b WHERE COALESCE(b->>'imageUrl','') = ''
  );

UPDATE public.products
SET guide_data = jsonb_set(
  guide_data,
  '{emailBanners}',
  COALESCE(
    (SELECT jsonb_agg(b) FROM jsonb_array_elements(guide_data->'emailBanners') b WHERE COALESCE(b->>'imageUrl','') <> ''),
    '[]'::jsonb
  )
)
WHERE guide_data ? 'emailBanners'
  AND jsonb_typeof(guide_data->'emailBanners') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(guide_data->'emailBanners') b WHERE COALESCE(b->>'imageUrl','') = ''
  );