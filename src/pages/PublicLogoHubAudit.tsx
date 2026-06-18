import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, ArrowLeft, XCircle, FileImage, FileType2, Globe2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';
import { auditBrand } from '@/lib/logoAuditChecks';

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

export default function PublicLogoHubAudit() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    document.title = 'Logo Hub Audit — Coverage & Format Details';
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

  const filtered = useMemo(
    () =>
      audited.filter((r) => {
        if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (category !== 'all' && r.category !== category) return false;
        if (status === 'audit-fail') return r.audit.overall === 'fail';
        if (status === 'audit-warn') return r.audit.overall === 'warn';
        if (status === 'audit-pass') return r.audit.overall === 'pass';
        if (status !== 'all' && r.bucket !== status) return false;
        return true;
      }),
    [audited, search, category, status],
  );

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-6 py-10">
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Logo Hub Audit
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
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
        <div className="container mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brand name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
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
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="partial">Partial</TabsTrigger>
              <TabsTrigger value="raster">Raster only</TabsTrigger>
              <TabsTrigger value="missing">Missing</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-6 py-8">
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
                </tr>
                <tr className="bg-muted/20 text-[10px]">
                  <th />
                  <th />
                  <th />
                  <th className="text-center py-1.5 font-normal">Color</th>
                  <th className="text-center py-1.5 font-normal">Black</th>
                  <th className="text-center py-1.5 font-normal">White</th>
                  <th className="text-center py-1.5 font-normal border-l border-border">Color</th>
                  <th className="text-center py-1.5 font-normal">Black</th>
                  <th className="text-center py-1.5 font-normal">White</th>
                  <th />
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
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
      className="flex flex-col items-center gap-0.5 group"
      title={slot.file.url}
    >
      <Icon className={cn('h-4 w-4', color)} />
      <span className="text-[9px] uppercase font-medium tracking-wider text-muted-foreground group-hover:text-foreground">
        {ext}
      </span>
    </a>
  );
}
