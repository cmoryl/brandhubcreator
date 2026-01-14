-- Create audit_logs table for rate limiting the brand-audit function
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Edge functions can insert audit logs (using service role, bypasses RLS)
-- Users can insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-cleanup old audit logs (older than 30 days) to prevent table bloat
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.audit_logs 
    WHERE created_at < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;