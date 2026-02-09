/**
 * Regional Branding Types
 * Types for Living Global Brand Guide with tiered regional hierarchy
 */

export type VariantLevel = 'global' | 'region' | 'country';

export type TranslationStatus = 'draft' | 'in_translation' | 'review' | 'approved' | 'published';

export type AdaptationPriority = 'high' | 'medium' | 'low';

// Region definitions (Americas, EMEA, APAC, etc.)
export interface BrandRegion {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  parent_region_code: string | null;
  display_order: number;
  is_active: boolean;
  cultural_context: CulturalContext;
  created_at: string;
  updated_at: string;
}

// Country to region mapping
export interface BrandCountryMapping {
  id: string;
  organization_id: string;
  country_code: string;
  country_name: string;
  region_code: string;
  default_language: string;
  cultural_notes: CulturalNotes;
  business_context: BusinessContext;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Regional variant of a brand/product/event
export interface BrandRegionalVariant {
  id: string;
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  variant_level: VariantLevel;
  variant_code: string;
  parent_variant_id: string | null;
  
  // Section overrides (null = inherit)
  hero_override: Record<string, unknown> | null;
  identity_override: Record<string, unknown> | null;
  colors_override: Record<string, unknown> | null;
  typography_override: Record<string, unknown> | null;
  imagery_override: Record<string, unknown> | null;
  messaging_override: Record<string, unknown> | null;
  voice_override: Record<string, unknown> | null;
  logos_override: Record<string, unknown> | null;
  patterns_override: Record<string, unknown> | null;
  gradients_override: Record<string, unknown> | null;
  custom_sections_override: Record<string, unknown> | null;
  
  // Cultural adaptations
  cultural_adaptations: CulturalAdaptation;
  adaptation_notes: string | null;
  
  // GlobalLink integration
  translation_status: TranslationStatus;
  globallink_job_id: string | null;
  last_synced_at: string | null;
  
  // Workflow
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  
  created_at: string;
  updated_at: string;
}

// GlobalLink full suite configuration
export interface GlobalLinkProductConfig {
  id: string;
  organization_id: string;
  
  // Translation (Web API)
  translation_enabled: boolean;
  translation_api_key_id: string | null;
  
  // AI (Cultural adaptation)
  ai_enabled: boolean;
  ai_model: string;
  ai_cultural_adaptation: boolean;
  ai_content_optimization: boolean;
  
  // Connect (Workflow)
  connect_enabled: boolean;
  connect_project_id: string | null;
  connect_workflow_template: string | null;
  
  // Fluent (In-context editing)
  fluent_enabled: boolean;
  fluent_embed_key: string | null;
  
  created_at: string;
  updated_at: string;
}

// User preferences for viewing brand guides
export interface UserLocalePreference {
  id: string;
  user_id: string;
  preferred_region: string | null;
  preferred_country: string | null;
  preferred_language: string;
  show_regional_comparison: boolean;
  created_at: string;
  updated_at: string;
}

// Cultural context for regions
export interface CulturalContext {
  holidays?: string[];
  sensitivities?: string[];
  preferences?: {
    colors?: string[];
    imagery?: string[];
    themes?: string[];
  };
  notes?: string;
}

// Cultural notes for countries
export interface CulturalNotes {
  color_meanings?: Record<string, string>;
  imagery_preferences?: string[];
  taboos?: string[];
  communication_style?: string;
  formality_level?: 'formal' | 'casual' | 'mixed';
}

// Business context for countries
export interface BusinessContext {
  timezone?: string;
  holidays?: string[];
  business_hours?: string;
  currency?: string;
  date_format?: string;
  number_format?: string;
}

// AI-suggested cultural adaptation
export interface CulturalAdaptation {
  suggestions?: AdaptationSuggestion[];
  applied?: string[];
  rejected?: string[];
  confidence_score?: number;
}

export interface AdaptationSuggestion {
  id: string;
  section: LocalizableSection;
  field: string;
  original_value: unknown;
  suggested_value: unknown;
  reason: string;
  confidence: number;
  priority: AdaptationPriority;
  cultural_context?: string;
  status: 'pending' | 'applied' | 'rejected';
}

// Standard regions
export const STANDARD_REGIONS = [
  { code: 'global', name: 'Global (Default)', parent: null },
  { code: 'americas', name: 'Americas', parent: 'global' },
  { code: 'emea', name: 'Europe, Middle East & Africa', parent: 'global' },
  { code: 'apac', name: 'Asia-Pacific', parent: 'global' },
] as const;

// Common countries with their regions
export const COMMON_COUNTRIES = [
  // Americas
  { code: 'US', name: 'United States', region: 'americas', language: 'en_US' },
  { code: 'CA', name: 'Canada', region: 'americas', language: 'en_CA' },
  { code: 'MX', name: 'Mexico', region: 'americas', language: 'es_MX' },
  { code: 'BR', name: 'Brazil', region: 'americas', language: 'pt_BR' },
  
  // EMEA
  { code: 'GB', name: 'United Kingdom', region: 'emea', language: 'en_GB' },
  { code: 'DE', name: 'Germany', region: 'emea', language: 'de_DE' },
  { code: 'FR', name: 'France', region: 'emea', language: 'fr_FR' },
  { code: 'ES', name: 'Spain', region: 'emea', language: 'es_ES' },
  { code: 'IT', name: 'Italy', region: 'emea', language: 'it_IT' },
  { code: 'NL', name: 'Netherlands', region: 'emea', language: 'nl_NL' },
  { code: 'AE', name: 'UAE', region: 'emea', language: 'ar_AE' },
  { code: 'SA', name: 'Saudi Arabia', region: 'emea', language: 'ar_SA' },
  
  // APAC
  { code: 'JP', name: 'Japan', region: 'apac', language: 'ja_JP' },
  { code: 'CN', name: 'China', region: 'apac', language: 'zh_CN' },
  { code: 'KR', name: 'South Korea', region: 'apac', language: 'ko_KR' },
  { code: 'AU', name: 'Australia', region: 'apac', language: 'en_AU' },
  { code: 'IN', name: 'India', region: 'apac', language: 'hi_IN' },
  { code: 'SG', name: 'Singapore', region: 'apac', language: 'en_SG' },
] as const;

// Sections that can have regional overrides
export const LOCALIZABLE_SECTIONS = [
  'hero',
  'identity',
  'colors',
  'typography',
  'imagery',
  'messaging',
  'voice',
  'logos',
  'patterns',
  'gradients',
  'custom_sections',
] as const;

export type LocalizableSection = typeof LOCALIZABLE_SECTIONS[number];

// Resolved variant (with inheritance applied)
export interface ResolvedBrandVariant {
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  variant_code: string;
  variant_level: VariantLevel;
  resolved_guide_data: Record<string, unknown>;
  inheritance_chain: string[]; // e.g., ['global', 'americas', 'us']
  overrides_applied: LocalizableSection[];
  translation_status: TranslationStatus;
}

// Comparison view data
export interface RegionalComparison {
  section: LocalizableSection;
  global_value: unknown;
  variants: {
    code: string;
    level: VariantLevel;
    value: unknown;
    has_override: boolean;
  }[];
}
