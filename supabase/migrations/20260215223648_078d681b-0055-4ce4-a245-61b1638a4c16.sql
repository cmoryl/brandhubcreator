
-- Storage policies for booth-gallery folder
CREATE POLICY "Authenticated users can upload booth gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = 'booth-gallery'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update booth gallery images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = 'booth-gallery'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete booth gallery images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = 'booth-gallery'
    AND auth.uid() IS NOT NULL
  );
