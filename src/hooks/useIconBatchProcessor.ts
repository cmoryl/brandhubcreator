/**
 * useIconBatchProcessor - Batch Processing for Icon Libraries
 * 
 * Applies optical sizing, states, and animations to all icons
 * in a library with a single action.
 */

import { useState, useCallback } from 'react';
import { useResponsiveIcon, ResponsiveIconSet } from './useResponsiveIcon';
import { useIconStateSystem, IconStateSet } from './useIconStateSystem';
import { useKineticBranding, BrandPersonality, EntranceAnimation, InteractionAnimation, KineticIconData } from './useKineticBranding';
import { BrandIconography } from '@/types/brand';

export interface BatchProcessingOptions {
  applyOpticalSizes: boolean;
  applyStates: boolean;
  applyAnimations: boolean;
  personality: BrandPersonality;
  entranceAnimation: EntranceAnimation;
  interactionAnimation: InteractionAnimation;
}

export interface ProcessedIcon {
  original: BrandIconography;
  opticalSizes?: ResponsiveIconSet;
  states?: IconStateSet;
  kinetic?: KineticIconData;
}

export interface BatchProcessingResult {
  processedIcons: ProcessedIcon[];
  totalIcons: number;
  processedCount: number;
  errors: { iconName: string; error: string }[];
  css: string;
  summary: {
    opticalSizesGenerated: number;
    statesGenerated: number;
    animationsGenerated: number;
  };
}

export interface BatchProcessingProgress {
  current: number;
  total: number;
  currentIconName: string;
  phase: 'optical' | 'states' | 'kinetic' | 'complete';
  percentage: number;
}

const DEFAULT_OPTIONS: BatchProcessingOptions = {
  applyOpticalSizes: true,
  applyStates: true,
  applyAnimations: true,
  personality: 'professional',
  entranceAnimation: 'fade',
  interactionAnimation: 'pulse',
};

export function useIconBatchProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProcessingProgress | null>(null);
  const [result, setResult] = useState<BatchProcessingResult | null>(null);

  const responsiveIcon = useResponsiveIcon(2);
  const stateSystem = useIconStateSystem();
  const kineticBranding = useKineticBranding('professional');

  /**
   * Process a batch of icons with the specified options
   */
  const processBatch = useCallback(async (
    icons: BrandIconography[],
    options: Partial<BatchProcessingOptions> = {}
  ): Promise<BatchProcessingResult> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    setIsProcessing(true);
    setResult(null);

    const processedIcons: ProcessedIcon[] = [];
    const errors: { iconName: string; error: string }[] = [];
    let cssAccumulator = '';
    let opticalSizesGenerated = 0;
    let statesGenerated = 0;
    let animationsGenerated = 0;

    const total = icons.length;
    const phases = [
      opts.applyOpticalSizes && 'optical',
      opts.applyStates && 'states',
      opts.applyAnimations && 'kinetic',
    ].filter(Boolean) as ('optical' | 'states' | 'kinetic')[];

    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];
      
      try {
        const processed: ProcessedIcon = { original: icon };

        // Phase 1: Optical Sizes
        if (opts.applyOpticalSizes && icon.svgPath) {
          setProgress({
            current: i + 1,
            total,
            currentIconName: icon.name,
            phase: 'optical',
            percentage: Math.round(((i + 0.33) / total) * 100),
          });

          processed.opticalSizes = responsiveIcon.generateAllVariants(icon.svgPath);
          opticalSizesGenerated++;
          
          // Small delay to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Phase 2: State Variants
        if (opts.applyStates && icon.svgPath) {
          setProgress({
            current: i + 1,
            total,
            currentIconName: icon.name,
            phase: 'states',
            percentage: Math.round(((i + 0.66) / total) * 100),
          });

          processed.states = stateSystem.generateAllStates(icon.svgPath);
          statesGenerated++;
          
          // Add CSS variables (only once)
          if (i === 0 && processed.states) {
            cssAccumulator += processed.states.cssVariables + '\n\n';
          }
          
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Phase 3: Kinetic Animations
        if (opts.applyAnimations && icon.svgPath) {
          setProgress({
            current: i + 1,
            total,
            currentIconName: icon.name,
            phase: 'kinetic',
            percentage: Math.round(((i + 1) / total) * 100),
          });

          processed.kinetic = kineticBranding.applyKineticAnimation(
            icon.svgPath,
            opts.entranceAnimation,
            opts.interactionAnimation
          );
          animationsGenerated++;
          
          // Add animation CSS (only once)
          if (i === 0 && processed.kinetic) {
            cssAccumulator += processed.kinetic.css + '\n\n';
          }
          
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        processedIcons.push(processed);
      } catch (error) {
        errors.push({
          iconName: icon.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Add staggered animation CSS
    if (opts.applyAnimations) {
      cssAccumulator += kineticBranding.generateStaggeredCSS(icons.length, 50);
    }

    setProgress({
      current: total,
      total,
      currentIconName: 'Complete',
      phase: 'complete',
      percentage: 100,
    });

    const batchResult: BatchProcessingResult = {
      processedIcons,
      totalIcons: total,
      processedCount: processedIcons.length,
      errors,
      css: cssAccumulator,
      summary: {
        opticalSizesGenerated,
        statesGenerated,
        animationsGenerated,
      },
    };

    setResult(batchResult);
    setIsProcessing(false);

    return batchResult;
  }, [responsiveIcon, stateSystem, kineticBranding]);

  /**
   * Export batch results as a downloadable package
   */
  const exportBatchResults = useCallback((
    result: BatchProcessingResult,
    libraryName: string
  ): string => {
    const exportData = {
      libraryName,
      exportedAt: new Date().toISOString(),
      summary: result.summary,
      css: result.css,
      icons: result.processedIcons.map(pi => ({
        name: pi.original.name,
        category: pi.original.category,
        opticalSizes: pi.opticalSizes ? {
          micro: pi.opticalSizes.micro,
          regular: pi.opticalSizes.regular,
          display: pi.opticalSizes.display,
        } : undefined,
        states: pi.states ? {
          default: pi.states.default,
          hover: pi.states.hover,
          active: pi.states.active,
          success: pi.states.success,
          error: pi.states.error,
          warning: pi.states.warning,
          disabled: pi.states.disabled,
        } : undefined,
        kinetic: pi.kinetic ? {
          svg: pi.kinetic.svg,
        } : undefined,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, []);

  /**
   * Reset the processor state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setResult(null);
  }, []);

  return {
    // State
    isProcessing,
    progress,
    result,
    
    // Actions
    processBatch,
    exportBatchResults,
    reset,
    
    // Options
    defaultOptions: DEFAULT_OPTIONS,
  };
}

export default useIconBatchProcessor;
