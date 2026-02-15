
-- Table to store admin-uploaded booth images that override the hardcoded defaults
CREATE TABLE public.booth_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(division_id, variant_label)
);

ALTER TABLE public.booth_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booth images"
  ON public.booth_images FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage booth images"
  ON public.booth_images FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_booth_images_updated_at
  BEFORE UPDATE ON public.booth_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
