
-- Table to link icon libraries (collections) to specific brands
CREATE TABLE public.icon_library_brand_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.organization_icon_libraries(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  allow_overrides BOOLEAN NOT NULL DEFAULT true,
  color_overrides JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid(),
  UNIQUE(library_id, brand_id)
);

-- Enable RLS
ALTER TABLE public.icon_library_brand_links ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read
CREATE POLICY "Org members can view icon library brand links"
ON public.icon_library_brand_links
FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: org admins can manage
CREATE POLICY "Org admins can manage icon library brand links"
ON public.icon_library_brand_links
FOR ALL
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id))
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Index for fast lookups
CREATE INDEX idx_icon_library_brand_links_brand ON public.icon_library_brand_links(brand_id);
CREATE INDEX idx_icon_library_brand_links_library ON public.icon_library_brand_links(library_id);
CREATE INDEX idx_icon_library_brand_links_org ON public.icon_library_brand_links(organization_id);
