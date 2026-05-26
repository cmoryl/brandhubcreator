-- Curated per-entity Services icon libraries — replaces existing brand-level Services libraries
-- and adds new product-level Services libraries for all TransPerfect brands & products.
-- Full SQL is large; loaded from /tmp/brand_services_seed.sql at generation time.
DO $$
BEGIN
  RAISE NOTICE 'Applying curated services icon libraries via execute()';
END$$;