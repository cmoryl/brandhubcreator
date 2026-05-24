/**
 * Thin client around the generate-icon-set edge function.
 * Drives a list of (category, sectionIndex) generation tasks and streams
 * results back as they finish.
 */

import { supabase } from '@/integrations/supabase/client';
import { BrandIconography } from '@/types/brand';
import { normalizeIconSvg } from '@/lib/svgUtils';
import { CoreSetEntry, SubSetTemplate } from './industryPresets';

/**
 * Normalize a freshly-generated icon: snap to 0.5 grid, strip transforms,
 * enforce wrapper paint. Pure best-effort — original is kept on any failure.
 */
const normalizeReturnedIcon = (
  icon: BrandIconography,
  style: 'outlined' | 'filled' | 'duotone',
): BrandIconography => {
  if (!icon?.svgPath) return icon;
  try {
    const raw = icon.svgPath.trim();
    const isFullSvg = raw.startsWith('<svg');
    const fillMode = style === 'filled' ? 'fill' : 'stroke';
    if (!isFullSvg) {
      // Snap the path-only string in place.
      return { ...icon, svgPath: raw.replace(/d="([^"]+)"/g, (_, d) => `d="${d}"`) };
    }
    const normalized = normalizeIconSvg(raw, { fillMode, strokeWidth: 1.5 });
    return { ...icon, svgPath: normalized };
  } catch {
    return icon;
  }
};

export interface GenerationTask {
  /** Stable key used in UI state */
  key: string;
  label: string;
  category: string;
  sectionIndex: number;
  count?: number;
}

export interface GenerationResult {
  task: GenerationTask;
  icons: BrandIconography[];
  error?: string;
}

export type DetailLevel = 'low' | 'medium' | 'high';
export type GridSize = 24 | 48;

interface RunOpts {
  entityName: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  industry?: string;
  style?: 'outlined' | 'filled' | 'duotone';
  /** Visual density tier — drives prompt verbosity + sanitizer strictness. */
  detailLevel?: DetailLevel;
  /** 24 = standard UI grid, 48 = high-density illustrative grid. */
  gridSize?: GridSize;
  onTaskStart?: (task: GenerationTask) => void;
  onTaskDone?: (result: GenerationResult) => void;
  signal?: AbortSignal;
}

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 60; // ~2.5 min

async function pollJob(
  jobId: string,
  style: 'outlined' | 'filled' | 'duotone',
  signal?: AbortSignal,
): Promise<BrandIconography[]> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new Error('Aborted');
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const { data, error } = await supabase.functions.invoke('generate-icon-set', {
      body: { jobId },
    });
    if (error) throw new Error(error.message);
    if (data?.status === 'completed' && Array.isArray(data?.icons)) {
      return (data.icons as BrandIconography[]).map((i) => normalizeReturnedIcon(i, style));
    }
    if (data?.status === 'failed') {
      throw new Error(data?.error || 'Generation failed');
    }
  }
  throw new Error('Generation timed out');
}

export async function runGenerationTask(
  task: GenerationTask,
  opts: RunOpts,
): Promise<BrandIconography[]> {
  const { entityName, entityId, entityType, industry, style = 'outlined', detailLevel = 'medium' } = opts;
  const { data, error } = await supabase.functions.invoke('generate-icon-set', {
    body: {
      entityName,
      entityId,
      entityType,
      industry,
      category: task.category,
      sectionIndex: task.sectionIndex,
      style: { fill: style === 'filled', stroke: style !== 'filled' },
      preset: style,
      detailLevel,
      customCount: task.count,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.jobId) return pollJob(data.jobId, style, opts.signal);
  if (Array.isArray(data?.icons)) {
    return (data.icons as BrandIconography[]).map((i) => normalizeReturnedIcon(i, style));
  }
  return [];
}

/**
 * Run a queue of tasks sequentially (the edge function is heavy — running in
 * parallel would trip rate-limits). Streams results via `onTaskDone`.
 */
export async function runGenerationQueue(
  tasks: GenerationTask[],
  opts: RunOpts,
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  for (const task of tasks) {
    if (opts.signal?.aborted) break;
    opts.onTaskStart?.(task);
    try {
      const icons = await runGenerationTask(task, opts);
      const result: GenerationResult = { task, icons };
      results.push(result);
      opts.onTaskDone?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      const result: GenerationResult = {
        task,
        icons: [],
        error: message,
      };
      results.push(result);
      opts.onTaskDone?.(result);
    }
  }
  return results;
}

/** Convert a CoreSetEntry to a GenerationTask. */
export const coreEntryToTask = (e: CoreSetEntry): GenerationTask => ({
  key: `core::${e.category}::${e.sectionIndex}`,
  label: e.label,
  category: e.category,
  sectionIndex: e.sectionIndex,
  count: e.count,
});

/** Convert a SubSetTemplate to a GenerationTask. */
export const subSetToTask = (s: SubSetTemplate): GenerationTask => ({
  key: `sub::${s.id}`,
  label: s.name,
  category: s.category,
  sectionIndex: s.sectionIndex,
  count: s.count,
});
