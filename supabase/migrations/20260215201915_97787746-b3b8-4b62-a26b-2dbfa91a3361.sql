
-- Create a table to store hero background settings for standalone pages (e.g., /booths, /about)
CREATE TABLE public.page_hero_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  hero_effect TEXT NOT NULL DEFAULT 'none',
  hero_effect_intensity TEXT NOT NULL DEFAULT 'medium',
  hero_effect_color_scheme TEXT NOT NULL DEFAULT 'cyan-purple',
  hero_effect_mode TEXT NOT NULL DEFAULT 'dark',
  hero_effect_brightness INTEGER NOT NULL DEFAULT 50,
  hero_effect_density TEXT NOT NULL DEFAULT 'normal',
  hero_effect_speed TEXT NOT NULL DEFAULT 'normal',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_hero_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read page hero settings (public pages)
CREATE POLICY "Anyone can view page hero settings"
  ON public.page_hero_settings
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (admin check done in app)
CREATE POLICY "Authenticated users can insert page hero settings"
  ON public.page_hero_settings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update page hero settings"
  ON public.page_hero_settings
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_page_hero_settings_updated_at
  BEFORE UPDATE ON public.page_hero_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
