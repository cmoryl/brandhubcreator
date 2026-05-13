CREATE TABLE IF NOT EXISTS public.ai_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  function_name text NOT NULL,
  purpose text,
  model text NOT NULL,
  status_code integer NOT NULL,
  error_code text,
  duration_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  user_id uuid,
  organization_id uuid,
  entity_type text,
  entity_id uuid
);

CREATE INDEX IF NOT EXISTS ai_call_log_created_at_idx ON public.ai_call_log (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_call_log_function_idx ON public.ai_call_log (function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_call_log_org_idx ON public.ai_call_log (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_call_log_error_idx ON public.ai_call_log (error_code) WHERE error_code IS NOT NULL;

ALTER TABLE public.ai_call_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_call_log_admin_read
  ON public.ai_call_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );