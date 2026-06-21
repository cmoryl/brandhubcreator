import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileType2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Link2,
  Save,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SvgLintCell } from '@/components/logohub/SvgLintCell';
import { SvgQualityCell } from '@/components/logohub/SvgQualityCell';
import type { ClientLogoFile, ClientLogoLockup, ClientLogoVariant } from '@/types/brand';
import { useSvgLint } from '@/hooks/useSvgLint';
import { getRemediationsFor } from '@/lib/svgRemediations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SvgEntry {
  brandId: string;
  brandName: string;
  category: string;
  file: ClientLogoFile;
  key: string;
}

type Severity = 'fail' | 'warn' | 'pass' | 'pending';

interface FilterState {
  search: string;
  severities: Severity[];
  brand: string; // 'all' or brandId
  category: string; // 'all' or category
}

interface FilterPreset {
  id: string;
  name: string;
  filter: FilterState;
  createdAt: number;
}

const PRESETS_KEY = 'logohub-svg-audit-presets-v1';
const ALL_SEVERITIES: Severity[] = ['fail', 'warn', 'pass', 'pending'];
const DEFAULT_FILTER: FilterState = {
  search: '',
  severities: [...ALL_SEVERITIES],
  brand: 'all',
  category: 'all',
};

function loadPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresets(presets: FilterPreset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota */
  }
}

function findingAnchor(entryKey: string, findingId: string) {
  return `finding-${entryKey.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${findingId}`;
}

/**
 * Row that computes its own lint-derived status, reports it upward via
 * onStatus, and can be hidden by the active severity filter set.
 */
