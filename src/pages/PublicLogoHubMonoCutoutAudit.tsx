import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, AlertTriangle, CheckCircle2, MinusCircle, XOctagon, Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ClientLogoFile, ClientLogoLockup, ClientLogoVariant } from '@/types/brand';
import { analyzeMonoPair, fetchText, type CutoutCheck, type CutoutStatus } from '@/lib/monoCutoutCheck';
import { useAuth } from '@/contexts/AuthContext';

type LockupSet = {
  lockup: ClientLogoLockup;
  color?: ClientLogoFile;
  black?: ClientLogoFile;
  white?: ClientLogoFile;
  blackCheck?: CutoutCheck;
  whiteCheck?: CutoutCheck;
  colorSvg?: string;
  blackSvg?: string;
  whiteSvg?: string;
  error?: string;
};

interface BrandResult {
  id: string;
  name: string;
  category: string;
  lockups: LockupSet[];
  worst: CutoutStatus;
  loading: boolean;
}

const LOCKUPS: ClientLogoLockup[] = ['icon', 'wordmark'];

const STATUS_RANK: Record<CutoutStatus, number> = {
  error: 4,
  fail: 3,
  pass: 2,
  'not-applicable': 1,
};

function rollup(checks: (CutoutCheck | undefined)[]): CutoutStatus {
  let worst: CutoutStatus = 'not-applicable';
  for (const c of checks) {
    if (!c) continue;
    if (STATUS_RANK[c.status] > STATUS_RANK[worst]) worst = c.status;
  }
  return worst;
}

