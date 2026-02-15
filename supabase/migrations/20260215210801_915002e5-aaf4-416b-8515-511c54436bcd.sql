
CREATE TABLE public.booth_production_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.booth_production_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booth production specs" ON public.booth_production_specs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage booth production specs" ON public.booth_production_specs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
