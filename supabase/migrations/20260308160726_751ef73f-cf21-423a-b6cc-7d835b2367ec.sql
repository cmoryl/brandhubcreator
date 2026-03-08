
-- Booth brand presets: stores per-division brand overrides for quick switching
CREATE TABLE public.booth_brand_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id TEXT NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  preset_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Brand identity
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  logo_url TEXT,
  -- Content overrides
  headline TEXT,
  tagline TEXT,
  messaging JSONB DEFAULT '[]'::jsonb,
  -- Panel graphic URLs mapped by panel position
  panel_graphics JSONB DEFAULT '{}'::jsonb,
  -- Screen content URLs for monitors/TVs
  screen_content JSONB DEFAULT '{}'::jsonb,
  -- Full override blob for custom fields
  overrides JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by division
CREATE INDEX idx_booth_brand_presets_division ON public.booth_brand_presets(division_id);

-- Auto-update timestamp
CREATE TRIGGER set_booth_brand_presets_updated_at
  BEFORE UPDATE ON public.booth_brand_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.booth_brand_presets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read booth brand presets"
  ON public.booth_brand_presets FOR SELECT TO authenticated
  USING (true);

-- Admins/super_admins can manage
CREATE POLICY "Admins can manage booth brand presets"
  ON public.booth_brand_presets FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid())
  );
