
-- Social Asset Analysis results table
CREATE TABLE public.social_asset_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID REFERENCES public.social_asset_placements(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  image_url TEXT NOT NULL,
  
  -- Bias & Inclusion
  bias_score NUMERIC,
  bias_findings JSONB DEFAULT '[]'::jsonb,
  representation_analysis JSONB,
  cultural_sensitivity JSONB,
  accessibility_findings JSONB,
  
  -- Brand Compliance
  compliance_score NUMERIC,
  color_compliance JSONB,
  logo_compliance JSONB,
  typography_compliance JSONB,
  compliance_details JSONB DEFAULT '[]'::jsonb,
  
  -- Engagement Prediction
  predicted_engagement_rate NUMERIC,
  predicted_reach TEXT,
  optimal_posting_time TEXT,
  engagement_factors JSONB DEFAULT '[]'::jsonb,
  content_quality_score NUMERIC,
  
  -- Overall
  overall_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_social_asset_analyses_placement ON public.social_asset_analyses(placement_id);
CREATE INDEX idx_social_asset_analyses_org ON public.social_asset_analyses(organization_id);

-- Updated at trigger
CREATE TRIGGER set_social_asset_analyses_updated_at
  BEFORE UPDATE ON public.social_asset_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.social_asset_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view analyses"
  ON public.social_asset_analyses FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert analyses"
  ON public.social_asset_analyses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can update analyses"
  ON public.social_asset_analyses FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete analyses"
  ON public.social_asset_analyses FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));
