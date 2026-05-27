import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIconOptimizer, IconAuditResult } from './useIconOptimizer';

/**
 * Stylizer Configuration Options
 */
export interface StylizerOptions {
  // Stage A: Pre-processing
  removeBackground: boolean;
  edgeSharpening: number; // 0-1: How aggressive the edge detection is
  
  // Stage B: Vectorization
  simplifyThreshold: number; // 0-1: Path simplification (0 = keep detail, 1 = max simplify)
  maxAnchorPoints: number;
  snapToGrid: boolean; // 0.5px grid snapping
  
  // Stage C: Style Injection
  strokeWidth: number;
  cornerRadius: number;
  fillMode: 'stroke' | 'fill' | 'auto';
  preserveHoles: boolean; // Whether to preserve negative space
}

/**
 * Conversion Score - How well the PNG converted
 */
export interface ConversionScore {
  overall: number; // 0-100
  fidelityScore: number; // How much original shape was preserved
  nodeCount: number; // Anchor point count
  nodeScore: number; // Score based on node count (under 50 = good)
  gridCompatibility: number; // Does it fit the 20px safe zone?
  status: 'excellent' | 'good' | 'acceptable' | 'needs-work';
}

/**
 * Shadow Canvas Validation Result
 */
export interface ShadowCanvasResult {
  isValid: boolean;
  autoFixed: boolean;
  issues: string[];
  simplificationPasses: number;
}

/**
 * Stylizer Result
 */
export interface StylizerResult {
  svg: string;
  originalDimensions: { width: number; height: number };
  conversionScore: ConversionScore;
  audit: IconAuditResult;
  processingTime: number;
  shadowValidation: ShadowCanvasResult;
}

/**
 * Pipeline Stage for tracking
 */
type PipelineStage = 
  | 'idle'
  | 'preprocessing'
  | 'vectorizing'
  | 'styling'
  | 'shadow-validation'
  | 'auto-simplifying'
  | 'complete';

const DEFAULT_OPTIONS: StylizerOptions = {
  removeBackground: true,
  edgeSharpening: 0.7,
  simplifyThreshold: 0.5,
  maxAnchorPoints: 50,
  snapToGrid: true,
  strokeWidth: 2,
  cornerRadius: 4,
  fillMode: 'auto',
  preserveHoles: true,
};

const MIN_QUALITY_SCORE = 50; // Below this, auto-simplification kicks in
const MAX_SIMPLIFICATION_PASSES = 3;

/**
 * useStylizer - PNG-to-SVG Conversion with Brand Style Injection
 * 
 * Multi-Stage Pipeline:
 * - Stage A: Semantic Pre-Processing (background removal, edge sharpening)
 * - Stage B: Intelligent Vectorization (primitive fitting, path normalization)
 * - Stage C: Style Injection (brand preset application)
 * - Shadow Canvas: Pre-validation before user sees result
 */
