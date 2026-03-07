
-- Add product_id and event_id columns to icon_library_brand_links
ALTER TABLE public.icon_library_brand_links 
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'brand';

-- Make brand_id nullable (since now product_id or event_id could be the target)
ALTER TABLE public.icon_library_brand_links 
  ALTER COLUMN brand_id DROP NOT NULL;

-- Add unique constraints for product and event links
ALTER TABLE public.icon_library_brand_links 
  ADD CONSTRAINT unique_library_product UNIQUE (library_id, product_id),
  ADD CONSTRAINT unique_library_event UNIQUE (library_id, event_id);

-- Add validation trigger to ensure exactly one entity is set
CREATE OR REPLACE FUNCTION public.validate_icon_library_entity_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure exactly one of brand_id, product_id, event_id is set
  IF (
    (NEW.brand_id IS NOT NULL)::int + 
    (NEW.product_id IS NOT NULL)::int + 
    (NEW.event_id IS NOT NULL)::int
  ) != 1 THEN
    RAISE EXCEPTION 'Exactly one of brand_id, product_id, or event_id must be set';
  END IF;
  
  -- Set entity_type based on which ID is set
  IF NEW.brand_id IS NOT NULL THEN
    NEW.entity_type := 'brand';
  ELSIF NEW.product_id IS NOT NULL THEN
    NEW.entity_type := 'product';
  ELSIF NEW.event_id IS NOT NULL THEN
    NEW.entity_type := 'event';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_icon_library_entity_link_trigger
  BEFORE INSERT OR UPDATE ON public.icon_library_brand_links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_icon_library_entity_link();

-- RLS policies for product and event links (existing brand policies still apply)
CREATE POLICY "Org members can view product icon links"
  ON public.icon_library_brand_links
  FOR SELECT
  TO authenticated
  USING (
    product_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM products p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = icon_library_brand_links.product_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view event icon links"
  ON public.icon_library_brand_links
  FOR SELECT
  TO authenticated
  USING (
    event_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = icon_library_brand_links.event_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage product icon links"
  ON public.icon_library_brand_links
  FOR ALL
  TO authenticated
  USING (
    product_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM products p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = icon_library_brand_links.product_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can manage event icon links"
  ON public.icon_library_brand_links
  FOR ALL
  TO authenticated
  USING (
    event_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE e.id = icon_library_brand_links.event_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );
