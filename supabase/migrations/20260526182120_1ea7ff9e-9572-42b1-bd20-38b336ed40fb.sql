WITH ranked AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) AS rn
  FROM public.organization_icon_libraries
  WHERE name ILIKE 'Services - %'
)
DELETE FROM public.icon_library_brand_links
WHERE library_id IN (SELECT id FROM ranked WHERE rn > 1);

WITH ranked AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) AS rn
  FROM public.organization_icon_libraries
  WHERE name ILIKE 'Services - %'
)
DELETE FROM public.organization_icon_libraries
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);