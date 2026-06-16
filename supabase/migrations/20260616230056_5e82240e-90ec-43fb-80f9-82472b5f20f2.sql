CREATE INDEX IF NOT EXISTS idx_brands_updated_at ON public.brands (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_brands_org_public_updated ON public.brands (organization_id, is_public, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_org_public_updated ON public.products (organization_id, is_public, updated_at DESC);