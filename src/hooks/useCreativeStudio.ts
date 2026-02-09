/**
 * Hook for Brand Creative Studio functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  BrandPrompt, 
  GeneratedAsset, 
  DesignTokenConfig,
  PromptCategory,
  AspectRatio,
  StylePreset,
  TokenFormat
} from '@/types/creativeStudio';

interface UseCreativeStudioProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId?: string | null;
}

interface GenerateOptions {
  prompt: string;
  category?: PromptCategory;
  aspectRatio?: AspectRatio;
  stylePreset?: StylePreset;
  applyBrandContext?: boolean;
  saveToHistory?: boolean;
  promptId?: string;
}

interface GenerateResult {
  imageUrl: string;
  textResponse?: string;
  savedAssetId?: string;
  promptUsed: string;
  brandContextApplied: boolean;
}

export const useCreativeStudio = ({ entityId, entityType, organizationId }: UseCreativeStudioProps) => {
  const { user } = useAuth();
  
  // State
  const [prompts, setPrompts] = useState<BrandPrompt[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch prompts for this entity
  const fetchPrompts = useCallback(async () => {
    if (!entityId) return;
    
    setIsLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('brand_prompt_library')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('use_count', { ascending: false });
      
      if (error) throw error;
      setPrompts((data || []) as BrandPrompt[]);
    } catch (error) {
      console.error('[CreativeStudio] Failed to fetch prompts:', error);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, [entityId, entityType]);

  // Fetch generated assets history
  const fetchAssets = useCallback(async () => {
    if (!entityId) return;
    
    setIsLoadingAssets(true);
    try {
      const { data, error } = await supabase
        .from('brand_generated_assets')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setGeneratedAssets((data || []) as GeneratedAsset[]);
    } catch (error) {
      console.error('[CreativeStudio] Failed to fetch assets:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [entityId, entityType]);

  // Generate image with AI
  const generateImage = useCallback(async (options: GenerateOptions): Promise<GenerateResult | null> => {
    if (!user?.id || !entityId) {
      toast.error('Authentication required');
      return null;
    }
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-creative-asset', {
        body: {
          prompt: options.prompt,
          entityId,
          entityType,
          category: options.category || 'general',
          aspectRatio: options.aspectRatio || '1:1',
          stylePreset: options.stylePreset || 'photorealistic',
          applyBrandContext: options.applyBrandContext ?? true,
          saveToHistory: options.saveToHistory ?? true,
          promptId: options.promptId
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return null;
      }
      
      toast.success('Image generated successfully');
      
      // Refresh assets list
      if (options.saveToHistory !== false) {
        await fetchAssets();
      }
      
      return data as GenerateResult;
    } catch (error) {
      console.error('[CreativeStudio] Generation failed:', error);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, entityId, entityType, fetchAssets]);

  // Save a new prompt to library
  const savePrompt = useCallback(async (prompt: Omit<BrandPrompt, 'id' | 'entity_id' | 'entity_type' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at'>): Promise<BrandPrompt | null> => {
    if (!user?.id || !entityId) {
      toast.error('Authentication required');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('brand_prompt_library')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          organization_id: organizationId,
          name: prompt.name,
          category: prompt.category,
          prompt_template: prompt.prompt_template,
          description: prompt.description,
          output_format: prompt.output_format,
          aspect_ratio: prompt.aspect_ratio,
          style_preset: prompt.style_preset,
          is_default: false,
          is_shared: prompt.is_shared,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Prompt saved to library');
      await fetchPrompts();
      
      return data as BrandPrompt;
    } catch (error) {
      console.error('[CreativeStudio] Failed to save prompt:', error);
      toast.error('Failed to save prompt');
      return null;
    }
  }, [user?.id, entityId, entityType, organizationId, fetchPrompts]);

  // Delete prompt
  const deletePrompt = useCallback(async (promptId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_prompt_library')
        .delete()
        .eq('id', promptId);
      
      if (error) throw error;
      
      toast.success('Prompt deleted');
      await fetchPrompts();
      return true;
    } catch (error) {
      console.error('[CreativeStudio] Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
      return false;
    }
  }, [fetchPrompts]);

  // Rate an asset
  const rateAsset = useCallback(async (assetId: string, rating: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_generated_assets')
        .update({ rating })
        .eq('id', assetId);
      
      if (error) throw error;
      
      setGeneratedAssets(prev => 
        prev.map(a => a.id === assetId ? { ...a, rating } : a)
      );
      return true;
    } catch (error) {
      console.error('[CreativeStudio] Failed to rate asset:', error);
      return false;
    }
  }, []);

  // Approve/publish asset
  const approveAsset = useCallback(async (assetId: string, approve: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_generated_assets')
        .update({ is_approved: approve })
        .eq('id', assetId);
      
      if (error) throw error;
      
      setGeneratedAssets(prev => 
        prev.map(a => a.id === assetId ? { ...a, is_approved: approve } : a)
      );
      toast.success(approve ? 'Asset approved' : 'Approval removed');
      return true;
    } catch (error) {
      console.error('[CreativeStudio] Failed to update asset:', error);
      return false;
    }
  }, []);

  // Delete asset
  const deleteAsset = useCallback(async (assetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('brand_generated_assets')
        .delete()
        .eq('id', assetId);
      
      if (error) throw error;
      
      setGeneratedAssets(prev => prev.filter(a => a.id !== assetId));
      toast.success('Asset deleted');
      return true;
    } catch (error) {
      console.error('[CreativeStudio] Failed to delete asset:', error);
      toast.error('Failed to delete asset');
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (entityId) {
      fetchPrompts();
      fetchAssets();
    }
  }, [entityId, fetchPrompts, fetchAssets]);

  return {
    // State
    prompts,
    generatedAssets,
    isLoadingPrompts,
    isLoadingAssets,
    isGenerating,
    
    // Actions
    generateImage,
    savePrompt,
    deletePrompt,
    rateAsset,
    approveAsset,
    deleteAsset,
    
    // Refresh
    refreshPrompts: fetchPrompts,
    refreshAssets: fetchAssets
  };
};

// Design tokens generation utility
export const generateDesignTokens = (
  guideData: Record<string, unknown>,
  format: TokenFormat,
  options: {
    includeColors?: boolean;
    includeTypography?: boolean;
    includeSpacing?: boolean;
    prefix?: string;
  } = {}
): string => {
  const {
    includeColors = true,
    includeTypography = true,
    includeSpacing = false,
    prefix = 'brand'
  } = options;
  
  const colors = (guideData.colors as Array<{ hex: string; name: string; role?: string }>) || [];
  const typography = (guideData.typography as Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>) || [];
  
  switch (format) {
    case 'css':
      return generateCSSTokens(colors, typography, prefix, includeColors, includeTypography);
    case 'scss':
      return generateSCSSTokens(colors, typography, prefix, includeColors, includeTypography);
    case 'json':
      return generateJSONTokens(colors, typography, prefix, includeColors, includeTypography);
    case 'tailwind':
      return generateTailwindTokens(colors, typography, prefix, includeColors, includeTypography);
    case 'figma':
      return generateFigmaTokens(colors, typography, prefix, includeColors, includeTypography);
    default:
      return '';
  }
};

function generateCSSTokens(
  colors: Array<{ hex: string; name: string; role?: string }>,
  typography: Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>,
  prefix: string,
  includeColors: boolean,
  includeTypography: boolean
): string {
  const lines: string[] = [':root {'];
  
  if (includeColors) {
    lines.push('  /* Colors */');
    colors.forEach(color => {
      const varName = `--${prefix}-${(color.role || color.name).toLowerCase().replace(/\s+/g, '-')}`;
      lines.push(`  ${varName}: ${color.hex};`);
    });
    lines.push('');
  }
  
  if (includeTypography) {
    lines.push('  /* Typography */');
    typography.forEach(font => {
      const family = font.fontFamily || font.family;
      if (family) {
        const varName = `--${prefix}-font-${(font.role || 'default').toLowerCase()}`;
        lines.push(`  ${varName}: "${family}";`);
      }
    });
  }
  
  lines.push('}');
  return lines.join('\n');
}

function generateSCSSTokens(
  colors: Array<{ hex: string; name: string; role?: string }>,
  typography: Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>,
  prefix: string,
  includeColors: boolean,
  includeTypography: boolean
): string {
  const lines: string[] = [];
  
  if (includeColors) {
    lines.push('// Colors');
    colors.forEach(color => {
      const varName = `$${prefix}-${(color.role || color.name).toLowerCase().replace(/\s+/g, '-')}`;
      lines.push(`${varName}: ${color.hex};`);
    });
    lines.push('');
  }
  
  if (includeTypography) {
    lines.push('// Typography');
    typography.forEach(font => {
      const family = font.fontFamily || font.family;
      if (family) {
        const varName = `$${prefix}-font-${(font.role || 'default').toLowerCase()}`;
        lines.push(`${varName}: "${family}";`);
      }
    });
  }
  
  return lines.join('\n');
}

function generateJSONTokens(
  colors: Array<{ hex: string; name: string; role?: string }>,
  typography: Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>,
  prefix: string,
  includeColors: boolean,
  includeTypography: boolean
): string {
  const tokens: Record<string, unknown> = {};
  
  if (includeColors) {
    tokens.colors = {};
    colors.forEach(color => {
      const key = (color.role || color.name).toLowerCase().replace(/\s+/g, '-');
      (tokens.colors as Record<string, string>)[key] = color.hex;
    });
  }
  
  if (includeTypography) {
    tokens.typography = {};
    typography.forEach(font => {
      const family = font.fontFamily || font.family;
      if (family) {
        const key = (font.role || 'default').toLowerCase();
        (tokens.typography as Record<string, unknown>)[key] = {
          fontFamily: family,
          fontWeight: font.weight || '400'
        };
      }
    });
  }
  
  return JSON.stringify({ [prefix]: tokens }, null, 2);
}

function generateTailwindTokens(
  colors: Array<{ hex: string; name: string; role?: string }>,
  typography: Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>,
  prefix: string,
  includeColors: boolean,
  includeTypography: boolean
): string {
  const config: string[] = ['module.exports = {', '  theme: {', '    extend: {'];
  
  if (includeColors) {
    config.push('      colors: {');
    config.push(`        ${prefix}: {`);
    colors.forEach(color => {
      const key = (color.role || color.name).toLowerCase().replace(/\s+/g, '-');
      config.push(`          '${key}': '${color.hex}',`);
    });
    config.push('        },');
    config.push('      },');
  }
  
  if (includeTypography) {
    config.push('      fontFamily: {');
    typography.forEach(font => {
      const family = font.fontFamily || font.family;
      if (family) {
        const key = (font.role || 'default').toLowerCase();
        config.push(`        '${prefix}-${key}': ['${family}', 'sans-serif'],`);
      }
    });
    config.push('      },');
  }
  
  config.push('    },');
  config.push('  },');
  config.push('};');
  
  return config.join('\n');
}

function generateFigmaTokens(
  colors: Array<{ hex: string; name: string; role?: string }>,
  typography: Array<{ fontFamily?: string; family?: string; role?: string; weight?: string }>,
  prefix: string,
  includeColors: boolean,
  includeTypography: boolean
): string {
  const tokens: Record<string, unknown> = {};
  
  if (includeColors) {
    tokens.color = {};
    colors.forEach(color => {
      const key = (color.role || color.name).toLowerCase().replace(/\s+/g, '-');
      (tokens.color as Record<string, unknown>)[key] = {
        value: color.hex,
        type: 'color'
      };
    });
  }
  
  if (includeTypography) {
    tokens.fontFamilies = {};
    typography.forEach(font => {
      const family = font.fontFamily || font.family;
      if (family) {
        const key = (font.role || 'default').toLowerCase();
        (tokens.fontFamilies as Record<string, unknown>)[key] = {
          value: family,
          type: 'fontFamilies'
        };
      }
    });
  }
  
  return JSON.stringify(tokens, null, 2);
}
