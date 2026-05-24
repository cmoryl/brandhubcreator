/**
 * useIconHierarchy - Brand Hierarchy Icon System
 * 
 * Manages icon inheritance, overrides, and multi-tenant styling:
 * - Parent Brand DNA (global rules)
 * - Sub-Brand Style Overrides
 * - Product-Specific Glyphs
 * - Event-Mode Overlays
 * - Dynamic Color Mapping
 */

import { useMemo, useCallback } from 'react';
import { BrandIconography } from '@/types/brand';

// ============================================
// TYPES
// ============================================

export type HierarchyLevel = 'parent' | 'sub-brand' | 'product' | 'event';

/**
 * Brand DNA - The immutable rules inherited by all children
 */
export interface BrandIconDNA {
  id: string;
  name: string;
  
  // Core Visual Rules (Locked)
  strokeWidth: number;
  strokeCap: 'round' | 'square' | 'butt';
  strokeJoin: 'round' | 'miter' | 'bevel';
  viewBox: string;
  gridSize: number;
  safeZone: number;
  
  // Optical Standards
  opticalWeight: 'light' | 'regular' | 'medium' | 'bold';
  targetAnchorPoints: number;
  
  // Grid & Alignment
  pixelSnapping: boolean;
  snapPrecision: 0.5 | 1 | 2;
}

/**
 * Style Override - What sub-brands/products can change
 */
export interface IconStyleOverride {
  id: string;
  name: string;
  level: HierarchyLevel;
  parentId?: string;
  
  // Allowed Overrides
  cornerRadius?: number;        // Can soften corners
  fillMode?: 'stroke' | 'fill' | 'duotone';
  colorSlots?: ColorSlotMapping;
  
  // Visual Personality
  personality?: 'professional' | 'friendly' | 'playful' | 'luxury' | 'tech';
  
  // Semantic Accents (for events/themes)
  accentPattern?: string;       // SVG pattern ID
  accentPosition?: 'corner' | 'background' | 'border';
}

/**
 * Color Slot Mapping - Dynamic theming
 */
export interface ColorSlotMapping {
  primary: string;      // Main icon color
  secondary?: string;   // Secondary elements
  accent?: string;      // Accent/highlight
  background?: string;  // Background fills
}

/**
 * Event Overlay - Temporary themed layer
 */
export interface EventOverlay {
  id: string;
  name: string;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  
  // Visual Modifications
  texture?: 'grain' | 'noise' | 'halftone' | 'none';
  accentShape?: string;  // SVG path for corner accent
  colorOverride?: Partial<ColorSlotMapping>;
  cornerBadge?: string;  // Small SVG badge
  
  // Animation Override
  entranceAnimation?: string;
}

/**
 * Product Glyph Set - Auto-generated product-specific icons
 */
export interface ProductGlyphSet {
  productId: string;
  productName: string;
  productCategory: string;
  
  // The 20 unique glyphs for this product
  glyphs: BrandIconography[];
  
  // Seed data for generation
  seedKeywords: string[];
  seedContext: string;
}

/**
 * Complete Hierarchical Icon Configuration
 */
export interface HierarchicalIconConfig {
  dna: BrandIconDNA;
  overrides: IconStyleOverride[];
  eventOverlays: EventOverlay[];
  productGlyphs: ProductGlyphSet[];
  colorMappings: Record<string, ColorSlotMapping>;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_DNA: BrandIconDNA = {
  id: 'default-dna',
  name: 'Brand DNA',
  strokeWidth: 2,
  strokeCap: 'round',
  strokeJoin: 'round',
  viewBox: '0 0 24 24',
  gridSize: 24,
  safeZone: 2,
  opticalWeight: 'regular',
  targetAnchorPoints: 50,
  pixelSnapping: true,
  snapPrecision: 0.5,
};

const DEFAULT_COLOR_SLOTS: ColorSlotMapping = {
  primary: 'currentColor',
  secondary: 'currentColor',
  accent: 'currentColor',
  background: 'none',
};

// ============================================
// HOOK
// ============================================

export function useIconHierarchy(
  baseDNA: Partial<BrandIconDNA> = {},
  baseIcons: BrandIconography[] = []
) {
  // Merge with defaults
  const dna = useMemo<BrandIconDNA>(() => ({
    ...DEFAULT_DNA,
    ...baseDNA,
  }), [baseDNA]);

  /**
   * Apply DNA rules to an icon (enforce parent constraints)
   */
  const applyDNA = useCallback((icon: BrandIconography): BrandIconography => {
    let svg = icon.svgPath;

    // Enforce stroke width
    svg = svg.replace(
      /stroke-width="[\d.]+"/g,
      `stroke-width="${dna.strokeWidth}"`
    );

    // Enforce stroke caps
    svg = svg.replace(
      /stroke-linecap="[^"]+"/g,
      `stroke-linecap="${dna.strokeCap}"`
    );

    // Enforce stroke joins
    svg = svg.replace(
      /stroke-linejoin="[^"]+"/g,
      `stroke-linejoin="${dna.strokeJoin}"`
    );

    // Enforce viewBox
    svg = svg.replace(
      /viewBox="[^"]+"/g,
      `viewBox="${dna.viewBox}"`
    );

