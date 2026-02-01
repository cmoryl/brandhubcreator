/**
 * Chart Theme Presets and Utilities
 * 
 * Provides pre-built chart themes and utilities for applying
 * consistent theming across all chart and infographic sections.
 */

import { ChartTheme, ChartThemePresetId, ChartThemeSettings, RevenueChartColors, BrandColor } from '@/types/brand';

// Pre-built theme presets
export const CHART_THEME_PRESETS: Record<Exclude<ChartThemePresetId, 'custom' | 'brand-primary' | 'brand-secondary'>, ChartTheme> = {
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue tones for business presentations',
    primary: '#2563eb',
    secondary: '#3b82f6',
    tertiary: '#60a5fa',
    accent: '#1d4ed8',
    background: '#f8fafc',
    gridColor: '#e2e8f0',
    textColor: '#475569',
    useGradients: true,
    palette: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  },
  'modern-purple': {
    id: 'modern-purple',
    name: 'Modern Purple',
    description: 'Contemporary violet and purple gradients',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    tertiary: '#a78bfa',
    accent: '#6d28d9',
    background: '#faf5ff',
    gridColor: '#e9d5ff',
    textColor: '#6b21a8',
    useGradients: true,
    palette: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  },
  'forest-green': {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural, eco-friendly green palette',
    primary: '#059669',
    secondary: '#10b981',
    tertiary: '#34d399',
    accent: '#047857',
    background: '#f0fdf4',
    gridColor: '#d1fae5',
    textColor: '#065f46',
    useGradients: true,
    palette: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm sunset tones with energy',
    primary: '#ea580c',
    secondary: '#f97316',
    tertiary: '#fb923c',
    accent: '#c2410c',
    background: '#fff7ed',
    gridColor: '#fed7aa',
    textColor: '#9a3412',
    useGradients: true,
    palette: ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'],
  },
  'minimal-gray': {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Clean, understated monochrome',
    primary: '#374151',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    accent: '#1f2937',
    background: '#f9fafb',
    gridColor: '#e5e7eb',
    textColor: '#6b7280',
    useGradients: false,
    palette: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Accessibility-focused with strong contrast',
    primary: '#000000',
    secondary: '#1f2937',
    tertiary: '#374151',
    accent: '#dc2626',
    background: '#ffffff',
    gridColor: '#9ca3af',
    textColor: '#000000',
    useGradients: false,
    palette: ['#000000', '#dc2626', '#2563eb', '#059669', '#7c3aed'],
  },
};

/**
 * Generate a brand-based theme from brand colors
 */
export function generateBrandTheme(
  brandColors: BrandColor[],
  variant: 'primary' | 'secondary' = 'primary'
): ChartTheme {
  // Find primary and secondary colors from brand palette
  const primaryColor = brandColors.find(c => 
    c.name.toLowerCase().includes('primary') || 
    c.name.toLowerCase().includes('main') ||
    c.name.toLowerCase().includes('brand')
  ) || brandColors[0];
  
  const secondaryColor = brandColors.find(c => 
    c.name.toLowerCase().includes('secondary') || 
    c.name.toLowerCase().includes('accent')
  ) || brandColors[1] || primaryColor;
  
  const baseColor = variant === 'primary' ? primaryColor : secondaryColor;
  const accentColor = variant === 'primary' ? secondaryColor : primaryColor;
  
  if (!baseColor) {
    // Fallback to corporate blue if no brand colors
    return CHART_THEME_PRESETS['corporate-blue'];
  }
  
  return {
    id: `brand-${variant}`,
    name: variant === 'primary' ? 'Brand Primary' : 'Brand Secondary',
    description: `Based on your ${baseColor.name} brand color`,
    primary: baseColor.hex,
    secondary: accentColor?.hex || baseColor.hex,
    tertiary: adjustColorBrightness(baseColor.hex, 30),
    accent: adjustColorBrightness(baseColor.hex, -20),
    background: adjustColorBrightness(baseColor.hex, 95),
    gridColor: adjustColorBrightness(baseColor.hex, 80),
    textColor: adjustColorBrightness(baseColor.hex, -40),
    useGradients: true,
    palette: brandColors.slice(0, 5).map(c => c.hex),
  };
}

/**
 * Resolve theme settings to an actual ChartTheme object
 */
export function resolveChartTheme(
  settings: ChartThemeSettings | undefined,
  brandColors: BrandColor[] = []
): ChartTheme {
  if (!settings) {
    // Default to brand primary if available, otherwise corporate blue
    if (brandColors.length > 0) {
      return generateBrandTheme(brandColors, 'primary');
    }
    return CHART_THEME_PRESETS['corporate-blue'];
  }
  
  switch (settings.presetId) {
    case 'brand-primary':
      return generateBrandTheme(brandColors, 'primary');
    case 'brand-secondary':
      return generateBrandTheme(brandColors, 'secondary');
    case 'custom':
      return settings.customTheme || CHART_THEME_PRESETS['corporate-blue'];
    default:
      return CHART_THEME_PRESETS[settings.presetId] || CHART_THEME_PRESETS['corporate-blue'];
  }
}

/**
 * Convert ChartTheme to RevenueChartColors for backwards compatibility
 */
export function themeToRevenueColors(theme: ChartTheme): RevenueChartColors {
  return {
    barColor: theme.primary,
    barColorEnd: theme.useGradients ? theme.secondary : undefined,
    hoverColor: theme.accent,
    gridColor: theme.gridColor,
    textColor: theme.textColor,
  };
}

/**
 * Adjust color brightness
 * @param hex - Hex color string
 * @param percent - Positive to lighten, negative to darken
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/**
 * Get all available theme presets for the picker UI
 */
export function getThemePresetOptions(hasBrandColors: boolean): Array<{
  id: ChartThemePresetId;
  name: string;
  description: string;
  preview: ChartTheme;
}> {
  const options: Array<{
    id: ChartThemePresetId;
    name: string;
    description: string;
    preview: ChartTheme;
  }> = [];
  
  // Add brand-based options if colors are available
  if (hasBrandColors) {
    options.push({
      id: 'brand-primary',
      name: 'Brand Primary',
      description: 'Uses your primary brand color',
      preview: CHART_THEME_PRESETS['corporate-blue'], // Will be replaced with actual
    });
    options.push({
      id: 'brand-secondary',
      name: 'Brand Secondary',
      description: 'Uses your secondary brand color',
      preview: CHART_THEME_PRESETS['modern-purple'], // Will be replaced with actual
    });
  }
  
  // Add all preset themes
  Object.entries(CHART_THEME_PRESETS).forEach(([id, theme]) => {
    options.push({
      id: id as ChartThemePresetId,
      name: theme.name,
      description: theme.description || '',
      preview: theme,
    });
  });
  
  // Add custom option
  options.push({
    id: 'custom',
    name: 'Custom Theme',
    description: 'Create your own color scheme',
    preview: CHART_THEME_PRESETS['corporate-blue'],
  });
  
  return options;
}
