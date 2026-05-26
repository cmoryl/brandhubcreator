DELETE FROM public.icon_library_brand_links
WHERE library_id IN (
  SELECT id FROM public.organization_icon_libraries WHERE name ILIKE 'Services - %'
);
DELETE FROM public.organization_icon_libraries WHERE name ILIKE 'Services - %';