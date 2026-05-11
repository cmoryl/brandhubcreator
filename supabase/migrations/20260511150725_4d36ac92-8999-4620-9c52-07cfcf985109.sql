
CREATE TABLE IF NOT EXISTS public.skill_export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  version TEXT NOT NULL,
  prev_version TEXT,
  changelog TEXT,
  diff_summary JSONB DEFAULT '{}'::jsonb,
  skill_meta JSONB DEFAULT '{}'::jsonb,
  approx_tokens INTEGER,
  file_count INTEGER,
  locales TEXT[] DEFAULT '{}',
  exported_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_export_history_entity ON public.skill_export_history(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_export_history_org ON public.skill_export_history(organization_id, created_at DESC);

ALTER TABLE public.skill_export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read skill export history"
  ON public.skill_export_history FOR SELECT
  USING (
    organization_id IS NULL
    OR public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Authenticated insert skill export history"
  ON public.skill_export_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Schedule table for CI-style QA
CREATE TABLE IF NOT EXISTS public.skill_qa_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  cadence TEXT NOT NULL DEFAULT 'weekly',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_qa_schedules_next ON public.skill_qa_schedules(next_run_at) WHERE enabled = true;

ALTER TABLE public.skill_qa_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage QA schedules"
  ON public.skill_qa_schedules FOR ALL
  USING (
    organization_id IS NULL
    OR public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    organization_id IS NULL
    OR public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_super_admin(auth.uid())
  );
