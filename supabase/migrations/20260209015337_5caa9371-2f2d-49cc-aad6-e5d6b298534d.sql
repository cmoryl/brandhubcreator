-- Backfill parent_entity_id for existing brand_intelligence records
-- Link products and events to their parent brands

-- Update products
UPDATE brand_intelligence bi
SET parent_entity_id = p.parent_brand_id
FROM products p
WHERE bi.entity_type = 'product'
  AND bi.entity_id = p.id
  AND p.parent_brand_id IS NOT NULL
  AND bi.parent_entity_id IS NULL;

-- Update events
UPDATE brand_intelligence bi
SET parent_entity_id = e.parent_brand_id
FROM events e
WHERE bi.entity_type = 'event'
  AND bi.entity_id = e.id
  AND e.parent_brand_id IS NOT NULL
  AND bi.parent_entity_id IS NULL;

-- Create a trigger to automatically set parent_entity_id on insert
CREATE OR REPLACE FUNCTION public.set_brand_intelligence_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set parent for products and events, not brands
  IF NEW.entity_type = 'product' AND NEW.parent_entity_id IS NULL THEN
    SELECT parent_brand_id INTO NEW.parent_entity_id
    FROM products 
    WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'event' AND NEW.parent_entity_id IS NULL THEN
    SELECT parent_brand_id INTO NEW.parent_entity_id
    FROM events 
    WHERE id = NEW.entity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on brand_intelligence table
DROP TRIGGER IF EXISTS set_parent_entity_on_insert ON brand_intelligence;
CREATE TRIGGER set_parent_entity_on_insert
  BEFORE INSERT ON brand_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_brand_intelligence_parent();