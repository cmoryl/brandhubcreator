-- Create organization icon libraries table for hierarchical icon management
CREATE TABLE public.organization_icon_libraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'core' CHECK (level IN ('core', 'product_line', 'brand')),
  description TEXT,
  icons JSONB NOT NULL DEFAULT '[]'::jsonb,
  parent_library_id UUID REFERENCES public.organization_icon_libraries(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.organization_icon_libraries ENABLE ROW LEVEL SECURITY;

-- Create policies for organization icon libraries
CREATE POLICY "Org members can view icon libraries"
ON public.organization_icon_libraries
FOR SELECT
USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can insert icon libraries"
ON public.organization_icon_libraries
FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can update icon libraries"
ON public.organization_icon_libraries
FOR UPDATE
USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can delete icon libraries"
ON public.organization_icon_libraries
FOR DELETE
USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_org_icon_libraries_org_id ON public.organization_icon_libraries(organization_id);
CREATE INDEX idx_org_icon_libraries_level ON public.organization_icon_libraries(level);
CREATE INDEX idx_org_icon_libraries_parent ON public.organization_icon_libraries(parent_library_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_org_icon_libraries_updated_at
BEFORE UPDATE ON public.organization_icon_libraries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();