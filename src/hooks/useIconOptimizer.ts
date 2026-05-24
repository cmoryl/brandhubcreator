import { useCallback, useMemo } from 'react';

/**
 * Icon Quality Score breakdown
 */
export interface IconQualityScore {
  overall: number; // 1-100
  breakdown: {
    geometricPrecision: number; // 0-25: Grid alignment, sub-pixel snapping
    opticalBalance: number; // 0-25: Weight, centering, density
    accessibility: number; // 0-25: Contrast, legibility, complexity
    production: number; // 0-25: File size, clean code, optimization
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'production-ready' | 'needs-review' | 'needs-cleanup';
}

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
  // Enhanced metrics
  qualityScore: IconQualityScore;
  opticalMetrics: {
    inkDensity: number; // 0-1: How "heavy" the icon appears
    visualCenter: { x: number; y: number };
    needsOpticalAdjustment: boolean;
    suggestedScale: number; // e.g., 0.95 for heavy icons
  };
  accessibilityMetrics: {
    passesContrastCheck: boolean;
    contrastRatio: number;
    complexityScore: number; // Higher = more complex
    passesLegibilityTest: boolean;
  };
  productionMetrics: {
    isPixelPerfect: boolean;
    hasCleanIds: boolean;
    isMetadataFree: boolean;
    anchorPointCount: number;
  };
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
  // Enhanced options
  enableOpticalCorrection?: boolean;
  enableSubPixelSnapping?: boolean;
  maxComplexityScore?: number;
  iconPrefix?: string; // For ID normalization
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  targetViewBox: '0 0 24 24',
  decimalPrecision: 2,
  maxFileSizeBytes: 2048, // 2KB
  strokeWidth: 2,
  forceStroke: true,
  forceFill: false,
  cornerRadius: 4,
  enableOpticalCorrection: true,
  enableSubPixelSnapping: true,
  maxComplexityScore: 50,
  iconPrefix: 'brand-icon',
};

/**
 * useIconOptimizer - Production-Grade 4-Pillar Robustness System
 * 
 * Pillar 1: Optical Weight Balancing
 * Pillar 2: Accessibility & Legibility Guardrails
 * Pillar 3: Production-Ready Sanitizer
 * Pillar 4: Semantic Family Logic (via quality scoring)
 */
