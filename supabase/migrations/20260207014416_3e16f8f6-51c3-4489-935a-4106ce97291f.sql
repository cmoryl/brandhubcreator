-- Update typography defaults for all brands
UPDATE public.brands
SET guide_data = jsonb_set(
  guide_data,
  '{typography}',
  '[
    {"id": "heading", "name": "Headline", "fontFamily": "Poppins", "weight": "700", "usage": "Primary headlines and titles"},
    {"id": "subheading", "name": "Sub-Headline", "fontFamily": "Montserrat", "weight": "600", "usage": "Secondary headlines and section titles"},
    {"id": "body", "name": "Web Safe", "fontFamily": "Verdana", "weight": "400", "usage": "Body text and fallback font"}
  ]'::jsonb
),
updated_at = now();

-- Update typography defaults for all products
UPDATE public.products
SET guide_data = jsonb_set(
  guide_data,
  '{typography}',
  '[
    {"id": "heading", "name": "Headline", "fontFamily": "Poppins", "weight": "700", "usage": "Primary headlines and titles"},
    {"id": "subheading", "name": "Sub-Headline", "fontFamily": "Montserrat", "weight": "600", "usage": "Secondary headlines and section titles"},
    {"id": "body", "name": "Web Safe", "fontFamily": "Verdana", "weight": "400", "usage": "Body text and fallback font"}
  ]'::jsonb
),
updated_at = now();

-- Update typography defaults for all events
UPDATE public.events
SET guide_data = jsonb_set(
  guide_data,
  '{typography}',
  '[
    {"id": "heading", "name": "Headline", "fontFamily": "Poppins", "weight": "700", "usage": "Primary headlines and titles"},
    {"id": "subheading", "name": "Sub-Headline", "fontFamily": "Montserrat", "weight": "600", "usage": "Secondary headlines and section titles"},
    {"id": "body", "name": "Web Safe", "fontFamily": "Verdana", "weight": "400", "usage": "Body text and fallback font"}
  ]'::jsonb
),
updated_at = now();