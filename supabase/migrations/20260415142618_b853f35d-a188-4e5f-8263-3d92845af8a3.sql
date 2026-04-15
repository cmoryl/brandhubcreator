
-- Brand visibility audits table
CREATE TABLE public.brand_visibility_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  entity_name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Overall scores
  overall_visibility_score NUMERIC,
  search_visibility_score NUMERIC,
  ai_platform_score NUMERIC,
  social_media_score NUMERIC,
  
  -- Detailed results
  search_analysis JSONB,
  ai_platform_analysis JSONB,
  social_media_analysis JSONB,
  visibility_gaps JSONB,
  recommendations JSONB,
  
  -- Metadata
  websites_analyzed TEXT[],
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_visibility_audits ENABLE ROW LEVEL SECURITY;

-- Members of the org can view their audits
CREATE POLICY "Org members can view visibility audits"
ON public.brand_visibility_audits
FOR SELECT
TO authenticated
USING (
  organization_id IS NULL
  OR public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- Org admins and global admins can insert
CREATE POLICY "Admins can create visibility audits"
ON public.brand_visibility_audits
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
  OR (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
);

-- Org admins and global admins can update (for status changes from edge function)
CREATE POLICY "Admins can update visibility audits"
ON public.brand_visibility_audits
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
  OR (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
);

-- Updated_at trigger
CREATE TRIGGER update_brand_visibility_audits_updated_at
  BEFORE UPDATE ON public.brand_visibility_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast entity lookups
CREATE INDEX idx_visibility_audits_entity ON public.brand_visibility_audits(entity_id, entity_type);
CREATE INDEX idx_visibility_audits_org ON public.brand_visibility_audits(organization_id);
