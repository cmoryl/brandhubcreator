UPDATE public.brands
SET guide_data = jsonb_set(
  guide_data,
  '{services}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN s->>'id' = 'svc-1' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-1.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-1.png')
        WHEN s->>'id' = 'svc-2' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-2.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-2.png')
        WHEN s->>'id' = 'svc-3' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-3.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-3.png')
        WHEN s->>'id' = 'svc-4' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-4.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-4.png')
        WHEN s->>'id' = 'svc-5' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-5.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-5.png')
        WHEN s->>'id' = 'svc-6' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-6.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-6.png')
        WHEN s->>'id' = 'svc-7' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-7.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-7.png')
        WHEN s->>'id' = 'svc-8' THEN s || jsonb_build_object('headerImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-8.png', 'imageUrl', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/brand/bbdeaaae-b756-4c7e-8537-1c854ed2cb27/services/svc-8.png')
        ELSE s
      END
    )
    FROM jsonb_array_elements(guide_data->'services') s
  )
)
WHERE id = 'bbdeaaae-b756-4c7e-8537-1c854ed2cb27';