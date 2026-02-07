ALTER TABLE public.presentation_templates
ADD COLUMN IF NOT EXISTS card_image_url text;

CREATE INDEX IF NOT EXISTS idx_presentation_templates_entity
ON public.presentation_templates (entity_type, entity_id);

COMMENT ON COLUMN public.presentation_templates.card_image_url IS 'Optional override thumbnail shown on the presentation card; stored as public URL in file storage.';