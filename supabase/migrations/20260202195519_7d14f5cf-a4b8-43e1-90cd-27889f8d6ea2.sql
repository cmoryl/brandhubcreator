-- Create table for favorite competitors
CREATE TABLE public.favorite_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID,
  name TEXT NOT NULL,
  competitor_type TEXT DEFAULT 'direct' CHECK (competitor_type IN ('direct', 'indirect', 'emerging')),
  reason TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.favorite_competitors ENABLE ROW LEVEL SECURITY;

-- Policies: org members can manage their org's favorites
CREATE POLICY "Org members can view favorite competitors"
  ON public.favorite_competitors FOR SELECT
  USING (
    organization_id IS NULL 
    OR public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Org members can insert favorite competitors"
  ON public.favorite_competitors FOR INSERT
  WITH CHECK (
    organization_id IS NULL 
    OR public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Org members can delete favorite competitors"
  ON public.favorite_competitors FOR DELETE
  USING (
    organization_id IS NULL 
    OR public.is_org_member(auth.uid(), organization_id)
  );

-- Add updated_at trigger
CREATE TRIGGER update_favorite_competitors_updated_at
  BEFORE UPDATE ON public.favorite_competitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_favorite_competitors_org ON public.favorite_competitors(organization_id);
CREATE INDEX idx_favorite_competitors_industry ON public.favorite_competitors(industry);