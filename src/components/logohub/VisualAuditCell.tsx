import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useVisualAudit } from '@/hooks/useVisualAudit';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Variant = 'color' | 'black' | 'white';

function pill(status: 'pass' | 'warn' | 'fail') {
  return status === 'pass'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : status === 'warn'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-red-500/15 text-red-700 dark:text-red-300';
}

export function VisualAuditCell({ url, variant }: { url: string; variant: Variant }) {
  const { result, loading, rerun, rerunHistory } = useVisualAudit(url, variant);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const submitRerun = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    rerun(trimmed);
    setReason('');
    setOpen(false);
  };

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
      <div className="flex items-center gap-1">
        <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', pill(result.status))}>
          {result.status.toUpperCase()}
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              title="Rerun visual audit (reason required)"
              disabled={loading}
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-2">
            <div>
              <Label className="text-xs font-semibold">Rerun reason <span className="text-red-500">*</span></Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Required. Logged with the rerun so the history shows why it was repeated.
              </p>
            </div>
            <Textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Source asset was replaced; rerendering canvas checks."
              className="text-xs min-h-[70px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitRerun();
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setOpen(false); setReason(''); }}>
                  Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={submitRerun} disabled={!reason.trim()}>
                  Rerun
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
      {rerunHistory.length > 0 && (
        <details className="text-[10px] text-left max-w-[220px] w-full">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            rerun history ({rerunHistory.length})
          </summary>
          <ul className="mt-1 space-y-1">
            {rerunHistory.map((h, i) => (
              <li key={i} className="border-l-2 border-muted pl-2">
                <div className="text-[9px] text-muted-foreground">
                  {new Date(h.at).toLocaleString()}
                  {h.prevStatus && <> · prev: <span className="uppercase font-semibold">{h.prevStatus}</span></>}
                </div>
                <div className="text-[10px]">{h.reason}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
