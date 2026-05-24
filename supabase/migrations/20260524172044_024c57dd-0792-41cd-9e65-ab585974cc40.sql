CREATE TABLE public.icon_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  brand_id uuid,
  user_id uuid,
  industry text,
  section_id text NOT NULL,
  pack text NOT NULL,
  icon_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('added','removed','exported','kit_added')),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_icon_usage_org_created ON public.icon_usage_events (organization_id, created_at DESC);
CREATE INDEX idx_icon_usage_industry_pack_name ON public.icon_usage_events (industry, pack, icon_name);
CREATE INDEX idx_icon_usage_section ON public.icon_usage_events (section_id);

ALTER TABLE public.icon_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read usage events"
  ON public.icon_usage_events
  FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert usage events"
  ON public.icon_usage_events
  FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));