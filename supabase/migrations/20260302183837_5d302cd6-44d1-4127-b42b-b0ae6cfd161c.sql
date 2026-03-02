-- Add share_token for public shareable palette links
ALTER TABLE public.color_lab_reports 
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for share token lookups
CREATE INDEX IF NOT EXISTS idx_color_lab_reports_share_token 
  ON public.color_lab_reports (share_token) WHERE share_token IS NOT NULL;

-- Allow public SELECT on shared palettes via share_token
CREATE POLICY "Anyone can view shared palettes"
  ON public.color_lab_reports
  FOR SELECT
  USING (share_token IS NOT NULL);