import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HeroEffectType } from '@/components/brand/HeroEditToolbar';

export interface PageHeroSettings {
  heroEffect: HeroEffectType;
  heroEffectIntensity: 'subtle' | 'medium' | 'bold';
  heroEffectColorScheme: string;
  heroEffectMode: 'dark' | 'light';
  heroEffectBrightness: number;
  heroEffectDensity: 'few' | 'normal' | 'many' | 'dense';
  heroEffectSpeed: 'slow' | 'normal' | 'fast' | 'very-fast';
}

const DEFAULT_SETTINGS: PageHeroSettings = {
  heroEffect: 'none',
  heroEffectIntensity: 'medium',
  heroEffectColorScheme: 'cyan-purple',
  heroEffectMode: 'dark',
  heroEffectBrightness: 50,
  heroEffectDensity: 'normal',
  heroEffectSpeed: 'normal',
};

export function usePageHeroSettings(pageSlug: string) {
  const [settings, setSettings] = useState<PageHeroSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('page_hero_settings' as any)
        .select('*')
        .eq('page_slug', pageSlug)
        .maybeSingle();

      if (data) {
        setSettings({
          heroEffect: (data as any).hero_effect || 'none',
          heroEffectIntensity: (data as any).hero_effect_intensity || 'medium',
          heroEffectColorScheme: (data as any).hero_effect_color_scheme || 'cyan-purple',
          heroEffectMode: (data as any).hero_effect_mode || 'dark',
          heroEffectBrightness: (data as any).hero_effect_brightness ?? 50,
          heroEffectDensity: (data as any).hero_effect_density || 'normal',
          heroEffectSpeed: (data as any).hero_effect_speed || 'normal',
        });
      }
      setIsLoading(false);
    };
    fetch();
  }, [pageSlug]);

  const updateSettings = useCallback(async (updates: Partial<PageHeroSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to update settings');
      return;
    }

    const dbRow = {
      page_slug: pageSlug,
      hero_effect: newSettings.heroEffect,
      hero_effect_intensity: newSettings.heroEffectIntensity,
      hero_effect_color_scheme: newSettings.heroEffectColorScheme,
      hero_effect_mode: newSettings.heroEffectMode,
      hero_effect_brightness: newSettings.heroEffectBrightness,
      hero_effect_density: newSettings.heroEffectDensity,
      hero_effect_speed: newSettings.heroEffectSpeed,
      updated_by: user.id,
    };

    const { error } = await supabase
      .from('page_hero_settings' as any)
      .upsert(dbRow as any, { onConflict: 'page_slug' });

    if (error) {
      console.error('Failed to save hero settings:', error);
      toast.error('Failed to save hero settings');
    }
  }, [settings, pageSlug]);

  return { settings, updateSettings, isLoading };
}
