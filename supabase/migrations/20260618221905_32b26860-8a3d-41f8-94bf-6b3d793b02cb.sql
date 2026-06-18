CREATE TABLE public.svg_render_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_url_hash TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  png_transparent TEXT NOT NULL,
  png_white TEXT NOT NULL,
  png_black TEXT NOT NULL,
  sig_transparent TEXT NOT NULL,
  sig_white TEXT NOT NULL,
  sig_black TEXT NOT NULL,
  sha_transparent TEXT NOT NULL,
  sha_white TEXT NOT NULL,
  sha_black TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.svg_render_snapshots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.svg_render_snapshots TO authenticated;
GRANT ALL ON public.svg_render_snapshots TO service_role;

ALTER TABLE public.svg_render_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Snapshots are publicly readable"
  ON public.svg_render_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Admins manage snapshots"
  ON public.svg_render_snapshots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_svg_render_snapshots_updated_at
  BEFORE UPDATE ON public.svg_render_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();