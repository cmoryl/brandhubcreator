/**
 * useResponsiveIcon - Optical Size Optimizer
 * 
 * Generates responsive SVG variants that adapt to display size:
 * - Display (64px+): Full detail, thin lines, flourishes
 * - Regular (24px): Standard brand weight
 * - Micro (12px): Simplified, thickened strokes for legibility
 */

import { useMemo, useCallback } from 'react';

export type IconSizeVariant = 'micro' | 'regular' | 'display';

export interface OpticalSizeConfig {
  strokeMultiplier: number;
  simplifyPaths: boolean;
  removeDetails: boolean;
  cornerRadiusAdjust: number;
}

export interface ResponsiveIconSet {
  micro: string;    // 12-16px
  regular: string;  // 24-48px  
  display: string;  // 64px+
  responsive: string; // CSS media query version
}

const OPTICAL_CONFIGS: Record<IconSizeVariant, OpticalSizeConfig> = {
  micro: {
    strokeMultiplier: 1.5,      // Thicker for legibility
    simplifyPaths: true,
    removeDetails: true,        // Remove decorative elements
    cornerRadiusAdjust: -2,     // Sharper corners at small sizes
  },
  regular: {
    strokeMultiplier: 1,
    simplifyPaths: false,
    removeDetails: false,
    cornerRadiusAdjust: 0,
  },
  display: {
    strokeMultiplier: 0.75,     // Thinner, more elegant
    simplifyPaths: false,
    removeDetails: false,
    cornerRadiusAdjust: 2,      // Smoother curves
  },
};

// Detail elements to remove at micro sizes
const DETAIL_PATTERNS = [
  /<!-- ?detail ?-->/gi,           // Marked detail comments
  /<g[^>]*class="[^"]*detail[^"]*"[^>]*>[\s\S]*?<\/g>/gi,
  /<path[^>]*class="[^"]*flourish[^"]*"[^>]*\/?>/gi,
  /<circle[^>]*r="[01](\.\d+)?"[^>]*\/?>/gi,  // Tiny circles (dots)
];

export function useResponsiveIcon(baseStrokeWidth: number = 2) {
  /**
   * Generate an optically-adjusted SVG variant
   */
  const generateVariant = useCallback((
    svg: string,
    variant: IconSizeVariant
  ): string => {
    const config = OPTICAL_CONFIGS[variant];
    let processed = svg;

    // 1. Adjust stroke width
    const newStrokeWidth = Math.max(1, baseStrokeWidth * config.strokeMultiplier);
    processed = processed.replace(
      /stroke-width="[\d.]+"/g,
      `stroke-width="${newStrokeWidth.toFixed(2)}"`
    );

    // 2. Remove details for micro size
    if (config.removeDetails) {
      for (const pattern of DETAIL_PATTERNS) {
        processed = processed.replace(pattern, '');
      }
    }

    // 3. Simplify paths for micro (reduce precision)
    if (config.simplifyPaths) {
      processed = processed.replace(
        /(\d+\.\d{3,})/g,
        (match) => parseFloat(match).toFixed(1)
      );
    }

    // 4. Add variant class for styling
    processed = processed.replace(
      '<svg',
      `<svg class="icon-${variant}"`
    );

    return processed;
  }, [baseStrokeWidth]);

  /**
   * Generate a responsive SVG with embedded media queries
   * Uses CSS in SVG for automatic size adaptation
   */
  const generateResponsiveSvg = useCallback((svg: string): string => {
    const micro = generateVariant(svg, 'micro');
    const regular = generateVariant(svg, 'regular');
    const display = generateVariant(svg, 'display');

    // Extract path data from each variant
    const extractPaths = (s: string) => {
      const match = s.match(/<path[^>]*d="([^"]+)"[^>]*>/);
      return match ? match[1] : '';
    };

    const microPath = extractPaths(micro);
    const regularPath = extractPaths(regular);
    const displayPath = extractPaths(display);

    // Create responsive SVG with CSS-based switching
    const responsiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="responsive-icon">
  <style>
    .responsive-icon .micro-path { display: none; }
    .responsive-icon .regular-path { display: block; }
    .responsive-icon .display-path { display: none; }
    
    @media (max-width: 16px), (max-height: 16px) {
      .responsive-icon .micro-path { display: block; }
      .responsive-icon .regular-path { display: none; }
      .responsive-icon { stroke-width: ${(baseStrokeWidth * 1.5).toFixed(2)}; }
    }
    
    @media (min-width: 64px), (min-height: 64px) {
      .responsive-icon .display-path { display: block; }
      .responsive-icon .regular-path { display: none; }
      .responsive-icon { stroke-width: ${(baseStrokeWidth * 0.75).toFixed(2)}; }
    }
  </style>
  <g class="micro-path" stroke-width="${(baseStrokeWidth * 1.5).toFixed(2)}"><path d="${microPath}"/></g>
  <g class="regular-path" stroke-width="${baseStrokeWidth}"><path d="${regularPath}"/></g>
  <g class="display-path" stroke-width="${(baseStrokeWidth * 0.75).toFixed(2)}"><path d="${displayPath}"/></g>
</svg>`;

    return responsiveSvg;
  }, [generateVariant, baseStrokeWidth]);

  /**
   * Generate all size variants for an icon
   */
  const generateAllVariants = useCallback((svg: string): ResponsiveIconSet => {
    return {
      micro: generateVariant(svg, 'micro'),
      regular: generateVariant(svg, 'regular'),
      display: generateVariant(svg, 'display'),
      responsive: generateResponsiveSvg(svg),
    };
  }, [generateVariant, generateResponsiveSvg]);

  /**
   * Get the appropriate variant for a given pixel size
   */
  const getVariantForSize = useCallback((size: number): IconSizeVariant => {
    if (size <= 16) return 'micro';
    if (size >= 64) return 'display';
    return 'regular';
  }, []);

  return {
    generateVariant,
    generateResponsiveSvg,
    generateAllVariants,
    getVariantForSize,
    configs: OPTICAL_CONFIGS,
  };
}

export default useResponsiveIcon;