async function runConcurrent<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export default function PublicLogoHubMonoCutoutAudit() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [brands, setBrands] = useState<BrandResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'fail-only' | 'all' | 'pass' | 'error'>('fail-only');
  const [search, setSearch] = useState('');
  const [lockupFilter, setLockupFilter] = useState<'all' | 'icon' | 'wordmark'>('all');
  const [failureTypeFilter, setFailureTypeFilter] = useState<'all' | 'missing-black' | 'missing-white' | 'no-markers' | 'incomplete' | 'fetch-error'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [regen, setRegen] = useState<{ running: boolean; result?: string }>({ running: false });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = 'Mono Cutout Audit — Logo Hub';
  }, []);

  useEffect(() => {
    void loadAndAnalyze();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAndAnalyze() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setAnalyzing(false);

    const { data } = await supabase
      .from('global_client_logos')
      .select('id, name, category, files')
      .order('category')
      .order('name')
      .limit(2000);

    const initial: BrandResult[] = (data || []).map((d) => {
      const files = (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[];
      const lockups: LockupSet[] = LOCKUPS.map((lk) => {
        const inLockup = files.filter((f) => (f.lockup || 'icon') === lk);
        return {
          lockup: lk,
          color: inLockup.find((f) => f.variant === 'color' && f.format === 'svg'),
          black: inLockup.find((f) => f.variant === 'black' && f.format === 'svg'),
          white: inLockup.find((f) => f.variant === 'white' && f.format === 'svg'),
        };
      }).filter((l) => l.color); // only analyze lockups with a color SVG source
      return {
        id: d.id,
        name: d.name,
        category: d.category,
        lockups,
        worst: 'not-applicable',
        loading: lockups.length > 0,
      };
    });
    setBrands(initial);
    setLoading(false);

    // Analyze all brands with at least one color SVG.
    const tasks = initial.filter((b) => b.lockups.length > 0);
    setAnalyzing(true);
    setProgress({ done: 0, total: tasks.length });
    let done = 0;

    await runConcurrent(tasks, 6, async (b) => {
      if (ctrl.signal.aborted) return;
      for (const lk of b.lockups) {
        try {
          if (!lk.color) continue;
          lk.colorSvg = await fetchText(lk.color.url, ctrl.signal);
          if (lk.black) {
            lk.blackSvg = await fetchText(lk.black.url, ctrl.signal);
            lk.blackCheck = analyzeMonoPair(lk.colorSvg, lk.blackSvg);
          } else {
            lk.blackCheck = { status: 'fail', whiteCandidates: 0, taggedCutouts: 0, hasMonoStyleBlock: false, note: 'Missing black variant.' };
          }
          if (lk.white) {
            lk.whiteSvg = await fetchText(lk.white.url, ctrl.signal);
            lk.whiteCheck = analyzeMonoPair(lk.colorSvg, lk.whiteSvg);
          } else {
            lk.whiteCheck = { status: 'fail', whiteCandidates: 0, taggedCutouts: 0, hasMonoStyleBlock: false, note: 'Missing white variant.' };
          }
        } catch (e) {
          lk.error = (e as Error).message;
        }
      }
      b.worst = rollup(b.lockups.flatMap((l) => [l.blackCheck, l.whiteCheck]));
      b.loading = false;
      done++;
      setProgress({ done, total: tasks.length });
      setBrands((prev) => prev.map((x) => (x.id === b.id ? { ...b } : x)));
    });

    setAnalyzing(false);
  }

  const categories = useMemo(() => {
    const set = new Set(brands.map((b) => b.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [brands]);

  function lockupMatches(lk: LockupSet): boolean {
    if (lockupFilter === 'all') return true;
    return lk.lockup === lockupFilter;
  }

  function failureTypeMatches(lk: LockupSet): boolean {
    if (failureTypeFilter === 'all') return true;
    const checks: (CutoutCheck | undefined)[] = [lk.blackCheck, lk.whiteCheck];
    for (const c of checks) {
      if (!c) continue;
      switch (failureTypeFilter) {
        case 'missing-black':
          if (c.note?.toLowerCase().includes('missing black')) return true;
          break;
        case 'missing-white':
          if (c.note?.toLowerCase().includes('missing white')) return true;
          break;
        case 'no-markers':
          if (c.note?.toLowerCase().includes('no data-mono')) return true;
          if (c.note?.toLowerCase().includes('not produced by the current pipeline')) return true;
          break;
        case 'incomplete':
          if (c.note?.toLowerCase().includes('incomplete')) return true;
          if (c.status === 'fail' && c.taggedCutouts > 0 && c.whiteCandidates > c.taggedCutouts) return true;
          break;
        case 'fetch-error':
          if (lk.error || c.status === 'error') return true;
          break;
      }
    }
    return false;
  }

  const filtered = useMemo(() => {
    return brands.filter((b) => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;

      // Apply lockup & failure type filters by checking if at least one lockup matches.
      const activeSubFilters = lockupFilter !== 'all' || failureTypeFilter !== 'all';
      if (activeSubFilters) {
        const matchesLockup = b.lockups.filter(lockupMatches);
        if (matchesLockup.length === 0) return false;
        if (failureTypeFilter !== 'all') {
          const hasFailureMatch = matchesLockup.some(failureTypeMatches);
          if (!hasFailureMatch) return false;
        }
      }

      if (statusFilter === 'fail-only') return b.worst === 'fail';
      if (statusFilter === 'pass') return b.worst === 'pass';
      if (statusFilter === 'error') return b.worst === 'error';
      return true;
    });
  }, [brands, search, statusFilter, lockupFilter, failureTypeFilter, categoryFilter]);

  const summary = useMemo(() => {
    const s = { total: brands.length, fail: 0, pass: 0, na: 0, error: 0 };
    for (const b of brands) {
      if (b.loading) continue;
      if (b.worst === 'fail') s.fail++;
      else if (b.worst === 'pass') s.pass++;
      else if (b.worst === 'error') s.error++;
      else s.na++;
    }
    return s;
  }, [brands]);

  async function regenerateFailing() {
    const failingNames = brands.filter((b) => b.worst === 'fail').map((b) => b.name);
    if (failingNames.length === 0) return;
    setRegen({ running: true });
    try {
      const { data, error } = await supabase.functions.invoke('derive-mono-svgs', {
        body: { names: failingNames, force: true },
      });
      if (error) throw error;
      setRegen({ running: false, result: `Regenerated ${(data?.summary?.touched ?? '?')} / ${failingNames.length}. Re-running audit…` });
      await loadAndAnalyze();
    } catch (e) {
      setRegen({ running: false, result: `Failed: ${(e as Error).message}` });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <Link
            to="/logohub/audit"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Logo Hub Audit
          </Link>
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px] mb-3">
            Mono Cutout QA
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Mono Cutout Audit
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Detects brands whose derived black &amp; white monochrome SVGs lost their inner
            transparent cutouts (Amex letters, LEGO inner blocks, etc.). Shows the source
            color SVG side-by-side with each mono variant.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Brands" value={summary.total} />
            <Stat label="Failing" value={summary.fail} tone="danger" />
            <Stat label="Passing" value={summary.pass} tone="success" />
            <Stat label="No cutouts needed" value={summary.na} />
            <Stat label="Fetch errors" value={summary.error} tone="warning" />
          </div>

          {(analyzing || loading) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loading ? 'Loading brands…' : `Analyzing ${progress.done} / ${progress.total}…`}
            </div>
          )}

          {(isAdmin || isSuperAdmin) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAndAnalyze}
                disabled={analyzing || loading}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Re-run audit
              </Button>
              <Button
                size="sm"
                onClick={regenerateFailing}
                disabled={regen.running || summary.fail === 0}
              >
                {regen.running && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Regenerate {summary.fail} failing brand(s)
              </Button>
              {regen.result && (
                <span className="text-xs text-muted-foreground">{regen.result}</span>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search brand name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full md:max-w-[260px]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 md:overflow-visible">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="fail-only">Failing ({summary.fail})</TabsTrigger>
                <TabsTrigger value="pass">Passing ({summary.pass})</TabsTrigger>
                <TabsTrigger value="error">Errors ({summary.error})</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-1 shrink-0', showFilters && 'bg-accent')}
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 pb-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Lockup</span>
              <select
                className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                value={lockupFilter}
                onChange={(e) => setLockupFilter(e.target.value as typeof lockupFilter)}
              >
                <option value="all">All</option>
                <option value="icon">Icon</option>
                <option value="wordmark">Wordmark</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Failure</span>
              <select
                className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                value={failureTypeFilter}
                onChange={(e) => setFailureTypeFilter(e.target.value as typeof failureTypeFilter)}
              >
                <option value="all">Any</option>
                <option value="missing-black">Missing black variant</option>
                <option value="missing-white">Missing white variant</option>
                <option value="no-markers">No mono markers</option>
                <option value="incomplete">Incomplete cutouts</option>
                <option value="fetch-error">Fetch error</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Category</span>
              <select
                className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All' : c}
                  </option>
                ))}
              </select>
            </div>
            {(lockupFilter !== 'all' || failureTypeFilter !== 'all' || categoryFilter !== 'all') && (
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => { setLockupFilter('all'); setFailureTypeFilter('all'); setCategoryFilter('all'); }}>
                Reset
              </Button>
            )}
          </div>
        )}
      </section>

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {filtered.length === 0 && !loading && !analyzing && (
          <div className="text-center py-24 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
            <p className="font-medium">Nothing to show with these filters.</p>
            {statusFilter === 'fail-only' && (
              <p className="text-xs mt-1">No brands are currently failing mono cutout detection.</p>
            )}
          </div>
        )}

        {filtered.map((b) => (
          <BrandCard key={b.id} brand={b} filters={{ lockupFilter, failureTypeFilter }} />
        ))}
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' }) {
  const cls =
    tone === 'success' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'warning' ? 'text-amber-600 dark:text-amber-400'
    : tone === 'danger' ? 'text-red-600 dark:text-red-400'
    : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-2xl font-semibold mt-1', cls)}>{value}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: CutoutStatus }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'fail') return <XOctagon className="h-4 w-4 text-red-500" />;
  if (status === 'error') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
}

