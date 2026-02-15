-- Allow authenticated users to upload booth images to organization-assets bucket
CREATE POLICY "Authenticated users can upload booth images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-images'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update booth images
CREATE POLICY "Authenticated users can update booth images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-images'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete booth images
CREATE POLICY "Authenticated users can delete booth images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'booth-images'
  AND auth.uid() IS NOT NULL
);