
CREATE TABLE public.expo_booth_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  variant_label TEXT NOT NULL DEFAULT 'default',
  event_name TEXT,
  event_date DATE,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Predicted metrics (from simulation)
  predicted_traffic INTEGER,
  predicted_dwell_time_seconds INTEGER,
  predicted_peak_capacity INTEGER,
  predicted_visibility_score INTEGER,
  simulation_data JSONB DEFAULT '{}'::jsonb,
  
  -- Actual post-show metrics
  actual_leads_captured INTEGER DEFAULT 0,
  actual_demos_given INTEGER DEFAULT 0,
  actual_dwell_time_seconds INTEGER,
  actual_traffic_estimate INTEGER,
  actual_peak_visitors INTEGER,
  actual_engagement_rate NUMERIC(5,2),
  
  -- Breakdown data
  leads_by_source JSONB DEFAULT '[]'::jsonb,
  demos_by_station JSONB DEFAULT '[]'::jsonb,
  traffic_by_hour JSONB DEFAULT '[]'::jsonb,
  engagement_by_zone JSONB DEFAULT '[]'::jsonb,
  
  -- Qualitative
  top_performing_panels JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expo_booth_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view booth analytics"
  ON public.expo_booth_analytics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Org members can insert booth analytics"
  ON public.expo_booth_analytics FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NULL 
    OR public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins can update booth analytics"
  ON public.expo_booth_analytics FOR UPDATE TO authenticated
  USING (
    organization_id IS NULL 
    OR public.is_org_admin(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins can delete booth analytics"
  ON public.expo_booth_analytics FOR DELETE TO authenticated
  USING (
    organization_id IS NULL 
    OR public.is_org_admin(auth.uid(), organization_id)
  );

-- Updated_at trigger
CREATE TRIGGER update_expo_booth_analytics_updated_at
  BEFORE UPDATE ON public.expo_booth_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
