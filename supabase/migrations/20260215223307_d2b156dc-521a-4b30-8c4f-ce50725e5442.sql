
CREATE TABLE public.booth_gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booth_gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booth gallery photos"
  ON public.booth_gallery_photos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage booth gallery photos"
  ON public.booth_gallery_photos FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
