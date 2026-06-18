import { Loader2, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIndustryStandards } from '@/hooks/useIndustryStandards';

interface Props {
  brandName: string;
  storedSvgUrls: string[];
}

/**
 * Brand-level "industry standards" audit panel.
 *
 * Probes well-known canonical SVG registries and reports:
 *  - whether the brand exists in any of them
 *  - which stored files are byte-identical to a canonical mark
 *  - which canonical assets are missing from the brand record (potentially outdated)
 */
export function IndustryStandardsSection({ brandName, storedSvgUrls }: Props) {
  const { loading, report, error } = useIndustryStandards(brandName, storedSvgUrls);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
          Industry-standard sources
        </h2>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <Verdict
              status={report.hasCanonical ? 'pass' : 'warn'}
              label={
                report.hasCanonical
                  ? `Found in ${report.hits.length} canonical registr${report.hits.length === 1 ? 'y' : 'ies'}`
                  : 'Not found in any tracked canonical registry'
              }
              detail={
                report.hasCanonical
                  ? report.hits.map((h) => h.candidate.label).join(', ')
                  : `Probed slug: ${[report.slug, ...report.alternateSlugs].filter(Boolean).join(', ') || '—'}`
              }
            />
            <Verdict
              status={
                Object.keys(report.matches).length > 0
                  ? 'pass'
                  : report.hasCanonical
                    ? 'warn'
                    : 'pass'
              }
              label={
                Object.keys(report.matches).length > 0
                  ? `${Object.keys(report.matches).length} stored file(s) byte-match a canonical source`
                  : report.hasCanonical
                    ? 'No stored SVG matches the canonical source — may be outdated'
                    : 'No canonical baseline available'
              }
              detail={
                Object.keys(report.matches).length > 0
                  ? 'Stored asset is identical to the registry version.'
                  : report.hasCanonical
                    ? 'Compare your stored mark against the canonical SVG below.'
                    : undefined
              }
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Registry</th>
                  <th className="text-center px-3 py-2 font-medium">Preview</th>
                  <th className="text-center px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Size</th>
                  <th className="text-left px-3 py-2 font-medium">URL</th>
                  <th className="text-right px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {report.probes.map((p) => {
                  const ok = p.status === 200 && !!p.svgText;
                  const status: 'pass' | 'warn' | 'fail' = ok
                    ? 'pass'
                    : p.reachable
                      ? 'warn'
                      : 'fail';
                  return (
                    <tr key={p.candidate.url} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {p.candidate.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {ok ? (
                          <div className="mx-auto h-10 w-14 rounded border border-border bg-white flex items-center justify-center overflow-hidden">
                            <img
                              src={p.candidate.url}
                              alt=""
                              className="max-h-9 max-w-12 object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <ProbePill status={status} httpStatus={p.status} reachable={p.reachable} />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {ok ? `${(p.bytes / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="px-3 py-2 max-w-sm">
                        <code className="text-[10px] font-mono break-all text-muted-foreground block leading-relaxed">
                          {p.candidate.url}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copy(p.candidate.url)}
                          title="Copy URL"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                          <a href={p.candidate.url} target="_blank" rel="noreferrer" title="Open">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {report.probes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Could not derive a slug from this brand name.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {Object.keys(report.matches).length > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
              <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                Canonical matches
              </p>
              <ul className="space-y-0.5">
                {Object.entries(report.matches).map(([url, labels]) => (
                  <li key={url} className="text-muted-foreground">
                    <code className="font-mono break-all">{url}</code>{' '}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ≡ {labels.join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Verdict({
  status,
  label,
  detail,
}: {
  status: 'pass' | 'warn' | 'fail';
  label: string;
  detail?: string;
}) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'warn' ? AlertTriangle : XCircle;
  const color =
    status === 'pass'
      ? 'text-emerald-600 dark:text-emerald-400'
      : status === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {detail && <div className="text-[11px] text-muted-foreground mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

function ProbePill({
  status,
  httpStatus,
  reachable,
}: {
  status: 'pass' | 'warn' | 'fail';
  httpStatus: number;
  reachable: boolean;
}) {
  const cls =
    status === 'pass'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : status === 'warn'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : 'bg-red-500/15 text-red-700 dark:text-red-300';
  const label = status === 'pass'
    ? `200 OK`
    : !reachable
      ? 'unreachable'
      : `HTTP ${httpStatus || '?'}`;
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', cls)}>
      {label}
    </span>
  );
}
