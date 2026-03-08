/**
 * useDivisionBranding — Manages division brand presets for instant booth brand swapping.
 * Loads org brands + booth-specific overrides, applies selected preset to booth state.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlacedAsset } from './boothFurnitureConfigs';

/* ─── Types ────────────────────────────────── */

export interface BrandPreset {
  id: string;
  presetName: string;
  brandId: string | null;
  displayOrder: number;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  headline: string | null;
  tagline: string | null;
  messaging: Array<{ heading: string; bullets: string[] }>;
  panelGraphics: Record<string, string>;
  screenContent: Record<string, string>;
  overrides: Record<string, unknown>;
}

export interface OrgBrand {
  id: string;
  name: string;
  slug: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  tagline: string | null;
}

export interface DivisionBrandingState {
  /** Available presets (custom + org brands) */
  presets: BrandPreset[];
  /** Org-level brands that can be used as source */
  orgBrands: OrgBrand[];
  /** Currently active preset ID (null = no brand override) */
  activePresetId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Select and apply a preset */
  applyPreset: (presetId: string) => void;
  /** Clear active branding (return to default) */
  clearBranding: () => void;
  /** Create a new preset from an org brand */
  createPresetFromBrand: (brandId: string) => Promise<void>;
  /** Save current booth state as a preset */
  saveCurrentAsPreset: (name: string) => Promise<void>;
  /** Delete a preset */
  deletePreset: (presetId: string) => Promise<void>;
  /** The resolved brand data for the active preset */
  activeBrand: BrandPreset | null;
}

/* ─── Hook ─────────────────────────────────── */

