/**
 * DataForce Configuration Hook
 * Manages DataForce settings and service enablement
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DataForceConfig, dbToDataForceConfig } from '@/lib/dataforce/types';

interface UseDataForceConfigOptions {
  organizationId: string;
}

interface UseDataForceConfigReturn {
  config: DataForceConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  isDemo: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (updates: Partial<DataForceConfig>) => Promise<boolean>;
  isServiceEnabled: (service: 'compliance' | 'assistant' | 'validation' | 'training') => boolean;
}

export function useDataForceConfig({
  organizationId
}: UseDataForceConfigOptions): UseDataForceConfigReturn {
  const [config, setConfig] = useState<DataForceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dataforce_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data ? dbToDataForceConfig(data) : null);
    } catch (error) {
      console.error('Failed to fetch DataForce config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = useCallback(async (updates: Partial<DataForceConfig>): Promise<boolean> => {
    if (!organizationId) return false;

    setIsSaving(true);
    try {
      // Convert camelCase to snake_case for DB
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.apiKey !== undefined) dbUpdates.api_key = updates.apiKey;
      if (updates.apiEndpoint !== undefined) dbUpdates.api_endpoint = updates.apiEndpoint;
      if (updates.apiMode !== undefined) dbUpdates.api_mode = updates.apiMode;
      if (updates.complianceAiEnabled !== undefined) dbUpdates.compliance_ai_enabled = updates.complianceAiEnabled;
      if (updates.brandAssistantEnabled !== undefined) dbUpdates.brand_assistant_enabled = updates.brandAssistantEnabled;
      if (updates.culturalValidationEnabled !== undefined) dbUpdates.cultural_validation_enabled = updates.culturalValidationEnabled;
      if (updates.genaiTrainingEnabled !== undefined) dbUpdates.genai_training_enabled = updates.genaiTrainingEnabled;
      if (updates.complianceAutoScan !== undefined) dbUpdates.compliance_auto_scan = updates.complianceAutoScan;
      if (updates.complianceThreshold !== undefined) dbUpdates.compliance_threshold = updates.complianceThreshold;
      if (updates.assistantLanguages !== undefined) dbUpdates.assistant_languages = updates.assistantLanguages;
      if (updates.assistantPersona !== undefined) dbUpdates.assistant_persona = updates.assistantPersona;
      if (updates.validationPanelSize !== undefined) dbUpdates.validation_panel_size = updates.validationPanelSize;
      if (updates.validationRegions !== undefined) dbUpdates.validation_regions = updates.validationRegions;
      if (updates.trainingModelBase !== undefined) dbUpdates.training_model_base = updates.trainingModelBase;

      dbUpdates.updated_at = new Date().toISOString();

      if (config) {
        // Update existing
        const { error } = await supabase
          .from('dataforce_config')
          .update(dbUpdates)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('dataforce_config')
          .insert({
            organization_id: organizationId,
            ...dbUpdates,
          });

        if (error) throw error;
      }

      await fetchConfig();
      toast.success('DataForce settings updated');
      return true;
    } catch (error) {
      console.error('Failed to update DataForce config:', error);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [organizationId, config, fetchConfig]);

  const isServiceEnabled = useCallback((service: 'compliance' | 'assistant' | 'validation' | 'training'): boolean => {
    if (!config) return true; // Default enabled if no config
    
    switch (service) {
      case 'compliance': return config.complianceAiEnabled;
      case 'assistant': return config.brandAssistantEnabled;
      case 'validation': return config.culturalValidationEnabled;
      case 'training': return config.genaiTrainingEnabled;
      default: return true;
    }
  }, [config]);

  const isDemo = !config || config.apiMode === 'demo';

  return {
    config,
    isLoading,
    isSaving,
    isDemo,
    fetchConfig,
    updateConfig,
    isServiceEnabled,
  };
}
