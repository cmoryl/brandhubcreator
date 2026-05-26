/**
 * useNormalizeAllLibraries — one-shot batch audit that walks every icon in
 * every saved library and:
 *   1. Re-detects `fillMode` from the SVG markup (so filled packs stop being
 *      forced into outlined renders and outline packs stay outlines).
 *   2. Backfills missing `viewBox` by extracting it from the SVG.
 *   3. Ensures `strokeWidth` is unset for fill-native icons so the renderer
 *      can drive a uniform stroke from the design system.
 *
 * Runs entirely in the browser using the same `detectFillMode` /
 * `extractViewBox` helpers the renderer uses, then persists per-library via
 * the existing `updateLibrary` mutation. Sequential to keep writes orderly.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useIconLibraries } from './useIconLibraries';
import { detectFillMode, extractViewBox, buildSvgString } from '@/lib/svgUtils';
import { logger } from '@/lib/logger';

export interface NormalizeProgress {
  total: number;
  done: number;
  current?: string;
  running: boolean;
  iconsChanged: number;
  librariesChanged: number;
}

const normalizeIcon = (icon: any): { icon: any; changed: boolean } => {
  if (!icon || typeof icon !== 'object') return { icon, changed: false };
  const svgPath: string = (icon.svgPath || '').trim();
  if (!svgPath) return { icon, changed: false };

  // Build a full <svg> string so detectFillMode/extractViewBox have a complete
  // document to parse (svgPath in storage may be either a full <svg>…</svg>
  // or just inner path markup).
  const full = svgPath.startsWith('<svg')
    ? svgPath
    : buildSvgString({ svgPath, viewBox: icon.viewBox, fillMode: icon.fillMode, name: icon.name });

  const detected = detectFillMode(full);
  const nextFillMode: 'fill' | 'stroke' = detected === 'stroke' ? 'stroke' : 'fill';
  const nextViewBox = icon.viewBox || extractViewBox(full, '0 0 24 24');

  const changes: Record<string, any> = {};
  if (icon.fillMode !== nextFillMode) changes.fillMode = nextFillMode;
  if (icon.viewBox !== nextViewBox) changes.viewBox = nextViewBox;
  // For fill-native icons we don't want a stored strokeWidth fighting the
  // renderer's auto-scaled stroke. For stroke icons we leave whatever the
  // designer set so caller-side overrides still work.
  if (nextFillMode === 'fill' && typeof icon.strokeWidth === 'number') {
    changes.strokeWidth = undefined;
  }

  if (Object.keys(changes).length === 0) return { icon, changed: false };
  return { icon: { ...icon, ...changes }, changed: true };
};

export function useNormalizeAllLibraries(organizationId: string | undefined) {
  const { libraries, updateLibrary } = useIconLibraries(organizationId);
  const [progress, setProgress] = useState<NormalizeProgress>({
    total: 0,
    done: 0,
    running: false,
    iconsChanged: 0,
    librariesChanged: 0,
  });

  const normalizeAll = useCallback(async () => {
    const targets = libraries.filter((l) => l.is_active);
    if (!targets.length) {
      toast.info('No libraries to audit');
      return;
    }
    setProgress({ total: targets.length, done: 0, running: true, iconsChanged: 0, librariesChanged: 0 });
    const id = toast.loading(`Auditing ${targets.length} libraries…`);
    let iconsChanged = 0;
    let librariesChanged = 0;
    try {
      for (let i = 0; i < targets.length; i++) {
        const lib = targets[i];
        setProgress((p) => ({ ...p, current: lib.name, done: i }));
        try {
          let libIconsChanged = 0;
          const nextIcons = (lib.icons || []).map((ic: any) => {
            const r = normalizeIcon(ic);
            if (r.changed) libIconsChanged += 1;
            return r.icon;
          });
          if (libIconsChanged > 0) {
            await updateLibrary.mutateAsync({
              id: lib.id,
              updates: { icons: nextIcons, silent: true } as any,
            });
            iconsChanged += libIconsChanged;
            librariesChanged += 1;
          }
        } catch (e) {
          logger.debug('[normalizeAll] failed', lib.name, e);
        }
        setProgress((p) => ({ ...p, done: i + 1, iconsChanged, librariesChanged }));
      }
      toast.success(
        librariesChanged === 0
          ? 'All icons already normalized — nothing to update'
          : `Normalized ${iconsChanged} icons across ${librariesChanged} ${librariesChanged === 1 ? 'library' : 'libraries'}`,
        { id },
      );
    } catch (e) {
      logger.debug('[normalizeAll] aborted', e);
      toast.error('Audit failed', { id });
    } finally {
      setProgress((p) => ({ ...p, running: false, current: undefined }));
    }
  }, [libraries, updateLibrary]);

  return { progress, normalizeAll };
}
