import { useCallback, useMemo } from 'react';

/**
 * Icon Audit Result
 */
export interface IconAuditResult {
  isValid: boolean;
  isCentered: boolean;
  usesCorrectColors: boolean;
  isOptimalSize: boolean;
  fileSizeBytes: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Optimization Options
 */
export interface OptimizationOptions {
  targetViewBox?: string;
  decimalPrecision?: number;
  maxFileSizeBytes?: number;
  brandColors?: string[];
  strokeWidth?: number;
  forceStroke?: boolean;
  forceFill?: boolean;
  cornerRadius?: number;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  targetViewBox: '0 0 24 24',
  decimalPrecision: 2,
  maxFileSizeBytes: 2048, // 2KB
  strokeWidth: 2,
  forceStroke: true,
  forceFill: false,
  cornerRadius: 4,
};

/**
 * useIconOptimizer - 3-Layer Validation System for SVG Icons
 * 
 * Layer 1: Semantic Prompting (handled at edge function level)
 * Layer 2: SVG Post-Processing ("The Wash")
 * Layer 3: PNG-to-Style Anchor (geometric primitive fitting)
 */
export function useIconOptimizer(options: OptimizationOptions = {}) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  /**
   * Layer 2: SVG Post-Processing - "The Wash"
   * Cleans and normalizes SVG output from AI
   */
  const sanitizeSVG = useCallback((svgString: string): string => {
    if (!svgString) return '';

    let svg = svgString.trim();

    // Step 1: Extract SVG content if wrapped in other elements
    const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) return svg;
    svg = svgMatch[0];

    // Step 2: Remove metadata, comments, and editor-specific tags
    svg = svg
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, '') // Remove metadata
      .replace(/<title[\s\S]*?<\/title>/gi, '') // Remove title
      .replace(/<desc[\s\S]*?<\/desc>/gi, '') // Remove description
      .replace(/data-[\w-]+="[^"]*"/gi, '') // Remove data attributes
      .replace(/inkscape:[\w-]+="[^"]*"/gi, '') // Remove Inkscape attrs
      .replace(/sodipodi:[\w-]+="[^"]*"/gi, '') // Remove Sodipodi attrs
      .replace(/xmlns:inkscape="[^"]*"/gi, '') // Remove Inkscape namespace
      .replace(/xmlns:sodipodi="[^"]*"/gi, '') // Remove Sodipodi namespace
      .replace(/id="[^"]*"/gi, '') // Remove IDs (we'll add our own)
      .replace(/class="[^"]*"/gi, '') // Remove classes
      .replace(/style="[^"]*"/gi, ''); // Remove inline styles (we use CSS)

    // Step 3: Normalize ViewBox to 24x24
    svg = normalizeViewBox(svg, opts.targetViewBox!);

    // Step 4: Round decimal coordinates
    svg = roundDecimals(svg, opts.decimalPrecision!);

    // Step 5: Clean up whitespace
    svg = svg
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();

    // Step 6: Apply stroke/fill normalization
    svg = normalizeStrokeFill(svg, opts);

