import { Loader2 } from 'lucide-react';
import { useSvgLint } from '@/hooks/useSvgLint';
import { cn } from '@/lib/utils';

function pillCls(status: 'pass' | 'warn' | 'fail') {
  return status === 'pass'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : status === 'warn'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-red-500/15 text-red-700 dark:text-red-300';
}

export function SvgLintCell({ url }: { url: string }) {
  const { result, loading, error } = useSvgLint(url);

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center text-muted-foreground py-1">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }
  if (error) {
    return <span className="text-[10px] text-muted-foreground">lint: {error}</span>;
  }
  if (!result) return <span className="text-[10px] text-muted-foreground">—</span>;

  const status: 'pass' | 'warn' | 'fail' =
    result.counts.fail > 0 ? 'fail' : result.counts.warn > 0 ? 'warn' : 'pass';

  return (
    <div className="flex flex-col items-start gap-1 mt-2 border-t border-border/40 pt-2">
      <div className="flex items-center gap-1.5">
        <span className={cn('inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider', pillCls(status))}>
          SVG LINT · {status.toUpperCase()}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {result.counts.pass}✓ · {result.counts.warn}⚠ · {result.counts.fail}✗
        </span>
      </div>
      <details className="text-[10px] text-left w-full">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">structural</summary>
        <ul className="mt-1 space-y-0.5 max-w-[240px]">
          {result.findings.map((f) => (
            <li key={f.id} className="flex items-start gap-1">
              <span
                className={cn(
                  'mt-0.5',
                  f.severity === 'pass'
                    ? 'text-emerald-500'
                    : f.severity === 'warn'
                      ? 'text-amber-500'
                      : 'text-red-500',
                )}
              >
                {f.severity === 'pass' ? '✓' : f.severity === 'warn' ? '⚠' : '✗'}
              </span>
              <span>
                <span className="font-medium">{f.label}</span>
                {f.detail && (
                  <span className="block text-muted-foreground text-[9px]">{f.detail}</span>
                )}
                {f.remediation && f.remediation !== 'kept' && (
                  <span className="block text-[9px] italic text-muted-foreground">
                    sanitizer: {f.remediation}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
