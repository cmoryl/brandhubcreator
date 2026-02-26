
CREATE TABLE public.intelligence_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  digest TEXT NOT NULL,
  data_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view digests"
  ON public.intelligence_digests FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can insert digests"
  ON public.intelligence_digests FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE INDEX idx_intelligence_digests_org ON public.intelligence_digests(organization_id, generated_at DESC);
