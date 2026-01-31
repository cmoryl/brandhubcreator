import { useState, useCallback } from 'react';
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
 * Stylizer Result
 */
export interface StylizerResult {
  svg: string;
  originalDimensions: { width: number; height: number };
  conversionScore: ConversionScore;
  audit: IconAuditResult;
  processingTime: number;
}

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

/**
 * useStylizer - PNG-to-SVG Conversion with Brand Style Injection
 * 
 * Multi-Stage Pipeline:
 * - Stage A: Semantic Pre-Processing (background removal, edge sharpening)
 * - Stage B: Intelligent Vectorization (primitive fitting, path normalization)
 * - Stage C: Style Injection (brand preset application)
 */
export function useStylizer(brandColors: string[] = []) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [result, setResult] = useState<StylizerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const iconOptimizer = useIconOptimizer({
    brandColors,
    enableOpticalCorrection: true,
    enableSubPixelSnapping: true,
    iconPrefix: 'stylized-icon',
  });

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

    try {
      // Read file as base64
      const base64 = await fileToBase64(file);
      const imageDimensions = await getImageDimensions(file);

      // Stage A: Semantic Pre-Processing
      setCurrentStage('Pre-processing image...');
      setProgress(10);
      await delay(300); // Visual feedback

      // Stage B: AI-Powered Vectorization
      setCurrentStage('Vectorizing with AI...');
      setProgress(30);

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

      setProgress(70);
      setCurrentStage('Applying brand styles...');

      const rawSvg = response.data?.svg;
      if (!rawSvg) {
        throw new Error('No SVG generated from image');
      }

      // Stage C: Style Injection & Optimization
      setProgress(85);
      setCurrentStage('Optimizing for production...');

      // Apply brand optimization
      const { optimized, audit } = iconOptimizer.optimizeIcon(rawSvg, file.name.replace(/\.[^/.]+$/, ''));

      // Calculate Conversion Score
      const conversionScore = calculateConversionScore(optimized, imageDimensions, opts);

      setProgress(100);
      setCurrentStage('Complete!');

      const processingTime = performance.now() - startTime;

      const finalResult: StylizerResult = {
        svg: optimized,
        originalDimensions: imageDimensions,
        conversionScore,
        audit,
        processingTime,
      };

      setResult(finalResult);
      return finalResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error during conversion';
      setError(message);
      console.error('Stylizer error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [iconOptimizer]);

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
   * Reset the stylizer state
   */
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setCurrentStage('');
  }, []);

  return {
    // State
    isProcessing,
    progress,
    currentStage,
    result,
    error,

    // Actions
    processImage,
    reapplyStyle,
    reset,

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
