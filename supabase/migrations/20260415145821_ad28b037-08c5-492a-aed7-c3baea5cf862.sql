
CREATE TABLE public.recommendation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recommendation_key TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  source TEXT DEFAULT 'oracle',
  status TEXT DEFAULT 'pending',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recommendation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view recommendation actions"
ON public.recommendation_actions FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert recommendation actions"
ON public.recommendation_actions FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update recommendation actions"
ON public.recommendation_actions FOR UPDATE
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete recommendation actions"
ON public.recommendation_actions FOR DELETE
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_recommendation_actions_updated_at
BEFORE UPDATE ON public.recommendation_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
