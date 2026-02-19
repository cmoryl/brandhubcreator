
-- Fix 1: Tighten admin_delete_user to require super_admin role
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only super_admins can delete users (destructive operation)
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  IF has_role(target_user_id, 'admin') OR has_role(target_user_id, 'super_admin') THEN
    RAISE EXCEPTION 'Cannot delete another admin user';
  END IF;

  DELETE FROM public.organization_members WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN true;
END;
$function$;

-- Fix 2: Replace always-true INSERT/UPDATE/DELETE policies on booth tables
-- booth_content_sections
DROP POLICY IF EXISTS "Authenticated users can delete booth content sections" ON public.booth_content_sections;
DROP POLICY IF EXISTS "Authenticated users can insert booth content sections" ON public.booth_content_sections;
DROP POLICY IF EXISTS "Authenticated users can update booth content sections" ON public.booth_content_sections;

CREATE POLICY "Authenticated users can delete booth content sections" ON public.booth_content_sections FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert booth content sections" ON public.booth_content_sections FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update booth content sections" ON public.booth_content_sections FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- booth_key_stats
DROP POLICY IF EXISTS "Authenticated users can delete booth key stats" ON public.booth_key_stats;
DROP POLICY IF EXISTS "Authenticated users can insert booth key stats" ON public.booth_key_stats;
DROP POLICY IF EXISTS "Authenticated users can update booth key stats" ON public.booth_key_stats;

CREATE POLICY "Authenticated users can delete booth key stats" ON public.booth_key_stats FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert booth key stats" ON public.booth_key_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update booth key stats" ON public.booth_key_stats FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- booth_variant_info
DROP POLICY IF EXISTS "Authenticated users can delete booth variant info" ON public.booth_variant_info;
DROP POLICY IF EXISTS "Authenticated users can insert booth variant info" ON public.booth_variant_info;
DROP POLICY IF EXISTS "Authenticated users can update booth variant info" ON public.booth_variant_info;

CREATE POLICY "Authenticated users can delete booth variant info" ON public.booth_variant_info FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert booth variant info" ON public.booth_variant_info FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update booth variant info" ON public.booth_variant_info FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- booth_qr_codes - was using true for public role, restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can delete booth QR codes" ON public.booth_qr_codes;
DROP POLICY IF EXISTS "Authenticated users can insert booth QR codes" ON public.booth_qr_codes;
DROP POLICY IF EXISTS "Authenticated users can update booth QR codes" ON public.booth_qr_codes;

CREATE POLICY "Authenticated users can delete booth QR codes" ON public.booth_qr_codes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert booth QR codes" ON public.booth_qr_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update booth QR codes" ON public.booth_qr_codes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- bias_awareness_scans - replace ALL true with proper auth check
DROP POLICY IF EXISTS "Service role full access to bias scans" ON public.bias_awareness_scans;

CREATE POLICY "Authenticated users can manage bias scans" ON public.bias_awareness_scans FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