function SvgAuditRow({
  entry,
  onStatus,
  visibleStatuses,
}: {
  entry: SvgEntry;
  onStatus: (key: string, s: Severity) => void;
  visibleStatuses: Set<Severity>;
}) {
  const { result, loading } = useSvgLint(entry.file.url);
  const status: Severity = !result
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
          {result && status !== 'pass' && status !== 'pending' && (() => {
            const fixes = getRemediationsFor(result.findings);
            if (fixes.length === 0) return null;
            const toneCls =
              status === 'fail'
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-amber-500/40 bg-amber-500/5';
            const headCls =
              status === 'fail'
                ? 'text-red-700 dark:text-red-300'
                : 'text-amber-700 dark:text-amber-300';
            return (
              <div className={cn('mt-3 rounded-md border p-3', toneCls)}>
                <div className={cn('mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider', headCls)}>
                  <Wrench className="h-3 w-3" aria-hidden="true" />
                  Suggested fixes ({fixes.length})
                </div>
                <ul className="space-y-3">
                  {fixes.map(({ finding, remediation }) => {
                    const anchor = findingAnchor(entry.key, finding.id);
                    return (
                      <li id={anchor} key={finding.id} className="text-[11px] scroll-mt-4">
                        <div className="flex items-start gap-1.5">
                          <span
                            className={cn(
                              'mt-0.5 text-[10px]',
                              finding.severity === 'fail' ? 'text-red-500' : 'text-amber-500',
                            )}
                            aria-hidden="true"
                          >
                            {finding.severity === 'fail' ? '✗' : '⚠'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="font-semibold text-foreground">{finding.label}</div>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = new URL(window.location.href);
                                  url.hash = anchor;
                                  window.history.replaceState(null, '', url.toString());
                                  if (navigator.clipboard?.writeText) {
                                    navigator.clipboard.writeText(url.toString());
                                  }
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                                aria-label={`Copy link to ${finding.label} finding`}
                                title="Copy link to this finding"
                              >
                                <Link2 className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                            {finding.detail && (
                              <div className="text-[10px] text-muted-foreground">{finding.detail}</div>
                            )}
                            <div className="mt-1 text-muted-foreground">
                              <span className="font-medium text-foreground">Fix:</span>{' '}
                              {remediation.summary}
                            </div>
                            <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                              <span className="font-medium text-foreground">Why it matters:</span>{' '}
                              {remediation.rationale}
                            </div>
                            <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-muted-foreground">
                              {remediation.steps.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ol>
                            {remediation.snippet && (
                              <pre className="mt-1.5 overflow-x-auto rounded bg-muted/60 px-2 py-1 font-mono text-[10px] leading-snug">
                                {remediation.snippet}
                              </pre>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                              {remediation.tool && (
                                <span className="italic text-muted-foreground">
                                  Tool: {remediation.tool}
                                </span>
                              )}
                              {remediation.href && (
                                <a
                                  href={remediation.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Learn more <span aria-hidden="true">↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}
        </div>
      </div>
    </article>
  );
}

export default function PublicLogoHubSvgAudit() {
  const [entries, setEntries] = useState<SvgEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, Severity>>({});

  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string>('');

  useEffect(() => {
    document.title = 'SVG Audit — Global Logo Hub';
    setPresets(loadPresets());
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

  // Derived option lists for brand / category selectors
  const brandOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entries) map.set(e.brandId, e.brandName);
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) if (e.category) set.add(e.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  // Apply search + brand + category (severity is applied per-row)
  const filtered = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter.brand !== 'all' && e.brandId !== filter.brand) return false;
      if (filter.category !== 'all' && e.category !== filter.category) return false;
      if (q && !e.brandName.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [entries, filter.search, filter.brand, filter.category]);

  const onStatus = useMemo(
    () => (key: string, s: Severity) =>
      setStatuses((prev) => (prev[key] === s ? prev : { ...prev, [key]: s })),
    [],
  );

  const counts = useMemo(() => {
    const c = { fail: 0, warn: 0, pass: 0, pending: 0 };
    for (const e of filtered) {
      const s = statuses[e.key] || 'pending';
      c[s]++;
    }
    return c;
  }, [statuses, filtered]);

  const visibleStatuses: Set<Severity> = useMemo(
    () => new Set<Severity>(filter.severities.length ? filter.severities : ALL_SEVERITIES),
    [filter.severities],
  );

  const visibleCount = useMemo(
    () => filtered.reduce((n, e) => n + (visibleStatuses.has(statuses[e.key] || 'pending') ? 1 : 0), 0),
    [filtered, statuses, visibleStatuses],
  );

  const toggleSeverity = (sev: Severity) => {
    setActivePresetId('');
    setFilter((prev) => {
      const has = prev.severities.includes(sev);
      const next = has ? prev.severities.filter((s) => s !== sev) : [...prev.severities, sev];
      return { ...prev, severities: next };
    });
  };

  const setAllSeverities = () => {
    setActivePresetId('');
    setFilter((prev) => ({ ...prev, severities: [...ALL_SEVERITIES] }));
  };

  const onlySeverity = (sev: Severity) => {
    setActivePresetId('');
    setFilter((prev) => ({ ...prev, severities: [sev] }));
  };

  const resetFilters = () => {
    setActivePresetId('');
    setFilter(DEFAULT_FILTER);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      toast.error('Preset name required');
      return;
    }
    const preset: FilterPreset = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      filter,
      createdAt: Date.now(),
    };
    const next = [...presets, preset];
    setPresets(next);
    savePresets(next);
    setActivePresetId(preset.id);
    setPresetName('');
    toast.success(`Saved preset "${name}"`);
  };

  const handleApplyPreset = (id: string) => {
    if (!id) {
      setActivePresetId('');
      return;
    }
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFilter({
      ...DEFAULT_FILTER,
      ...p.filter,
      severities:
        Array.isArray(p.filter.severities) && p.filter.severities.length
          ? p.filter.severities
          : [...ALL_SEVERITIES],
    });
    setActivePresetId(id);
  };

  const handleDeletePreset = () => {
    if (!activePresetId) return;
    const p = presets.find((x) => x.id === activePresetId);
    const next = presets.filter((x) => x.id !== activePresetId);
    setPresets(next);
    savePresets(next);
    setActivePresetId('');
    if (p) toast.success(`Deleted preset "${p.name}"`);
  };

  const sevPills: { id: Severity; label: string; tone: string; activeTone: string; icon: typeof CheckCircle2 }[] = [
    {
      id: 'fail',
      label: `Fail (${counts.fail})`,
      tone: 'border-red-500/40 text-red-600 dark:text-red-300',
      activeTone: 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-200',
      icon: XCircle,
    },
    {
      id: 'warn',
      label: `Warn (${counts.warn})`,
      tone: 'border-amber-500/40 text-amber-600 dark:text-amber-300',
      activeTone: 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-200',
      icon: AlertTriangle,
    },
    {
      id: 'pass',
      label: `Pass (${counts.pass})`,
      tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300',
      activeTone: 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-200',
      icon: CheckCircle2,
    },
    {
      id: 'pending',
      label: `Pending (${counts.pending})`,
      tone: 'border-border text-muted-foreground',
      activeTone: 'bg-accent border-foreground/40 text-foreground',
      icon: FileType2,
    },
  ];

  const allActive = ALL_SEVERITIES.every((s) => filter.severities.includes(s));

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
            value={filter.search}
            onChange={(e) => {
              setActivePresetId('');
              setFilter((prev) => ({ ...prev, search: e.target.value }));
            }}
            placeholder="Search brand or category…"
            className="h-11 sm:h-10 w-full sm:w-72 text-sm"
            aria-label="Search SVGs"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-4">
        {/* Severity quick toggles (multi-select) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
            Severity
          </span>
          <button
            type="button"
            onClick={setAllSeverities}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 min-h-9 text-xs font-medium transition-colors',
              allActive ? 'bg-accent text-accent-foreground border-foreground/40' : 'bg-background hover:bg-accent/50 border-border',
            )}
            aria-pressed={allActive}
          >
            <FileType2 className="h-3.5 w-3.5" aria-hidden="true" />
            All ({filtered.length})
          </button>
          {sevPills.map((p) => {
            const Icon = p.icon;
            const active = filter.severities.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSeverity(p.id)}
                onDoubleClick={() => onlySeverity(p.id)}
                title="Click to toggle. Double-click to show only this severity."
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 min-h-9 text-xs font-medium transition-colors',
                  active ? p.activeTone : cn(p.tone, 'bg-background hover:bg-accent/50 opacity-60'),
                )}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Brand + category dropdowns + preset controls */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Brand</label>
            <Select
              value={filter.brand}
              onValueChange={(v) => {
                setActivePresetId('');
                setFilter((prev) => ({ ...prev, brand: v }));
              }}
            >
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands ({brandOptions.length})</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</label>
            <Select
              value={filter.category}
              onValueChange={(v) => {
                setActivePresetId('');
                setFilter((prev) => ({ ...prev, category: v }));
              }}
            >
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories ({categoryOptions.length})</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
              <Bookmark className="h-3 w-3" /> Preset
            </label>
            <Select value={activePresetId || 'none'} onValueChange={(v) => handleApplyPreset(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-9 w-[220px] text-xs">
                <SelectValue placeholder="Apply preset…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {presets.length === 0 ? (
                  <SelectItem value="empty" disabled>No saved presets</SelectItem>
                ) : (
                  presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDeletePreset}
            disabled={!activePresetId}
            className="h-9 text-xs"
            aria-label="Delete active preset"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resetFilters}
            className="h-9 text-xs"
          >
            Reset
          </Button>

          <div className="flex items-end gap-1 ml-auto">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Save current as</label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePreset();
                  }
                }}
                placeholder="Preset name…"
                className="h-9 w-[180px] text-xs"
                aria-label="New preset name"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="h-9 text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{visibleCount}</span> of{' '}
          <span className="font-semibold text-foreground">{filtered.length}</span> filtered SVGs
          ({entries.length} total).
        </p>

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
