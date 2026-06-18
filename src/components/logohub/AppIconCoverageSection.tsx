import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkAppIconCoverage } from '@/lib/logoCoverageChecks';
import type { ClientLogoFile } from '@/types/brand';

interface Props {
  files: ClientLogoFile[];
}

/**
 * Favicon / app-icon coverage matrix. Detects required sizes via filename
 * conventions (favicon-32, apple-touch-icon, 192x192, maskable, etc.).
 */
export function AppIconCoverageSection({ files }: Props) {
  const coverage = checkAppIconCoverage(files);
  const required = coverage.filter((c) => c.requirement.required);
  const optional = coverage.filter((c) => !c.requirement.required);
  const requiredMet = required.filter((c) => c.matched.length > 0).length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
          Favicon &amp; app-icon coverage
        </h2>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded',
            requiredMet === required.length
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          )}
        >
          {requiredMet}/{required.length} required
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {coverage.map((c) => {
          const has = c.matched.length > 0;
          const Icon = has ? CheckCircle2 : c.requirement.required ? XCircle : AlertTriangle;
          const tone = has
            ? 'text-emerald-600 dark:text-emerald-400'
            : c.requirement.required
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400';
          return (
            <div
              key={c.requirement.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', tone)} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{c.requirement.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {has
                    ? `Detected ${c.matched.length} matching file${c.matched.length > 1 ? 's' : ''}`
                    : c.requirement.notes || 'No matching file detected'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Detection is filename-based (e.g. <code>apple-touch-icon</code>, <code>192x192</code>,
        <code> maskable</code>). Generate missing sizes with your icon pipeline before publishing.
      </p>
    </section>
  );
}
