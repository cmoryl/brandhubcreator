-- Add slug column to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS slug text;

-- Add slug column to products table  
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index for brand slugs within an organization
CREATE UNIQUE INDEX IF NOT EXISTS brands_org_slug_unique 
ON public.brands (organization_id, slug) 
WHERE slug IS NOT NULL;

-- Create unique index for product slugs within an organization
CREATE UNIQUE INDEX IF NOT EXISTS products_org_slug_unique 
ON public.products (organization_id, slug) 
WHERE slug IS NOT NULL;

-- Function to generate a slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
$$;

-- Populate slugs for existing brands
UPDATE public.brands 
SET slug = public.generate_slug(name)
WHERE slug IS NULL;

-- Populate slugs for existing products
UPDATE public.products 
SET slug = public.generate_slug(name)
WHERE slug IS NULL;

-- Add trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION public.set_slug_from_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for brands and products
DROP TRIGGER IF EXISTS set_brand_slug ON public.brands;
CREATE TRIGGER set_brand_slug
BEFORE INSERT ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.set_slug_from_name();

DROP TRIGGER IF EXISTS set_product_slug ON public.products;
CREATE TRIGGER set_product_slug
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_slug_from_name();