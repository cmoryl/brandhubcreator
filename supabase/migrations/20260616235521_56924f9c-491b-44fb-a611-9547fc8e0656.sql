
CREATE TABLE IF NOT EXISTS public.canva_audit_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID,
  brand_slug TEXT NOT NULL,
  audit_slug TEXT NOT NULL,
  audit_title TEXT,
  template_count INTEGER NOT NULL DEFAULT 0,
  flag_count INTEGER NOT NULL DEFAULT 0,
  category_count INTEGER NOT NULL DEFAULT 0,
  health_score INTEGER NOT NULL DEFAULT 0,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_used TEXT,
  source_hash TEXT,
  last_analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (brand_slug, audit_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.canva_audit_analyses TO authenticated;
GRANT ALL ON public.canva_audit_analyses TO service_role;

ALTER TABLE public.canva_audit_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view canva audit analyses"
  ON public.canva_audit_analyses FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert canva audit analyses"
  ON public.canva_audit_analyses FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update canva audit analyses"
  ON public.canva_audit_analyses FOR UPDATE
  TO authenticated
  USING (is_org_admin(auth.uid(), organization_id))
  WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete canva audit analyses"
  ON public.canva_audit_analyses FOR DELETE
  TO authenticated
  USING (is_org_admin(auth.uid(), organization_id));

CREATE INDEX IF NOT EXISTS idx_canva_audit_analyses_org ON public.canva_audit_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_canva_audit_analyses_brand ON public.canva_audit_analyses(brand_slug);
CREATE INDEX IF NOT EXISTS idx_canva_audit_analyses_recent ON public.canva_audit_analyses(last_analyzed_at DESC);

CREATE TRIGGER update_canva_audit_analyses_updated_at
  BEFORE UPDATE ON public.canva_audit_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
