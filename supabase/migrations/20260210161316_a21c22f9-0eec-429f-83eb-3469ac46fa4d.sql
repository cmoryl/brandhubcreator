
-- Global Client Logos - Master hub for reusable client/partner logos
CREATE TABLE public.global_client_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  website_url TEXT,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_client_logos ENABLE ROW LEVEL SECURITY;

-- Policies: org members can read, admins can write
CREATE POLICY "Org members can view global logos"
ON public.global_client_logos
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert global logos"
ON public.global_client_logos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = global_client_logos.organization_id
    AND role IN ('admin', 'owner')
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can update global logos"
ON public.global_client_logos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = global_client_logos.organization_id
    AND role IN ('admin', 'owner')
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins can delete global logos"
ON public.global_client_logos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = global_client_logos.organization_id
    AND role IN ('admin', 'owner')
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'super_admin')
);

-- Index for faster org lookups
CREATE INDEX idx_global_client_logos_org ON public.global_client_logos(organization_id);
CREATE INDEX idx_global_client_logos_category ON public.global_client_logos(category);

-- Trigger for updated_at
CREATE TRIGGER update_global_client_logos_updated_at
BEFORE UPDATE ON public.global_client_logos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