interface FilterState {
  lockupFilter: 'all' | 'icon' | 'wordmark';
  failureTypeFilter: 'all' | 'missing-black' | 'missing-white' | 'no-markers' | 'incomplete' | 'fetch-error';
}

function failureTypeMatches(lk: LockupSet, failureTypeFilter: FilterState['failureTypeFilter']): boolean {
  if (failureTypeFilter === 'all') return true;
  const checks: (CutoutCheck | undefined)[] = [lk.blackCheck, lk.whiteCheck];
  for (const c of checks) {
    if (!c) continue;
    switch (failureTypeFilter) {
      case 'missing-black':
        if (c.note?.toLowerCase().includes('missing black')) return true;
        break;
      case 'missing-white':
        if (c.note?.toLowerCase().includes('missing white')) return true;
        break;
      case 'no-markers':
        if (c.note?.toLowerCase().includes('no data-mono')) return true;
        if (c.note?.toLowerCase().includes('not produced by the current pipeline')) return true;
        break;
      case 'incomplete':
        if (c.note?.toLowerCase().includes('incomplete')) return true;
        if (c.status === 'fail' && c.taggedCutouts > 0 && c.whiteCandidates > c.taggedCutouts) return true;
        break;
      case 'fetch-error':
        if (lk.error || c.status === 'error') return true;
        break;
    }
  }
  return false;
}

