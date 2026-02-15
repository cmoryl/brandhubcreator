
-- Create dedicated table for website analysis reports
CREATE TABLE public.website_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  entity_name TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  website_url TEXT NOT NULL,
  overall_score INTEGER,
  grade TEXT,
  summary TEXT,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by entity
CREATE INDEX idx_website_analysis_entity ON public.website_analysis_reports(entity_id, entity_type);
CREATE INDEX idx_website_analysis_org ON public.website_analysis_reports(organization_id);

-- Enable RLS
ALTER TABLE public.website_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read reports for their org
CREATE POLICY "Users can view website analysis reports in their org"
  ON public.website_analysis_reports FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can create reports
CREATE POLICY "Users can create website analysis reports"
  ON public.website_analysis_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can update their own reports
CREATE POLICY "Users can update website analysis reports in their org"
  ON public.website_analysis_reports FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete reports in their org
CREATE POLICY "Users can delete website analysis reports in their org"
  ON public.website_analysis_reports FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_website_analysis_reports_updated_at
  BEFORE UPDATE ON public.website_analysis_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
