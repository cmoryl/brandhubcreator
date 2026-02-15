
-- Create booth_variant_info table for per-variant about sections
CREATE TABLE public.booth_variant_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(division_id, variant_label)
);

-- Enable RLS
ALTER TABLE public.booth_variant_info ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view booth variant info"
  ON public.booth_variant_info FOR SELECT USING (true);

-- Authenticated write
CREATE POLICY "Authenticated users can insert booth variant info"
  ON public.booth_variant_info FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update booth variant info"
  ON public.booth_variant_info FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete booth variant info"
  ON public.booth_variant_info FOR DELETE TO authenticated USING (true);
