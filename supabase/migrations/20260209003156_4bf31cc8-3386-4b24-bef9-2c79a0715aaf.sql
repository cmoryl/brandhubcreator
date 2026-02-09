-- =============================================
-- Living Global Brand Guide: Regional Hierarchy Schema
-- Tiered: Global → Regional (Americas, EMEA, APAC) → Country
-- =============================================

-- Regional definitions (Americas, EMEA, APAC, etc.)
CREATE TABLE public.brand_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- 'americas', 'emea', 'apac', 'global'
  name TEXT NOT NULL,
  parent_region_code TEXT, -- NULL for top-level, 'americas' for US, etc.
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  cultural_context JSONB DEFAULT '{}', -- cultural notes, holidays, sensitivities
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Country-to-region mapping with cultural metadata
CREATE TABLE public.brand_country_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (US, GB, JP, etc.)
  country_name TEXT NOT NULL,
  region_code TEXT NOT NULL, -- maps to brand_regions.code
  default_language TEXT DEFAULT 'en_US',
  cultural_notes JSONB DEFAULT '{}', -- color meanings, imagery preferences, taboos
  business_context JSONB DEFAULT '{}', -- timezone, holidays, business hours
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, country_code)
);

-- Regional/Country-specific brand guide overrides
-- Uses inheritance: country inherits from region, region inherits from global
CREATE TABLE public.brand_regional_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  variant_level TEXT NOT NULL CHECK (variant_level IN ('global', 'region', 'country')),
  variant_code TEXT NOT NULL, -- 'global', 'americas', 'us', 'jp', etc.
  parent_variant_id UUID REFERENCES public.brand_regional_variants(id), -- for inheritance chain
  
  -- Override sections (NULL = inherit from parent)
  hero_override JSONB,
  identity_override JSONB,
  colors_override JSONB,
  typography_override JSONB,
  imagery_override JSONB,
  messaging_override JSONB,
  voice_override JSONB,
  logos_override JSONB,
  patterns_override JSONB,
  gradients_override JSONB,
  custom_sections_override JSONB,
  
  -- Cultural adaptation metadata
  cultural_adaptations JSONB DEFAULT '{}', -- AI-suggested adaptations
  adaptation_notes TEXT,
  
  -- GlobalLink integration
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'in_translation', 'review', 'published')),
  globallink_job_id TEXT, -- External GlobalLink job reference
  last_synced_at TIMESTAMPTZ,
  
  -- Workflow
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(entity_type, entity_id, variant_level, variant_code)
);

-- GlobalLink product integrations config per organization
CREATE TABLE public.globallink_product_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Translation (Web API)
  translation_enabled BOOLEAN DEFAULT true,
  translation_api_key_id TEXT, -- Reference to secrets
  
  -- AI (Cultural adaptation)
  ai_enabled BOOLEAN DEFAULT false,
  ai_model TEXT DEFAULT 'standard',
  ai_cultural_adaptation BOOLEAN DEFAULT true,
  ai_content_optimization BOOLEAN DEFAULT false,
  
  -- Connect (Workflow management)
  connect_enabled BOOLEAN DEFAULT false,
  connect_project_id TEXT,
  connect_workflow_template TEXT,
  
  -- Fluent (In-context editing)
  fluent_enabled BOOLEAN DEFAULT false,
  fluent_embed_key TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User locale preferences (for viewing brand guides)
CREATE TABLE public.user_locale_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preferred_region TEXT, -- 'americas', 'emea', etc.
  preferred_country TEXT, -- 'us', 'jp', etc.
  preferred_language TEXT DEFAULT 'en_US',
  show_regional_comparison BOOLEAN DEFAULT false, -- show differences across regions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.brand_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_country_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_regional_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globallink_product_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locale_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: brand_regions
CREATE POLICY "Org members can view regions"
  ON public.brand_regions FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage regions"
  ON public.brand_regions FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- RLS Policies: brand_country_mappings
CREATE POLICY "Org members can view country mappings"
  ON public.brand_country_mappings FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage country mappings"
  ON public.brand_country_mappings FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- RLS Policies: brand_regional_variants
CREATE POLICY "Org members can view regional variants"
  ON public.brand_regional_variants FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage regional variants"
  ON public.brand_regional_variants FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- RLS Policies: globallink_product_config
CREATE POLICY "Org members can view globallink config"
  ON public.globallink_product_config FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage globallink config"
  ON public.globallink_product_config FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- RLS Policies: user_locale_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_locale_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_brand_regions_org ON public.brand_regions(organization_id);
CREATE INDEX idx_brand_country_mappings_org ON public.brand_country_mappings(organization_id);
CREATE INDEX idx_brand_country_mappings_region ON public.brand_country_mappings(region_code);
CREATE INDEX idx_brand_regional_variants_entity ON public.brand_regional_variants(entity_type, entity_id);
CREATE INDEX idx_brand_regional_variants_org ON public.brand_regional_variants(organization_id);
CREATE INDEX idx_brand_regional_variants_variant ON public.brand_regional_variants(variant_level, variant_code);

-- Triggers for updated_at
CREATE TRIGGER update_brand_regions_updated_at
  BEFORE UPDATE ON public.brand_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_country_mappings_updated_at
  BEFORE UPDATE ON public.brand_country_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_regional_variants_updated_at
  BEFORE UPDATE ON public.brand_regional_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_globallink_product_config_updated_at
  BEFORE UPDATE ON public.globallink_product_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_locale_preferences_updated_at
  BEFORE UPDATE ON public.user_locale_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();