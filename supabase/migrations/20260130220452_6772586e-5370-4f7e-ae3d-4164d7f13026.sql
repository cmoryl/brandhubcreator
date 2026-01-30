-- Create table to track organization images
CREATE TABLE public.organization_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Logos', 'Backgrounds', 'Product Images', 'Icons', 'General')),
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_images ENABLE ROW LEVEL SECURITY;

-- Policies: org members can view, upload, and delete their org's images
CREATE POLICY "Org members can view images"
  ON public.organization_images FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can upload images"
  ON public.organization_images FOR INSERT
  WITH CHECK (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can update images"
  ON public.organization_images FOR UPDATE
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can delete images"
  ON public.organization_images FOR DELETE
  USING (is_org_member(organization_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_org_images_org_id ON public.organization_images(organization_id);
CREATE INDEX idx_org_images_category ON public.organization_images(category);

-- Trigger for updated_at
CREATE TRIGGER update_organization_images_updated_at
  BEFORE UPDATE ON public.organization_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for org image library
INSERT INTO storage.buckets (id, name, public) 
VALUES ('org-image-library', 'org-image-library', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for org-image-library bucket
CREATE POLICY "Public read access for org-image-library"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-image-library');

CREATE POLICY "Org members can upload to org-image-library"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-image-library' 
    AND is_org_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

CREATE POLICY "Org members can update in org-image-library"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-image-library' 
    AND is_org_member((storage.foldername(name))[1]::uuid, auth.uid())
  );

CREATE POLICY "Org members can delete from org-image-library"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-image-library' 
    AND is_org_member((storage.foldername(name))[1]::uuid, auth.uid())
  );