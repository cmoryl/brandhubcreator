-- Allow authenticated users to upload to booth-qr/ directory
CREATE POLICY "Authenticated users can upload booth qr images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-qr'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update booth-qr/ files
CREATE POLICY "Authenticated users can update booth qr images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-qr'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete booth-qr/ files
CREATE POLICY "Authenticated users can delete booth qr images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-qr'
  AND auth.uid() IS NOT NULL
);