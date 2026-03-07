
CREATE TABLE public.booth_3d_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT 'u-shape',
  lighting_preset TEXT NOT NULL DEFAULT 'expo-bright',
  assignments JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  show_labels BOOLEAN NOT NULL DEFAULT true,
  show_dimensions BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(division_id)
);

ALTER TABLE public.booth_3d_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read booth 3d mappings"
  ON public.booth_3d_mappings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert booth 3d mappings"
  ON public.booth_3d_mappings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update booth 3d mappings"
  ON public.booth_3d_mappings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_booth_3d_mappings_updated_at
  BEFORE UPDATE ON public.booth_3d_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
