import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkPrintFormats } from '@/lib/logoCoverageChecks';
import type { ClientLogoFile } from '@/types/brand';

interface Props {
  files: ClientLogoFile[];
  /** Brand description — scanned for declared CMYK/Pantone/min-size/clear-space hints. */
  brandDescription?: string | null;
}

/**
 * Print & production readiness:
 *  - EPS / PDF availability for print vendors
 *  - CMYK / Pantone declarations (scanned in description, since the schema
 *    has no dedicated field — best-effort, never blocks)
 *  - Minimum-size guidance
 *  - Clear-space (exclusion-zone) declaration
 */
export function PrintProductionSection({ files, brandDescription }: Props) {
  const formats = checkPrintFormats(files);
  const desc = (brandDescription || '').toLowerCase();
  const declared = {
    cmyk: /\bcmyk\b/.test(desc),
    pantone: /\b(pantone|pms\b)/.test(desc),
    minSize: /\b(min(imum)?\s*(size|width)|clear[-\s]?space|exclusion)\b/.test(desc),
    clearSpace: /\b(clear[-\s]?space|exclusion zone|safe area)\b/.test(desc),
  };

  const rows = [
    {
      id: 'eps',
      label: 'EPS files for print vendors',
      status: formats.hasEps ? 'pass' : 'warn',
      detail: formats.hasEps
        ? `${formats.epsCount} EPS file(s) available`
        : 'No EPS — most commercial printers still ask for it',
    },
    {
      id: 'pdf',
      label: 'PDF files for press',
      status: formats.hasPdf ? 'pass' : 'warn',
      detail: formats.hasPdf
        ? `${formats.pdfCount} PDF file(s) available`
        : 'No PDF — common request from agencies and signage vendors',
    },
    {
      id: 'cmyk',
      label: 'CMYK equivalents declared',
      status: declared.cmyk ? 'pass' : 'info',
      detail: declared.cmyk
        ? 'CMYK referenced in brand description'
        : 'Not declared in description — manual review recommended',
    },
    {
      id: 'pantone',
      label: 'Pantone (PMS) equivalents declared',
      status: declared.pantone ? 'pass' : 'info',
      detail: declared.pantone
        ? 'Pantone referenced in brand description'
        : 'Not declared in description — required for spot-color printing',
    },
    {
      id: 'min-size',
      label: 'Minimum-size guidance',
      status: declared.minSize ? 'pass' : 'info',
      detail: declared.minSize
        ? 'Minimum-size guidance referenced'
        : 'No minimum-size floor declared — derive from thinnest stroke',
    },
    {
      id: 'clear-space',
      label: 'Clear-space / exclusion zone',
      status: declared.clearSpace ? 'pass' : 'info',
      detail: declared.clearSpace
        ? 'Clear-space guidance referenced'
        : 'No clear-space rule declared — typical is 1× cap-height or x-width',
    },
  ] as const;

  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
        Print &amp; production readiness
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {rows.map((r) => {
          const Icon =
            r.status === 'pass'
              ? CheckCircle2
              : r.status === 'warn'
                ? AlertTriangle
                : r.status === 'fail'
                  ? XCircle
                  : Info;
          const tone =
            r.status === 'pass'
              ? 'text-emerald-600 dark:text-emerald-400'
              : r.status === 'warn'
                ? 'text-amber-600 dark:text-amber-400'
                : r.status === 'fail'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400';
          return (
            <div
              key={r.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', tone)} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{r.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
