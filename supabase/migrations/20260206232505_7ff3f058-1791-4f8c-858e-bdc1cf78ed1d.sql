-- Add enhanced audit logging columns for robust activity tracking
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS outcome text DEFAULT 'success',
ADD COLUMN IF NOT EXISTS browser text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS target_user_id uuid,
ADD COLUMN IF NOT EXISTS target_user_email text,
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS old_value jsonb,
ADD COLUMN IF NOT EXISTS new_value jsonb;

-- Add check constraint for outcome values
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_outcome_check 
CHECK (outcome IN ('success', 'failure', 'partial'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON public.audit_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);

-- Update the insert_audit_log function to support new fields
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_brand_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_action_type text DEFAULT NULL,
  p_entity_name text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_outcome text DEFAULT 'success',
  p_browser text DEFAULT NULL,
  p_device_type text DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_target_user_email text DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user email from profiles
  SELECT email INTO v_user_email FROM public.profiles WHERE user_id = v_user_id;
  
  -- Validate brand access if brand_id provided
  IF p_brand_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.brands b
      LEFT JOIN public.organization_members om ON om.organization_id = b.organization_id
      WHERE b.id = p_brand_id
      AND (
        om.user_id = v_user_id
        OR b.organization_id IS NULL
        OR public.has_role(v_user_id, 'admin')
      )
    ) THEN
      RAISE EXCEPTION 'Access denied to brand';
    END IF;
  END IF;
  
  -- Insert the audit log with all new fields
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    brand_id,
    entity_type,
    action_type,
    entity_name,
    details,
    outcome,
    browser,
    device_type,
    session_id,
    target_user_id,
    target_user_email,
    organization_id,
    old_value,
    new_value
  ) VALUES (
    v_user_id,
    v_user_email,
    p_brand_id,
    p_entity_type,
    p_action_type,
    p_entity_name,
    p_details,
    COALESCE(p_outcome, 'success'),
    p_browser,
    p_device_type,
    p_session_id,
    p_target_user_id,
    p_target_user_email,
    p_organization_id,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Update the safe view to include new fields (without PII)
DROP VIEW IF EXISTS public.audit_logs_safe;
CREATE VIEW public.audit_logs_safe AS
SELECT 
  id,
  user_id,
  brand_id,
  entity_type,
  action_type,
  entity_name,
  details,
  outcome,
  device_type,
  organization_id,
  created_at
FROM public.audit_logs;