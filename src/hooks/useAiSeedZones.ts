/**
 * useAiSeedZones
 *
 * Watches a templated editor's zone array for entries marked
 * `_seedPending: true` (set by `hydrateZoneDefaults` when seed mode === 'ai'),
 * batches them into a single edge-function call, and writes the AI-generated
 * brand-aware copy back via the supplied `onZonesChange` callback.
 *
 * Behaviour:
 *  - Debounced (250ms) so a burst of mounts coalesces into one request.
 *  - Tracks already-seeded zone ids in a ref so the same zone never re-fires
 *    after the user edits its content (the marker is stripped on success
 *    AND on failure to avoid retry loops).
 *  - Silent on failure — the lorem placeholder remains visible, and the
 *    caller can surface a toast via the `onError` hook if desired.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CanvasEditorZone } from '@/components/brand/templating/TemplateCanvasEditor';

export interface ZoneSeedBrandContext {
  name?: string;
  industry?: string;
  tone?: string | string[];
  archetype?: string;
  tagline?: string;
}

interface UseAiSeedZonesArgs {
  zones: CanvasEditorZone[];
  onZonesChange: (zones: CanvasEditorZone[]) => void;
  brand?: ZoneSeedBrandContext;
  surface?: string;
  /** Disable seeding entirely (e.g. when the user prefers lorem / blank). */
  enabled?: boolean;
  onError?: (message: string) => void;
}

const DEBOUNCE_MS = 250;

export function useAiSeedZones({
  zones,
  onZonesChange,
  brand,
  surface,
  enabled = true,
  onError,
}: UseAiSeedZonesArgs) {
  const inflightIds = useRef<Set<string>>(new Set());
  const handledIds = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always read the latest zones / handlers inside the async callback.
  const latestZones = useRef(zones);
  const latestOnChange = useRef(onZonesChange);
  latestZones.current = zones;
  latestOnChange.current = onZonesChange;

  useEffect(() => {
    if (!enabled) return;

    const pending = zones.filter(
      (z) =>
        z._seedPending &&
        (z.type === 'text' || z.type === 'cta') &&
        !handledIds.current.has(z.id) &&
        !inflightIds.current.has(z.id),
    );
    if (pending.length === 0) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      // Snapshot the ids we're about to send.
      const batch = pending.map((z) => ({
        id: z.id,
        type: z.type as 'text' | 'cta',
        label: z.label,
      }));
      batch.forEach((b) => inflightIds.current.add(b.id));

      try {
        const { data, error } = await supabase.functions.invoke('seed-zone-copy', {
          body: { zones: batch, brand, surface },
        });

        if (error) throw error;

        const results: Record<string, string> = (data?.results as Record<string, string>) || {};

        const next = latestZones.current.map((zone) => {
          if (!batch.some((b) => b.id === zone.id)) return zone;
          const aiContent = results[zone.id];
          // Strip the pending marker either way so we don't retry.
          const { _seedPending: _drop, ...rest } = zone;
          if (aiContent && aiContent.trim()) {
            return { ...rest, content: aiContent.trim() } as CanvasEditorZone;
          }
          return rest as CanvasEditorZone;
        });
        latestOnChange.current(next);
        batch.forEach((b) => handledIds.current.add(b.id));
      } catch (err) {
        // On failure, mark these as handled so we don't loop. The lorem
        // placeholder set by hydrateZoneDefaults remains visible.
        batch.forEach((b) => handledIds.current.add(b.id));
        const message = err instanceof Error ? err.message : 'Failed to generate AI copy';
        console.warn('[useAiSeedZones]', message);
        onError?.(message);
      } finally {
        batch.forEach((b) => inflightIds.current.delete(b.id));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [zones, enabled, brand, surface, onError]);
}
