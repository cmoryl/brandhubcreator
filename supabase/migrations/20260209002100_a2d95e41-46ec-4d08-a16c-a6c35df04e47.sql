-- ============================================================
-- GlobalLink Localization System
-- ============================================================

-- Target languages configuration per organization
CREATE TABLE public.localization_target_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL, -- e.g., 'fr_FR', 'de_DE', 'ja_JP'
  language_name TEXT NOT NULL, -- e.g., 'French (France)', 'German', 'Japanese'
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, language_code)
);

-- Translation jobs tracking
CREATE TABLE public.localization_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event', 'ui_label')),
  entity_id UUID, -- nullable for UI labels
  entity_name TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en_US',
  target_language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  source_content JSONB NOT NULL, -- original content
  translated_content JSONB, -- translated result
  translation_method TEXT DEFAULT 'globallink' CHECK (translation_method IN ('globallink', 'manual', 'machine')),
  word_count INTEGER,
  character_count INTEGER,
  error_message TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Translation cache for quick lookups
CREATE TABLE public.localization_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_hash TEXT NOT NULL, -- hash of source content for lookup
  source_language TEXT NOT NULL DEFAULT 'en_US',
  target_language TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT, -- optional context for translation
  hit_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, source_hash, target_language)
);

-- Localized content storage (full guide translations)
CREATE TABLE public.localized_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  localized_guide_data JSONB NOT NULL,
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'review', 'published')),
  last_synced_at TIMESTAMPTZ, -- when source content was last synced
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  published_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, language_code)
);

-- GlobalLink configuration per organization
CREATE TABLE public.globallink_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  api_mode TEXT NOT NULL DEFAULT 'demo' CHECK (api_mode IN ('demo', 'live')),
  api_endpoint TEXT,
  project_key TEXT, -- encrypted in secrets, this is just a reference
  callback_url TEXT,
  default_service TEXT DEFAULT 'mt', -- machine translation
  auto_translate_new_content BOOLEAN DEFAULT false,
  preserve_formatting BOOLEAN DEFAULT true,
  glossary_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.localization_target_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localization_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.globallink_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies: org members can read, admins can write
CREATE POLICY "Org members can view target languages"
  ON public.localization_target_languages FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage target languages"
  ON public.localization_target_languages FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view jobs"
  ON public.localization_jobs FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage jobs"
  ON public.localization_jobs FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view cache"
  ON public.localization_cache FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage cache"
  ON public.localization_cache FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view localized content"
  ON public.localized_content FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage localized content"
  ON public.localized_content FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can view config"
  ON public.globallink_config FOR SELECT
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can manage config"
  ON public.globallink_config FOR ALL
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_localization_target_languages_updated_at
  BEFORE UPDATE ON public.localization_target_languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localization_jobs_updated_at
  BEFORE UPDATE ON public.localization_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localization_cache_updated_at
  BEFORE UPDATE ON public.localization_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localized_content_updated_at
  BEFORE UPDATE ON public.localized_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_globallink_config_updated_at
  BEFORE UPDATE ON public.globallink_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_localization_jobs_entity ON public.localization_jobs(entity_type, entity_id);
CREATE INDEX idx_localization_jobs_status ON public.localization_jobs(status);
CREATE INDEX idx_localization_jobs_org ON public.localization_jobs(organization_id);
CREATE INDEX idx_localization_cache_lookup ON public.localization_cache(source_hash, target_language);
CREATE INDEX idx_localized_content_entity ON public.localized_content(entity_type, entity_id);
CREATE INDEX idx_localized_content_language ON public.localized_content(language_code);