
CREATE TABLE public.booth_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_svg TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.booth_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booth services" ON public.booth_services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage booth services" ON public.booth_services FOR ALL USING (auth.uid() IS NOT NULL);

-- Seed from existing services arrays in booth_custom_divisions
INSERT INTO public.booth_services (division_id, label, display_order)
SELECT d.division_id, s.label, s.ord - 1
FROM booth_custom_divisions d,
     LATERAL unnest(d.services) WITH ORDINALITY AS s(label, ord);
