-- Add is_suite_master column to products table
ALTER TABLE public.products 
ADD COLUMN is_suite_master boolean NOT NULL DEFAULT false;

-- Add a comment explaining the column
COMMENT ON COLUMN public.products.is_suite_master IS 'Marks products as suite masters (like GlobalLink, DigitalReef) to protect from accidental deletion';

-- Create an index for efficient filtering
CREATE INDEX idx_products_suite_master ON public.products (is_suite_master) WHERE is_suite_master = true;

-- Update GlobalLink product to be marked as suite master
UPDATE public.products 
SET is_suite_master = true 
WHERE slug = 'globallink' OR name ILIKE 'GlobalLink';

-- Create a trigger function to prevent deletion of suite masters
CREATE OR REPLACE FUNCTION public.protect_suite_master_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_suite_master = true THEN
    RAISE EXCEPTION 'Cannot delete suite master product "%". Remove suite master protection first.', OLD.name;
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger to protect suite masters from deletion
CREATE TRIGGER prevent_suite_master_deletion
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_suite_master_deletion();