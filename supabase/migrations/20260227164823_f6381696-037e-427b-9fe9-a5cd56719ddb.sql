-- Add longitudinal_trends JSONB column to oracle_intelligence
ALTER TABLE public.oracle_intelligence
ADD COLUMN IF NOT EXISTS longitudinal_trends jsonb DEFAULT NULL;

COMMENT ON COLUMN public.oracle_intelligence.longitudinal_trends IS 'Tracks improvements, regressions, and stagnant areas across governance cycles';