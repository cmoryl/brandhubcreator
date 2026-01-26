-- Allow org members to upload backups to their org folder
CREATE POLICY "Org members can upload backups"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-backups'
  AND (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow org members to delete their backups
CREATE POLICY "Org members can delete their backups"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-backups'
  AND (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);