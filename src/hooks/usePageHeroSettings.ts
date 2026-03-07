import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HeroEffectType } from '@/components/brand/HeroEditToolbar';

/** DB row shape for page_hero_settings (not yet in generated types) */
interface PageHeroSettingsRow {
  page_slug: string;
  hero_effect: string | null;
  hero_effect_intensity: string | null;
  hero_effect_color_scheme: string | null;
  hero_effect_mode: string | null;
  hero_effect_brightness: number | null;
  hero_effect_density: string | null;
  hero_effect_speed: string | null;
  updated_by: string | null;
}

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
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('page_hero_settings' as unknown as 'brands')
        .select('*')
        .eq('page_slug' as 'id', pageSlug)
        .maybeSingle();

      if (data) {
        const row = data as unknown as PageHeroSettingsRow;
        setSettings({
          heroEffect: (row.hero_effect as HeroEffectType) || 'none',
          heroEffectIntensity: (row.hero_effect_intensity as PageHeroSettings['heroEffectIntensity']) || 'medium',
          heroEffectColorScheme: row.hero_effect_color_scheme || 'cyan-purple',
          heroEffectMode: (row.hero_effect_mode as PageHeroSettings['heroEffectMode']) || 'dark',
          heroEffectBrightness: row.hero_effect_brightness ?? 50,
          heroEffectDensity: (row.hero_effect_density as PageHeroSettings['heroEffectDensity']) || 'normal',
          heroEffectSpeed: (row.hero_effect_speed as PageHeroSettings['heroEffectSpeed']) || 'normal',
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
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
      .from('page_hero_settings' as unknown as 'brands')
      .upsert(dbRow as unknown as Record<string, unknown>, { onConflict: 'page_slug' as 'id' });

    if (error) {
      console.error('Failed to save hero settings:', error);
      toast.error('Failed to save hero settings');
    }
  }, [settings, pageSlug]);

  return { settings, updateSettings, isLoading };
}
