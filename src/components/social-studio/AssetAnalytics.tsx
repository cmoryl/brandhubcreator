/**
 * Inline analytics panel showing dimension, aspect ratio, and resolution checks
 * for uploaded social assets.
 */
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeAsset, AnalyticsCheck, AnalyticsStatus, getPlatformLimits } from '@/lib/socialPlatformLimits';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AssetAnalyticsProps {
  imageUrl: string;
  platform: string;
  format: string;
  sizeSpec: { width: number; height: number; aspectRatio: string; name: string };
}

const statusIcons: Record<AnalyticsStatus, React.ElementType> = {
  pass: CheckCircle2,
  warning: AlertTriangle,
  fail: XCircle,
};

const statusColors: Record<AnalyticsStatus, string> = {
  pass: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  fail: 'text-destructive',
};

const statusBg: Record<AnalyticsStatus, string> = {
  pass: 'bg-emerald-500/10',
  warning: 'bg-amber-500/10',
  fail: 'bg-destructive/10',
};

export const AssetAnalytics = ({ imageUrl, platform, format, sizeSpec }: AssetAnalyticsProps) => {
  const [checks, setChecks] = useState<AnalyticsCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    analyzeAsset(imageUrl, platform, format, sizeSpec).then((results) => {
      setChecks(results);
      setLoading(false);
      // Auto-expand if there are issues
      if (results.some(c => c.status === 'fail')) {
        setOpen(true);
      }
    });
  }, [imageUrl, platform, format, sizeSpec]);

  if (loading) {
    return (
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
          Analyzing asset…
        </div>
      </div>
    );
  }

  if (checks.length === 0) return null;

  const worstStatus = checks.reduce<AnalyticsStatus>((worst, check) => {
    if (check.status === 'fail') return 'fail';
    if (check.status === 'warning' && worst !== 'fail') return 'warning';
    return worst;
  }, 'pass');

  const SummaryIcon = statusIcons[worstStatus];
  const limits = getPlatformLimits(platform, format);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          'px-3 py-2 border-t border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors',
        )}>
          <div className="flex items-center gap-2">
            <SummaryIcon className={cn('h-3.5 w-3.5', statusColors[worstStatus])} />
            <span className="text-xs font-medium">
              {worstStatus === 'pass' ? 'All checks passed' : worstStatus === 'warning' ? 'Minor issues' : 'Issues detected'}
            </span>
            {limits.notes && (
              <span className="text-xs text-muted-foreground hidden sm:inline">· {limits.notes}</span>
            )}
          </div>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-2.5 space-y-1.5">
          {checks.map((check) => {
            const Icon = statusIcons[check.status];
            return (
              <div key={check.label} className={cn('flex items-start gap-2 rounded-md px-2 py-1.5 text-xs', statusBg[check.status])}>
                <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', statusColors[check.status])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{check.label}</span>
                    <span className="text-muted-foreground font-mono">{check.value}</span>
                  </div>
                  {check.detail && (
                    <p className="text-muted-foreground mt-0.5">{check.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span>Max: {limits.maxFileSize}MB</span>
            <span>Formats: {limits.supportedFormats.map(f => f.split('/')[1]?.toUpperCase()).join(', ')}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
