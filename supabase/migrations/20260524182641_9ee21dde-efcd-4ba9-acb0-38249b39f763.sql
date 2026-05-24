
-- =====================================================================
-- 1. bias_awareness_scans: drop overly permissive ALL policy + add DELETE
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can manage bias scans" ON public.bias_awareness_scans;

CREATE POLICY "Users can delete bias scans for their org"
ON public.bias_awareness_scans
FOR DELETE
USING (
  organization_id IN (
    SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
  )
);

-- =====================================================================
-- 2. booth_* tables: restrict writes to platform admins (has_role 'admin' or super_admin)
--    Public SELECT preserved. Booth content is platform-managed CMS data.
-- =====================================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'booth_images','booth_gallery_photos','booth_color_palettes','booth_services',
    'booth_section_analyses','booth_ai_analyses','booth_content_sections','booth_key_stats',
    'booth_qr_codes','booth_production_specs','booth_variant_info','booth_custom_divisions',
    'booth_download_links'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop existing write policies (we'll recreate admin-scoped ones)
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Recreate admin-only write policies
    EXECUTE format($f$
      CREATE POLICY "Admins can insert %1$I" ON public.%1$I
      FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Admins can update %1$I" ON public.%1$I
      FOR UPDATE USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
      WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Admins can delete %1$I" ON public.%1$I
      FOR DELETE USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
    $f$, t);
  END LOOP;
END $$;

-- =====================================================================
-- 3. page_hero_settings: restrict writes to platform admins
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can insert page hero settings" ON public.page_hero_settings;
DROP POLICY IF EXISTS "Authenticated users can update page hero settings" ON public.page_hero_settings;

CREATE POLICY "Admins can insert page hero settings"
ON public.page_hero_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can update page hero settings"
ON public.page_hero_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can delete page hero settings"
ON public.page_hero_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

-- =====================================================================
-- 4. expo_booth_analytics: replace true SELECT with org-scoped
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can view booth analytics" ON public.expo_booth_analytics;

CREATE POLICY "Org members can view booth analytics"
ON public.expo_booth_analytics
FOR SELECT
USING (
  organization_id IS NULL
  OR is_org_member(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

-- =====================================================================
-- 5. skill_qa_jobs + skill_qa_reports: org-scoped SELECT (+ tighten writes)
-- =====================================================================
DROP POLICY IF EXISTS "qa_jobs_select_auth" ON public.skill_qa_jobs;
DROP POLICY IF EXISTS "qa_reports_select_auth" ON public.skill_qa_reports;

CREATE POLICY "Org members can view qa jobs"
ON public.skill_qa_jobs
FOR SELECT
USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Org members can view qa reports"
ON public.skill_qa_reports
FOR SELECT
USING (
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

-- =====================================================================
-- 6. dataforce_config: restrict SELECT to org admins only (api_key exposure)
-- =====================================================================
DROP POLICY IF EXISTS "Users can view their org DataForce config" ON public.dataforce_config;

CREATE POLICY "Org admins can view DataForce config"
ON public.dataforce_config
FOR SELECT
USING (
  is_org_admin(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

-- =====================================================================
-- 7. globallink_product_config: restrict SELECT to org admins (embed key)
-- =====================================================================
DROP POLICY IF EXISTS "Org members can view globallink config" ON public.globallink_product_config;

CREATE POLICY "Org admins can view globallink config"
ON public.globallink_product_config
FOR SELECT
USING (
  is_org_admin(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

-- =====================================================================
-- 8. social_platform_credentials: restrict SELECT to org admins
-- =====================================================================
DROP POLICY IF EXISTS "Org members can view social credentials" ON public.social_platform_credentials;

CREATE POLICY "Org admins can view social credentials"
ON public.social_platform_credentials
FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role = ANY (ARRAY['admin'::text, 'owner'::text])
  )
  OR has_role(auth.uid(), 'admin')
  OR is_super_admin(auth.uid())
);

-- =====================================================================
-- 9. realtime.messages: require authentication to subscribe/broadcast
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages';

    EXECUTE $p$
      CREATE POLICY "Authenticated users can read realtime messages"
      ON realtime.messages FOR SELECT TO authenticated USING (true)
    $p$;

    EXECUTE $p$
      CREATE POLICY "Authenticated users can send realtime messages"
      ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)
    $p$;
  END IF;
END $$;
