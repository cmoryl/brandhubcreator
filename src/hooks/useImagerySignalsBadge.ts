/**
 * Lightweight hook for "Learning from N rejections" badges on generator UI surfaces.
 */
import { useEffect, useState } from 'react';
import { loadImagerySignals, type ImagerySignals } from '@/lib/imagerySignals';

export function useImagerySignalsBadge(
  entityId: string | null | undefined,
  entityType: 'brand' | 'product' | 'event' = 'brand',
  guideData?: any,
) {
  const [signals, setSignals] = useState<ImagerySignals | null>(null);

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    loadImagerySignals(entityId, entityType, guideData).then(s => {
      if (!cancelled) setSignals(s);
    });
    return () => { cancelled = true; };
  }, [entityId, entityType, guideData?.imageryAvoidList?.length]);

  return signals;
}
