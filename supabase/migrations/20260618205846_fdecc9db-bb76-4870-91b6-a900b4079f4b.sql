
CREATE TABLE public.logo_audit_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_id UUID NOT NULL REFERENCES public.global_client_logos(id) ON DELETE CASCADE,
  lockup TEXT NOT NULL,
  variant TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'reviewed' CHECK (status IN ('pending','reviewed','approved','rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX logo_audit_reviews_unique_slot
  ON public.logo_audit_reviews (logo_id, lockup, variant, COALESCE(file_url, ''));

CREATE INDEX logo_audit_reviews_logo_idx ON public.logo_audit_reviews (logo_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.logo_audit_reviews TO authenticated;
GRANT ALL ON public.logo_audit_reviews TO service_role;

ALTER TABLE public.logo_audit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read audit reviews"
  ON public.logo_audit_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert audit reviews"
  ON public.logo_audit_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update audit reviews"
  ON public.logo_audit_reviews
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete audit reviews"
  ON public.logo_audit_reviews
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER logo_audit_reviews_set_updated_at
  BEFORE UPDATE ON public.logo_audit_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
