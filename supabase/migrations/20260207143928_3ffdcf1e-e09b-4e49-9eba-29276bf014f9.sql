-- Create presentation_templates table for persistent storage
CREATE TABLE public.presentation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'brand' CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  slides JSONB NOT NULL DEFAULT '[]',
  category TEXT DEFAULT 'corporate',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups by entity
CREATE INDEX idx_presentation_templates_entity ON public.presentation_templates(entity_type, entity_id);
CREATE INDEX idx_presentation_templates_org ON public.presentation_templates(organization_id);

-- Enable RLS
ALTER TABLE public.presentation_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view presentations
CREATE POLICY "Organization members can view presentations"
ON public.presentation_templates
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Organization members can insert presentations
CREATE POLICY "Organization members can insert presentations"
ON public.presentation_templates
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Organization members can update presentations
CREATE POLICY "Organization members can update presentations"
ON public.presentation_templates
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Organization members can delete presentations
CREATE POLICY "Organization members can delete presentations"
ON public.presentation_templates
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_presentation_templates_updated_at
BEFORE UPDATE ON public.presentation_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();