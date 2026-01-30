-- Create universe_backups table for storing Product Universe configurations
CREATE TABLE public.universe_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  universe_type TEXT NOT NULL CHECK (universe_type IN ('globallink', 'transperfect', 'custom')),
  universe_name TEXT NOT NULL,
  backup_name TEXT NOT NULL,
  backup_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_universe_backups_type ON public.universe_backups(universe_type);
CREATE INDEX idx_universe_backups_org ON public.universe_backups(organization_id);

-- Enable RLS
ALTER TABLE public.universe_backups ENABLE ROW LEVEL SECURITY;

-- Org members can view backups
CREATE POLICY "Org members can view universe backups"
  ON public.universe_backups
  FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Org admins can create backups
CREATE POLICY "Org admins can create universe backups"
  ON public.universe_backups
  FOR INSERT
  WITH CHECK (
    is_org_admin(auth.uid(), organization_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Org admins can update backups
CREATE POLICY "Org admins can update universe backups"
  ON public.universe_backups
  FOR UPDATE
  USING (
    is_org_admin(auth.uid(), organization_id) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Org admins can delete non-default backups
CREATE POLICY "Org admins can delete universe backups"
  ON public.universe_backups
  FOR DELETE
  USING (
    (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role))
    AND is_default = false
  );

-- Add trigger for updated_at
CREATE TRIGGER update_universe_backups_updated_at
  BEFORE UPDATE ON public.universe_backups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();