import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileType2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SvgLintCell } from '@/components/logohub/SvgLintCell';
import { SvgQualityCell } from '@/components/logohub/SvgQualityCell';
import type { ClientLogoFile, ClientLogoLockup, ClientLogoVariant } from '@/types/brand';
import { useSvgLint } from '@/hooks/useSvgLint';
import { cn } from '@/lib/utils';

interface SvgEntry {
  brandId: string;
  brandName: string;
  category: string;
  file: ClientLogoFile;
  key: string;
}

type StatusFilter = 'all' | 'fail' | 'warn' | 'pass' | 'pending';

/**
 * Row that computes its own lint-derived status, reports it upward via
 * onStatus, and can be hidden by the active status filter.
 */
function SvgAuditRow({
  entry,
  onStatus,
  visibleStatuses,
}: {
  entry: SvgEntry;
  onStatus: (key: string, s: StatusFilter) => void;
  visibleStatuses: Set<StatusFilter>;
}) {
  const { result, loading } = useSvgLint(entry.file.url);
  const status: StatusFilter = !result
    ? 'pending'
    : result.counts.fail > 0
      ? 'fail'
      : result.counts.warn > 0
        ? 'warn'
        : 'pass';

  useEffect(() => {
    onStatus(entry.key, status);
  }, [entry.key, status, onStatus]);

  if (!visibleStatuses.has(status)) return null;

  const lockupLabel = (entry.file.lockup || 'icon') as ClientLogoLockup;
  const variantLabel = entry.file.variant as ClientLogoVariant;
  const isWhite = variantLabel === 'white';

  return (
    <article className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-0">
        <div
          className={cn(
            'flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border min-h-[140px]',
            isWhite ? 'bg-slate-900' : 'bg-muted/40',
          )}
        >
          <img
            src={entry.file.url}
            alt={`${entry.brandName} ${lockupLabel} ${variantLabel}`}
            loading="lazy"
            className="max-h-24 max-w-[120px] object-contain"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" title={entry.brandName}>
                {entry.brandName}
              </h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {entry.category} · {lockupLabel} · {variantLabel}
              </p>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-7 text-[10px] px-2 shrink-0">
              <a href={entry.file.url} target="_blank" rel="noopener noreferrer">Open SVG</a>
            </Button>
          </div>
          {loading && !result && (
            <p className="text-[10px] text-muted-foreground">Linting…</p>
          )}
          <SvgLintCell url={entry.file.url} />
          <SvgQualityCell url={entry.file.url} />
        </div>
      </div>
    </article>
  );
}

export default function PublicLogoHubSvgAudit() {
  const [entries, setEntries] = useState<SvgEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<Record<string, StatusFilter>>({});
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    document.title = 'SVG Audit — Global Logo Hub';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, category, files')
        .order('category')
        .order('name')
        .limit(2000);
      if (error || cancelled) {
        setLoading(false);
        return;
      }
      const next: SvgEntry[] = [];
      for (const row of data || []) {
        const files = (Array.isArray(row.files) ? row.files : []) as unknown as ClientLogoFile[];
        for (const file of files) {
          if (file.format !== 'svg' || !file.url) continue;
          next.push({
            brandId: row.id,
            brandName: row.name,
            category: row.category,
            file,
            key: `${row.id}::${file.lockup || 'icon'}::${file.variant}::${file.url}`,
          });
        }
      }
      setEntries(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.brandName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const onStatus = useMemo(
    () => (key: string, s: StatusFilter) =>
      setStatuses((prev) => (prev[key] === s ? prev : { ...prev, [key]: s })),
    [],
  );

  const counts = useMemo(() => {
    const c = { fail: 0, warn: 0, pass: 0, pending: 0 };
    for (const e of filtered) {
      const s = statuses[e.key] || 'pending';
      if (s !== 'all') c[s]++;
    }
    return c;
  }, [statuses, filtered]);

  const visibleStatuses: Set<StatusFilter> = useMemo(
    () => (filter === 'all'
      ? new Set<StatusFilter>(['fail', 'warn', 'pass', 'pending'])
      : new Set<StatusFilter>([filter])),
    [filter],
  );

  const pills: { id: StatusFilter; label: string; tone: string; icon: typeof CheckCircle2 }[] = [
    { id: 'all', label: `All (${filtered.length})`, tone: 'border-border', icon: FileType2 },
    { id: 'fail', label: `Fail (${counts.fail})`, tone: 'border-red-500/40 text-red-600 dark:text-red-300', icon: XCircle },
    { id: 'warn', label: `Warn (${counts.warn})`, tone: 'border-amber-500/40 text-amber-600 dark:text-amber-300', icon: AlertTriangle },
    { id: 'pass', label: `Pass (${counts.pass})`, tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300', icon: CheckCircle2 },
    { id: 'pending', label: `Pending (${counts.pending})`, tone: 'border-border text-muted-foreground', icon: FileType2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-6xl flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/logohub/audit"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Logo Hub Audit
            </Link>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">SVG Audit</h1>
            <p className="text-xs text-muted-foreground">
              Structural lint + quality checks run live against every SVG file in the global logo library.
            </p>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand or category…"
            className="h-11 sm:h-10 w-full sm:w-72 text-sm"
            aria-label="Search SVGs"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => {
            const Icon = p.icon;
            const active = filter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setFilter(p.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 min-h-9 text-xs font-medium transition-colors',
                  p.tone,
                  active ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-accent/50',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {p.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Loading SVGs…
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No SVG files found in the global logo library.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((entry) => (
              <SvgAuditRow
                key={entry.key}
                entry={entry}
                onStatus={onStatus}
                visibleStatuses={visibleStatuses}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
