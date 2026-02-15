
-- Table to store admin-created custom booth divisions
CREATE TABLE public.booth_custom_divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'hsl(200, 70%, 45%)',
  icon_name TEXT NOT NULL DEFAULT 'Building2',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  services TEXT[] NOT NULL DEFAULT '{}',
  display_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.booth_custom_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom divisions"
  ON public.booth_custom_divisions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage custom divisions"
  ON public.booth_custom_divisions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_booth_custom_divisions_updated_at
  BEFORE UPDATE ON public.booth_custom_divisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
