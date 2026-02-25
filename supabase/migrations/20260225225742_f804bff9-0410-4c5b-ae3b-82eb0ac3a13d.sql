
-- Portfolio relationships table for cross-entity intelligence mapping
CREATE TABLE public.portfolio_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL,
  source_entity_type TEXT NOT NULL CHECK (source_entity_type IN ('brand', 'product', 'event')),
  source_entity_name TEXT NOT NULL,
  target_entity_id UUID NOT NULL,
  target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('brand', 'product', 'event')),
  target_entity_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'alignment',
  strength_score NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_relationships ENABLE ROW LEVEL SECURITY;

-- Org members can view relationships
CREATE POLICY "Org members can view portfolio relationships"
ON public.portfolio_relationships FOR SELECT
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- Org admins can manage relationships
CREATE POLICY "Org admins can manage portfolio relationships"
ON public.portfolio_relationships FOR ALL
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_super_admin(auth.uid())
);

-- Indexes
CREATE INDEX idx_portfolio_relationships_org ON public.portfolio_relationships(organization_id);
CREATE INDEX idx_portfolio_relationships_source ON public.portfolio_relationships(source_entity_id);
CREATE INDEX idx_portfolio_relationships_target ON public.portfolio_relationships(target_entity_id);

-- Unique constraint to prevent duplicate relationships
CREATE UNIQUE INDEX idx_portfolio_relationships_unique 
ON public.portfolio_relationships(organization_id, source_entity_id, target_entity_id, relationship_type);

-- Updated at trigger
CREATE TRIGGER update_portfolio_relationships_updated_at
BEFORE UPDATE ON public.portfolio_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
