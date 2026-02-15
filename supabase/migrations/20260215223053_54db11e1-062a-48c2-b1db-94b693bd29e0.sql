
-- Add variant_label column to booth_content_sections
-- NULL means "applies to all variants" (default/shared content)
ALTER TABLE public.booth_content_sections
ADD COLUMN variant_label TEXT DEFAULT NULL;

-- Update existing rows to be shared (NULL = all variants), which is already the default
