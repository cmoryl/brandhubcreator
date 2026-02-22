
-- Cross-portfolio insights table for curb-cut feedback loop
CREATE TABLE public.portfolio_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Source tracking
  source_entity_id UUID NOT NULL,
  source_entity_type TEXT NOT NULL DEFAULT 'brand',
  source_entity_name TEXT NOT NULL,
  source_module TEXT NOT NULL, -- 'bias_scan', 'localization', 'research', 'competitive', 'website', 'booth'
  source_scan_id UUID, -- reference to the originating scan/job
  
  -- Insight content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'accessibility', -- 'accessibility', 'usability', 'localization', 'inclusive_design', 'performance', 'competitive'
  curb_cut_category TEXT, -- 'mobility', 'vision', 'hearing', 'cognitive', 'language', 'cultural', 'universal'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Cross-pollination
  applicable_entity_ids UUID[] DEFAULT '{}',
  applicable_entity_types TEXT[] DEFAULT '{}',
  propagation_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'propagated', 'dismissed'
  propagated_at TIMESTAMPTZ,
  dismissed_by UUID,
  dismissed_reason TEXT,
  
  -- AI-generated recommendations
  recommendations JSONB DEFAULT '[]',
  confidence_score NUMERIC(5,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.portfolio_insights ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's insights
CREATE POLICY "Org members can view portfolio insights"
  ON public.portfolio_insights FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Only admins can manage insights
CREATE POLICY "Admins can insert portfolio insights"
  ON public.portfolio_insights FOR INSERT
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can update portfolio insights"
  ON public.portfolio_insights FOR UPDATE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can delete portfolio insights"
  ON public.portfolio_insights FOR DELETE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Indexes
CREATE INDEX idx_portfolio_insights_org ON public.portfolio_insights(organization_id);
CREATE INDEX idx_portfolio_insights_source ON public.portfolio_insights(source_entity_id, source_module);
CREATE INDEX idx_portfolio_insights_type ON public.portfolio_insights(insight_type);
CREATE INDEX idx_portfolio_insights_status ON public.portfolio_insights(propagation_status);

-- Trigger for updated_at
CREATE TRIGGER update_portfolio_insights_updated_at
  BEFORE UPDATE ON public.portfolio_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
