
-- External sources for research enrichment
CREATE TABLE public.research_external_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  source_type TEXT NOT NULL DEFAULT 'url' CHECK (source_type IN ('url', 'rss')),
  last_fetched_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('brand', 'product', 'event'))
);

ALTER TABLE public.research_external_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view external sources"
  ON public.research_external_sources FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can manage external sources"
  ON public.research_external_sources FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NULL
    OR is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can update external sources"
  ON public.research_external_sources FOR UPDATE TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can delete external sources"
  ON public.research_external_sources FOR DELETE TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE TRIGGER update_research_external_sources_updated_at
  BEFORE UPDATE ON public.research_external_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Research schedules for automated recurring briefings
CREATE TABLE public.research_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL DEFAULT 'monthly' CHECK (cadence IN ('weekly', 'biweekly', 'monthly')),
  briefing_type TEXT NOT NULL DEFAULT 'weekly' CHECK (briefing_type IN ('daily', 'weekly', 'deep-dive')),
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_schedule_entity_type CHECK (entity_type IN ('brand', 'product', 'event')),
  CONSTRAINT unique_entity_schedule UNIQUE (entity_id, entity_type)
);

ALTER TABLE public.research_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view schedules"
  ON public.research_schedules FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can manage schedules"
  ON public.research_schedules FOR ALL TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE TRIGGER update_research_schedules_updated_at
  BEFORE UPDATE ON public.research_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add cross-entity and knowledge tracking columns to research_briefings
ALTER TABLE public.research_briefings 
  ADD COLUMN IF NOT EXISTS cross_entity_insights JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS knowledge_extracted BOOLEAN NOT NULL DEFAULT false;
