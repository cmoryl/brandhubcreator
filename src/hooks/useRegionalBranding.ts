/**
 * useRegionalBranding - Hook for managing regional brand variants
 * Supports tiered hierarchy: Global → Region → Country
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type {
  BrandRegion,
  BrandCountryMapping,
  BrandRegionalVariant,
  GlobalLinkProductConfig,
  UserLocalePreference,
  ResolvedBrandVariant,
  LocalizableSection,
  VariantLevel,
  RegionalComparison,
  AdaptationSuggestion,
} from '@/types/regionalBranding';

export function useRegionalBranding(organizationId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch regions
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['brand-regions', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('brand_regions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order');
      if (error) throw error;
      return data as BrandRegion[];
    },
    enabled: !!organizationId,
  });

  // Fetch country mappings
  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['brand-countries', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('brand_country_mappings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('country_name');
      if (error) throw error;
      return data as BrandCountryMapping[];
    },
    enabled: !!organizationId,
  });

  // Fetch GlobalLink product config
  const { data: glProductConfig, isLoading: configLoading } = useQuery({
    queryKey: ['globallink-product-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('globallink_product_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as GlobalLinkProductConfig | null;
    },
    enabled: !!organizationId,
  });

  // Add region
  const addRegion = useMutation({
    mutationFn: async (region: { code: string; name: string; parent_region_code?: string }) => {
      if (!organizationId) throw new Error('Organization required');
      const { error } = await supabase
        .from('brand_regions')
        .insert({
          organization_id: organizationId,
          code: region.code,
          name: region.name,
          parent_region_code: region.parent_region_code || null,
          display_order: regions.length,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-regions', organizationId] });
      toast.success('Region added');
    },
    onError: (error) => {
      toast.error(`Failed to add region: ${error.message}`);
    },
  });

  // Add country mapping
  const addCountry = useMutation({
    mutationFn: async (country: {
      country_code: string;
      country_name: string;
      region_code: string;
      default_language?: string;
    }) => {
      if (!organizationId) throw new Error('Organization required');
      const { error } = await supabase
        .from('brand_country_mappings')
        .insert({
          organization_id: organizationId,
          country_code: country.country_code,
          country_name: country.country_name,
          region_code: country.region_code,
          default_language: country.default_language || 'en_US',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-countries', organizationId] });
      toast.success('Country added');
    },
    onError: (error) => {
      toast.error(`Failed to add country: ${error.message}`);
    },
  });

  // Update GlobalLink product config
  const updateGLProductConfig = useMutation({
    mutationFn: async (updates: Partial<GlobalLinkProductConfig>) => {
      if (!organizationId) throw new Error('Organization required');

      if (glProductConfig) {
        const { error } = await supabase
          .from('globallink_product_config')
          .update(updates)
          .eq('id', glProductConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('globallink_product_config')
          .insert({
            organization_id: organizationId,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globallink-product-config', organizationId] });
      toast.success('Configuration updated');
    },
    onError: (error) => {
      toast.error(`Failed to update config: ${error.message}`);
    },
  });

  return {
    // Data
    regions,
    countries,
    glProductConfig,

    // Loading
    isLoading: regionsLoading || countriesLoading || configLoading,

    // Mutations
    addRegion,
    addCountry,
    updateGLProductConfig,
  };
}

// Hook for managing variants of a specific entity
export function useEntityVariants(
  entityType: 'brand' | 'product' | 'event',
  entityId: string | undefined,
  organizationId: string | undefined
) {
  const queryClient = useQueryClient();

  // Fetch all variants for this entity
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['entity-variants', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from('brand_regional_variants')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('variant_level');
      if (error) throw error;
      return data as BrandRegionalVariant[];
    },
    enabled: !!entityId,
  });

  // Create or update a variant
  const upsertVariant = useMutation({
    mutationFn: async (variant: {
      variant_level: VariantLevel;
      variant_code: string;
      overrides: Partial<Record<`${LocalizableSection}_override`, Record<string, unknown> | null>>;
      parent_variant_id?: string;
    }) => {
      if (!entityId || !organizationId) throw new Error('Entity and organization required');

      const existing = variants.find(
        v => v.variant_level === variant.variant_level && v.variant_code === variant.variant_code
      );

      if (existing) {
        const { error } = await supabase
          .from('brand_regional_variants')
          .update({
            ...variant.overrides as Record<string, Json | null>,
            parent_variant_id: variant.parent_variant_id || existing.parent_variant_id,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('brand_regional_variants')
          .insert({
            organization_id: organizationId,
            entity_type: entityType,
            entity_id: entityId,
            variant_level: variant.variant_level,
            variant_code: variant.variant_code,
            parent_variant_id: variant.parent_variant_id || null,
            created_by: userData.user?.id,
            ...variant.overrides as Record<string, Json | null>,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-variants', entityType, entityId] });
      toast.success('Variant saved');
    },
    onError: (error) => {
      toast.error(`Failed to save variant: ${error.message}`);
    },
  });

  // Resolve a variant with inheritance
  const resolveVariant = useCallback((
    variantCode: string,
    baseGuideData: Record<string, unknown>
  ): ResolvedBrandVariant | null => {
    if (!entityId) return null;

    const targetVariant = variants.find(v => v.variant_code === variantCode);
    if (!targetVariant) {
      // Return global/base if no variant exists
      return {
        entity_id: entityId,
        entity_type: entityType,
        variant_code: 'global',
        variant_level: 'global',
        resolved_guide_data: baseGuideData,
        inheritance_chain: ['global'],
        overrides_applied: [],
        translation_status: 'draft',
      };
    }

    // Build inheritance chain
    const chain: BrandRegionalVariant[] = [];
    let current: BrandRegionalVariant | undefined = targetVariant;
    
    while (current) {
      chain.unshift(current);
      current = current.parent_variant_id
        ? variants.find(v => v.id === current!.parent_variant_id)
        : undefined;
    }

    // Apply overrides in order
    const resolved = { ...baseGuideData };
    const overridesApplied: LocalizableSection[] = [];

    for (const variant of chain) {
      const sections: LocalizableSection[] = [
        'hero', 'identity', 'colors', 'typography', 'imagery',
        'messaging', 'voice', 'logos', 'patterns', 'gradients', 'custom_sections'
      ];

      for (const section of sections) {
        const override = variant[`${section}_override` as keyof BrandRegionalVariant] as Record<string, unknown> | null;
        if (override) {
          resolved[section] = { ...(resolved[section] as Record<string, unknown> || {}), ...override };
          if (!overridesApplied.includes(section)) {
            overridesApplied.push(section);
          }
        }
      }
    }

    return {
      entity_id: entityId,
      entity_type: entityType,
      variant_code: targetVariant.variant_code,
      variant_level: targetVariant.variant_level,
      resolved_guide_data: resolved,
      inheritance_chain: chain.map(v => v.variant_code),
      overrides_applied: overridesApplied,
      translation_status: targetVariant.translation_status,
    };
  }, [variants, entityId, entityType]);

  // Get comparison data across variants for a section
  const getComparison = useCallback((
    section: LocalizableSection,
    baseGuideData: Record<string, unknown>
  ): RegionalComparison => {
    const globalValue = baseGuideData[section];

    return {
      section,
      global_value: globalValue,
      variants: variants.map(v => ({
        code: v.variant_code,
        level: v.variant_level,
        value: v[`${section}_override` as keyof BrandRegionalVariant],
        has_override: v[`${section}_override` as keyof BrandRegionalVariant] !== null,
      })),
    };
  }, [variants]);

  return {
    variants,
    isLoading,
    upsertVariant,
    resolveVariant,
    getComparison,
  };
}

// Hook for user locale preferences
export function useLocalePreference() {
  const queryClient = useQueryClient();

  const { data: preference, isLoading } = useQuery({
    queryKey: ['user-locale-preference'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('user_locale_preferences')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserLocalePreference | null;
    },
  });

  const updatePreference = useMutation({
    mutationFn: async (updates: Partial<UserLocalePreference>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      if (preference) {
        const { error } = await supabase
          .from('user_locale_preferences')
          .update(updates)
          .eq('id', preference.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_locale_preferences')
          .insert({
            user_id: userData.user.id,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-locale-preference'] });
    },
  });

  return {
    preference,
    isLoading,
    updatePreference,
  };
}

// Hook for AI cultural adaptation
export function useCulturalAdaptation(organizationId: string | undefined) {
  const [isAdapting, setIsAdapting] = useState(false);

  const getCulturalSuggestions = useCallback(async (
    entityType: 'brand' | 'product' | 'event',
    entityId: string,
    _guideData: Record<string, unknown>, // Kept for API compat, not sent
    targetCountry?: string,
    targetRegion?: string,
    sections?: string[]
  ): Promise<{ success: boolean; suggestions: AdaptationSuggestion[]; error?: string }> => {
    if (!organizationId) {
      return { success: false, suggestions: [], error: 'Organization required' };
    }

    setIsAdapting(true);
    try {
      const { data, error } = await supabase.functions.invoke('globallink-cultural-adapt', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          target_region: targetRegion,
          target_country: targetCountry,
          sections,
        },
      });

      if (error) throw error;
      return {
        success: data.success,
        suggestions: data.suggestions || [],
        error: data.error,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Adaptation failed';
      return { success: false, suggestions: [], error: message };
    } finally {
      setIsAdapting(false);
    }
  }, [organizationId]);

  return {
    isAdapting,
    getCulturalSuggestions,
  };
}
