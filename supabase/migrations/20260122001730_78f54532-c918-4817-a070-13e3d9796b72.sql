-- Allow organization owners to delete their organizations
CREATE POLICY "Org owners can delete their organization"
ON public.organizations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'owner'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);