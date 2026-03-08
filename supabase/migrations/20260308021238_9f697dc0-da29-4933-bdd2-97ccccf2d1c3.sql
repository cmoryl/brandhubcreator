-- Add storage policy for booth-sprites directory
CREATE POLICY "Allow authenticated users to manage booth sprites"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-sprites')
WITH CHECK (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-sprites');

-- Also allow public read access for booth sprites (needed for texture loading in 3D scene)
CREATE POLICY "Allow public read of booth sprites"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-assets' AND (storage.foldername(name))[1] = 'booth-sprites');
