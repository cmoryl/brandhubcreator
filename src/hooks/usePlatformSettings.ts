/**
 * usePlatformSettings - Hook for fetching and updating platform-wide settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MapThemeConfig } from '@/types/mapTheme';
import type { Json } from '@/integrations/supabase/types';

interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          value,
          updated_by: userData.user?.id || null,
        })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Helper to get a specific setting value
  const getSetting = <T>(key: string, defaultValue: T): T => {
    const setting = settings?.find(s => s.key === key);
    return setting ? (setting.value as unknown as T) : defaultValue;
  };

  return {
    settings,
    isLoading,
    updateSetting,
    getSetting,
  };
}

// Specific hook for global map theme
export function useGlobalMapTheme() {
  const { settings, isLoading, updateSetting, getSetting } = usePlatformSettings();
  
  const defaultTheme: MapThemeConfig = {
    tileStyle: 'dark',
    markerColors: {
      studio: '#ec4899',
      office: '#6b7280',
      headquarters: '#f59e0b',
      datacenter: '#22c55e',
      partner: '#8b5cf6',
    },
    uiTheme: {
      panelBackground: 'rgba(10, 22, 40, 0.9)',
      panelText: 'rgba(255, 255, 255, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      accentColor: '#00d4ff',
    },
  };

  const globalMapTheme = getSetting<MapThemeConfig>('global_map_theme', defaultTheme);

  const updateGlobalMapTheme = (theme: MapThemeConfig) => {
    return updateSetting.mutateAsync({ key: 'global_map_theme', value: theme as unknown as Json });
  };

  return {
    globalMapTheme,
    isLoading,
    updateGlobalMapTheme,
    isUpdating: updateSetting.isPending,
  };
}
