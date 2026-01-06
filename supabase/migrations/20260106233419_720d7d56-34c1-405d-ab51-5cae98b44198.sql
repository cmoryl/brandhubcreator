-- Create storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true);

-- Allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload org assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_org_admin(auth.uid(), id)
  )
);

-- Allow authenticated users to update their organization's assets
CREATE POLICY "Users can update org assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_org_admin(auth.uid(), id)
  )
);

-- Allow authenticated users to delete their organization's assets
CREATE POLICY "Users can delete org assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations WHERE is_org_admin(auth.uid(), id)
  )
);

-- Allow public read access to organization assets
CREATE POLICY "Public can view org assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-assets');