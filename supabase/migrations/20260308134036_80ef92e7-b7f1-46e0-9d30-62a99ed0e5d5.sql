
-- Expo floor plans table
CREATE TABLE public.expo_floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  venue_name TEXT,
  hall_name TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  dimensions JSONB DEFAULT '{}',
  scale_factor NUMERIC DEFAULT 1.0,
  grid_size NUMERIC DEFAULT 10,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booth placements on floor plans
CREATE TABLE public.expo_booth_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID REFERENCES public.expo_floor_plans(id) ON DELETE CASCADE NOT NULL,
  division_id TEXT,
  label TEXT NOT NULL,
  booth_size TEXT NOT NULL DEFAULT '10x10',
  x_position NUMERIC NOT NULL DEFAULT 0,
  y_position NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 100,
  height NUMERIC NOT NULL DEFAULT 100,
  rotation NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  booth_number TEXT,
  is_own_booth BOOLEAN DEFAULT false,
  is_competitor BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'standard',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Floor plan zones (traffic areas, entrances, etc.)
CREATE TABLE public.expo_floor_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID REFERENCES public.expo_floor_plans(id) ON DELETE CASCADE NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'traffic',
  label TEXT NOT NULL,
  points JSONB NOT NULL DEFAULT '[]',
  color TEXT DEFAULT '#f59e0b',
  opacity NUMERIC DEFAULT 0.3,
  intensity TEXT DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expo_floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expo_booth_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expo_floor_zones ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users in the org can manage floor plans
CREATE POLICY "Org members can manage floor plans"
  ON public.expo_floor_plans FOR ALL TO authenticated
  USING (
    organization_id IS NULL 
    OR is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    organization_id IS NULL 
    OR is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Users can manage booth placements"
  ON public.expo_booth_placements FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expo_floor_plans fp
      WHERE fp.id = floor_plan_id
      AND (
        fp.organization_id IS NULL
        OR is_org_member(auth.uid(), fp.organization_id)
        OR has_role(auth.uid(), 'admin')
        OR is_super_admin(auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expo_floor_plans fp
      WHERE fp.id = floor_plan_id
      AND (
        fp.organization_id IS NULL
        OR is_org_member(auth.uid(), fp.organization_id)
        OR has_role(auth.uid(), 'admin')
        OR is_super_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage floor zones"
  ON public.expo_floor_zones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expo_floor_plans fp
      WHERE fp.id = floor_plan_id
      AND (
        fp.organization_id IS NULL
        OR is_org_member(auth.uid(), fp.organization_id)
        OR has_role(auth.uid(), 'admin')
        OR is_super_admin(auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expo_floor_plans fp
      WHERE fp.id = floor_plan_id
      AND (
        fp.organization_id IS NULL
        OR is_org_member(auth.uid(), fp.organization_id)
        OR has_role(auth.uid(), 'admin')
        OR is_super_admin(auth.uid())
      )
    )
  );

-- Updated_at triggers
CREATE TRIGGER update_expo_floor_plans_updated_at
  BEFORE UPDATE ON public.expo_floor_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expo_booth_placements_updated_at
  BEFORE UPDATE ON public.expo_booth_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expo_floor_zones_updated_at
  BEFORE UPDATE ON public.expo_floor_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