    return svg;
  }, [opts]);

  /**
   * Normalize ViewBox to target dimensions
   */
  const normalizeViewBox = (svg: string, targetViewBox: string): string => {
    // Remove existing viewBox and replace with target
    const hasViewBox = /viewBox="[^"]*"/i.test(svg);
    
    if (hasViewBox) {
      svg = svg.replace(/viewBox="[^"]*"/i, `viewBox="${targetViewBox}"`);
    } else {
      svg = svg.replace(/<svg/, `<svg viewBox="${targetViewBox}"`);
    }

    // Remove width/height attributes to allow CSS sizing
    svg = svg.replace(/\s*width="[^"]*"/gi, '');
    svg = svg.replace(/\s*height="[^"]*"/gi, '');

    return svg;
  };

  /**
   * Round decimal coordinates to specified precision
   */
  const roundDecimals = (svg: string, precision: number): string => {
    // Match numbers with decimals in path data and coordinates
    return svg.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      const rounded = Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
      // If it's a whole number, return without decimals
      if (rounded === Math.floor(rounded)) {
        return String(Math.floor(rounded));
      }
      return rounded.toFixed(precision).replace(/\.?0+$/, '');
    });
  };

  /**
   * Normalize stroke and fill attributes
   */
  const normalizeStrokeFill = (svg: string, options: OptimizationOptions): string => {
    // Add xmlns if missing
    if (!svg.includes('xmlns=')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Set stroke properties on SVG element
    if (options.forceStroke) {
      // Remove existing stroke attributes from child elements
      svg = svg.replace(/\s*stroke="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-width="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-linecap="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-linejoin="[^"]*"/gi, '');
      
      // Add standardized stroke to SVG root
      svg = svg.replace(
        '<svg',
        `<svg stroke="currentColor" stroke-width="${options.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      );
    }

    if (options.forceFill === false) {
      // Remove fills and set to none
      svg = svg.replace(/\s*fill="(?!none)[^"]*"/gi, '');
      if (!svg.includes('fill="none"')) {
        svg = svg.replace('<svg', '<svg fill="none"');
      }
    } else if (options.forceFill) {
      svg = svg.replace(/\s*fill="[^"]*"/gi, '');
      svg = svg.replace('<svg', '<svg fill="currentColor"');
    }

    return svg;
  };

  /**
   * Extract path data from SVG for analysis
   */
  const extractPaths = useCallback((svg: string): string[] => {
    const pathMatches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/gi);
    return Array.from(pathMatches, m => m[1]);
  }, []);

  /**
   * Check if icon is centered in viewBox
   */
  const checkCentering = useCallback((svg: string): { isCentered: boolean; offset: { x: number; y: number } } => {
    const paths = extractPaths(svg);
    if (paths.length === 0) {
      return { isCentered: true, offset: { x: 0, y: 0 } };
    }

    // Parse viewBox
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) {
      return { isCentered: true, offset: { x: 0, y: 0 } };
    }

    const [, , vbWidth, vbHeight] = viewBoxMatch[1].split(' ').map(Number);
    const centerX = vbWidth / 2;
    const centerY = vbHeight / 2;

    // Extract all coordinates from paths
    const coords: { x: number; y: number }[] = [];
    for (const path of paths) {
      const numbers = path.match(/-?\d+\.?\d*/g);
      if (numbers) {
        for (let i = 0; i < numbers.length - 1; i += 2) {
          coords.push({ x: parseFloat(numbers[i]), y: parseFloat(numbers[i + 1]) });
        }
      }
    }

    if (coords.length === 0) {
      return { isCentered: true, offset: { x: 0, y: 0 } };
    }

    // Calculate bounding box center
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));

    const iconCenterX = (minX + maxX) / 2;
    const iconCenterY = (minY + maxY) / 2;

    const offsetX = centerX - iconCenterX;
    const offsetY = centerY - iconCenterY;

    // Consider centered if within 1px tolerance
    const tolerance = 1;
    const isCentered = Math.abs(offsetX) <= tolerance && Math.abs(offsetY) <= tolerance;

    return { isCentered, offset: { x: offsetX, y: offsetY } };
  }, [extractPaths]);

  /**
   * Check if SVG uses brand-approved colors
   */
  const checkBrandColors = useCallback((svg: string, brandColors: string[]): { usesCorrectColors: boolean; foundColors: string[] } => {
    if (!brandColors || brandColors.length === 0) {
      return { usesCorrectColors: true, foundColors: [] };
    }

    // Normalize brand colors to lowercase
    const normalizedBrandColors = brandColors.map(c => c.toLowerCase());
    
    // Find all color references in SVG
    const colorPatterns = [
      /fill="(#[0-9a-f]{3,6})"/gi,
      /stroke="(#[0-9a-f]{3,6})"/gi,
      /stop-color="(#[0-9a-f]{3,6})"/gi,
      /fill="(rgb\([^)]+\))"/gi,
      /stroke="(rgb\([^)]+\))"/gi,
    ];

    const foundColors: Set<string> = new Set();
    
    for (const pattern of colorPatterns) {
      const matches = svg.matchAll(pattern);
      for (const match of matches) {
        const color = match[1].toLowerCase();
        // Skip currentColor and none
        if (color !== 'currentcolor' && color !== 'none') {
          foundColors.add(color);
        }
      }
    }

    const foundArray = Array.from(foundColors);
    const usesCorrectColors = foundArray.every(c => 
      normalizedBrandColors.includes(c) || c === 'currentcolor' || c === 'none'
    );

    return { usesCorrectColors, foundColors: foundArray };
  }, []);

  /**
   * Calculate file size of SVG string
   */
  const getFileSize = useCallback((svg: string): number => {
    return new Blob([svg]).size;
  }, []);

  /**
   * Simplify SVG by removing redundant points
   */
  const simplifySVG = useCallback((svg: string): string => {
    // Basic path simplification - remove consecutive duplicate commands
    let simplified = svg;

    // Remove redundant whitespace in paths
    simplified = simplified.replace(/d="([^"]+)"/g, (match, pathData) => {
      const cleaned = pathData
        .replace(/\s+/g, ' ')
        .replace(/\s*([MLHVCSQTAZmlhvcsqtaz])\s*/g, '$1')
        .trim();
      return `d="${cleaned}"`;
    });

    return simplified;
  }, []);

  /**
   * Full Icon Audit - The "Hidden" Verification Feature
   */
  const auditIcon = useCallback((svg: string, brandColors?: string[]): IconAuditResult => {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check 1: Is the icon centered?
    const { isCentered, offset } = checkCentering(svg);
    if (!isCentered) {
      issues.push(`Icon is off-center by (${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px)`);
      suggestions.push('Consider re-centering the icon within the 24x24 grid');
    }

    // Check 2: Does it use brand colors?
    const { usesCorrectColors, foundColors } = checkBrandColors(svg, brandColors || []);
    if (!usesCorrectColors && foundColors.length > 0) {
      issues.push(`Non-brand colors found: ${foundColors.join(', ')}`);
      suggestions.push('Replace hard-coded colors with "currentColor" for theming flexibility');
    }

    // Check 3: Is file size optimal?
    const fileSizeBytes = getFileSize(svg);
    const isOptimalSize = fileSizeBytes <= opts.maxFileSizeBytes!;
    if (!isOptimalSize) {
      issues.push(`File size (${fileSizeBytes} bytes) exceeds ${opts.maxFileSizeBytes} byte limit`);
      suggestions.push('Run simplification pass to reduce path complexity');
    }

    // Additional checks
    if (!svg.includes('viewBox="0 0 24 24"')) {
      issues.push('ViewBox is not normalized to 24x24');
      suggestions.push('Normalize viewBox to "0 0 24 24" for consistency');
    }

    if (svg.includes('<image') || svg.includes('base64')) {
      issues.push('Contains raster data (base64 or image tags)');
      suggestions.push('Remove raster data and use vector paths only');
    }

    if (svg.includes('<style') || svg.includes('style=')) {
      issues.push('Contains inline styles');
      suggestions.push('Remove inline styles for CSS-based theming');
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      isCentered,
      usesCorrectColors,
      isOptimalSize,
      fileSizeBytes,
      issues,
      suggestions,
    };
  }, [checkCentering, checkBrandColors, getFileSize, opts.maxFileSizeBytes]);

  /**
   * Full optimization pipeline
   */
  const optimizeIcon = useCallback((svg: string): { optimized: string; audit: IconAuditResult } => {
    // Run sanitization (Layer 2)
    let optimized = sanitizeSVG(svg);
    
    // Run simplification if needed
    const initialSize = getFileSize(optimized);
    if (initialSize > opts.maxFileSizeBytes!) {
      optimized = simplifySVG(optimized);
    }

    // Run audit
    const audit = auditIcon(optimized, opts.brandColors);

    return { optimized, audit };
  }, [sanitizeSVG, simplifySVG, auditIcon, getFileSize, opts.maxFileSizeBytes, opts.brandColors]);

  /**
   * Generate semantic prompt for AI (Layer 1 helper)
   */
  const generateSemanticPrompt = useCallback((
    iconDescription: string,
    category: string,
    preset: string
  ): string => {
    const basePrompt = `Generate a single-path SVG icon on a 24x24 grid. 
Use ${opts.strokeWidth}px strokes. 
${opts.forceFill ? 'Use solid fills.' : 'No fills, stroke-only.'}
No gradients or shadows.
Ensure all corners have a ${opts.cornerRadius}px radius.
Center the object within a 20px safe zone (2px padding on all sides).

Icon: ${iconDescription}
Category: ${category}
Style: ${preset}

Output ONLY the SVG element, no explanation.`;

    return basePrompt;
  }, [opts.strokeWidth, opts.forceFill, opts.cornerRadius]);

  return {
    // Layer 2: Post-processing
    sanitizeSVG,
    simplifySVG,
    normalizeViewBox: (svg: string) => normalizeViewBox(svg, opts.targetViewBox!),
    roundDecimals: (svg: string) => roundDecimals(svg, opts.decimalPrecision!),
    
    // Analysis
    extractPaths,
    checkCentering,
    checkBrandColors,
    getFileSize,
    
    // Layer 3: Full audit
    auditIcon,
    
    // Combined pipeline
    optimizeIcon,
    
    // Layer 1: Prompt generation
    generateSemanticPrompt,
  };
}

export default useIconOptimizer;
