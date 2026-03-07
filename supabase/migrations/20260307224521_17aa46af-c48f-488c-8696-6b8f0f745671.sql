-- Storage policy for booth 3D spec uploads
CREATE POLICY "Authenticated users can upload booth 3D specs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-3d-specs');

CREATE POLICY "Authenticated users can read booth 3D specs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-3d-specs');

CREATE POLICY "Authenticated users can delete booth 3D specs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-3d-specs');