export function useIconOptimizer(options: OptimizationOptions = {}) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  // =========================================
  // PILLAR 1: OPTICAL WEIGHT BALANCING
  // =========================================

  /**
   * Calculate "ink density" - how visually heavy an icon appears
   * Based on path coverage and filled area estimation
   */
  const calculateInkDensity = useCallback((svg: string): number => {
    const paths = extractPathsFromSvg(svg);
    if (paths.length === 0) return 0;

    // Estimate ink density from path commands
    let totalPoints = 0;
    let closedPaths = 0;

    for (const path of paths) {
      const commands = path.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || [];
      totalPoints += commands.length;
      if (path.toLowerCase().includes('z')) closedPaths++;
    }

    // Check if icon uses fill
    const hasFill = svg.includes('fill="currentColor"') || 
                    (svg.includes('fill=') && !svg.includes('fill="none"'));

    // Density formula: more points + closed paths + fill = heavier
    const baseComplexity = Math.min(totalPoints / 30, 1); // Cap at 30 commands
    const fillWeight = hasFill ? 0.3 : 0;
    const closureWeight = (closedPaths / Math.max(paths.length, 1)) * 0.2;

    return Math.min(baseComplexity + fillWeight + closureWeight, 1);
  }, []);

  /**
   * Calculate visual center (may differ from mathematical center)
   * Triangular icons need rightward nudge, heavy bottom icons need upward nudge
   */
  const calculateVisualCenter = useCallback((svg: string): { x: number; y: number; needsAdjustment: boolean } => {
    const coords = extractCoordinates(svg);
    if (coords.length === 0) return { x: 12, y: 12, needsAdjustment: false };

    // Calculate bounding box
    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const mathCenterX = (minX + maxX) / 2;
    const mathCenterY = (minY + maxY) / 2;

    // Calculate weighted center based on point distribution
    const avgX = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
    const avgY = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;

    // Detect asymmetry (triangular icons, arrows, etc.)
    const xSkew = avgX - mathCenterX;
    const ySkew = avgY - mathCenterY;
    const needsAdjustment = Math.abs(xSkew) > 1.5 || Math.abs(ySkew) > 1.5;

    return {
      x: mathCenterX + (xSkew * 0.3), // Apply 30% correction
      y: mathCenterY + (ySkew * 0.3),
      needsAdjustment,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extractCoordinates is a stable function declaration
  }, []);

  /**
   * Calculate suggested scale based on optical weight
   * Heavy icons (solid squares) scale down, light icons (thin lines) scale up
   */
  const calculateOpticalScale = useCallback((inkDensity: number): number => {
    // Target density is ~0.5 (medium weight)
    const targetDensity = 0.5;
    const deviation = inkDensity - targetDensity;
    
    // Scale adjustment: heavy icons scale down, light icons scale up
    // Max adjustment is ±5%
    const adjustment = -deviation * 0.1;
    return Math.max(0.9, Math.min(1.1, 1 + adjustment));
  }, []);

  // =========================================
  // PILLAR 2: ACCESSIBILITY & LEGIBILITY
  // =========================================

  /**
   * Calculate contrast ratio between foreground and background
   * Returns WCAG-style ratio (e.g., 4.5:1)
   */
  const calculateContrastRatio = useCallback((fgColor: string, bgColor: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = hexToRgb(hex);
      if (!rgb) return 0;
      
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(fgColor);
    const l2 = getLuminance(bgColor);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  /**
   * Check if icon passes WCAG 2.1 AA for graphical elements (3:1 ratio)
   */
  const checkContrastCompliance = useCallback((iconColor: string, brandColors: string[]): { passes: boolean; ratio: number } => {
    if (!iconColor || brandColors.length === 0) {
      return { passes: true, ratio: 21 }; // Assume currentColor is compliant
    }

    // Test against common backgrounds (white and black)
    const backgrounds = ['#ffffff', '#000000', ...brandColors];
    let worstRatio = 21;

    for (const bg of backgrounds) {
      const ratio = calculateContrastRatio(iconColor, bg);
      worstRatio = Math.min(worstRatio, ratio);
    }

    return { passes: worstRatio >= 3, ratio: worstRatio };
  }, [calculateContrastRatio]);

  /**
   * Calculate complexity score based on path structure
   * Higher score = more complex = potentially illegible at small sizes
   */
  const calculateComplexityScore = useCallback((svg: string): number => {
    const paths = extractPathsFromSvg(svg);
    let score = 0;

    for (const path of paths) {
      // Count anchor points
      const commands = path.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || [];
      score += commands.length;

      // Curves are more complex than lines
      const curves = path.match(/[CSQcsq]/g) || [];
      score += curves.length * 2;
    }

    // Count total paths
    score += paths.length * 3;

    return score;
  }, []);

  /**
   * "Blob Test" - would the icon be recognizable when blurred?
   * Icons with complexity > threshold fail
   */
  const checkLegibility = useCallback((svg: string, maxComplexity: number): boolean => {
    const complexity = calculateComplexityScore(svg);
    return complexity <= maxComplexity;
  }, [calculateComplexityScore]);

  // =========================================
  // PILLAR 3: PRODUCTION-READY SANITIZER
  // =========================================

  /**
   * Snap coordinates to 0.5px grid for pixel-perfect rendering
   */
  const snapToSubPixelGrid = useCallback((svg: string): string => {
    return svg.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      // Snap to nearest 0.5
      const snapped = Math.round(num * 2) / 2;
      // Remove unnecessary decimals
      return snapped === Math.floor(snapped) ? String(Math.floor(snapped)) : snapped.toFixed(1);
    });
  }, []);

  /**
   * Normalize IDs for developer-friendly CSS targeting
   */
  const normalizeIds = useCallback((svg: string, iconName: string, prefix: string): string => {
    // Generate kebab-case ID from name
    const normalizedName = iconName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);

    const newId = `${prefix}-${normalizedName}`;

    // Remove existing IDs and add normalized one
    let result = svg.replace(/\s*id="[^"]*"/gi, '');
    result = result.replace('<svg', `<svg id="${newId}"`);

    return result;
  }, []);

  /**
   * Count anchor points in SVG paths
   */
  const countAnchorPoints = useCallback((svg: string): number => {
    const paths = extractPathsFromSvg(svg);
    let count = 0;

    for (const path of paths) {
      const commands = path.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || [];
      count += commands.length;
    }

    return count;
  }, []);

  /**
   * Full sanitization pipeline
   */
  const sanitizeSVG = useCallback((svgString: string, iconName?: string): string => {
    if (!svgString) return '';

    let svg = svgString.trim();

    // Extract SVG content if wrapped
    const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) return svg;
    svg = svgMatch[0];

    // Step 1: Remove metadata and editor-specific tags
    svg = svg
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
      .replace(/<title[\s\S]*?<\/title>/gi, '')
      .replace(/<desc[\s\S]*?<\/desc>/gi, '')
      .replace(/<defs[\s\S]*?<\/defs>/gi, '')
      .replace(/data-[\w-]+="[^"]*"/gi, '')
      .replace(/inkscape:[\w-]+="[^"]*"/gi, '')
      .replace(/sodipodi:[\w-]+="[^"]*"/gi, '')
      .replace(/xmlns:inkscape="[^"]*"/gi, '')
      .replace(/xmlns:sodipodi="[^"]*"/gi, '')
      .replace(/xmlns:svg="[^"]*"/gi, '')
      .replace(/xmlns:dc="[^"]*"/gi, '')
      .replace(/xmlns:cc="[^"]*"/gi, '')
      .replace(/xmlns:rdf="[^"]*"/gi, '')
      .replace(/class="[^"]*"/gi, '')
      .replace(/style="[^"]*"/gi, '');

    // Step 2: Normalize ViewBox
    svg = normalizeViewBox(svg, opts.targetViewBox!);

    // Step 3: Sub-pixel snapping (Pillar 3)
    if (opts.enableSubPixelSnapping) {
      svg = snapToSubPixelGrid(svg);
    }

    // Step 4: ID normalization (Pillar 3)
    if (iconName) {
      svg = normalizeIds(svg, iconName, opts.iconPrefix!);
    }

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
  }, [opts, snapToSubPixelGrid, normalizeIds]);

  /**
   * Normalize ViewBox to target dimensions
   */
  const normalizeViewBox = (svg: string, targetViewBox: string): string => {
    const hasViewBox = /viewBox="[^"]*"/i.test(svg);
    
    if (hasViewBox) {
      svg = svg.replace(/viewBox="[^"]*"/i, `viewBox="${targetViewBox}"`);
    } else {
      svg = svg.replace(/<svg/, `<svg viewBox="${targetViewBox}"`);
    }

    svg = svg.replace(/\s*width="[^"]*"/gi, '');
    svg = svg.replace(/\s*height="[^"]*"/gi, '');

    return svg;
  };

  /**
   * Normalize stroke and fill attributes
   */
  const normalizeStrokeFill = (svg: string, options: OptimizationOptions): string => {
    if (!svg.includes('xmlns=')) {
      svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    if (options.forceStroke) {
      svg = svg.replace(/\s*stroke="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-width="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-linecap="[^"]*"/gi, '');
      svg = svg.replace(/\s*stroke-linejoin="[^"]*"/gi, '');
      
      svg = svg.replace(
        '<svg',
        `<svg stroke="currentColor" stroke-width="${options.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      );
    }

    if (options.forceFill === false) {
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

  // =========================================
  // PILLAR 4: QUALITY SCORING SYSTEM
  // =========================================

  /**
   * Calculate comprehensive Icon Quality Score (1-100)
   */
  const calculateQualityScore = useCallback((
    svg: string,
    brandColors: string[] = []
  ): IconQualityScore => {
    const scores = {
      geometricPrecision: 0,
      opticalBalance: 0,
      accessibility: 0,
      production: 0,
    };

    // Geometric Precision (0-25)
    const hasCorrectViewBox = svg.includes('viewBox="0 0 24 24"');
    const hasXmlns = svg.includes('xmlns=');
    const coords = extractCoordinates(svg);
    const hasWholeNumbers = coords.every(c => 
      Number.isInteger(c.x * 2) && Number.isInteger(c.y * 2) // 0.5px grid
    );
    
    scores.geometricPrecision = 
      (hasCorrectViewBox ? 10 : 0) +
      (hasXmlns ? 5 : 0) +
      (hasWholeNumbers ? 10 : 5);

    // Optical Balance (0-25)
    const inkDensity = calculateInkDensity(svg);
    const visualCenter = calculateVisualCenter(svg);
    const opticalScale = calculateOpticalScale(inkDensity);
    
    const isBalancedDensity = inkDensity > 0.2 && inkDensity < 0.8;
    const isCentered = !visualCenter.needsAdjustment;
    const isOpticallyCorrect = opticalScale > 0.95 && opticalScale < 1.05;

    scores.opticalBalance =
      (isBalancedDensity ? 10 : 5) +
      (isCentered ? 10 : 5) +
      (isOpticallyCorrect ? 5 : 0);

    // Accessibility (0-25)
    const complexity = calculateComplexityScore(svg);
    const isSimple = complexity <= opts.maxComplexityScore!;
    const passesLegibility = checkLegibility(svg, opts.maxComplexityScore!);
    
    // Extract icon color for contrast check
    const colorMatch = svg.match(/stroke="(#[0-9a-f]{3,6})"/i) || 
                       svg.match(/fill="(#[0-9a-f]{3,6})"/i);
    const iconColor = colorMatch ? colorMatch[1] : '';
    const contrastResult = iconColor ? checkContrastCompliance(iconColor, brandColors) : { passes: true, ratio: 21 };

    scores.accessibility =
      (isSimple ? 10 : 5) +
      (passesLegibility ? 10 : 5) +
      (contrastResult.passes ? 5 : 0);

    // Production (0-25)
    const fileSize = new Blob([svg]).size;
    const isUnderSizeLimit = fileSize <= opts.maxFileSizeBytes!;
    const anchorPoints = countAnchorPoints(svg);
    const isOptimized = anchorPoints <= 40;
    const hasNoMetadata = !svg.includes('inkscape') && !svg.includes('sodipodi');
    const hasCleanId = svg.includes(`id="${opts.iconPrefix}`);

    scores.production =
      (isUnderSizeLimit ? 10 : 5) +
      (isOptimized ? 5 : 0) +
      (hasNoMetadata ? 5 : 0) +
      (hasCleanId ? 5 : 0);

    // Calculate overall
    const overall = scores.geometricPrecision + scores.opticalBalance + 
                    scores.accessibility + scores.production;

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    // Determine status
    let status: 'production-ready' | 'needs-review' | 'needs-cleanup';
    if (overall >= 80) status = 'production-ready';
    else if (overall >= 60) status = 'needs-review';
    else status = 'needs-cleanup';

    return {
      overall,
      breakdown: scores,
      grade,
      status,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extractCoordinates is a stable function declaration
  }, [
    calculateInkDensity, 
    calculateVisualCenter, 
    calculateOpticalScale,
    calculateComplexityScore,
    checkLegibility,
    checkContrastCompliance,
    countAnchorPoints,
    opts.maxComplexityScore,
    opts.maxFileSizeBytes,
    opts.iconPrefix,
  ]);

  // =========================================
  // FULL AUDIT SYSTEM
  // =========================================

  /**
   * Full Icon Audit with 4-Pillar analysis
   */
  const auditIcon = useCallback((svg: string, brandColors?: string[]): IconAuditResult => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const colors = brandColors || [];

    // Basic checks
    const fileSizeBytes = new Blob([svg]).size;
    const isOptimalSize = fileSizeBytes <= opts.maxFileSizeBytes!;
    
    if (!isOptimalSize) {
      issues.push(`File size (${fileSizeBytes}B) exceeds ${opts.maxFileSizeBytes}B limit`);
      suggestions.push('Simplify paths or reduce anchor points');
    }

    if (!svg.includes('viewBox="0 0 24 24"')) {
      issues.push('ViewBox not normalized to 24x24');
      suggestions.push('Apply viewBox="0 0 24 24"');
    }

    // Pillar 1: Optical metrics
    const inkDensity = calculateInkDensity(svg);
    const visualCenter = calculateVisualCenter(svg);
    const suggestedScale = calculateOpticalScale(inkDensity);

    if (visualCenter.needsAdjustment) {
      issues.push('Icon may appear off-center due to visual weight distribution');
      suggestions.push('Apply optical centering correction');
    }

    if (inkDensity > 0.8) {
      issues.push('Icon appears too heavy (high ink density)');
      suggestions.push(`Consider scaling down to ${(suggestedScale * 100).toFixed(0)}%`);
    } else if (inkDensity < 0.15) {
      issues.push('Icon appears too light (low ink density)');
      suggestions.push('Consider adding visual weight or thicker strokes');
    }

    // Pillar 2: Accessibility
    const complexityScore = calculateComplexityScore(svg);
    const passesLegibilityTest = checkLegibility(svg, opts.maxComplexityScore!);
    
    const colorMatch = svg.match(/stroke="(#[0-9a-f]{3,6})"/i) || svg.match(/fill="(#[0-9a-f]{3,6})"/i);
    const iconColor = colorMatch ? colorMatch[1] : '';
    const contrastResult = iconColor ? checkContrastCompliance(iconColor, colors) : { passes: true, ratio: 21 };

    if (!passesLegibilityTest) {
      issues.push(`Complexity score (${complexityScore}) too high for small sizes`);
      suggestions.push('Simplify the icon for better legibility at 16px');
    }

    if (!contrastResult.passes) {
      issues.push(`Contrast ratio (${contrastResult.ratio.toFixed(1)}:1) below WCAG 3:1 minimum`);
      suggestions.push('Use higher contrast colors');
    }

    // Pillar 3: Production metrics
    const anchorPointCount = countAnchorPoints(svg);
    const isPixelPerfect = !svg.match(/\.\d{3,}/); // No coords with 3+ decimals
    const hasCleanIds = svg.includes(`id="${opts.iconPrefix}`) || !svg.includes('id=');
    const isMetadataFree = !svg.includes('inkscape') && !svg.includes('sodipodi') && !svg.includes('adobe');

    if (!isPixelPerfect) {
      issues.push('Contains sub-pixel coordinates that may cause blurry rendering');
      suggestions.push('Snap coordinates to 0.5px grid');
    }

    if (!isMetadataFree) {
      issues.push('Contains editor metadata (bloat)');
      suggestions.push('Strip all non-essential SVG metadata');
    }

    if (anchorPointCount > 50) {
      issues.push(`High anchor point count (${anchorPointCount})`);
      suggestions.push('Simplify paths for smaller file size');
    }

    // Calculate quality score
    const qualityScore = calculateQualityScore(svg, colors);

    // Centering check
    const coords = extractCoordinates(svg);
    let isCentered = true;
    if (coords.length > 0) {
      const xs = coords.map(c => c.x);
      const ys = coords.map(c => c.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      isCentered = Math.abs(centerX - 12) <= 1.5 && Math.abs(centerY - 12) <= 1.5;
    }

    const usesCorrectColors = iconColor === '' || iconColor === 'currentColor' || 
      colors.map(c => c.toLowerCase()).includes(iconColor.toLowerCase());

    const isValid = issues.length === 0;

    return {
      isValid,
      isCentered,
      usesCorrectColors,
      isOptimalSize,
      fileSizeBytes,
      issues,
      suggestions,
      qualityScore,
      opticalMetrics: {
        inkDensity,
        visualCenter: { x: visualCenter.x, y: visualCenter.y },
        needsOpticalAdjustment: visualCenter.needsAdjustment,
        suggestedScale,
      },
      accessibilityMetrics: {
        passesContrastCheck: contrastResult.passes,
        contrastRatio: contrastResult.ratio,
        complexityScore,
        passesLegibilityTest,
      },
      productionMetrics: {
        isPixelPerfect,
        hasCleanIds,
        isMetadataFree,
        anchorPointCount,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extractCoordinates is a stable function declaration
  }, [
    opts.maxFileSizeBytes,
    opts.maxComplexityScore,
    opts.iconPrefix,
    calculateInkDensity,
    calculateVisualCenter,
    calculateOpticalScale,
    calculateComplexityScore,
    checkLegibility,
    checkContrastCompliance,
    countAnchorPoints,
    calculateQualityScore,
  ]);

  /**
   * Apply optical corrections to SVG
   */
  const applyOpticalCorrections = useCallback((svg: string): string => {
    const visualCenter = calculateVisualCenter(svg);
    
    if (!visualCenter.needsAdjustment) return svg;

    // Calculate offset needed to visually center
    const offsetX = 12 - visualCenter.x;
    const offsetY = 12 - visualCenter.y;

    // Apply transform to center visually
    if (Math.abs(offsetX) > 0.5 || Math.abs(offsetY) > 0.5) {
      // Add a group with transform
      svg = svg.replace(
        /(<svg[^>]*>)/,
        `$1<g transform="translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})">`
      );
      svg = svg.replace('</svg>', '</g></svg>');
    }

    return svg;
  }, [calculateVisualCenter]);

  /**
   * Simplify SVG by reducing complexity
   */
  const simplifySVG = useCallback((svg: string): string => {
    let simplified = svg;

    // Round all coordinates more aggressively
    simplified = simplified.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      return String(Math.round(num));
    });

    // Remove redundant path commands
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
   * Full optimization pipeline
   */
  const optimizeIcon = useCallback((svg: string, iconName?: string): { 
    optimized: string; 
    audit: IconAuditResult 
  } => {
    // Apply sanitization
    let optimized = sanitizeSVG(svg, iconName);
    
    // Apply optical corrections if enabled
    if (opts.enableOpticalCorrection) {
      optimized = applyOpticalCorrections(optimized);
    }
    
    // Check if simplification is needed
    const initialSize = new Blob([optimized]).size;
    if (initialSize > opts.maxFileSizeBytes!) {
      optimized = simplifySVG(optimized);
    }

    // Run full audit
    const audit = auditIcon(optimized, opts.brandColors);

    return { optimized, audit };
  }, [sanitizeSVG, applyOpticalCorrections, simplifySVG, auditIcon, opts]);

  // =========================================
  // HELPER FUNCTIONS
  // =========================================

  function extractPathsFromSvg(svg: string): string[] {
    const pathMatches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/gi);
    return Array.from(pathMatches, m => m[1]);
  }

  function extractCoordinates(svg: string): { x: number; y: number }[] {
    const paths = extractPathsFromSvg(svg);
    const coords: { x: number; y: number }[] = [];
    
    for (const path of paths) {
      const numbers = path.match(/-?\d+\.?\d*/g);
      if (numbers) {
        for (let i = 0; i < numbers.length - 1; i += 2) {
          coords.push({ 
            x: parseFloat(numbers[i]), 
            y: parseFloat(numbers[i + 1]) 
          });
        }
      }
    }
    
    return coords;
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      // Try 3-digit hex
      const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
      if (short) {
        return {
          r: parseInt(short[1] + short[1], 16),
          g: parseInt(short[2] + short[2], 16),
          b: parseInt(short[3] + short[3], 16),
        };
      }
      return null;
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  return {
    // Pillar 1: Optical Balance
    calculateInkDensity,
    calculateVisualCenter,
    calculateOpticalScale,
    applyOpticalCorrections,

    // Pillar 2: Accessibility
    calculateContrastRatio,
    checkContrastCompliance,
    calculateComplexityScore,
    checkLegibility,

    // Pillar 3: Production Sanitizer
    sanitizeSVG,
    simplifySVG,
    snapToSubPixelGrid,
    normalizeIds,
    countAnchorPoints,

    // Pillar 4: Quality Scoring
    calculateQualityScore,
    auditIcon,

    // Combined Pipeline
    optimizeIcon,
  };
}

export default useIconOptimizer;
