
-- Intelligence Alerts table for automated score drop detection and intelligence events
CREATE TABLE public.intelligence_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID,
  entity_type TEXT, -- 'brand', 'product', 'event', 'organization'
  entity_name TEXT,
  alert_type TEXT NOT NULL, -- 'score_drop', 'synthesis_complete', 'health_warning', 'compliance_drop', 'bias_drop', 'new_insight'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_intelligence_alerts_org ON public.intelligence_alerts(organization_id);
CREATE INDEX idx_intelligence_alerts_unacked ON public.intelligence_alerts(organization_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_intelligence_alerts_created ON public.intelligence_alerts(created_at DESC);
CREATE INDEX idx_intelligence_alerts_entity ON public.intelligence_alerts(entity_id, entity_type);

-- Enable RLS
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;

-- Org members can view alerts for their org
CREATE POLICY "Org members can view alerts"
  ON public.intelligence_alerts FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins can update (acknowledge) alerts
CREATE POLICY "Org admins can update alerts"
  ON public.intelligence_alerts FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Service role inserts (edge functions) - allow insert for authenticated users who are org admins
CREATE POLICY "Org admins can insert alerts"
  ON public.intelligence_alerts FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Org admins can delete alerts
CREATE POLICY "Org admins can delete alerts"
  ON public.intelligence_alerts FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Updated_at trigger
CREATE TRIGGER update_intelligence_alerts_updated_at
  BEFORE UPDATE ON public.intelligence_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
