-- Create QR codes table for storing multiple QR codes per entity
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  fg_color TEXT NOT NULL DEFAULT '#000000',
  bg_color TEXT NOT NULL DEFAULT '#ffffff',
  logo_url TEXT,
  logo_type TEXT DEFAULT 'none', -- 'none', 'brand', 'custom'
  size INTEGER NOT NULL DEFAULT 256,
  error_correction TEXT NOT NULL DEFAULT 'M', -- 'L', 'M', 'Q', 'H'
  use_case TEXT, -- 'event', 'product', 'marketing', 'contact', 'wifi', 'other'
  is_active BOOLEAN NOT NULL DEFAULT true,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_qr_codes_entity ON public.qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_org ON public.qr_codes(organization_id);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization members
CREATE POLICY "Org members can view QR codes"
  ON public.qr_codes
  FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org members can create QR codes"
  ON public.qr_codes
  FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can update QR codes"
  ON public.qr_codes
  FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org admins can delete QR codes"
  ON public.qr_codes
  FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();