
-- Table to store AI analyses for booth divisions
CREATE TABLE public.booth_ai_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  variant_label TEXT DEFAULT NULL,
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score INTEGER DEFAULT NULL,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booth_ai_analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can read analyses (booth catalog is public)
CREATE POLICY "Anyone can view booth analyses"
  ON public.booth_ai_analyses FOR SELECT
  USING (true);

-- Only authenticated users can create/update/delete
CREATE POLICY "Authenticated users can insert booth analyses"
  ON public.booth_ai_analyses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update booth analyses"
  ON public.booth_ai_analyses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete booth analyses"
  ON public.booth_ai_analyses FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Index for fast lookup by division
CREATE INDEX idx_booth_ai_analyses_division ON public.booth_ai_analyses (division_id, variant_label);

-- Trigger for updated_at
CREATE TRIGGER update_booth_ai_analyses_updated_at
  BEFORE UPDATE ON public.booth_ai_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
