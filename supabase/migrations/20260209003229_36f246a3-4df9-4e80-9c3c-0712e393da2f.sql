-- Fix overly permissive FOR ALL policies with granular INSERT/UPDATE/DELETE policies

-- brand_regions: Replace FOR ALL with granular policies
DROP POLICY IF EXISTS "Org admins can manage regions" ON public.brand_regions;

CREATE POLICY "Org admins can insert regions"
  ON public.brand_regions FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update regions"
  ON public.brand_regions FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete regions"
  ON public.brand_regions FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- brand_country_mappings: Replace FOR ALL with granular policies
DROP POLICY IF EXISTS "Org admins can manage country mappings" ON public.brand_country_mappings;

CREATE POLICY "Org admins can insert country mappings"
  ON public.brand_country_mappings FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update country mappings"
  ON public.brand_country_mappings FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete country mappings"
  ON public.brand_country_mappings FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- brand_regional_variants: Replace FOR ALL with granular policies
DROP POLICY IF EXISTS "Org admins can manage regional variants" ON public.brand_regional_variants;

CREATE POLICY "Org admins can insert regional variants"
  ON public.brand_regional_variants FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update regional variants"
  ON public.brand_regional_variants FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete regional variants"
  ON public.brand_regional_variants FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- globallink_product_config: Replace FOR ALL with granular policies
DROP POLICY IF EXISTS "Org admins can manage globallink config" ON public.globallink_product_config;

CREATE POLICY "Org admins can insert globallink config"
  ON public.globallink_product_config FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can update globallink config"
  ON public.globallink_product_config FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete globallink config"
  ON public.globallink_product_config FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- user_locale_preferences: Replace FOR ALL with granular policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_locale_preferences;

CREATE POLICY "Users can view their own preferences"
  ON public.user_locale_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_locale_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_locale_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_locale_preferences FOR DELETE
  USING (auth.uid() = user_id);