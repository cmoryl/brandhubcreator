-- Add public SELECT policy for QR codes so they show on public portal pages
CREATE POLICY "Public can view QR codes for public entities"
ON public.qr_codes FOR SELECT
TO anon, authenticated
USING (
  -- Allow if the entity is public
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM public.brands WHERE brands.id = qr_codes.entity_id AND brands.is_public = true
  ))
  OR
  (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM public.products WHERE products.id = qr_codes.entity_id AND products.is_public = true
  ))
  OR
  (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM public.events WHERE events.id = qr_codes.entity_id AND events.is_public = true
  ))
  OR
  -- Keep existing org member access
  is_org_member(auth.uid(), organization_id)
  OR
  has_role(auth.uid(), 'admin'::app_role)
);