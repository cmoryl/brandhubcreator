import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  Search,
  ArrowLeft,
  XCircle,
  FileImage,
  FileType2,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Save,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';
import { auditBrand } from '@/lib/logoAuditChecks';
import { OrphanedFilesSection } from '@/components/logohub/OrphanedFilesSection';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Row {
  id: string;
  name: string;
  category: string;
  website_url: string | null;
  files: ClientLogoFile[];
}

const LOCKUPS: ClientLogoLockup[] = ['icon', 'wordmark'];
const VARIANTS: ClientLogoVariant[] = ['color', 'black', 'white'];

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const extOf = (url: string, fallback?: string) => {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (m) return m[1].toLowerCase();
  } catch { /* noop */ }
  return (fallback || '').toLowerCase();
};

type StatusFilter = 'all' | 'complete' | 'partial' | 'raster' | 'missing' | 'audit-fail' | 'audit-warn' | 'audit-pass';

type AuditSeverity = 'pass' | 'warn' | 'fail';
type CoverageBucket = 'complete' | 'partial' | 'raster' | 'missing';

const ALL_SEVERITIES: AuditSeverity[] = ['pass', 'warn', 'fail'];
const ALL_BUCKETS: CoverageBucket[] = ['complete', 'partial', 'raster', 'missing'];

interface FilterState {
  search: string;
  category: string;
  severities: AuditSeverity[];
  buckets: CoverageBucket[];
}

interface FilterPreset {
  id: string;
  name: string;
  filter: FilterState;
  createdAt: number;
}

