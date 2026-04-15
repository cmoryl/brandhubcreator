
CREATE TABLE public.imagery_strategy_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  overall_score NUMERIC DEFAULT 0,
  diversity_score NUMERIC DEFAULT 0,
  authenticity_score NUMERIC DEFAULT 0,
  cultural_context_score NUMERIC DEFAULT 0,
  action_orientation_score NUMERIC DEFAULT 0,
  inclusive_prompting_score NUMERIC DEFAULT 0,
  stock_dependency TEXT DEFAULT 'medium',
  stop_signals_detected JSONB DEFAULT '[]',
  go_signals_present JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  images_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

ALTER TABLE public.imagery_strategy_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view imagery audits"
ON public.imagery_strategy_audits
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Org admins can insert imagery audits"
ON public.imagery_strategy_audits
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

CREATE INDEX idx_imagery_audits_entity ON public.imagery_strategy_audits(entity_id, entity_type);
CREATE INDEX idx_imagery_audits_org ON public.imagery_strategy_audits(organization_id);
