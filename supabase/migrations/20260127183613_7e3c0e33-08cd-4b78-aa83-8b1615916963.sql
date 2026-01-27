-- Update the upload policy to allow all organization members (not just admins)
DROP POLICY IF EXISTS "Users can upload org assets" ON storage.objects;

CREATE POLICY "Org members can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT organizations.id::text
    FROM organizations
    WHERE is_org_member(auth.uid(), organizations.id)
  )
);

-- Update the update policy to allow all organization members
DROP POLICY IF EXISTS "Users can update org assets" ON storage.objects;

CREATE POLICY "Org members can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT organizations.id::text
    FROM organizations
    WHERE is_org_member(auth.uid(), organizations.id)
  )
);

-- Update the delete policy to allow all organization members
DROP POLICY IF EXISTS "Users can delete org assets" ON storage.objects;

CREATE POLICY "Org members can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT organizations.id::text
    FROM organizations
    WHERE is_org_member(auth.uid(), organizations.id)
  )
);