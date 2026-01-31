/**
 * useIconStateSystem - Dynamic Semantic Variants
 * 
 * Generates interactive icon variants:
 * - Hover/Active: Filled versions of outline icons
 * - Success/Error: Semantic state wrappers
 * - Skeleton: Loading placeholder versions
 * - Disabled: Reduced opacity variants
 */

import { useMemo, useCallback } from 'react';

export type IconState = 
  | 'default' 
  | 'hover' 
  | 'active' 
  | 'success' 
  | 'error' 
  | 'warning'
  | 'skeleton' 
  | 'disabled';

export interface IconStateConfig {
  fillMode: 'none' | 'currentColor' | 'inherit';
  strokeMode: 'currentColor' | 'none' | 'inherit';
  wrapper?: 'circle' | 'square' | 'triangle' | 'none';
  wrapperColor?: string;
  opacity: number;
  filter?: string;
}

export interface IconStateSet {
  default: string;
  hover: string;
  active: string;
  success: string;
  error: string;
  warning: string;
  skeleton: string;
  disabled: string;
  cssVariables: string;
}

// Brand-compliant semantic colors (using CSS variables)
const SEMANTIC_COLORS = {
  success: 'hsl(142, 76%, 36%)',  // Brand-safe green
  error: 'hsl(0, 84%, 60%)',      // Brand-safe red
  warning: 'hsl(38, 92%, 50%)',   // Brand-safe amber
};

const STATE_CONFIGS: Record<IconState, IconStateConfig> = {
  default: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    opacity: 1,
  },
  hover: {
    fillMode: 'currentColor',
    strokeMode: 'currentColor',
    opacity: 1,
  },
  active: {
    fillMode: 'currentColor',
    strokeMode: 'none',
    opacity: 0.9,
  },
  success: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    wrapper: 'circle',
    wrapperColor: SEMANTIC_COLORS.success,
    opacity: 1,
  },
  error: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    wrapper: 'circle',
    wrapperColor: SEMANTIC_COLORS.error,
    opacity: 1,
  },
  warning: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    wrapper: 'triangle',
    wrapperColor: SEMANTIC_COLORS.warning,
    opacity: 1,
  },
  skeleton: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    opacity: 0.3,
    filter: 'blur(2px)',
  },
  disabled: {
    fillMode: 'none',
    strokeMode: 'currentColor',
    opacity: 0.4,
  },
};