export function useDivisionBranding(
  divisionId: string | undefined,
  organizationId: string | undefined,
  assignments: Record<string, string>,
  placedAssets: PlacedAsset[],
  onApplyBrand: (data: {
    assignments?: Record<string, string>;
    accentColors?: { primary: string; secondary: string; accent: string };
    screenContent?: Record<string, string>;
    logoUrl?: string;
    headline?: string;
    tagline?: string;
  }) => void,
): DivisionBrandingState {
  const [presets, setPresets] = useState<BrandPreset[]>([]);
  const [orgBrands, setOrgBrands] = useState<OrgBrand[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load presets + org brands
  useEffect(() => {
    if (!divisionId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load custom presets
        const { data: presetData } = await supabase
          .from('booth_brand_presets')
          .select('*')
          .eq('division_id', divisionId)
          .order('display_order');

        if (presetData) {
          setPresets(presetData.map(p => ({
            id: p.id,
            presetName: p.preset_name,
            brandId: p.brand_id,
            displayOrder: p.display_order,
            primaryColor: p.primary_color,
            secondaryColor: p.secondary_color,
            accentColor: p.accent_color,
            logoUrl: p.logo_url,
            headline: p.headline,
            tagline: p.tagline,
            messaging: Array.isArray(p.messaging) ? p.messaging as BrandPreset['messaging'] : [],
            panelGraphics: (p.panel_graphics as Record<string, string>) || {},
            screenContent: (p.screen_content as Record<string, string>) || {},
            overrides: (p.overrides as Record<string, unknown>) || {},
          })));
        }

        // Load org brands
        if (organizationId) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('id, name, slug, guide_data')
            .eq('organization_id', organizationId)
            .order('name');

          if (brandData) {
            setOrgBrands(brandData.map(b => {
              const gd = b.guide_data as Record<string, unknown> | null;
              const hero = gd?.hero as Record<string, string> | undefined;
              const colors = Array.isArray(gd?.colors) ? (gd.colors as Array<Record<string, string>>) : [];
              const primary = colors.find(c => c.role === 'primary')?.hex || hero?.primaryColor || null;
              const secondary = colors.find(c => c.role === 'secondary')?.hex || null;
              const accent = colors.find(c => c.role === 'accent')?.hex || null;
              
              return {
                id: b.id,
                name: b.name,
                slug: b.slug,
                primaryColor: primary,
                secondaryColor: secondary,
                accentColor: accent,
                logoUrl: (hero?.imageUrl as string) || null,
                tagline: (hero?.tagline as string) || null,
              };
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load division branding:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [divisionId, organizationId]);

  const activeBrand = useMemo(() => {
    if (!activePresetId) return null;
    return presets.find(p => p.id === activePresetId) || null;
  }, [activePresetId, presets]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);

    // Apply brand data to booth
    onApplyBrand({
      assignments: Object.keys(preset.panelGraphics).length > 0 ? preset.panelGraphics : undefined,
      accentColors: preset.primaryColor ? {
        primary: preset.primaryColor,
        secondary: preset.secondaryColor || preset.primaryColor,
        accent: preset.accentColor || preset.primaryColor,
      } : undefined,
      screenContent: Object.keys(preset.screenContent).length > 0 ? preset.screenContent : undefined,
      logoUrl: preset.logoUrl || undefined,
      headline: preset.headline || undefined,
      tagline: preset.tagline || undefined,
    });

    toast.success(`Switched to ${preset.presetName}`);
  }, [presets, onApplyBrand]);

  const clearBranding = useCallback(() => {
    setActivePresetId(null);
    toast.info('Brand override cleared');
  }, []);

  const createPresetFromBrand = useCallback(async (brandId: string) => {
    if (!divisionId) return;
    const brand = orgBrands.find(b => b.id === brandId);
    if (!brand) return;

    try {
      const { data, error } = await supabase
        .from('booth_brand_presets')
        .insert({
          division_id: divisionId,
          brand_id: brandId,
          preset_name: brand.name,
          display_order: presets.length,
          primary_color: brand.primaryColor,
          secondary_color: brand.secondaryColor,
          accent_color: brand.accentColor,
          logo_url: brand.logoUrl,
          tagline: brand.tagline,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newPreset: BrandPreset = {
          id: data.id,
          presetName: data.preset_name,
          brandId: data.brand_id,
          displayOrder: data.display_order,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          accentColor: data.accent_color,
          logoUrl: data.logo_url,
          headline: data.headline,
          tagline: data.tagline,
          messaging: [],
          panelGraphics: {},
          screenContent: {},
          overrides: {},
        };
        setPresets(prev => [...prev, newPreset]);
        toast.success(`Added ${brand.name} as booth preset`);
      }
    } catch (err) {
      toast.error('Failed to create preset');
    }
  }, [divisionId, orgBrands, presets.length]);

  const saveCurrentAsPreset = useCallback(async (name: string) => {
    if (!divisionId) return;

    // Capture current screen content from placed assets
    const screenMap: Record<string, string> = {};
    placedAssets.forEach(a => {
      if (a.screenImageUrl) {
        screenMap[a.instanceId] = a.screenImageUrl;
      }
    });

    try {
      const { data, error } = await supabase
        .from('booth_brand_presets')
        .insert({
          division_id: divisionId,
          preset_name: name,
          display_order: presets.length,
          panel_graphics: assignments,
          screen_content: screenMap,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newPreset: BrandPreset = {
          id: data.id,
          presetName: data.preset_name,
          brandId: data.brand_id,
          displayOrder: data.display_order,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          accentColor: data.accent_color,
          logoUrl: data.logo_url,
          headline: data.headline,
          tagline: data.tagline,
          messaging: [],
          panelGraphics: (data.panel_graphics as Record<string, string>) || {},
          screenContent: (data.screen_content as Record<string, string>) || {},
          overrides: {},
        };
        setPresets(prev => [...prev, newPreset]);
        toast.success(`Saved "${name}" preset`);
      }
    } catch {
      toast.error('Failed to save preset');
    }
  }, [divisionId, assignments, placedAssets, presets.length]);

  const deletePreset = useCallback(async (presetId: string) => {
    try {
      const { error } = await supabase
        .from('booth_brand_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      setPresets(prev => prev.filter(p => p.id !== presetId));
      if (activePresetId === presetId) setActivePresetId(null);
      toast.success('Preset deleted');
    } catch {
      toast.error('Failed to delete preset');
    }
  }, [activePresetId]);

  return {
    presets,
    orgBrands,
    activePresetId,
    isLoading,
    applyPreset,
    clearBranding,
    createPresetFromBrand,
    saveCurrentAsPreset,
    deletePreset,
    activeBrand,
  };
}
