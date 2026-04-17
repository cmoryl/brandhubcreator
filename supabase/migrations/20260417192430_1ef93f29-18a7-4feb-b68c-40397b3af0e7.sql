
-- 1. Fix RLS "Always True" policies on booth_color_analyses
DROP POLICY IF EXISTS "Authenticated users can insert booth color analyses" ON public.booth_color_analyses;
DROP POLICY IF EXISTS "Authenticated users can update booth color analyses" ON public.booth_color_analyses;

CREATE POLICY "Authenticated users can insert booth color analyses"
ON public.booth_color_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update booth color analyses"
ON public.booth_color_analyses
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid())))
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Restrict bucket listing on public buckets.
-- Public file URLs still work (Storage public URLs bypass storage.objects RLS for object reads),
-- but listing files via the Storage API now requires an authenticated org member.
DROP POLICY IF EXISTS "Public can view org assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for org-image-library" ON storage.objects;

CREATE POLICY "Org members can list organization-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "Org members can list org-image-library"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'org-image-library'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  )
);

-- 3. Add search_path to email queue helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;