const PRESETS_KEY = 'logohub-audit-presets-v1';
const DEFAULT_FILTER: FilterState = {
  search: '',
  category: 'all',
  severities: [...ALL_SEVERITIES],
  buckets: [...ALL_BUCKETS],
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

export default function PublicLogoHubAudit() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string>('');

  useEffect(() => {
    document.title = 'Logo Hub Audit — Coverage & Format Details';
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('global_client_logos')
        .select('id, name, category, website_url, files')
        .order('category')
        .order('name')
        .limit(2000);
      setRows(
        (data || []).map((d) => ({
          ...d,
          files: (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[],
        })),
      );
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  );

  // Per-brand computed audit
  const audited = useMemo(() => {
    return rows.map((r) => {
      const slots = LOCKUPS.flatMap((lk) =>
        VARIANTS.map((v) => {
          const inLockup = r.files.filter((f) => (f.lockup || 'icon') === lk);
          const svg = inLockup.find((f) => f.variant === v && f.format === 'svg');
          const png = inLockup.find((f) => f.variant === v && f.format === 'png');
          const any = inLockup.find((f) => f.variant === v);
          const file = svg || png || any;
          return {
            lockup: lk,
            variant: v,
            file,
            present: !!file,
            isSvg: file?.format === 'svg',
            isRaster: !!file && file.format !== 'svg',
          };
        }),
      );
      const total = slots.length; // 6
      const present = slots.filter((s) => s.present).length;
      const svgCount = slots.filter((s) => s.isSvg).length;
      const rasterCount = slots.filter((s) => s.isRaster).length;
      const missingCount = total - present;
      let bucket: 'complete' | 'partial' | 'raster' | 'missing';
      if (missingCount === 0 && rasterCount === 0) bucket = 'complete';
      else if (missingCount === total) bucket = 'missing';
      else if (rasterCount > 0 && missingCount === 0) bucket = 'raster';
      else bucket = 'partial';
      const audit = auditBrand(r.files);
      return { ...r, slots, total, present, svgCount, rasterCount, missingCount, bucket, audit };
    });
  }, [rows]);

  const severitySet = useMemo(
    () => new Set<AuditSeverity>(filter.severities.length ? filter.severities : ALL_SEVERITIES),
    [filter.severities],
  );
  const bucketSet = useMemo(
    () => new Set<CoverageBucket>(filter.buckets.length ? filter.buckets : ALL_BUCKETS),
    [filter.buckets],
  );

  const filtered = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return audited.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (filter.category !== 'all' && r.category !== filter.category) return false;
      if (!severitySet.has(r.audit.overall)) return false;
      if (!bucketSet.has(r.bucket)) return false;
      return true;
    });
  }, [audited, filter.search, filter.category, severitySet, bucketSet]);

  const summary = useMemo(() => {
    const totals = {
      brands: audited.length,
      complete: 0,
      partial: 0,
      raster: 0,
      missing: 0,
      slotsTotal: 0,
      slotsPresent: 0,
      slotsSvg: 0,
      slotsRaster: 0,
      slotsMissing: 0,
      auditPass: 0,
      auditWarn: 0,
      auditFail: 0,
      checkTotal: 0,
      checkPass: 0,
      checkFail: 0,
      checkWarn: 0,
    };
    for (const r of audited) {
      totals[r.bucket]++;
      totals.slotsTotal += r.total;
      totals.slotsPresent += r.present;
      totals.slotsSvg += r.svgCount;
      totals.slotsRaster += r.rasterCount;
      totals.slotsMissing += r.missingCount;
      if (r.audit.overall === 'pass') totals.auditPass++;
      else if (r.audit.overall === 'warn') totals.auditWarn++;
      else totals.auditFail++;
      const t = r.audit.totals;
      totals.checkTotal += t.fileChecks + r.audit.checks.length + r.audit.slots.length * 2;
      totals.checkPass += t.filePass + t.brandPass + t.slotPass;
      totals.checkFail += t.fileFail + t.brandFail + t.slotFail;
      totals.checkWarn += t.fileWarn + t.brandWarn + t.slotWarn;
    }
    return totals;
  }, [audited]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <Link
            to="/logohub"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Logo Hub
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe2 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
              Audit
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Logo Hub Audit
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Detailed coverage report for every brand — checks all 6 slots (icon and wordmark in
            color, black, and white) for presence, format quality, and source.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Brands" value={summary.brands} />
            <StatCard label="Complete (all SVG)" value={summary.complete} tone="success" />
            <StatCard label="Partial" value={summary.partial} tone="warning" />
            <StatCard label="Raster only" value={summary.raster} tone="warning" />
            <StatCard label="Missing all" value={summary.missing} tone="danger" />
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total slots" value={summary.slotsTotal} subtle />
            <StatCard
              label="Present"
              value={`${summary.slotsPresent} (${pct(summary.slotsPresent, summary.slotsTotal)}%)`}
              subtle
            />
            <StatCard
              label="SVG slots"
              value={`${summary.slotsSvg} (${pct(summary.slotsSvg, summary.slotsTotal)}%)`}
              subtle
            />
            <StatCard
              label="Raster / missing"
              value={`${summary.slotsRaster} / ${summary.slotsMissing}`}
              subtle
            />
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Brands passing audit" value={summary.auditPass} tone="success" />
            <StatCard label="Brands with warnings" value={summary.auditWarn} tone="warning" />
            <StatCard label="Brands failing audit" value={summary.auditFail} tone="danger" />
            <StatCard
              label="Check pass rate"
              value={`${pct(summary.checkPass, summary.checkTotal)}%`}
              subtle
            />
          </div>
        </div>
      </header>

      <section className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brand name..."
                value={filter.search}
                onChange={(e) => {
                  setActivePresetId('');
                  setFilter((p) => ({ ...p, search: e.target.value }));
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filter.category}
              onValueChange={(v) => {
                setActivePresetId('');
                setFilter((p) => ({ ...p, category: v }));
              }}
            >
              <SelectTrigger aria-label="Filter by category" className="w-full md:w-[200px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setActivePresetId('');
                setFilter(DEFAULT_FILTER);
              }}
            >
              Reset
            </Button>
          </div>

          {/* Severity + coverage toggle pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Audit:</span>
            {([
              { id: 'pass' as const, label: `Pass (${summary.auditPass})`, tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300', active: 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-200', icon: CheckCircle2 },
              { id: 'warn' as const, label: `Warn (${summary.auditWarn})`, tone: 'border-amber-500/40 text-amber-600 dark:text-amber-300', active: 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-200', icon: AlertTriangle },
              { id: 'fail' as const, label: `Fail (${summary.auditFail})`, tone: 'border-red-500/40 text-red-600 dark:text-red-300', active: 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-200', icon: XCircle },
            ]).map(({ id, label, tone, active, icon: Icon }) => {
              const on = filter.severities.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActivePresetId('');
                    setFilter((p) => ({
                      ...p,
                      severities: p.severities.includes(id)
                        ? p.severities.filter((s) => s !== id)
                        : [...p.severities, id],
                    }));
                  }}
                  onDoubleClick={() => {
                    setActivePresetId('');
                    setFilter((p) => ({ ...p, severities: [id] }));
                  }}
                  title="Click to toggle · Double-click to isolate"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                    on ? active : `${tone} opacity-60 hover:opacity-100`,
                  )}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
            <span className="mx-2 h-4 w-px bg-border" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Coverage:</span>
            {([
              { id: 'complete' as const, label: `Complete (${summary.complete})`, tone: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300', active: 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-200' },
              { id: 'partial' as const, label: `Partial (${summary.partial})`, tone: 'border-amber-500/40 text-amber-600 dark:text-amber-300', active: 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-200' },
              { id: 'raster' as const, label: `Raster (${summary.raster})`, tone: 'border-orange-500/40 text-orange-600 dark:text-orange-300', active: 'bg-orange-500/15 border-orange-500 text-orange-700 dark:text-orange-200' },
              { id: 'missing' as const, label: `Missing (${summary.missing})`, tone: 'border-red-500/40 text-red-600 dark:text-red-300', active: 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-200' },
            ]).map(({ id, label, tone, active }) => {
              const on = filter.buckets.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActivePresetId('');
                    setFilter((p) => ({
                      ...p,
                      buckets: p.buckets.includes(id)
                        ? p.buckets.filter((s) => s !== id)
                        : [...p.buckets, id],
                    }));
                  }}
                  onDoubleClick={() => {
                    setActivePresetId('');
                    setFilter((p) => ({ ...p, buckets: [id] }));
                  }}
                  title="Click to toggle · Double-click to isolate"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                    on ? active : `${tone} opacity-60 hover:opacity-100`,
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Saved filter presets */}
          <div className="flex flex-wrap items-center gap-2">
            <Bookmark className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Presets:</span>
            <Select
              value={activePresetId || '__none__'}
              onValueChange={(v) => {
                if (v === '__none__') {
                  setActivePresetId('');
                  return;
                }
                const p = presets.find((x) => x.id === v);
                if (!p) return;
                setFilter({
                  ...DEFAULT_FILTER,
                  ...p.filter,
                  severities:
                    Array.isArray(p.filter.severities) && p.filter.severities.length
                      ? p.filter.severities
                      : [...ALL_SEVERITIES],
                  buckets:
                    Array.isArray(p.filter.buckets) && p.filter.buckets.length
                      ? p.filter.buckets
                      : [...ALL_BUCKETS],
                });
                setActivePresetId(v);
              }}
            >
              <SelectTrigger aria-label="Apply saved preset" className="h-8 w-[200px] text-xs">
                <SelectValue placeholder={presets.length ? 'Apply preset…' : 'No presets saved'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activePresetId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-red-600 hover:text-red-700"
                onClick={() => {
                  const p = presets.find((x) => x.id === activePresetId);
                  const next = presets.filter((x) => x.id !== activePresetId);
                  setPresets(next);
                  savePresets(next);
                  setActivePresetId('');
                  if (p) toast.success(`Deleted preset "${p.name}"`);
                }}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
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
                  }
                }}
                placeholder="Save current as…"
                className="h-8 w-[180px] text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => {
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
                }}
              >
                <Save className="h-3 w-3" /> Save
              </Button>
            </div>
          </div>
        </div>
      </section>


      <section aria-label="Audit report" className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-medium">No brands match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Brand</th>
                  <th className="text-left px-3 py-3 font-medium">Category</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="text-center px-2 py-3 font-medium" colSpan={3}>
                    Icon
                  </th>
                  <th className="text-center px-2 py-3 font-medium border-l border-border" colSpan={3}>
                    Wordmark
                  </th>
                  <th className="text-right px-3 py-3 font-medium">Coverage</th>
                  <th className="text-right px-3 py-3 font-medium">Audit</th>
                </tr>
                <tr className="bg-muted/20 text-[10px]">
                  <th aria-hidden="true"><span className="sr-only">Brand</span></th>
                  <th aria-hidden="true"><span className="sr-only">Category</span></th>
                  <th aria-hidden="true"><span className="sr-only">Status</span></th>
                  <th className="text-center py-1.5 font-normal">Color</th>
                  <th className="text-center py-1.5 font-normal">Black</th>
                  <th className="text-center py-1.5 font-normal">White</th>
                  <th className="text-center py-1.5 font-normal border-l border-border">Color</th>
                  <th className="text-center py-1.5 font-normal">Black</th>
                  <th className="text-center py-1.5 font-normal">White</th>
                  <th aria-hidden="true"><span className="sr-only">Coverage</span></th>
                  <th aria-hidden="true"><span className="sr-only">Audit</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 align-top">
                      <Link
                        to={`/logohub/audit/${r.id}`}
                        className="font-medium truncate max-w-[200px] block hover:text-primary hover:underline"
                        title={r.name}
                      >
                        {r.name}
                      </Link>
                      {r.website_url && (
                        <a
                          href={r.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-muted-foreground hover:underline"
                        >
                          {hostOf(r.website_url)}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                      {r.category}
                    </td>
                    <td className="px-3 py-3 align-top text-center">
                      <StatusBadge bucket={r.bucket} />
                    </td>
                    {r.slots.map((s, i) => (
                      <td
                        key={`${s.lockup}-${s.variant}`}
                        className={cn(
                          'px-2 py-3 align-top text-center',
                          i === 3 && 'border-l border-border',
                        )}
                      >
                        <SlotCell slot={s} />
                      </td>
                    ))}
                    <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                      <div className="text-xs font-medium">
                        {r.svgCount}/{r.total} SVG
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.rasterCount > 0 && <>{r.rasterCount} raster · </>}
                        {r.missingCount > 0 && <>{r.missingCount} missing</>}
                        {r.rasterCount === 0 && r.missingCount === 0 && 'complete'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                      <AuditCell audit={r.audit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-semibold">Mono cutout audit</div>
            <p className="text-sm text-muted-foreground">
              Find brands whose black &amp; white derived SVGs lost their inner transparent
              cutouts. Shows before/after previews per lockup.
            </p>
          </div>
          <Link
            to="/logohub/audit/mono-cutouts"
            className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
          >
            Open →
          </Link>
        </div>

        {(isAdmin || isSuperAdmin) && (
          <div className="mt-10">
            <OrphanedFilesSection canDelete={isSuperAdmin} />
          </div>
        )}
      </section>
    </div>
  );
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function StatCard({
  label,
  value,
  tone,
  subtle,
}: {
  label: string;
  value: string | number;
  tone?: 'success' | 'warning' | 'danger';
  subtle?: boolean;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'danger'
          ? 'text-red-600 dark:text-red-400'
          : 'text-foreground';
  return (
    <div
      className={cn(
        'rounded-lg border border-border p-3',
        subtle ? 'bg-muted/20' : 'bg-card',
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-xl font-semibold mt-1', toneClass)}>{value}</div>
    </div>
  );
}

function StatusBadge({ bucket }: { bucket: 'complete' | 'partial' | 'raster' | 'missing' }) {
  const map = {
    complete: { label: 'Complete', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    partial: { label: 'Partial', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    raster: { label: 'Raster', cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
    missing: { label: 'Missing', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  } as const;
  const { label, cls } = map[bucket];
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-medium', cls)}>
      {label}
    </span>
  );
}

function SlotCell({
  slot,
}: {
  slot: {
    lockup: ClientLogoLockup;
    variant: ClientLogoVariant;
    file: ClientLogoFile | undefined;
    present: boolean;
    isSvg: boolean;
    isRaster: boolean;
  };
}) {
  if (!slot.file) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-[9px] text-muted-foreground">missing</span>
      </div>
    );
  }
  const ext = extOf(slot.file.url, slot.file.format) || slot.file.format;
  const Icon = slot.isSvg ? FileType2 : FileImage;
  const color = slot.isSvg
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-amber-600 dark:text-amber-400';
  return (
    <a
      href={slot.file.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${slot.lockup} ${slot.variant} ${ext.toUpperCase()} in a new tab`}
      className="inline-flex flex-col items-center gap-0.5 group min-h-9 min-w-9 justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={slot.file.url}
    >
      <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
      <span className="text-[9px] uppercase font-medium tracking-wider text-muted-foreground group-hover:text-foreground">
        {ext}
      </span>
    </a>
  );
}

function AuditCell({
  audit,
}: {
  audit: { overall: 'pass' | 'warn' | 'fail'; passRate: number; totals: { fileFail: number; fileWarn: number; brandFail: number; brandWarn: number; slotFail: number; slotWarn: number } };
}) {
  const map = {
    pass: { label: 'Pass', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    warn: { label: 'Warn', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    fail: { label: 'Fail', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  } as const;
  const { label, cls } = map[audit.overall];
  const failCount = audit.totals.fileFail + audit.totals.brandFail + audit.totals.slotFail;
  const warnCount = audit.totals.fileWarn + audit.totals.brandWarn + audit.totals.slotWarn;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-medium', cls)}>
        {label} · {audit.passRate}%
      </span>
      {(failCount > 0 || warnCount > 0) && (
        <span className="text-[10px] text-muted-foreground">
          {failCount > 0 && <>{failCount} fail</>}
          {failCount > 0 && warnCount > 0 && ' · '}
          {warnCount > 0 && <>{warnCount} warn</>}
        </span>
      )}
    </div>
  );
}
