
-- Table for admin-managed download links per booth division
CREATE TABLE public.booth_download_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.booth_download_links ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Download links are publicly viewable"
  ON public.booth_download_links FOR SELECT
  USING (true);

-- Authenticated users can manage (admin check done in app)
CREATE POLICY "Authenticated users can insert download links"
  ON public.booth_download_links FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update download links"
  ON public.booth_download_links FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete download links"
  ON public.booth_download_links FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_booth_download_links_division ON public.booth_download_links(division_id);
