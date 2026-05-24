/**
 * useSvgOptimizer — Client-side SVGO wrapper for batch icon optimization.
 *
 * Provides 3 presets (safe, default, aggressive) plus a custom configurator.
 * Tracks per-icon stats (before/after bytes, savings %) and supports
 * reversible previews so users can audit changes before committing.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { optimize, type Config as SvgoConfig } from 'svgo';
import { logger } from '@/lib/logger';

export interface OptimizationPreset {
  id: 'safe' | 'default' | 'aggressive' | 'custom';
  label: string;
  description: string;
  config: SvgoConfig;
}

export interface IconOptimizationResult {
  id: string;
  name: string;
  beforeSvg: string;
  afterSvg: string;
  beforeBytes: number;
  afterBytes: number;
  savingsPercent: number;
  success: boolean;
  error?: string;
  warnings: string[];
}

export interface OptimizationRun {
  results: IconOptimizationResult[];
  totalBefore: number;
  totalAfter: number;
  totalSavingsPercent: number;
  failedCount: number;
  durationMs: number;
}

const PRESETS: OptimizationPreset[] = [
  {
    id: 'safe',
    label: 'Safe',
    description: 'Removes comments, whitespace, and default attrs. No path changes.',
    config: {
      plugins: [
        { name: 'preset-default', params: { overrides: {
          removeViewBox: false,
          convertPathData: false,
          mergePaths: false,
          convertShapeToPath: false,
          removeHiddenElems: false,
        }}},
      ],
    },
  },
  {
    id: 'default',
    label: 'Default',
    description: 'Standard SVGO preset with viewBox kept for scaling.',
    config: {
      plugins: [
        { name: 'preset-default', params: { overrides: {
          removeViewBox: false,
        }}},
      ],
    },
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: 'Maximum reduction — may alter paths and remove metadata.',
    config: {
      plugins: [
        { name: 'preset-default', params: { overrides: {
          removeViewBox: false,
        }}},
        { name: 'removeDimensions', active: true },
        { name: 'removeRasterImages', active: true },
        { name: 'removeScriptElement', active: true },
        { name: 'removeStyleElement', active: true },
        { name: 'removeOffCanvasPaths', active: true },
      ],
    },
  },
];

const NEW_SVGO_PRESETS: OptimizationPreset[] = PRESETS;

export { NEW_SVGO_PRESETS as SVGO_PRESETS };

function svgByteLength(svg: string): number {
  return new Blob([svg]).size;
}

function runSvgo(svg: string, config: SvgoConfig): { svg: string; warnings: string[] } {
  const warnings: string[] = [];
  const result = optimize(svg, {
    ...config,
    multipass: true,
  });

  if (result.modernError) {
    throw result.modernError;
  }

  // Check for common issues post-optimization
  const data = result.data || svg;
  if (!data.includes('xmlns') && !data.includes('<svg')) {
    warnings.push('Lost SVG namespace — may not render standalone');
  }
  if (!data.includes('viewBox') && !data.includes('width') && !data.includes('height')) {
    warnings.push('No viewBox or dimensions — may not scale correctly');
  }

  return { svg: data, warnings };
}

export function useSvgOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [latestRun, setLatestRun] = useState<OptimizationRun | null>(null);
  const abortRef = useRef(false);

  const presets = useMemo(() => PRESETS, []);

  const optimizeIcon = useCallback(
    (id: string, name: string, svg: string, config: SvgoConfig): IconOptimizationResult => {
      if (abortRef.current) {
        return {
          id,
          name,
          beforeSvg: svg,
          afterSvg: svg,
          beforeBytes: svgByteLength(svg),
          afterBytes: svgByteLength(svg),
          savingsPercent: 0,
          success: false,
          error: 'Aborted by user',
          warnings: [],
        };
      }

      const beforeBytes = svgByteLength(svg);
      try {
        const { svg: afterSvg, warnings } = runSvgo(svg, config);
        const afterBytes = svgByteLength(afterSvg);
        const savingsPercent = beforeBytes > 0
          ? Number((((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1))
          : 0;

        return {
          id,
          name,
          beforeSvg: svg,
          afterSvg,
          beforeBytes,
          afterBytes,
          savingsPercent,
          success: true,
          warnings,
        };
      } catch (err) {
        logger.error('SVGO optimization failed', { id, name, error: err });
        return {
          id,
          name,
          beforeSvg: svg,
          afterSvg: svg,
          beforeBytes,
          afterBytes: beforeBytes,
          savingsPercent: 0,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          warnings: [],
        };
      }
    },
    []
  );

  const optimizeBatch = useCallback(
    async (
      items: { id: string; name: string; svg: string }[],
      presetId: 'safe' | 'default' | 'aggressive' | 'custom',
      customConfig?: SvgoConfig
    ): Promise<OptimizationRun> => {
      setIsOptimizing(true);
      abortRef.current = false;
      const start = performance.now();

      const preset = PRESETS.find((p) => p.id === presetId);
      const config = presetId === 'custom' && customConfig ? customConfig : preset?.config ?? PRESETS[1].config;

      const results: IconOptimizationResult[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Yield to event loop every 25 icons so UI doesn't freeze
        if (i % 25 === 0 && i > 0) {
          await new Promise((res) => setTimeout(res, 0));
        }
        results.push(optimizeIcon(item.id, item.name, item.svg, config));
      }

      const totalBefore = results.reduce((s, r) => s + r.beforeBytes, 0);
      const totalAfter = results.reduce((s, r) => s + r.afterBytes, 0);
      const totalSavingsPercent = totalBefore > 0
        ? Number((((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1))
        : 0;
      const failedCount = results.filter((r) => !r.success).length;
      const durationMs = Math.round(performance.now() - start);

      const run: OptimizationRun = {
        results,
        totalBefore,
        totalAfter,
        totalSavingsPercent,
        failedCount,
        durationMs,
      };

      setLatestRun(run);
      setIsOptimizing(false);
      return run;
    },
    [optimizeIcon]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    presets,
    isOptimizing,
    latestRun,
    optimizeIcon,
    optimizeBatch,
    abort,
  };
}
