
CREATE POLICY "Admins manage client-logos folder"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'client-logos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
)
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] = 'client-logos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_super_admin(auth.uid()))
);