    // Apply pixel snapping if enabled
    if (dna.pixelSnapping) {
      svg = svg.replace(
        /(\d+\.\d+)/g,
        (match) => {
          const num = parseFloat(match);
          return (Math.round(num / dna.snapPrecision) * dna.snapPrecision).toString();
        }
      );
    }

    return {
      ...icon,
      svgPath: svg,
      viewBox: dna.viewBox,
    };
  }, [dna]);

  /**
   * Apply style override to an icon (sub-brand/product variations)
   */
  const applyOverride = useCallback((
    icon: BrandIconography,
    override: IconStyleOverride
  ): BrandIconography => {
    // First apply DNA rules
    const processed = applyDNA(icon);
    let svg = processed.svgPath;

    // Apply corner radius override
    if (override.cornerRadius !== undefined) {
      // This is a simplification - real implementation would parse paths
      svg = svg.replace(
        /rx="[\d.]+"/g,
        `rx="${override.cornerRadius}"`
      );
    }

    // Apply fill mode override
    if (override.fillMode === 'fill') {
      svg = svg.replace(/fill="none"/g, 'fill="currentColor"');
      svg = svg.replace(/stroke="currentColor"/g, 'stroke="none"');
    } else if (override.fillMode === 'duotone') {
      // Add secondary color layer
      svg = svg.replace(
        '</svg>',
        `<g opacity="0.3" fill="currentColor">${svg.match(/<path[^>]*>/g)?.[0] || ''}</g></svg>`
      );
    }

    // Apply color slot mapping
    if (override.colorSlots) {
      svg = svg.replace(
        /stroke="currentColor"/g,
        `stroke="${override.colorSlots.primary}"`
      );
      svg = svg.replace(
        /fill="currentColor"/g,
        `fill="${override.colorSlots.primary}"`
      );
    }

    return {
      ...processed,
      svgPath: svg,
    };
  }, [applyDNA]);

  /**
   * Apply event overlay to an icon (temporary themed layer)
   */
  const applyEventOverlay = useCallback((
    icon: BrandIconography,
    overlay: EventOverlay
  ): BrandIconography => {
    if (!overlay.active) return icon;

    let svg = icon.svgPath;

    // Add texture filter
    if (overlay.texture && overlay.texture !== 'none') {
      const filterId = `event-texture-${overlay.id}`;
      const filterDef = getTextureFilter(overlay.texture, filterId);
      
      svg = svg.replace(
        '<svg',
        `<svg filter="url(#${filterId})"`
      );
      svg = svg.replace(
        /(<svg[^>]*>)/,
        `$1<defs>${filterDef}</defs>`
      );
    }

    // Add corner accent shape
    if (overlay.accentShape) {
      svg = svg.replace(
        '</svg>',
        `<g class="event-accent" opacity="0.6">${overlay.accentShape}</g></svg>`
      );
    }

    // Add corner badge
    if (overlay.cornerBadge) {
      svg = svg.replace(
        '</svg>',
        `<g class="event-badge" transform="translate(16, 0) scale(0.35)">${overlay.cornerBadge}</g></svg>`
      );
    }

    // Apply color override
    if (overlay.colorOverride?.primary) {
      svg = svg.replace(
        /stroke="currentColor"/g,
        `stroke="${overlay.colorOverride.primary}"`
      );
    }

    return {
      ...icon,
      svgPath: svg,
    };
  }, []);

  /**
   * Apply color mapping to an icon
   */
  const applyColorMapping = useCallback((
    icon: BrandIconography,
    mapping: ColorSlotMapping
  ): BrandIconography => {
    let svg = icon.svgPath;

    // Replace color placeholders
    svg = svg.replace(/var\(--icon-primary\)/g, mapping.primary);
    svg = svg.replace(/var\(--icon-secondary\)/g, mapping.secondary || mapping.primary);
    svg = svg.replace(/var\(--icon-accent\)/g, mapping.accent || mapping.primary);
    svg = svg.replace(/var\(--icon-background\)/g, mapping.background || 'none');

    // Also handle direct currentColor references
    svg = svg.replace(/stroke="currentColor"/g, `stroke="${mapping.primary}"`);
    svg = svg.replace(/fill="currentColor"/g, `fill="${mapping.primary}"`);

    return {
      ...icon,
      svgPath: svg,
    };
  }, []);

  /**
   * Generate CSS variables for a color mapping
   */
  const generateColorCSS = useCallback((
    mappingId: string,
    mapping: ColorSlotMapping
  ): string => {
    return `
/* ${mappingId} Color Theme */
.icon-theme-${mappingId} {
  --icon-primary: ${mapping.primary};
  --icon-secondary: ${mapping.secondary || mapping.primary};
  --icon-accent: ${mapping.accent || mapping.primary};
  --icon-background: ${mapping.background || 'none'};
}

.icon-theme-${mappingId} svg {
  color: var(--icon-primary);
}
`;
  }, []);

  /**
   * Generate a complete hierarchical icon set
   */
  const generateHierarchicalSet = useCallback((
    icons: BrandIconography[],
    config: {
      overrides?: IconStyleOverride[];
      eventOverlay?: EventOverlay;
      colorMapping?: ColorSlotMapping;
    } = {}
  ): BrandIconography[] => {
    return icons.map(icon => {
      let processed = applyDNA(icon);

      // Apply each override in order
      if (config.overrides) {
        for (const override of config.overrides) {
          processed = applyOverride(processed, override);
        }
      }

      // Apply event overlay if active
      if (config.eventOverlay) {
        processed = applyEventOverlay(processed, config.eventOverlay);
      }

      // Apply color mapping
      if (config.colorMapping) {
        processed = applyColorMapping(processed, config.colorMapping);
      }

      return processed;
    });
  }, [applyDNA, applyOverride, applyEventOverlay, applyColorMapping]);

  /**
   * Generate product-specific glyph seeds
   */
  const generateProductGlyphSeeds = useCallback((
    productName: string,
    productCategory: string
  ): string[] => {
    // Category-based keyword mapping
    const categoryKeywords: Record<string, string[]> = {
      'analytics': ['chart', 'graph', 'trend', 'metric', 'dashboard', 'report', 'data', 'insight', 'funnel', 'growth'],
      'food': ['recipe', 'ingredient', 'cook', 'meal', 'nutrition', 'timer', 'temperature', 'portion', 'plate', 'utensil'],
      'translation': ['language', 'globe', 'text', 'document', 'speech', 'translate', 'dictionary', 'localize', 'subtitle', 'interpret'],
      'media': ['play', 'record', 'camera', 'film', 'audio', 'broadcast', 'stream', 'timeline', 'cut', 'effect'],
      'legal': ['contract', 'gavel', 'scale', 'document', 'signature', 'stamp', 'brief', 'clause', 'witness', 'verdict'],
      'healthcare': ['heart', 'pulse', 'medicine', 'stethoscope', 'prescription', 'appointment', 'diagnosis', 'record', 'care', 'wellness'],
      'education': ['book', 'graduate', 'lesson', 'quiz', 'certificate', 'course', 'lecture', 'study', 'classroom', 'knowledge'],
      'ecommerce': ['cart', 'payment', 'shipping', 'product', 'wishlist', 'review', 'discount', 'checkout', 'inventory', 'order'],
      'communication': ['message', 'call', 'video', 'chat', 'notification', 'inbox', 'send', 'reply', 'thread', 'mention'],
      'productivity': ['task', 'calendar', 'reminder', 'note', 'project', 'deadline', 'priority', 'workflow', 'kanban', 'timeline'],
    };

    const baseKeywords = categoryKeywords[productCategory.toLowerCase()] || 
      ['tool', 'action', 'feature', 'setting', 'view', 'create', 'edit', 'share', 'export', 'import'];

    // Add product-name-derived keywords
    const productWords = productName.toLowerCase().split(/[\s-_]+/);
    
    return [...new Set([...baseKeywords, ...productWords])].slice(0, 20);
  }, []);

  /**
   * Export multi-tenant CSS
   */
  const exportMultiTenantCSS = useCallback((
    colorMappings: Record<string, ColorSlotMapping>
  ): string => {
    let css = `/* Multi-Tenant Icon Theme System */
/* Generated by Brand Icon Studio */

:root {
  --icon-primary: currentColor;
  --icon-secondary: currentColor;
  --icon-accent: currentColor;
  --icon-background: none;
  --icon-transition: all 0.2s ease-out;
}

.brand-icon {
  transition: var(--icon-transition);
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

`;

    // Add each brand theme
    for (const [id, mapping] of Object.entries(colorMappings)) {
      css += generateColorCSS(id, mapping);
    }

    return css;
  }, [generateColorCSS]);

  return {
    // DNA
    dna,
    applyDNA,
    
    // Overrides
    applyOverride,
    
    // Events
    applyEventOverlay,
    
    // Colors
    applyColorMapping,
    generateColorCSS,
    exportMultiTenantCSS,
    
    // Full Pipeline
    generateHierarchicalSet,
    
    // Product Glyphs
    generateProductGlyphSeeds,
    
    // Constants
    DEFAULT_DNA,
    DEFAULT_COLOR_SLOTS,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getTextureFilter(texture: string, filterId: string): string {
  switch (texture) {
    case 'grain':
      return `<filter id="${filterId}">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
        <feComposite in="SourceGraphic" in2="noise" operator="in"/>
      </filter>`;
    case 'noise':
      return `<filter id="${filterId}">
        <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/>
      </filter>`;
    case 'halftone':
      return `<filter id="${filterId}">
        <feGaussianBlur stdDeviation="0.5"/>
      </filter>`;
    default:
      return '';
  }
}

export default useIconHierarchy;
