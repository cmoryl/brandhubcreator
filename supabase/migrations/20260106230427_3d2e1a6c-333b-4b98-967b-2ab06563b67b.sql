-- Update organization_members to allow null user_id for pending invites
ALTER TABLE public.organization_members 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint on invite_token for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_invite_token 
  ON public.organization_members(invite_token) WHERE invite_token IS NOT NULL;

-- Update RLS policy to allow viewing pending invites by email
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;

CREATE POLICY "Users can view members of their organizations or their invites" 
  ON public.organization_members 
  FOR SELECT 
  USING (
    is_org_member(auth.uid(), organization_id) 
    OR (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Allow users to update their own pending invite (to accept it)
CREATE POLICY "Users can accept their own invites" 
  ON public.organization_members 
  FOR UPDATE 
  USING (
    user_id IS NULL 
    AND invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );