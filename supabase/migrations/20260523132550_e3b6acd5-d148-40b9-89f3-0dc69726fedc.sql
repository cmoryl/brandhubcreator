
-- Icon A/B testing schema
CREATE TABLE public.icon_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  library_id UUID,
  name TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  winner_variant_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.icon_ab_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.icon_ab_tests(id) ON DELETE CASCADE,
  icon_id TEXT NOT NULL,
  label TEXT,
  svg_path TEXT,
  view_box TEXT DEFAULT '0 0 24 24',
  weight INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.icon_ab_events (
  id BIGSERIAL PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.icon_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.icon_ab_variants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  session_id TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_icon_ab_variants_test ON public.icon_ab_variants(test_id);
CREATE INDEX idx_icon_ab_events_variant ON public.icon_ab_events(variant_id, event_type);
CREATE INDEX idx_icon_ab_events_test ON public.icon_ab_events(test_id, created_at);
CREATE INDEX idx_icon_ab_tests_org ON public.icon_ab_tests(organization_id, status);

ALTER TABLE public.icon_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icon_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icon_ab_events ENABLE ROW LEVEL SECURITY;

-- Tests: org members read; org admins write
CREATE POLICY "ab_tests_select_members" ON public.icon_ab_tests
FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "ab_tests_insert_admins" ON public.icon_ab_tests
FOR INSERT WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "ab_tests_update_admins" ON public.icon_ab_tests
FOR UPDATE USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "ab_tests_delete_admins" ON public.icon_ab_tests
FOR DELETE USING (public.is_org_admin(auth.uid(), organization_id));

-- Variants follow parent test
CREATE POLICY "ab_variants_select_members" ON public.icon_ab_variants
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.icon_ab_tests t
  WHERE t.id = test_id AND public.is_org_member(auth.uid(), t.organization_id)
));

CREATE POLICY "ab_variants_write_admins" ON public.icon_ab_variants
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.icon_ab_tests t
  WHERE t.id = test_id AND public.is_org_admin(auth.uid(), t.organization_id)
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.icon_ab_tests t
  WHERE t.id = test_id AND public.is_org_admin(auth.uid(), t.organization_id)
));

-- Events: anyone (including anon visitors of a published guide) can log, members can read
CREATE POLICY "ab_events_insert_anyone" ON public.icon_ab_events
FOR INSERT WITH CHECK (true);

CREATE POLICY "ab_events_select_members" ON public.icon_ab_events
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.icon_ab_tests t
  WHERE t.id = test_id AND public.is_org_member(auth.uid(), t.organization_id)
));

CREATE TRIGGER trg_icon_ab_tests_updated
BEFORE UPDATE ON public.icon_ab_tests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregate function: per-variant impressions/clicks + winner
CREATE OR REPLACE FUNCTION public.get_icon_ab_results(p_test_id UUID)
RETURNS TABLE (
  variant_id UUID,
  label TEXT,
  impressions BIGINT,
  clicks BIGINT,
  ctr NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id AS variant_id,
    v.label,
    COALESCE(SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END), 0) AS impressions,
    COALESCE(SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
    CASE
      WHEN COALESCE(SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END), 0) = 0 THEN 0
      ELSE ROUND(
        COALESCE(SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END), 0)::numeric
        / SUM(CASE WHEN e.event_type = 'impression' THEN 1 ELSE 0 END)::numeric,
        4
      )
    END AS ctr
  FROM public.icon_ab_variants v
  LEFT JOIN public.icon_ab_events e ON e.variant_id = v.id
  WHERE v.test_id = p_test_id
  GROUP BY v.id, v.label
  ORDER BY ctr DESC, clicks DESC;
$$;
