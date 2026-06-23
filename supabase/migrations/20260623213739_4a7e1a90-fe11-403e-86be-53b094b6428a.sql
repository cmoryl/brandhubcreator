CREATE TABLE public.saved_gradients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  gradient JSONB NOT NULL,
  css TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_gradients TO authenticated;
GRANT ALL ON public.saved_gradients TO service_role;

ALTER TABLE public.saved_gradients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in can view public gradients"
  ON public.saved_gradients FOR SELECT
  TO authenticated
  USING (is_public = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert gradients"
  ON public.saved_gradients FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gradients"
  ON public.saved_gradients FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gradients"
  ON public.saved_gradients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_saved_gradients_category ON public.saved_gradients(category);
CREATE INDEX idx_saved_gradients_created_at ON public.saved_gradients(created_at DESC);

CREATE TRIGGER update_saved_gradients_updated_at
  BEFORE UPDATE ON public.saved_gradients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();