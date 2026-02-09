/**
 * useLocalization - Hook for managing localization and translations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { 
  TargetLanguage, 
  LocalizationJob, 
  LocalizedContent, 
  GlobalLinkConfig,
  TranslationRequest,
  TranslationResponse
} from '@/types/localization';

export function useLocalization(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch target languages
  const { data: targetLanguages = [], isLoading: languagesLoading } = useQuery({
    queryKey: ['localization-languages', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('localization_target_languages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order');
      if (error) throw error;
      return data as TargetLanguage[];
    },
    enabled: !!organizationId,
  });

  // Fetch localization jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['localization-jobs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('localization_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as LocalizationJob[];
    },
    enabled: !!organizationId,
  });

  // Fetch GlobalLink config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['globallink-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('globallink_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as GlobalLinkConfig | null;
    },
    enabled: !!organizationId,
  });

  // Add target language
  const addLanguage = useMutation({
    mutationFn: async (language: { language_code: string; language_name: string }) => {
      if (!organizationId) throw new Error('Organization required');
      const { error } = await supabase
        .from('localization_target_languages')
        .insert({
          organization_id: organizationId,
          language_code: language.language_code,
          language_name: language.language_name,
          display_order: targetLanguages.length,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localization-languages', organizationId] });
      toast.success('Language added');
    },
    onError: (error) => {
      toast.error(`Failed to add language: ${error.message}`);
    },
  });

  // Remove target language
  const removeLanguage = useMutation({
    mutationFn: async (languageId: string) => {
      const { error } = await supabase
        .from('localization_target_languages')
        .delete()
        .eq('id', languageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localization-languages', organizationId] });
      toast.success('Language removed');
    },
    onError: (error) => {
      toast.error(`Failed to remove language: ${error.message}`);
    },
  });

  // Toggle language active status
  const toggleLanguageActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('localization_target_languages')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localization-languages', organizationId] });
    },
  });

  // Update GlobalLink config
  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<GlobalLinkConfig>) => {
      if (!organizationId) throw new Error('Organization required');
      
      if (config) {
        const { error } = await supabase
          .from('globallink_config')
          .update(updates)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('globallink_config')
          .insert({
            organization_id: organizationId,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globallink-config', organizationId] });
      toast.success('Configuration saved');
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  // Translate content
  const translateContent = useCallback(async (
    request: TranslationRequest
  ): Promise<TranslationResponse> => {
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('globallink-translate', {
        body: {
          ...request,
          organization_id: organizationId,
        },
      });
      
      if (error) throw error;
      return data as TranslationResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed';
      return { success: false, translated_content: '', error: message };
    } finally {
      setIsTranslating(false);
    }
  }, [organizationId]);

  // Submit translation job
  const submitJob = useMutation({
    mutationFn: async (job: {
      entity_type: 'brand' | 'product' | 'event' | 'ui_label';
      entity_id: string | null;
      entity_name: string;
      target_language: string;
      source_content: Record<string, unknown>;
    }) => {
      if (!organizationId) throw new Error('Organization required');
      
      const { data: userData } = await supabase.auth.getUser();
      
      // Calculate word/character count
      const contentStr = JSON.stringify(job.source_content);
      const wordCount = contentStr.split(/\s+/).length;
      const charCount = contentStr.length;
      
      const { data, error } = await supabase
        .from('localization_jobs')
        .insert({
          organization_id: organizationId,
          entity_type: job.entity_type,
          entity_id: job.entity_id,
          entity_name: job.entity_name,
          target_language: job.target_language,
          source_content: job.source_content as Json,
          word_count: wordCount,
          character_count: charCount,
          submitted_by: userData.user?.id,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localization-jobs', organizationId] });
      toast.success('Translation job submitted');
    },
    onError: (error) => {
      toast.error(`Failed to submit job: ${error.message}`);
    },
  });

  // Get localized content for an entity
  const getLocalizedContent = useCallback(async (
    entityId: string,
    languageCode: string
  ): Promise<LocalizedContent | null> => {
    const { data, error } = await supabase
      .from('localized_content')
      .select('*')
      .eq('entity_id', entityId)
      .eq('language_code', languageCode)
      .maybeSingle();
    
    if (error) throw error;
    return data as LocalizedContent | null;
  }, []);

  // Save localized content
  const saveLocalizedContent = useMutation({
    mutationFn: async (content: {
      entity_id: string;
      entity_type: 'brand' | 'product' | 'event';
      language_code: string;
      localized_guide_data: Record<string, unknown>;
      translation_status?: 'draft' | 'review' | 'published';
    }) => {
      if (!organizationId) throw new Error('Organization required');
      
      const { data: existing } = await supabase
        .from('localized_content')
        .select('id')
        .eq('entity_id', content.entity_id)
        .eq('language_code', content.language_code)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('localized_content')
          .update({
            localized_guide_data: content.localized_guide_data as Json,
            translation_status: content.translation_status || 'draft',
            last_synced_at: new Date().toISOString(),
          } as never)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('localized_content')
          .insert({
            organization_id: organizationId,
            entity_id: content.entity_id,
            entity_type: content.entity_type,
            language_code: content.language_code,
            localized_guide_data: content.localized_guide_data as Json,
            translation_status: content.translation_status || 'draft',
            last_synced_at: new Date().toISOString(),
          } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Localized content saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  return {
    // Data
    targetLanguages,
    jobs,
    config,
    
    // Loading states
    isLoading: languagesLoading || jobsLoading || configLoading,
    isTranslating,
    
    // Language management
    addLanguage,
    removeLanguage,
    toggleLanguageActive,
    
    // Config management
    updateConfig,
    
    // Translation
    translateContent,
    submitJob,
    
    // Localized content
    getLocalizedContent,
    saveLocalizedContent,
  };
}
