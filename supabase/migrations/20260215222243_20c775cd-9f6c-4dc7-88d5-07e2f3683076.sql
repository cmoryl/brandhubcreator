-- Allow authenticated users to upload to booth-templates/ directory
CREATE POLICY "Authenticated users can upload booth templates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-templates'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update booth-templates/ files
CREATE POLICY "Authenticated users can update booth templates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-templates'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete booth-templates/ files
CREATE POLICY "Authenticated users can delete booth templates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-templates'
  AND auth.uid() IS NOT NULL
);