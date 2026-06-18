import { useCallback, useEffect, useState } from 'react';
import { visualAuditFile, type VisualAuditResult } from '@/lib/logoVisualAudit';

type Variant = 'color' | 'black' | 'white';

export type RerunHistoryEntry = {
  reason: string;
  at: string; // ISO timestamp
  prevStatus?: 'pass' | 'warn' | 'fail';
};

// Tiny in-memory cache keyed by url+variant so re-renders/tab-switches don't refetch.
const cache = new Map<string, VisualAuditResult>();
const inflight = new Map<string, Promise<VisualAuditResult>>();
const history = new Map<string, RerunHistoryEntry[]>();
const historyListeners = new Set<() => void>();

function notifyHistory() {
  historyListeners.forEach((fn) => fn());
}

export function getRerunHistory(url: string, variant: Variant): RerunHistoryEntry[] {
  return history.get(`${variant}::${url}`) ?? [];
}

export function useVisualAudit(url: string | null | undefined, variant: Variant, enabled = true) {
  const [result, setResult] = useState<VisualAuditResult | null>(() => {
    if (!url) return null;
    return cache.get(`${variant}::${url}`) ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const fn = () => setHistoryVersion((v) => v + 1);
    historyListeners.add(fn);
    return () => { historyListeners.delete(fn); };
  }, []);

  const rerun = useCallback((reason: string) => {
    const trimmed = reason.trim();
    if (!url || !trimmed) return;
    const key = `${variant}::${url}`;
    const prev = cache.get(key);
    const entry: RerunHistoryEntry = {
      reason: trimmed,
      at: new Date().toISOString(),
      prevStatus: prev?.status,
    };
    const list = history.get(key) ?? [];
    history.set(key, [entry, ...list]);
    notifyHistory();
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

  const rerunHistory = url ? (history.get(`${variant}::${url}`) ?? []) : [];

  return { result, loading, rerun, rerunHistory, historyVersion };
}
