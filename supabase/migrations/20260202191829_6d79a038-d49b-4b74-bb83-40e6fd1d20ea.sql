-- Create competitive_analysis_reports table
CREATE TABLE public.competitive_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'competitive',
  
  -- The comprehensive analysis data (JSONB)
  report_data JSONB NOT NULL,
  
  -- User-specified competitors
  competitors JSONB DEFAULT '[]',
  
  -- Metadata
  score INTEGER,
  status TEXT DEFAULT 'completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_competitive_reports_entity ON public.competitive_analysis_reports(entity_type, entity_id);
CREATE INDEX idx_competitive_reports_org ON public.competitive_analysis_reports(organization_id);
CREATE INDEX idx_competitive_reports_created_by ON public.competitive_analysis_reports(created_by);

-- Enable Row Level Security
ALTER TABLE public.competitive_analysis_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organization members can view reports for their org
CREATE POLICY "Org members can view competitive reports"
ON public.competitive_analysis_reports
FOR SELECT
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies: Org admins can insert reports
CREATE POLICY "Org admins can create competitive reports"
ON public.competitive_analysis_reports
FOR INSERT
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies: Org admins can update reports
CREATE POLICY "Org admins can update competitive reports"
ON public.competitive_analysis_reports
FOR UPDATE
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies: Org admins can delete reports
CREATE POLICY "Org admins can delete competitive reports"
ON public.competitive_analysis_reports
FOR DELETE
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Trigger for updating updated_at
CREATE TRIGGER update_competitive_reports_updated_at
BEFORE UPDATE ON public.competitive_analysis_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();