import { useEffect, useState } from 'react';
import { lintSvgString, type SvgLintResult } from '@/lib/svgStructuralLint';

const cache = new Map<string, SvgLintResult>();
const inflight = new Map<string, Promise<SvgLintResult>>();

async function loadAndLint(url: string): Promise<SvgLintResult> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!/svg|xml/i.test(ct) && !/^\s*<\?xml|<svg/i.test(text)) {
    return {
      ok: false,
      findings: [
        {
          id: 'not-svg',
          label: 'Response is an SVG document',
          severity: 'fail',
          detail: `content-type=${ct || 'unknown'}`,
        },
      ],
      sanitized: '',
      counts: { pass: 0, warn: 0, fail: 1 },
    };
  }
  return lintSvgString(text);
}

export function useSvgLint(url: string | null | undefined, enabled = true) {
  const [result, setResult] = useState<SvgLintResult | null>(() =>
    url ? (cache.get(url) ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;
    const cached = cache.get(url);
    if (cached) {
      setResult(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const p = inflight.get(url) ?? loadAndLint(url);
    inflight.set(url, p);
    p.then((r) => {
      cache.set(url, r);
      inflight.delete(url);
      if (!cancelled) setResult(r);
    })
      .catch((err) => {
        inflight.delete(url);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Fetch failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [url, enabled]);

  return { result, loading, error };
}
