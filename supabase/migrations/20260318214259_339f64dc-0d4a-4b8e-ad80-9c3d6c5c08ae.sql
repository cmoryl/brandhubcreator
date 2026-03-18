
-- Imagery preference signals table - tracks approved, skipped, removed interactions
CREATE TABLE public.imagery_preference_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id),
  image_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'skipped', 'removed'
  image_metadata JSONB DEFAULT '{}'::jsonb, -- categories, media_type, colors, description, dimensions
  search_context JSONB DEFAULT '{}'::jsonb, -- query used, filters active, was AI suggestion
  section_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visual DNA profile - learned preferences per entity
CREATE TABLE public.imagery_visual_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id),
  preferred_categories JSONB DEFAULT '[]'::jsonb,
  preferred_colors JSONB DEFAULT '[]'::jsonb,
  preferred_styles JSONB DEFAULT '[]'::jsonb, -- photo, vector, illustration weights
  preferred_compositions JSONB DEFAULT '[]'::jsonb, -- people count, orientation preferences
  mood_keywords JSONB DEFAULT '[]'::jsonb,
  avoid_keywords JSONB DEFAULT '[]'::jsonb,
  approval_patterns JSONB DEFAULT '{}'::jsonb, -- detailed pattern analysis
  total_approved INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  total_removed INTEGER DEFAULT 0,
  last_analyzed_at TIMESTAMPTZ,
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, entity_type)
);

-- Enable RLS
ALTER TABLE public.imagery_preference_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagery_visual_dna ENABLE ROW LEVEL SECURITY;

-- RLS policies for signals
CREATE POLICY "Org members can insert signals"
  ON public.imagery_preference_signals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org members can view signals"
  ON public.imagery_preference_signals FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- RLS policies for visual DNA
CREATE POLICY "Org members can view visual DNA"
  ON public.imagery_visual_dna FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can manage visual DNA"
  ON public.imagery_visual_dna FOR ALL
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

-- Index for fast lookups
CREATE INDEX idx_imagery_signals_entity ON public.imagery_preference_signals(entity_id, entity_type);
CREATE INDEX idx_imagery_signals_image ON public.imagery_preference_signals(image_id);
CREATE INDEX idx_imagery_visual_dna_entity ON public.imagery_visual_dna(entity_id, entity_type);

-- Trigger for updated_at
CREATE TRIGGER update_imagery_visual_dna_updated_at
  BEFORE UPDATE ON public.imagery_visual_dna
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