export function useIconStateSystem(brandColors: {
  success?: string;
  error?: string;
  warning?: string;
} = {}) {
  // Merge brand colors with defaults
  const semanticColors = useMemo(() => ({
    ...SEMANTIC_COLORS,
    ...brandColors,
  }), [brandColors]);

  /**
   * Generate a state variant of an icon
   */
  const generateStateVariant = useCallback((
    svg: string,
    state: IconState
  ): string => {
    const config = STATE_CONFIGS[state];
    let processed = svg;

    // 1. Update fill mode
    if (config.fillMode === 'currentColor') {
      processed = processed.replace(/fill="none"/g, 'fill="currentColor"');
    } else if (config.fillMode === 'none') {
      processed = processed.replace(/fill="currentColor"/g, 'fill="none"');
    }

    // 2. Update stroke mode
    if (config.strokeMode === 'none') {
      processed = processed.replace(/stroke="currentColor"/g, 'stroke="none"');
    }

    // 3. Apply opacity
    if (config.opacity !== 1) {
      processed = processed.replace(
        '<svg',
        `<svg style="opacity: ${config.opacity}"`
      );
    }

    // 4. Apply filter (for skeleton)
    if (config.filter) {
      const filterId = `filter-${state}-${Date.now()}`;
      const filterDef = config.filter === 'blur(2px)' 
        ? `<defs><filter id="${filterId}"><feGaussianBlur stdDeviation="1"/></filter></defs>`
        : '';
      
      processed = processed.replace(
        '<svg',
        `<svg filter="url(#${filterId})"`
      );
      processed = processed.replace(
        /(<svg[^>]*>)/,
        `$1${filterDef}`
      );
    }

    // 5. Add wrapper for semantic states
    if (config.wrapper && config.wrapper !== 'none' && config.wrapperColor) {
      processed = wrapIconWithShape(processed, config.wrapper, config.wrapperColor);
    }

    // 6. Add state class
    processed = processed.replace(
      '<svg',
      `<svg class="icon-state-${state}" data-state="${state}"`
    );

    return processed;
  }, []);

  /**
   * Wrap an icon with a semantic shape (circle, square, triangle)
   */
  const wrapIconWithShape = (
    svg: string,
    shape: 'circle' | 'square' | 'triangle',
    color: string
  ): string => {
    // Create a 32x32 wrapper with the icon centered at 24x24
    const wrapperShapes = {
      circle: `<circle cx="16" cy="16" r="14" fill="${color}" opacity="0.15"/>
               <circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1.5"/>`,
      square: `<rect x="2" y="2" width="28" height="28" rx="4" fill="${color}" opacity="0.15"/>
               <rect x="2" y="2" width="28" height="28" rx="4" fill="none" stroke="${color}" stroke-width="1.5"/>`,
      triangle: `<path d="M16 2 L30 28 L2 28 Z" fill="${color}" opacity="0.15"/>
                 <path d="M16 2 L30 28 L2 28 Z" fill="none" stroke="${color}" stroke-width="1.5"/>`,
    };

    // Extract inner content
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    const innerContent = innerMatch ? innerMatch[1] : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  ${wrapperShapes[shape]}
  <g transform="translate(4, 4)">
    ${innerContent}
  </g>
</svg>`;
  };

  /**
   * Generate all state variants for an icon
   */
  const generateAllStates = useCallback((svg: string): IconStateSet => {
    const states: Partial<IconStateSet> = {};
    
    for (const state of Object.keys(STATE_CONFIGS) as IconState[]) {
      states[state] = generateStateVariant(svg, state);
    }

    // Generate CSS variables for easy theming
    const cssVariables = `
:root {
  --icon-state-success: ${semanticColors.success};
  --icon-state-error: ${semanticColors.error};
  --icon-state-warning: ${semanticColors.warning};
  --icon-transition: all 0.2s ease-out;
}

.icon-interactive {
  transition: var(--icon-transition);
}

.icon-interactive:hover {
  fill: currentColor;
}

.icon-interactive:active {
  transform: scale(0.95);
}

.icon-state-skeleton {
  animation: icon-skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes icon-skeleton-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.15; }
}
`;

    return {
      ...states,
      cssVariables,
    } as IconStateSet;
  }, [generateStateVariant, semanticColors]);

  /**
   * Generate a morphable icon pair (e.g., hamburger → X)
   */
  const generateMorphPair = useCallback((
    iconA: string,
    iconB: string,
    transitionDuration: number = 300
  ): { combined: string; css: string } => {
    const extractPaths = (svg: string) => {
      const matches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/g);
      return Array.from(matches).map(m => m[1]);
    };

    const pathsA = extractPaths(iconA);
    const pathsB = extractPaths(iconB);

    // Create morphable SVG with CSS transitions
    const combined = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-morph">
  ${pathsA.map((path, i) => `
  <path class="morph-path morph-path-a" d="${path}" style="transition: d ${transitionDuration}ms ease-out;"/>
  <path class="morph-path morph-path-b" d="${pathsB[i] || path}" style="opacity: 0; transition: d ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out;"/>`).join('')}
</svg>`;

    const css = `
.icon-morph[data-state="b"] .morph-path-a {
  opacity: 0;
}
.icon-morph[data-state="b"] .morph-path-b {
  opacity: 1;
}
`;

    return { combined, css };
  }, []);

  return {
    generateStateVariant,
    generateAllStates,
    generateMorphPair,
    configs: STATE_CONFIGS,
    semanticColors,
  };
}

export default useIconStateSystem;