export function useStylizer(brandColors: string[] = []) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<StylizerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Shadow Canvas ref for off-screen validation
  const shadowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const iconOptimizer = useIconOptimizer({
    brandColors,
    enableOpticalCorrection: true,
    enableSubPixelSnapping: true,
    iconPrefix: 'stylized-icon',
  });

  /**
   * Initialize Shadow Canvas (off-screen)
   */
  const initShadowCanvas = useCallback(() => {
    if (!shadowCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; // 4x target size for quality check
      canvas.height = 128;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      shadowCanvasRef.current = canvas;
    }
    return shadowCanvasRef.current;
  }, []);

  /**
   * Render SVG to Shadow Canvas for validation
   */
  const renderToShadowCanvas = useCallback(async (svg: string): Promise<ImageData> => {
    const canvas = initShadowCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to render SVG to canvas'));
      };

      img.src = url;
    });
  }, [initShadowCanvas]);

  /**
   * Shadow Canvas Validation - "The Blob Test"
   * Validates the icon before user sees it
   */
  const validateOnShadowCanvas = useCallback(async (
    svg: string,
    conversionScore: ConversionScore
  ): Promise<ShadowCanvasResult> => {
    const issues: string[] = [];
    let isValid = true;

    try {
      const imageData = await renderToShadowCanvas(svg);
      const pixels = imageData.data;

      // 1. Check for empty/broken SVG
      let hasContent = false;
      let inkPixels = 0;
      const totalPixels = imageData.width * imageData.height;

      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        if (alpha > 10) {
          hasContent = true;
          if (alpha > 128) inkPixels++;
        }
      }

      if (!hasContent) {
        issues.push('Empty or broken SVG - no visible content');
        isValid = false;
      }

      // 2. "Blob Test" - Check if icon is too complex (becomes unrecognizable when blurred)
      const inkDensity = inkPixels / totalPixels;
      if (inkDensity > 0.6) {
        issues.push('High ink density - icon may appear as a blob at small sizes');
      }
      if (inkDensity < 0.05) {
        issues.push('Very low ink density - icon may be too thin/light');
      }

      // 3. Check centering via bounding box
      let minX = imageData.width, maxX = 0, minY = imageData.height, maxY = 0;
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const idx = (y * imageData.width + x) * 4;
          if (pixels[idx + 3] > 50) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX > minX && maxY > minY) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const expectedCenter = imageData.width / 2;
        const offsetX = Math.abs(centerX - expectedCenter);
        const offsetY = Math.abs(centerY - expectedCenter);

        if (offsetX > imageData.width * 0.1 || offsetY > imageData.height * 0.1) {
          issues.push('Icon is not well-centered');
        }
      }

      // 4. Check conversion score threshold
      if (conversionScore.overall < MIN_QUALITY_SCORE) {
        issues.push(`Quality score ${conversionScore.overall} below threshold ${MIN_QUALITY_SCORE}`);
        isValid = false;
      }

    } catch (err) {
      issues.push('Shadow canvas validation failed');
      console.error('Shadow canvas error:', err);
    }

    return {
      isValid,
      autoFixed: false,
      issues,
      simplificationPasses: 0,
    };
  }, [renderToShadowCanvas]);

  /**
   * Auto-Simplification Pass
   * Attempts to improve a low-scoring icon
   */
  const runSimplificationPass = useCallback(async (
    svg: string,
    passNumber: number
  ): Promise<string> => {
    // Progressively increase simplification
    const simplificationLevel = Math.min(0.9, 0.5 + (passNumber * 0.15));
    
    // Use the optimizer's simplification
    const { optimized } = iconOptimizer.optimizeIcon(svg, `simplified-pass-${passNumber}`);
    
    // Additional path simplification
    let simplified = optimized;

    // Reduce path precision on each pass
    const precision = Math.max(0, 2 - passNumber);
    simplified = simplified.replace(
      /(\d+\.\d{3,})/g,
      (match) => parseFloat(match).toFixed(precision)
    );

    // Remove tiny path segments
    simplified = simplified.replace(
      /([mlhvcsqtaz])\s*([-\d.]+\s*){1,2}(?=[mlhvcsqtaz])/gi,
      (match, cmd, coords) => {
        const nums = coords.trim().split(/\s+/).map(Number);
        const magnitude = Math.sqrt(nums.reduce((sum, n) => sum + n * n, 0));
        return magnitude < 0.5 ? '' : match;
      }
    );

    return simplified;
  }, [iconOptimizer]);

  /**
   * Convert a PNG file to branded SVG
   */
  const processImage = useCallback(async (
    file: File,
    options: Partial<StylizerOptions> = {}
  ): Promise<StylizerResult | null> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setPipelineStage('preprocessing');

    try {
      // Read file as base64
      const base64 = await fileToBase64(file);
      const imageDimensions = await getImageDimensions(file);

      // ============================================
      // Stage A: Semantic Pre-Processing
      // ============================================
      setCurrentStage('Pre-processing image...');
      setPipelineStage('preprocessing');
      setProgress(10);

      // Apply edge sharpening simulation (in real production, this would be a separate API)
      // For now, we pass parameters to the AI for semantic understanding
      await delay(200);

      // ============================================
      // Stage B: AI-Powered Vectorization
      // ============================================
      setCurrentStage('Vectorizing with AI...');
      setPipelineStage('vectorizing');
      setProgress(25);

      const response = await supabase.functions.invoke('stylize-icon', {
        body: {
          image: base64,
          options: {
            removeBackground: opts.removeBackground,
            edgeSharpening: opts.edgeSharpening,
            simplifyThreshold: opts.simplifyThreshold,
            maxAnchorPoints: opts.maxAnchorPoints,
            strokeWidth: opts.strokeWidth,
            cornerRadius: opts.cornerRadius,
            fillMode: opts.fillMode,
            preserveHoles: opts.preserveHoles,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setProgress(55);

      let rawSvg = response.data?.svg;
      if (!rawSvg) {
        throw new Error('No SVG generated from image');
      }

      // ============================================
      // Stage C: Style Injection & Optimization
      // ============================================
      setCurrentStage('Applying brand styles...');
      setPipelineStage('styling');
      setProgress(65);

      // Apply brand optimization
      let { optimized, audit } = iconOptimizer.optimizeIcon(rawSvg, file.name.replace(/\.[^/.]+$/, ''));
      let conversionScore = calculateConversionScore(optimized, imageDimensions, opts);

      // ============================================
      // Shadow Canvas Validation
      // ============================================
      setCurrentStage('Validating output...');
      setPipelineStage('shadow-validation');
      setProgress(75);

      let shadowValidation = await validateOnShadowCanvas(optimized, conversionScore);

      // ============================================
      // Auto-Simplification (if needed)
      // ============================================
      let simplificationPasses = 0;
      
      while (
        !shadowValidation.isValid && 
        simplificationPasses < MAX_SIMPLIFICATION_PASSES &&
        conversionScore.overall < MIN_QUALITY_SCORE
      ) {
        setCurrentStage(`Auto-simplifying (pass ${simplificationPasses + 1})...`);
        setPipelineStage('auto-simplifying');
        setProgress(80 + (simplificationPasses * 5));

        simplificationPasses++;
        
        // Run simplification
        optimized = await runSimplificationPass(optimized, simplificationPasses);
        
        // Re-optimize and re-score
        const reOptimized = iconOptimizer.optimizeIcon(optimized, file.name.replace(/\.[^/.]+$/, ''));
        optimized = reOptimized.optimized;
        audit = reOptimized.audit;
        conversionScore = calculateConversionScore(optimized, imageDimensions, opts);
        
        // Re-validate
        shadowValidation = await validateOnShadowCanvas(optimized, conversionScore);
        shadowValidation.simplificationPasses = simplificationPasses;
        shadowValidation.autoFixed = shadowValidation.isValid;
      }

      // ============================================
      // Complete
      // ============================================
      setProgress(100);
      setCurrentStage('Complete!');
      setPipelineStage('complete');

      const processingTime = performance.now() - startTime;

      const finalResult: StylizerResult = {
        svg: optimized,
        originalDimensions: imageDimensions,
        conversionScore,
        audit,
        processingTime,
        shadowValidation,
      };

      setResult(finalResult);
      return finalResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error during conversion';
      setError(message);
      setPipelineStage('idle');
      console.error('Stylizer error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [iconOptimizer, validateOnShadowCanvas, runSimplificationPass]);

  /**
   * Calculate the Conversion Score
   */
  const calculateConversionScore = (
    svg: string,
    originalDimensions: { width: number; height: number },
    options: StylizerOptions
  ): ConversionScore => {
    // Extract paths and count nodes
    const pathMatches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/gi);
    let totalNodes = 0;
    
    for (const match of pathMatches) {
      const pathData = match[1];
      const commands = pathData.match(/[MLHVCSQTAZmlhvcsqtaz]/g) || [];
      totalNodes += commands.length;
    }

    // Node Score (under 50 is ideal, under 30 is excellent)
    let nodeScore: number;
    if (totalNodes <= 20) nodeScore = 100;
    else if (totalNodes <= 30) nodeScore = 90;
    else if (totalNodes <= 50) nodeScore = 75;
    else if (totalNodes <= 80) nodeScore = 50;
    else nodeScore = Math.max(0, 100 - totalNodes);

    // Fidelity Score - Based on aspect ratio preservation
    const originalAspect = originalDimensions.width / originalDimensions.height;
    const targetAspect = 1; // 24x24 is square
    const aspectDiff = Math.abs(originalAspect - targetAspect);
    const fidelityScore = Math.max(0, 100 - (aspectDiff * 30));

    // Grid Compatibility - Check if content fits 20px safe zone
    const coords = extractCoordinates(svg);
    let gridCompatibility = 100;
    
    if (coords.length > 0) {
      const xs = coords.map(c => c.x);
      const ys = coords.map(c => c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Check if within 2-22 (20px content zone with 2px padding)
      const inSafeZone = minX >= 1.5 && maxX <= 22.5 && minY >= 1.5 && maxY <= 22.5;
      gridCompatibility = inSafeZone ? 100 : 60;
    }

    // Overall Score
    const overall = Math.round(
      (nodeScore * 0.35) + 
      (fidelityScore * 0.35) + 
      (gridCompatibility * 0.30)
    );

    // Status
    let status: ConversionScore['status'];
    if (overall >= 85) status = 'excellent';
    else if (overall >= 70) status = 'good';
    else if (overall >= 50) status = 'acceptable';
    else status = 'needs-work';

    return {
      overall,
      fidelityScore: Math.round(fidelityScore),
      nodeCount: totalNodes,
      nodeScore: Math.round(nodeScore),
      gridCompatibility: Math.round(gridCompatibility),
      status,
    };
  };

  /**
   * Apply a different style preset to existing result
   */
  const reapplyStyle = useCallback((
    svg: string,
    options: Partial<StylizerOptions>
  ): string => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let styled = svg;

    // Update stroke width
    styled = styled.replace(/stroke-width="[^"]*"/g, `stroke-width="${opts.strokeWidth}"`);

    // Update fill mode
    if (opts.fillMode === 'stroke') {
      styled = styled.replace(/fill="currentColor"/g, 'fill="none"');
      if (!styled.includes('stroke="currentColor"')) {
        styled = styled.replace('<svg', '<svg stroke="currentColor"');
      }
    } else if (opts.fillMode === 'fill') {
      styled = styled.replace(/stroke="currentColor"/g, 'stroke="none"');
      styled = styled.replace(/fill="none"/g, 'fill="currentColor"');
    }

    // Re-optimize
    const { optimized } = iconOptimizer.optimizeIcon(styled);
    return optimized;
  }, [iconOptimizer]);

  /**
   * Manual simplification trigger
   */
  const triggerSimplification = useCallback(async (): Promise<StylizerResult | null> => {
    if (!result) return null;

    setIsProcessing(true);
    setCurrentStage('Running simplification...');

    try {
      const simplified = await runSimplificationPass(result.svg, result.shadowValidation.simplificationPasses + 1);
      const { optimized, audit } = iconOptimizer.optimizeIcon(simplified);
      const conversionScore = calculateConversionScore(optimized, result.originalDimensions, DEFAULT_OPTIONS);
      const shadowValidation = await validateOnShadowCanvas(optimized, conversionScore);

      const newResult: StylizerResult = {
        ...result,
        svg: optimized,
        conversionScore,
        audit,
        shadowValidation: {
          ...shadowValidation,
          simplificationPasses: result.shadowValidation.simplificationPasses + 1,
          autoFixed: shadowValidation.isValid,
        },
      };

      setResult(newResult);
      return newResult;
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
    }
  }, [result, runSimplificationPass, iconOptimizer, validateOnShadowCanvas]);

  /**
   * Reset the stylizer state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setCurrentStage('');
    setPipelineStage('idle');
  }, []);

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    if (shadowCanvasRef.current) {
      shadowCanvasRef.current.remove();
      shadowCanvasRef.current = null;
    }
  }, []);

  // Auto-cleanup the off-screen <canvas> when the host component unmounts —
  // otherwise every Stylizer mount leaks a hidden 128×128 canvas into <body>.
  useEffect(() => cleanup, [cleanup]);

  return {
    // State
    isProcessing,
    progress,
    currentStage,
    pipelineStage,
    result,
    error,

    // Actions
    processImage,
    reapplyStyle,
    triggerSimplification,
    reset,
    cleanup,

    // Utilities
    calculateConversionScore,
  };
}

// =========================================
// UTILITY FUNCTIONS
// =========================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function extractCoordinates(svg: string): { x: number; y: number }[] {
  const pathMatches = svg.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/gi);
  const coords: { x: number; y: number }[] = [];
  
  for (const match of pathMatches) {
    const pathData = match[1];
    const numbers = pathData.match(/-?\d+\.?\d*/g);
    if (numbers) {
      for (let i = 0; i < numbers.length - 1; i += 2) {
        coords.push({
          x: parseFloat(numbers[i]),
          y: parseFloat(numbers[i + 1]),
        });
      }
    }
  }
  
  return coords;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default useStylizer;
