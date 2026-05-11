ALTER TABLE public.skill_export_history
  ADD COLUMN IF NOT EXISTS pushed_to_claude boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_status text,
  ADD COLUMN IF NOT EXISTS push_http_status integer,
  ADD COLUMN IF NOT EXISTS push_error text,
  ADD COLUMN IF NOT EXISTS anthropic_skill_id text,
  ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_skill_export_history_pushed
  ON public.skill_export_history (entity_type, entity_id, pushed_at DESC)
  WHERE pushed_to_claude = true;