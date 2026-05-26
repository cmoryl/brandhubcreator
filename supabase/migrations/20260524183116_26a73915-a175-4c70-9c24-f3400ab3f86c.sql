
-- 1. icon_ab_events: restrict insert to authenticated users
DROP POLICY IF EXISTS "ab_events_insert_anyone" ON public.icon_ab_events;
CREATE POLICY "ab_events_insert_authenticated"
  ON public.icon_ab_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. booth_3d_mappings: restrict writes to platform admins
DROP POLICY IF EXISTS "Authenticated users can insert booth 3d mappings" ON public.booth_3d_mappings;
DROP POLICY IF EXISTS "Authenticated users can update booth 3d mappings" ON public.booth_3d_mappings;
DROP POLICY IF EXISTS "Authenticated users can read booth 3d mappings" ON public.booth_3d_mappings;

CREATE POLICY "booth_3d_mappings_select_auth"
  ON public.booth_3d_mappings
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "booth_3d_mappings_insert_admin"
  ON public.booth_3d_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

CREATE POLICY "booth_3d_mappings_update_admin"
  ON public.booth_3d_mappings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

CREATE POLICY "booth_3d_mappings_delete_admin"
  ON public.booth_3d_mappings
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()));

-- 3. skill_qa_jobs: tighten insert (must own row)
DROP POLICY IF EXISTS "qa_jobs_insert_self" ON public.skill_qa_jobs;
CREATE POLICY "qa_jobs_insert_self"
  ON public.skill_qa_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Storage: lock down booth-* folders to platform admins for writes
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'Authenticated users can delete booth 3D specs',
        'Authenticated users can delete booth gallery images',
        'Authenticated users can delete booth images',
        'Authenticated users can delete booth qr images',
        'Authenticated users can delete booth templates',
        'Authenticated users can update booth gallery images',
        'Authenticated users can update booth images',
        'Authenticated users can update booth qr images',
        'Authenticated users can update booth templates',
        'Authenticated users can upload booth 3D specs',
        'Authenticated users can upload booth gallery images',
        'Authenticated users can upload booth images',
        'Authenticated users can upload booth qr images',
        'Authenticated users can upload booth templates'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins manage booth folders"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] IN ('booth-images','booth-qr','booth-gallery','booth-templates','booth-3d-specs')
    AND (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] IN ('booth-images','booth-qr','booth-gallery','booth-templates','booth-3d-specs')
    AND (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid()))
  );

-- 5. Revoke EXECUTE on SECURITY DEFINER functions from anon role broadly;
-- re-grant only the publicly-needed portal helpers.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant EXECUTE to anon ONLY for public portal lookup helpers
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'get_public_portal_org',
        'get_portal_org_safe',
        'get_public_organization_info',
        'get_public_org_for_portal',
        'get_public_product_data',
        'get_public_event_data',
        'get_public_brand_data',
        'get_org_slug_by_id',
        'org_has_public_brands',
        'is_slug_taken',
        'is_valid_invite_token',
        'generate_slug'
      )
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;
