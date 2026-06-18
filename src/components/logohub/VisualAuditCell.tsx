import { Loader2 } from 'lucide-react';
import { useVisualAudit } from '@/hooks/useVisualAudit';
import { cn } from '@/lib/utils';

type Variant = 'color' | 'black' | 'white';

function pill(status: 'pass' | 'warn' | 'fail') {
  return status === 'pass'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : status === 'warn'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-red-500/15 text-red-700 dark:text-red-300';
}

export function VisualAuditCell({ url, variant }: { url: string; variant: Variant }) {
  const { result, loading } = useVisualAudit(url, variant);

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </div>
    );
  }
  if (!result) {
    return <span className="text-[10px] text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', pill(result.status))}>
        {result.status.toUpperCase()}
      </span>
      <div className="text-[10px] text-muted-foreground">
        {result.passCount}✓ · {result.warnCount}⚠ · {result.failCount}✗
      </div>
      {result.width > 0 && (
        <div className="text-[9px] text-muted-foreground">
          {result.width}×{result.height} · L{(result.meanLuminance * 100).toFixed(0)} · C{(result.meanChroma * 100).toFixed(0)}
        </div>
      )}
      <details className="text-[10px] text-left max-w-[220px]">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">visual</summary>
        <ul className="mt-1 space-y-0.5">
          {result.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-1">
              <span
                className={cn(
                  'mt-0.5',
                  c.status === 'pass'
                    ? 'text-emerald-500'
                    : c.status === 'warn'
                      ? 'text-amber-500'
                      : 'text-red-500',
                )}
              >
                {c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'}
              </span>
              <span>
                <span className="font-medium">{c.label}</span>
                {c.detail && (
                  <span className="block text-muted-foreground text-[9px]">{c.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
