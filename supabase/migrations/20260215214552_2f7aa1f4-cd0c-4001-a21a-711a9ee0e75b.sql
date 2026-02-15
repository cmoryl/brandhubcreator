-- Add link_type column to booth_download_links to distinguish project files vs individual assets
ALTER TABLE public.booth_download_links
ADD COLUMN link_type text NOT NULL DEFAULT 'project';

-- Update existing rows to be project files by default
COMMENT ON COLUMN public.booth_download_links.link_type IS 'Type of download link: project or asset';