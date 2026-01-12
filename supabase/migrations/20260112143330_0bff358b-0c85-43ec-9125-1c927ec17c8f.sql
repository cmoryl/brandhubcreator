-- Add invite_expires_at column for token expiration
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP WITH TIME ZONE;

-- Create trigger function to auto-set expiration (7 days) for new invites
CREATE OR REPLACE FUNCTION public.set_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_token IS NOT NULL AND NEW.invite_expires_at IS NULL THEN
    NEW.invite_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to set expiration on insert/update
DROP TRIGGER IF EXISTS set_invite_expiration_trigger ON public.organization_members;
CREATE TRIGGER set_invite_expiration_trigger
BEFORE INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.set_invite_expiration();

-- Create cleanup function for expired invites
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.organization_members 
    WHERE user_id IS NULL 
      AND invite_expires_at IS NOT NULL
      AND invite_expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Set expiration for existing pending invites (7 days from now)
UPDATE public.organization_members 
SET invite_expires_at = NOW() + INTERVAL '7 days'
WHERE user_id IS NULL 
  AND invite_token IS NOT NULL 
  AND invite_expires_at IS NULL;