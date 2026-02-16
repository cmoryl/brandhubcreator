
-- Table to store per-section AI analyses for booth content sections
CREATE TABLE public.booth_section_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  section_id UUID NOT NULL REFERENCES public.booth_content_sections(id) ON DELETE CASCADE,
  section_heading TEXT NOT NULL,
  overall_score INTEGER DEFAULT NULL,
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booth_section_analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can view section analyses"
  ON public.booth_section_analyses FOR SELECT
  USING (true);

-- Only authenticated users can write
CREATE POLICY "Authenticated users can insert section analyses"
  ON public.booth_section_analyses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update section analyses"
  ON public.booth_section_analyses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete section analyses"
  ON public.booth_section_analyses FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Index
CREATE INDEX idx_booth_section_analyses_section ON public.booth_section_analyses (section_id);
CREATE INDEX idx_booth_section_analyses_division ON public.booth_section_analyses (division_id);

-- Trigger
CREATE TRIGGER update_booth_section_analyses_updated_at
  BEFORE UPDATE ON public.booth_section_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
