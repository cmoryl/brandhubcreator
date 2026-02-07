-- Fix the org-image-library RLS policies - arguments to is_org_member were swapped
-- Function signature: is_org_member(_user_id uuid, _org_id uuid)
-- Current policies incorrectly pass (org_id, user_id) instead of (user_id, org_id)

-- Drop and recreate INSERT policy with correct argument order
DROP POLICY IF EXISTS "Org members can upload to org-image-library" ON storage.objects;
CREATE POLICY "Org members can upload to org-image-library"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-image-library' 
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- Drop and recreate UPDATE policy with correct argument order
DROP POLICY IF EXISTS "Org members can update in org-image-library" ON storage.objects;
CREATE POLICY "Org members can update in org-image-library"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'org-image-library' 
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- Drop and recreate DELETE policy with correct argument order
DROP POLICY IF EXISTS "Org members can delete from org-image-library" ON storage.objects;
CREATE POLICY "Org members can delete from org-image-library"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'org-image-library' 
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);