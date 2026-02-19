
-- Health Snapshots table for longitudinal analytics tracking
CREATE TABLE public.health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand', -- brand, product, event
  entity_name TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, manual
  
  -- Core scores
  brand_health_score NUMERIC,
  compliance_score NUMERIC,
  bias_inclusion_score NUMERIC,
  website_score NUMERIC,
  competitive_score NUMERIC,
  
  -- Sub-dimension scores (JSONB for flexibility)
  compliance_details JSONB DEFAULT '{}'::jsonb,
  bias_details JSONB DEFAULT '{}'::jsonb,
  website_details JSONB DEFAULT '{}'::jsonb,
  competitive_details JSONB DEFAULT '{}'::jsonb,
  social_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Delta tracking (compared to previous snapshot)
  score_deltas JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'manual', -- manual, cron, auto
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate snapshots for same entity on same date
  UNIQUE(entity_id, entity_type, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

-- Org members can view snapshots for their org
CREATE POLICY "Org members can view health snapshots"
  ON public.health_snapshots FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Only admins can insert snapshots
CREATE POLICY "Admins can insert health snapshots"
  ON public.health_snapshots FOR INSERT
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Only admins can delete snapshots
CREATE POLICY "Admins can delete health snapshots"
  ON public.health_snapshots FOR DELETE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Indexes for fast queries
CREATE INDEX idx_health_snapshots_org_date ON public.health_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_health_snapshots_entity ON public.health_snapshots(entity_id, entity_type, snapshot_date DESC);

-- Timestamp trigger
CREATE TRIGGER update_health_snapshots_updated_at
  BEFORE UPDATE ON public.health_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to get trend data for an entity
CREATE OR REPLACE FUNCTION public.get_health_trends(
  p_entity_id UUID,
  p_entity_type TEXT DEFAULT 'brand',
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE(
  snapshot_date DATE,
  brand_health_score NUMERIC,
  compliance_score NUMERIC,
  bias_inclusion_score NUMERIC,
  website_score NUMERIC,
  competitive_score NUMERIC,
  score_deltas JSONB,
  period_type TEXT,
  triggered_by TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    hs.snapshot_date,
    hs.brand_health_score,
    hs.compliance_score,
    hs.bias_inclusion_score,
    hs.website_score,
    hs.competitive_score,
    hs.score_deltas,
    hs.period_type,
    hs.triggered_by
  FROM health_snapshots hs
  WHERE hs.entity_id = p_entity_id
    AND hs.entity_type = p_entity_type
    AND hs.snapshot_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  ORDER BY hs.snapshot_date ASC;
$$;

-- RPC to get org-wide summary trends
CREATE OR REPLACE FUNCTION public.get_org_health_summary(
  p_org_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE(
  snapshot_date DATE,
  avg_health_score NUMERIC,
  avg_compliance_score NUMERIC,
  avg_bias_score NUMERIC,
  avg_website_score NUMERIC,
  entity_count BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    hs.snapshot_date,
    AVG(hs.brand_health_score) AS avg_health_score,
    AVG(hs.compliance_score) AS avg_compliance_score,
    AVG(hs.bias_inclusion_score) AS avg_bias_score,
    AVG(hs.website_score) AS avg_website_score,
    COUNT(DISTINCT hs.entity_id) AS entity_count
  FROM health_snapshots hs
  WHERE hs.organization_id = p_org_id
    AND hs.snapshot_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY hs.snapshot_date
  ORDER BY hs.snapshot_date ASC;
$$;
