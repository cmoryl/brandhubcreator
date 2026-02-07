-- Fix argument order in RLS policies for public.organization_images
-- Current policies call is_org_member(organization_id, auth.uid()) but function expects (user_id, org_id)

-- Ensure RLS is enabled
ALTER TABLE public.organization_images ENABLE ROW LEVEL SECURITY;

-- Drop existing (incorrect) policies
DROP POLICY IF EXISTS "Org members can view images" ON public.organization_images;
DROP POLICY IF EXISTS "Org members can upload images" ON public.organization_images;
DROP POLICY IF EXISTS "Org members can update images" ON public.organization_images;
DROP POLICY IF EXISTS "Org members can delete images" ON public.organization_images;

-- Recreate policies with correct argument order
CREATE POLICY "Org members can view images"
ON public.organization_images
FOR SELECT
USING (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Org members can upload images"
ON public.organization_images
FOR INSERT
WITH CHECK (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Org members can update images"
ON public.organization_images
FOR UPDATE
USING (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Org members can delete images"
ON public.organization_images
FOR DELETE
USING (
  is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);
