
CREATE TABLE public.cfd_palette_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  variant TEXT NOT NULL CHECK (variant IN ('a','b','c')),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cfd_palette_votes TO anon, authenticated;
GRANT ALL ON public.cfd_palette_votes TO service_role;

ALTER TABLE public.cfd_palette_votes ENABLE ROW LEVEL SECURITY;

-- Anyone may read aggregate-friendly rows; no PII stored.
CREATE POLICY "Public can read palette votes"
  ON public.cfd_palette_votes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Writes go exclusively through the SECURITY DEFINER RPC below.
-- No INSERT/UPDATE/DELETE policy → table is write-locked for anon/authenticated.

CREATE OR REPLACE FUNCTION public.cast_palette_vote(
  p_visitor_id TEXT,
  p_variant TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tally JSONB;
BEGIN
  IF p_visitor_id IS NULL OR length(p_visitor_id) < 8 OR length(p_visitor_id) > 64 THEN
    RAISE EXCEPTION 'invalid visitor_id';
  END IF;
  IF p_variant NOT IN ('a','b','c') THEN
    RAISE EXCEPTION 'invalid variant';
  END IF;

  INSERT INTO public.cfd_palette_votes (visitor_id, variant, user_agent)
  VALUES (p_visitor_id, p_variant, left(coalesce(p_user_agent,''), 200))
  ON CONFLICT (visitor_id) DO UPDATE
    SET variant = EXCLUDED.variant,
        user_agent = EXCLUDED.user_agent,
        updated_at = now();

  SELECT jsonb_object_agg(variant, c) INTO v_tally
  FROM (
    SELECT variant, COUNT(*)::int AS c
    FROM public.cfd_palette_votes
    GROUP BY variant
  ) t;

  RETURN coalesce(v_tally, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_palette_vote(TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_palette_tally()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_object_agg(variant, c),
    '{}'::jsonb
  )
  FROM (
    SELECT variant, COUNT(*)::int AS c
    FROM public.cfd_palette_votes
    GROUP BY variant
  ) t;
$$;

GRANT EXECUTE ON FUNCTION public.get_palette_tally() TO anon, authenticated;
