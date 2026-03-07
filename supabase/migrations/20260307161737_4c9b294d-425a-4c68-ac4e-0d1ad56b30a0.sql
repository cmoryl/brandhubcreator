CREATE TABLE public.booth_color_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id text NOT NULL,
  variant_label text,
  colors text[] NOT NULL DEFAULT '{}',
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score integer,
  accessibility_score integer,
  production_score integer,
  psychology_data jsonb,
  recommendations jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX booth_color_analyses_division_variant_idx 
ON public.booth_color_analyses (division_id, COALESCE(variant_label, ''));

ALTER TABLE public.booth_color_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read booth color analyses" ON public.booth_color_analyses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert booth color analyses" ON public.booth_color_analyses
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update booth color analyses" ON public.booth_color_analyses
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_booth_color_analyses_updated_at
BEFORE UPDATE ON public.booth_color_analyses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();