import { useEffect, useRef, useState } from 'react';
import {
  probeIndustryStandards,
  type BrandStandardsReport,
} from '@/lib/industryStandardsLogos';

interface State {
  loading: boolean;
  report: BrandStandardsReport | null;
  error: string | null;
}

/**
 * Probe canonical logo registries (gilbarbara, svgl, simpleicons) for the
 * given brand and compare hashes against the brand's stored SVG files.
 */
export function useIndustryStandards(brandName: string | undefined, storedSvgUrls: string[]) {
  const [state, setState] = useState<State>({ loading: false, report: null, error: null });
  const lastKeyRef = useRef<string>('');

  const key = `${brandName ?? ''}::${storedSvgUrls.slice().sort().join('|')}`;

  useEffect(() => {
    if (!brandName) return;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const ctrl = new AbortController();
    setState({ loading: true, report: null, error: null });
    probeIndustryStandards({ brandName, storedSvgUrls, signal: ctrl.signal })
      .then((report) => setState({ loading: false, report, error: null }))
      .catch((err) =>
        setState({
          loading: false,
          report: null,
          error: err instanceof Error ? err.message : 'Lookup failed',
        }),
      )
      ;
    return () => ctrl.abort();
  }, [brandName, key, storedSvgUrls]);

  return state;
}
