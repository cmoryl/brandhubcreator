import { useCallback, useEffect, useState } from 'react';
import { visualAuditFile, type VisualAuditResult } from '@/lib/logoVisualAudit';

type Variant = 'color' | 'black' | 'white';

// Tiny in-memory cache keyed by url+variant so re-renders/tab-switches don't refetch.
const cache = new Map<string, VisualAuditResult>();
const inflight = new Map<string, Promise<VisualAuditResult>>();

export function useVisualAudit(url: string | null | undefined, variant: Variant, enabled = true) {
  const [result, setResult] = useState<VisualAuditResult | null>(() => {
    if (!url) return null;
    return cache.get(`${variant}::${url}`) ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const rerun = useCallback(() => {
    if (!url) return;
    const key = `${variant}::${url}`;
    cache.delete(key);
    inflight.delete(key);
    setTick((t) => t + 1);
  }, [url, variant]);

  useEffect(() => {
    if (!enabled || !url) return;
    const key = `${variant}::${url}`;
    const cached = cache.get(key);
    if (cached) {
      setResult(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const p = inflight.get(key) ?? visualAuditFile(url, variant);
    inflight.set(key, p);
    p.then((r) => {
      cache.set(key, r);
      inflight.delete(key);
      if (!cancelled) setResult(r);
    }).catch(() => {
      inflight.delete(key);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [url, variant, enabled, tick]);

  return { result, loading, rerun };
}
