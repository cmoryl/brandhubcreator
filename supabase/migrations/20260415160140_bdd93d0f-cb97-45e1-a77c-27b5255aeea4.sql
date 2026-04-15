
-- Table to track which competitive analysis recommendations have been approved/utilized
CREATE TABLE public.competitive_recommendation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.competitive_analysis_reports(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id),
  recommendation_index INTEGER NOT NULL,
  recommendation_title TEXT NOT NULL,
  recommendation_type TEXT NOT NULL DEFAULT 'design_priority',
  status TEXT NOT NULL DEFAULT 'approved',
  applied_to_imagery_hub BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  applied_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(report_id, recommendation_index, recommendation_type)
);

-- Enable RLS
ALTER TABLE public.competitive_recommendation_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies: org members can view, org admins can manage
CREATE POLICY "Org members can view recommendation actions"
  ON public.competitive_recommendation_actions
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can manage recommendation actions"
  ON public.competitive_recommendation_actions
  FOR ALL
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_competitive_recommendation_actions_updated_at
  BEFORE UPDATE ON public.competitive_recommendation_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
