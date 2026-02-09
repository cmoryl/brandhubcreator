/**
 * Localization Types
 * Types for GlobalLink integration and translation management
 */

export interface TargetLanguage {
  id: string;
  organization_id: string;
  language_code: string;
  language_name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LocalizationJob {
  id: string;
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event' | 'ui_label';
  entity_id: string | null;
  entity_name: string;
  source_language: string;
  target_language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  source_content: Record<string, unknown>;
  translated_content: Record<string, unknown> | null;
  translation_method: 'globallink' | 'manual' | 'machine';
  word_count: number | null;
  character_count: number | null;
  error_message: string | null;
  submitted_by: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalizationCache {
  id: string;
  organization_id: string;
  source_hash: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  context: string | null;
  hit_count: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface LocalizedContent {
  id: string;
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  language_code: string;
  localized_guide_data: Record<string, unknown>;
  translation_status: 'draft' | 'review' | 'published';
  last_synced_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalLinkConfig {
  id: string;
  organization_id: string;
  api_mode: 'demo' | 'live';
  api_endpoint: string | null;
  project_key: string | null;
  callback_url: string | null;
  default_service: string;
  auto_translate_new_content: boolean;
  preserve_formatting: boolean;
  glossary_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Common language options
export const SUPPORTED_LANGUAGES = [
  { code: 'en_US', name: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'es_ES', name: 'Spanish (Spain)' },
  { code: 'es_MX', name: 'Spanish (Mexico)' },
  { code: 'fr_FR', name: 'French (France)' },
  { code: 'fr_CA', name: 'French (Canada)' },
  { code: 'de_DE', name: 'German' },
  { code: 'it_IT', name: 'Italian' },
  { code: 'pt_BR', name: 'Portuguese (Brazil)' },
  { code: 'pt_PT', name: 'Portuguese (Portugal)' },
  { code: 'nl_NL', name: 'Dutch' },
  { code: 'pl_PL', name: 'Polish' },
  { code: 'ru_RU', name: 'Russian' },
  { code: 'zh_CN', name: 'Chinese (Simplified)' },
  { code: 'zh_TW', name: 'Chinese (Traditional)' },
  { code: 'ja_JP', name: 'Japanese' },
  { code: 'ko_KR', name: 'Korean' },
  { code: 'ar_SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'he_IL', name: 'Hebrew' },
  { code: 'tr_TR', name: 'Turkish' },
  { code: 'vi_VN', name: 'Vietnamese' },
  { code: 'th_TH', name: 'Thai' },
  { code: 'id_ID', name: 'Indonesian' },
  { code: 'ms_MY', name: 'Malay' },
  { code: 'hi_IN', name: 'Hindi' },
  { code: 'sv_SE', name: 'Swedish' },
  { code: 'da_DK', name: 'Danish' },
  { code: 'no_NO', name: 'Norwegian' },
  { code: 'fi_FI', name: 'Finnish' },
  { code: 'cs_CZ', name: 'Czech' },
  { code: 'hu_HU', name: 'Hungarian' },
  { code: 'ro_RO', name: 'Romanian' },
  { code: 'el_GR', name: 'Greek' },
  { code: 'uk_UA', name: 'Ukrainian' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Translation request payload
export interface TranslationRequest {
  source_language: string;
  target_language: string;
  content: string | Record<string, unknown>;
  context?: string;
  preserve_formatting?: boolean;
}

// Translation response
export interface TranslationResponse {
  success: boolean;
  translated_content: string | Record<string, unknown>;
  word_count?: number;
  character_count?: number;
  cached?: boolean;
  error?: string;
}
