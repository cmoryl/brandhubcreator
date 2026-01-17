-- Fix missing authenticated SELECT access for brands/products

-- Brands: allow authenticated users to view brands they own or that belong to orgs they are members of.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='brands' AND policyname='Users can view brands they own or in their organizations'
  ) THEN
    CREATE POLICY "Users can view brands they own or in their organizations"
    ON public.brands
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::public.app_role)
      OR user_id = auth.uid()
      OR (
        organization_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.organization_id = brands.organization_id
            AND om.user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- Products: allow authenticated users to view products they own or that belong to orgs they are members of.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='products' AND policyname='Users can view products they own or in their organizations'
  ) THEN
    CREATE POLICY "Users can view products they own or in their organizations"
    ON public.products
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::public.app_role)
      OR user_id = auth.uid()
      OR (
        organization_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.organization_members om
          WHERE om.organization_id = products.organization_id
            AND om.user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;
