import { CheckCircle2, AlertTriangle, XCircle, FileType2, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  REQUIRED_LOCKUPS,
  REQUIRED_VARIANTS,
  buildSlotMatrix,
  checkDarkModePairing,
  checkNamingConvention,
} from '@/lib/logoCoverageChecks';
import type { ClientLogoFile } from '@/types/brand';

interface Props {
  brandName: string;
  files: ClientLogoFile[];
}

export function SlotCompletenessSection({ brandName, files }: Props) {
  const matrix = buildSlotMatrix(files);
  const pairings = checkDarkModePairing(files);
  const naming = checkNamingConvention(brandName, files);
  const nonConforming = naming.filter((n) => !n.conforms);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
          Slot completeness &amp; governance
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <Stat label="Slot coverage" value={`${matrix.filledSlots}/${matrix.totalSlots}`} percent={matrix.coveragePercent} />
          <Stat label="SVG coverage" value={`${matrix.svgCoverage}%`} percent={matrix.svgCoverage} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Matrix */}
        <div className="lg:col-span-2 rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Lockup ↓ / Variant →</th>
                {REQUIRED_VARIANTS.map((v) => (
                  <th key={v} className="text-center px-3 py-2 font-medium capitalize">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REQUIRED_LOCKUPS.map((lockup) => (
                <tr key={lockup} className="border-t border-border">
                  <td className="px-3 py-2 font-medium capitalize">{lockup}</td>
                  {REQUIRED_VARIANTS.map((variant) => {
                    const cell = matrix.cells.find(
                      (c) => c.lockup === lockup && c.variant === variant,
                    )!;
                    const status: 'pass' | 'warn' | 'fail' = cell.files.length === 0
                      ? 'fail'
                      : cell.hasSvg
                        ? 'pass'
                        : 'warn';
                    const cls =
                      status === 'pass'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : status === 'warn'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'bg-red-500/10 text-red-700 dark:text-red-300';
                    return (
                      <td key={variant} className="px-3 py-2 text-center">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 rounded px-2 py-1',
                            cls,
                          )}
                        >
                          {cell.hasSvg && <FileType2 className="h-3 w-3" />}
                          {cell.hasRaster && <FileImage className="h-3 w-3" />}
                          <span className="text-[10px] font-semibold">
                            {cell.files.length === 0
                              ? 'missing'
                              : `${cell.files.length} file${cell.files.length > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pairings + naming */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Dark-mode pairing
            </p>
            <ul className="space-y-1">
              {pairings.map((p) => {
                const Icon = p.paired
                  ? CheckCircle2
                  : p.hasBlack || p.hasWhite
                    ? AlertTriangle
                    : XCircle;
                const tone = p.paired
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : p.hasBlack || p.hasWhite
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400';
                return (
                  <li key={p.lockup} className="flex items-start gap-2 text-xs">
                    <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', tone)} />
                    <span>
                      <span className="capitalize font-medium">{p.lockup}</span>:{' '}
                      <span className="text-muted-foreground">
                        {p.paired
                          ? 'black + white both present'
                          : p.hasBlack
                            ? 'has black, missing white (no dark-mode pair)'
                            : p.hasWhite
                              ? 'has white, missing black (no light-mode pair)'
                              : 'neither black nor white present'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Filename convention
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">
              Expected: <code>{`{brand}-{lockup}-{variant}.{ext}`}</code> ·{' '}
              <span
                className={cn(
                  'font-semibold',
                  nonConforming.length === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {naming.length - nonConforming.length}/{naming.length} conform
              </span>
            </p>
            {nonConforming.length > 0 && (
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {nonConforming.slice(0, 8).map((n, idx) => (
                  <li key={idx} className="text-[10px] flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span className="min-w-0">
                      <code className="block break-all text-muted-foreground">{n.actual}</code>
                      <span className="text-[9px] text-muted-foreground/80">
                        expected <code>{n.expected}</code> — {n.reason}
                      </span>
                    </span>
                  </li>
                ))}
                {nonConforming.length > 8 && (
                  <li className="text-[10px] text-muted-foreground italic">
                    +{nonConforming.length - 8} more
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, percent }: { label: string; value: string; percent: number }) {
  const tone = percent >= 100
    ? 'text-emerald-600 dark:text-emerald-400'
    : percent >= 60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  return (
    <div className="rounded border border-border px-3 py-1.5 bg-card text-right min-w-[110px]">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-semibold', tone)}>{value}</div>
    </div>
  );
}