function BrandCard({ brand, filters }: { brand: BrandResult; filters: FilterState }) {
  function lockupVisible(lk: LockupSet): boolean {
    if (filters.lockupFilter !== 'all' && lk.lockup !== filters.lockupFilter) return false;
    if (filters.failureTypeFilter !== 'all' && !failureTypeMatches(lk, filters.failureTypeFilter)) return false;
    return true;
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{brand.name}</div>
          <div className="text-xs text-muted-foreground">{brand.category}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusIcon status={brand.worst} />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{brand.worst}</span>
          <Link
            to={`/logohub/audit/${brand.id}`}
            className="text-xs text-primary hover:underline sm:ml-3"
          >
            Open brand audit →
          </Link>
        </div>
      </div>
      {brand.loading ? (
        <div className="p-8 flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing…
        </div>
      ) : (
        <div className="divide-y divide-border">
          {brand.lockups.map((lk) => (
            <LockupRow key={lk.lockup} lockup={lk} visible={lockupVisible(lk)} />
          ))}
          {brand.lockups.length === 0 && (
            <div className="p-5 text-sm text-muted-foreground">No color SVG to derive monochrome variants from.</div>
          )}
        </div>
      )}
    </div>
  );
}

function LockupRow({ lockup, visible }: { lockup: LockupSet; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        {lockup.lockup}
      </div>
      {lockup.error && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-3">Fetch error: {lockup.error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Preview
          title="Source · color"
          variant="color"
          url={lockup.color?.url}
          bg="checker"
        />
        <Preview
          title="Derived · black"
          variant="black"
          url={lockup.black?.url}
          bg="white"
          check={lockup.blackCheck}
        />
        <Preview
          title="Derived · white"
          variant="white"
          url={lockup.white?.url}
          bg="dark"
          check={lockup.whiteCheck}
        />
      </div>
    </div>
  );
}

function Preview({
  title,
  url,
  bg,
  check,
}: {
  title: string;
  variant: ClientLogoVariant;
  url?: string;
  bg: 'white' | 'dark' | 'checker';
  check?: CutoutCheck;
}) {
  const bgCls =
    bg === 'white' ? 'bg-white'
    : bg === 'dark' ? 'bg-neutral-900'
    : 'bg-[conic-gradient(at_0_0,#f3f4f6_0_25%,#fff_0_50%,#f3f4f6_0_75%,#fff_0)] [background-size:16px_16px]';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {check && (
          <span className="flex items-center gap-1">
            <StatusIcon status={check.status} />
            <span className="text-[10px] text-muted-foreground">{check.status}</span>
          </span>
        )}
      </div>
      <div className={cn('aspect-[2/1] rounded-md border border-border flex items-center justify-center overflow-hidden', bgCls)}>
        {url ? (
          <img
            src={url}
            alt={title}
            loading="lazy"
            className="max-h-full max-w-full object-contain p-3"
          />
        ) : (
          <span className="text-xs text-muted-foreground">missing</span>
        )}
      </div>
      {/* PNG rasterization: browser already renders SVG; downloading as PNG would
          require canvas. We show the rasterized representation by setting the
          <img> src directly — pixel preview matches what PNG export will produce. */}
      {check && (
        <div className="text-[10px] text-muted-foreground leading-snug">
          <div>{check.note}</div>
          <div className="opacity-70">
            white-fills: {check.whiteCandidates} · tagged cutouts: {check.taggedCutouts}
            {!check.hasMonoStyleBlock && url && ' · ⚠ no mono markers'}
          </div>
        </div>
      )}
    </div>
  );
}
