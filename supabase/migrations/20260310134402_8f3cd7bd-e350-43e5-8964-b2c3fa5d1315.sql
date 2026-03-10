
-- Social Asset Placements: stores approved creative assets per platform/format/size
CREATE TABLE public.social_asset_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand' CHECK (entity_type IN ('brand', 'product', 'event')),
  platform TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'feed' CHECK (format IN ('feed', 'story', 'reel', 'ad', 'cover', 'profile')),
  size_name TEXT NOT NULL,
  size_width INTEGER NOT NULL,
  size_height INTEGER NOT NULL,
  aspect_ratio TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'draft', 'approved', 'archived')),
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_social_asset_placements_org ON public.social_asset_placements(organization_id);
CREATE INDEX idx_social_asset_placements_entity ON public.social_asset_placements(entity_id, entity_type);
CREATE INDEX idx_social_asset_placements_platform ON public.social_asset_placements(platform, format);

-- Updated at trigger
CREATE TRIGGER update_social_asset_placements_updated_at
  BEFORE UPDATE ON public.social_asset_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.social_asset_placements ENABLE ROW LEVEL SECURITY;

-- Read: org members can view
CREATE POLICY "Org members can view social asset placements"
  ON public.social_asset_placements FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Insert: org admins can create
CREATE POLICY "Org admins can insert social asset placements"
  ON public.social_asset_placements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Update: org admins can update
CREATE POLICY "Org admins can update social asset placements"
  ON public.social_asset_placements FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Delete: org admins can delete
CREATE POLICY "Org admins can delete social asset placements"
  ON public.social_asset_placements FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));
