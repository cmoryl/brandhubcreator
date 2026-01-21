-- Enhance audit_logs table with more detail
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS action_type text NOT NULL DEFAULT 'view',
ADD COLUMN IF NOT EXISTS entity_name text,
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_email text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- Add check constraint for valid action types
DO $$ BEGIN
  ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_action_type_check 
    CHECK (action_type IN ('create', 'update', 'delete', 'view', 'publish', 'unpublish', 'export', 'login', 'logout', 'invite', 'join'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create a function to auto-populate user_email
CREATE OR REPLACE FUNCTION public.populate_audit_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_email IS NULL THEN
    SELECT email INTO NEW.user_email FROM public.profiles WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-populate email
DROP TRIGGER IF EXISTS populate_audit_email_trigger ON public.audit_logs;
CREATE TRIGGER populate_audit_email_trigger
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_audit_user_email();

-- Update existing records with action_type based on entity_type (for migration)
UPDATE public.audit_logs 
SET action_type = 'view' 
WHERE action_type = 'view' OR action_type IS NULL;