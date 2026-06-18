import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchSvgQuality, type SvgQualityReport } from '@/lib/svgQualityAnalysis';

interface Props {
  url: string;
}

/**
 * Per-file deep SVG quality panel. Renders inside the per-file audit cell
 * directly below the structural lint output.
 */
export function SvgQualityCell({ url }: Props) {
  const [report, setReport] = useState<SvgQualityReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchSvgQuality(url, ctrl.signal).then((r) => {
      setReport(r);
      setLoading(false);
    });
    return () => ctrl.abort();
  }, [url]);

  const worst: 'pass' | 'warn' | 'fail' = !report
    ? 'pass'
    : report.issues.some((i) => i.status === 'fail')
      ? 'fail'
      : report.issues.some((i) => i.status === 'warn')
        ? 'warn'
        : 'pass';

  return (
    <details className="mt-1 text-[10px] text-left">
      <summary
        className={cn(
          'cursor-pointer hover:underline inline-flex items-center gap-1',
          worst === 'fail'
            ? 'text-red-600 dark:text-red-400'
            : worst === 'warn'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> SVG quality…
          </>
        ) : (
          <>SVG quality · {worst.toUpperCase()}</>
        )}
      </summary>
      {report?.error && (
        <p className="mt-1 text-red-600 dark:text-red-400">{report.error}</p>
      )}
      {report && !report.error && (
        <ul className="mt-1 space-y-0.5 min-w-[220px]">
          {report.issues.map((i) => (
            <li key={i.id} className="flex items-start gap-1">
              <span
                className={cn(
                  'mt-0.5',
                  i.status === 'pass'
                    ? 'text-emerald-500'
                    : i.status === 'warn'
                      ? 'text-amber-500'
                      : i.status === 'fail'
                        ? 'text-red-500'
                        : 'text-blue-500',
                )}
              >
                {i.status === 'pass'
                  ? '✓'
                  : i.status === 'warn'
                    ? '⚠'
                    : i.status === 'fail'
                      ? '✗'
                      : 'ℹ'}
              </span>
              <span>
                <span className="font-medium">{i.label}</span>
                {i.detail && (
                  <span className="block text-muted-foreground text-[9px]">{i.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
