-- Fix: The existing "Admins can manage DataForce config" policy only has a USING clause 
-- but no WITH CHECK clause, which causes INSERT/UPDATE to fail silently.
-- Drop and recreate with both USING and WITH CHECK.

DROP POLICY IF EXISTS "Admins can manage DataForce config" ON public.dataforce_config;

CREATE POLICY "Admins can manage DataForce config"
ON public.dataforce_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = dataforce_config.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = dataforce_config.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);