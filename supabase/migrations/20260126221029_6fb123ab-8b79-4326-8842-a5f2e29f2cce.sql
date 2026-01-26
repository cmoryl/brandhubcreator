-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Org admins can insert backup history" ON backup_history;

-- Create a more permissive policy for org members
CREATE POLICY "Org members can insert backup history"
ON backup_history
FOR INSERT
TO authenticated
WITH CHECK (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);