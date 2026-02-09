-- Fix overly permissive RLS policies - replace FOR ALL with specific operations

-- localization_target_languages: drop the ALL policy and create specific ones
DROP POLICY IF EXISTS "Org admins can manage target languages" ON public.localization_target_languages;

CREATE POLICY "Org admins can insert target languages"
  ON public.localization_target_languages FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update target languages"
  ON public.localization_target_languages FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete target languages"
  ON public.localization_target_languages FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- localization_jobs: drop the ALL policy and create specific ones
DROP POLICY IF EXISTS "Org admins can manage jobs" ON public.localization_jobs;

CREATE POLICY "Org admins can insert jobs"
  ON public.localization_jobs FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update jobs"
  ON public.localization_jobs FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete jobs"
  ON public.localization_jobs FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- localization_cache: drop the ALL policy and create specific ones
DROP POLICY IF EXISTS "Org admins can manage cache" ON public.localization_cache;

CREATE POLICY "Org admins can insert cache"
  ON public.localization_cache FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update cache"
  ON public.localization_cache FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete cache"
  ON public.localization_cache FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- localized_content: drop the ALL policy and create specific ones
DROP POLICY IF EXISTS "Org admins can manage localized content" ON public.localized_content;

CREATE POLICY "Org admins can insert localized content"
  ON public.localized_content FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update localized content"
  ON public.localized_content FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete localized content"
  ON public.localized_content FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- globallink_config: drop the ALL policy and create specific ones
DROP POLICY IF EXISTS "Org admins can manage config" ON public.globallink_config;

CREATE POLICY "Org admins can insert config"
  ON public.globallink_config FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update config"
  ON public.globallink_config FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete config"
  ON public.globallink_config FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));