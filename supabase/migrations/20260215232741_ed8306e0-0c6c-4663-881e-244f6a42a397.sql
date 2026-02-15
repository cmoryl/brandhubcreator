
CREATE TABLE public.booth_color_palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  colors TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NULL,
  UNIQUE(division_id)
);

ALTER TABLE public.booth_color_palettes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booth color palettes"
  ON public.booth_color_palettes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage booth color palettes"
  ON public.booth_color_palettes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
