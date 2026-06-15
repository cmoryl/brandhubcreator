-- ============================================================
-- Canva Connect API sync: tables for templates + OAuth tokens
-- ============================================================

-- Synced template inventory (mirrors Canva brand templates)
CREATE TABLE public.canva_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canva_id TEXT NOT NULL UNIQUE,
  title TEXT,
  design_type TEXT,
  thumbnail_url TEXT,
  view_url TEXT,
  edit_url TEXT,
  width INTEGER,
  height INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  raw JSONB DEFAULT '{}'::jsonb,
  canva_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.canva_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canva_templates TO authenticated;
GRANT ALL ON public.canva_templates TO service_role;

ALTER TABLE public.canva_templates ENABLE ROW LEVEL SECURITY;

-- Templates are public reference data (the audit page is public HTML)
CREATE POLICY "Anyone can view canva templates"
ON public.canva_templates FOR SELECT
USING (true);

-- Only admins can mutate from the client (sync runs via service_role in edge fn)
CREATE POLICY "Admins can modify canva templates"
ON public.canva_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE TRIGGER update_canva_templates_updated_at
BEFORE UPDATE ON public.canva_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_canva_templates_synced_at ON public.canva_templates(synced_at DESC);
CREATE INDEX idx_canva_templates_design_type ON public.canva_templates(design_type);

-- ============================================================
-- OAuth tokens (singleton row per integration name)
-- Stores refresh + access tokens for the Canva Connect app
-- ============================================================
CREATE TABLE public.canva_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL UNIQUE DEFAULT 'default',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  connected_by UUID,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tokens are sensitive: NO anon access. Only service_role (edge functions) reads them.
-- Admins can see connection status via a SECURITY DEFINER function (no token leak).
GRANT ALL ON public.canva_oauth_tokens TO service_role;

ALTER TABLE public.canva_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- No client-facing policies — only service_role reaches this table.

CREATE TRIGGER update_canva_oauth_tokens_updated_at
BEFORE UPDATE ON public.canva_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper for the UI to check whether Canva is connected (without exposing tokens)
CREATE OR REPLACE FUNCTION public.canva_connection_status()
RETURNS TABLE(connected BOOLEAN, connected_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, scope TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TRUE AS connected,
    t.connected_at,
    t.expires_at,
    t.scope
  FROM public.canva_oauth_tokens t
  WHERE t.integration_name = 'default'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.canva_connection_status() TO anon, authenticated;