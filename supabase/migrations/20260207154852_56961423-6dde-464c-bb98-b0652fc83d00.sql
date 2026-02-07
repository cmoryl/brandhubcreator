-- Expand presentation_templates table to support all template types (merging with Master Scaffolds)

-- Add file_type column for template type classification
ALTER TABLE public.presentation_templates 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'pptx';

-- Add external_url for external links (Dropbox, Drive, etc.)
ALTER TABLE public.presentation_templates 
ADD COLUMN IF NOT EXISTS external_url text;

-- Add is_embedded_folder flag for folder embeds
ALTER TABLE public.presentation_templates 
ADD COLUMN IF NOT EXISTS is_embedded_folder boolean DEFAULT false;

-- Add thumbnail_url for custom preview images
ALTER TABLE public.presentation_templates 
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Update category column to support expanded categories
COMMENT ON COLUMN public.presentation_templates.category IS 'Template category: presentations, documents, design-files, spreadsheets, cloud-folders, external-links, pdf, other';
COMMENT ON COLUMN public.presentation_templates.file_type IS 'File type: pptx, pdf, docx, xlsx, figma, sketch, psd, ai, image, video, dropbox, dropbox-folder, drive, drive-folder, link, other';