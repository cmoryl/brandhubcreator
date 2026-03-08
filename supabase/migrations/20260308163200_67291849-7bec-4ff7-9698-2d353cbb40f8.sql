
-- Booth Systems: master reusable booth templates
CREATE TABLE public.booth_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booth_systems_org ON public.booth_systems(organization_id);

CREATE TRIGGER set_booth_systems_updated_at
  BEFORE UPDATE ON public.booth_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booth_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read booth systems"
  ON public.booth_systems FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage booth systems"
  ON public.booth_systems FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Booth System Variants: size variants with full snapshot data
CREATE TABLE public.booth_system_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES public.booth_systems(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_type TEXT NOT NULL DEFAULT 'inline',
  dimensions TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Full snapshot data (layout, assignments, assets, lighting, flooring, logistics)
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booth_system_variants_system ON public.booth_system_variants(system_id);

CREATE TRIGGER set_booth_system_variants_updated_at
  BEFORE UPDATE ON public.booth_system_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booth_system_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read booth system variants"
  ON public.booth_system_variants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage booth system variants"
  ON public.booth_system_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Event-to-booth-system assignments
CREATE TABLE public.booth_system_event_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  system_id UUID NOT NULL REFERENCES public.booth_systems(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.booth_system_variants(id) ON DELETE CASCADE,
  division_id TEXT,
  override_data JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, system_id)
);

CREATE INDEX idx_booth_system_event_links_event ON public.booth_system_event_links(event_id);

CREATE TRIGGER set_booth_system_event_links_updated_at
  BEFORE UPDATE ON public.booth_system_event_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booth_system_event_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read booth system event links"
  ON public.booth_system_event_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage booth system event links"
  ON public.booth_system_event_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));
