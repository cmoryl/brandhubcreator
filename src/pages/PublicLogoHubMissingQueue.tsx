import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ExternalLink, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadLogoVersion } from '@/components/logohub/UploadLogoVersion';
import type {
  ClientLogoFile,
  ClientLogoLockup,
  ClientLogoVariant,
} from '@/types/brand';

type Variant = ClientLogoVariant;
type Format = 'svg' | 'png';

interface Row {
  id: string;
  name: string;
  category: string | null;
  website_url: string | null;
  files: ClientLogoFile[];
}

type Filter = 'empty' | 'missing-color' | 'missing-any' | 'all';

const VARIANTS: Variant[] = ['color', 'black', 'white'];
const FORMATS: Format[] = ['svg', 'png'];

function has(files: ClientLogoFile[], lockup: ClientLogoLockup, variant: Variant, format: Format) {
  return files.some(
    (f) =>
      f &&
      f.format === format &&
      f.variant === variant &&
      (f.lockup === lockup || (!f.lockup && lockup === 'wordmark')),
  );
}

function missingSlots(files: ClientLogoFile[], lockupScope: LockupScope = 'both') {
  const missing: { lockup: ClientLogoLockup; variant: Variant; format: Format }[] = [];
  const lockups: ClientLogoLockup[] =
    lockupScope === 'wordmark' ? ['wordmark'] : lockupScope === 'icon' ? ['icon'] : ['wordmark', 'icon'];
  for (const l of lockups) {
    for (const v of VARIANTS) {
      for (const f of FORMATS) {
        if (!has(files, l, v, f)) missing.push({ lockup: l, variant: v, format: f });
      }
    }
  }
  return missing;
}

type LockupScope = 'both' | 'wordmark' | 'icon';

function FragmentRow({ lockup, files }: { lockup: ClientLogoLockup; files: ClientLogoFile[] }) {
  return (
    <>
      <div className="font-medium text-muted-foreground capitalize self-center">{lockup}</div>
      {VARIANTS.map((v) =>
        FORMATS.map((f) => {
          const present = has(files, lockup, v, f);
          return (
            <div key={`${lockup}-${v}-${f}`} className="flex justify-center items-center">
              {present ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive/50" />
              )}
            </div>
          );
        }),
      )}
    </>
  );
}

export default function PublicLogoHubMissingQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('empty');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lockupScope, setLockupScope] = useState<LockupScope>('both');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_client_logos')
      .select('id, name, category, website_url, files')
      .order('name');
    if (!error) {
      setRows(
        (data || []).map((d: { id: string; name: string; category: string | null; website_url: string | null; files: unknown }) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          website_url: d.website_url,
          files: (Array.isArray(d.files) ? d.files : []) as ClientLogoFile[],
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      const scopeFiles = r.files;
      const empty =
        lockupScope === 'icon'
          ? !scopeFiles.some((f) => f.lockup === 'icon')
          : lockupScope === 'wordmark'
            ? !scopeFiles.some((f) => f.lockup === 'wordmark' || !f.lockup)
            : scopeFiles.length === 0;
      const colorLockup: ClientLogoLockup = lockupScope === 'icon' ? 'icon' : 'wordmark';
      const missingColor =
        !has(scopeFiles, colorLockup, 'color', 'svg') &&
        !has(scopeFiles, colorLockup, 'color', 'png');
      const missingAny = missingSlots(scopeFiles, lockupScope).length > 0;
      if (filter === 'empty') return empty;
      if (filter === 'missing-color') return missingColor;
      if (filter === 'missing-any') return missingAny;
      return true;
    });
  }, [rows, search, filter, categoryFilter, lockupScope]);

  const stats = useMemo(() => {
    const empty = rows.filter((r) =>
      lockupScope === 'icon'
        ? !r.files.some((f) => f.lockup === 'icon')
        : lockupScope === 'wordmark'
          ? !r.files.some((f) => f.lockup === 'wordmark' || !f.lockup)
          : r.files.length === 0,
    ).length;
    const colorLockup: ClientLogoLockup = lockupScope === 'icon' ? 'icon' : 'wordmark';
    const missingColor = rows.filter(
      (r) =>
        !has(r.files, colorLockup, 'color', 'svg') &&
        !has(r.files, colorLockup, 'color', 'png'),
    ).length;
    return { total: rows.length, empty, missingColor };
  }, [rows, lockupScope]);

  const handleUploaded = (id: string, nextFiles: ClientLogoFile[]) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, files: nextFiles } : r)));
  };

  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const handleDeepFetch = async (row: Row) => {
    if (!row.website_url) {
      toast.error('No website URL on this brand');
      return;
    }
    setFetchingId(row.id);
    const t = toast.loading(`Deep-fetching icon for ${row.name}…`);
    try {
      const { data, error } = await supabase.functions.invoke('deep-icon-fetch', {
        body: {
          website_url: row.website_url,
          logo_id: row.id,
          name: row.name,
          commit: true,
        },
      });
      if (error) throw error;
      const r = data as { ok: boolean; total?: number; commit?: { ok?: boolean; files?: ClientLogoFile[]; error?: string }; error?: string };
      if (!r.ok) throw new Error(r.error || 'fetch failed');
      if (!r.total) {
        toast.error('No candidate icons discovered', { id: t });
      } else if (r.commit?.ok && r.commit.files?.length) {
        toast.success(`Saved icon (${r.total} candidates found)`, { id: t });
        await load();
      } else {
        toast.error(r.commit?.error || `Found ${r.total} candidates but failed to save`, { id: t });
      }
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    } finally {
      setFetchingId(null);
    }
  };

  const [derivingId, setDerivingId] = useState<string | null>(null);
  const handleDeriveMono = async (row: Row, lockup: 'icon' | 'wordmark') => {
    setDerivingId(row.id);
    const t = toast.loading(`Deriving B/W ${lockup} for ${row.name}…`);
    try {
      const { data, error } = await supabase.functions.invoke('derive-mono-icons', {
        body: { logo_id: row.id, lockup },
      });
      if (error) throw error;
      const r = data as { ok: boolean; produced?: ClientLogoFile[]; files?: ClientLogoFile[]; error?: string };
      if (!r.ok) throw new Error(r.error || 'derive failed');
      toast.success(`Derived ${r.produced?.length ?? 0} mono variants`, { id: t });
      if (r.files) handleUploaded(row.id, r.files);
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    } finally {
      setDerivingId(null);
    }
  };

  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const handleBulkDeriveMono = async () => {
    const lockupsToRun: ('icon' | 'wordmark')[] =
      lockupScope === 'icon' ? ['icon'] : lockupScope === 'wordmark' ? ['wordmark'] : ['icon', 'wordmark'];
    const jobs: { row: Row; lockup: 'icon' | 'wordmark' }[] = [];
    for (const row of filtered) {
      for (const lockup of lockupsToRun) {
        const hasColor = row.files.some(
          (f) => f.variant === 'color' && (f.lockup ?? 'wordmark') === lockup,
        );
        const missingMono =
          !has(row.files, lockup, 'black', 'svg') ||
          !has(row.files, lockup, 'black', 'png') ||
          !has(row.files, lockup, 'white', 'svg') ||
          !has(row.files, lockup, 'white', 'png');
        if (hasColor && missingMono) jobs.push({ row, lockup });
      }
    }
    if (jobs.length === 0) {
      toast.info('Nothing to derive — every visible row already has B/W variants or no color source.');
      return;
    }
    if (!confirm(`Derive B/W variants for ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} across ${filtered.length} brands?`)) return;

    setBulkRunning(true);
    setBulkProgress({ done: 0, total: jobs.length });
    const t = toast.loading(`Bulk deriving B/W… 0/${jobs.length}`);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < jobs.length; i++) {
      const { row, lockup } = jobs[i];
      try {
        const { data, error } = await supabase.functions.invoke('derive-mono-icons', {
          body: { logo_id: row.id, lockup },
        });
        if (error) throw error;
        const r = data as { ok: boolean; files?: ClientLogoFile[]; error?: string };
        if (!r.ok) throw new Error(r.error || 'derive failed');
        if (r.files) handleUploaded(row.id, r.files);
        ok++;
      } catch (e) {
        fail++;
        console.error('bulk derive failed', row.name, lockup, e);
      }
      setBulkProgress({ done: i + 1, total: jobs.length });
      toast.loading(`Bulk deriving B/W… ${i + 1}/${jobs.length}`, { id: t });
    }
    toast.success(`Bulk derive complete — ${ok} ok, ${fail} failed`, { id: t });
    setBulkRunning(false);
    setBulkProgress(null);
  };

  const [rasterRunning, setRasterRunning] = useState(false);
  const [rasterProgress, setRasterProgress] = useState<{ done: number; total: number } | null>(null);
  const handleBulkRasterizeWordmarks = async () => {
    const jobs: { row: Row; variants: ('color' | 'black' | 'white')[] }[] = [];
    for (const row of filtered) {
      const need: ('color' | 'black' | 'white')[] = [];
      for (const v of ['color', 'black', 'white'] as const) {
        const hasSvg = has(row.files, 'wordmark', v, 'svg');
        const hasPng = has(row.files, 'wordmark', v, 'png');
        if (hasSvg && !hasPng) need.push(v);
      }
      if (need.length) jobs.push({ row, variants: need });
    }
    if (jobs.length === 0) {
      toast.info('Nothing to rasterize — every visible wordmark with an SVG already has a PNG.');
      return;
    }
    const totalVariants = jobs.reduce((n, j) => n + j.variants.length, 0);
    if (!confirm(`Rasterize ${totalVariants} wordmark PNGs across ${jobs.length} brands?`)) return;

    setRasterRunning(true);
    setRasterProgress({ done: 0, total: jobs.length });
    const t = toast.loading(`Rasterizing wordmark PNGs… 0/${jobs.length}`);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < jobs.length; i++) {
      const { row, variants } = jobs[i];
      try {
        const { data, error } = await supabase.functions.invoke('rasterize-wordmark-png', {
          body: { logo_id: row.id, variants },
        });
        if (error) throw error;
        const r = data as { ok: boolean; files?: ClientLogoFile[]; error?: string };
        if (!r.ok) throw new Error(r.error || 'rasterize failed');
        if (r.files) handleUploaded(row.id, r.files);
        ok++;
      } catch (e) {
        fail++;
        console.error('bulk rasterize failed', row.name, e);
      }
      setRasterProgress({ done: i + 1, total: jobs.length });
      toast.loading(`Rasterizing wordmark PNGs… ${i + 1}/${jobs.length}`, { id: t });
    }
    toast.success(`Rasterize complete — ${ok} ok, ${fail} failed`, { id: t });
    setRasterRunning(false);
    setRasterProgress(null);
  };

  const [iconBulkRunning, setIconBulkRunning] = useState(false);
  const [iconBulkProgress, setIconBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const handleBulkDeepFetchIcons = async () => {
    const jobs = filtered.filter((row) => {
      if (!row.website_url) return false;
      const hasColorIcon =
        has(row.files, 'icon', 'color', 'svg') || has(row.files, 'icon', 'color', 'png');
      return !hasColorIcon;
    });
    if (jobs.length === 0) {
      toast.info('Nothing to fetch — every visible row already has a color icon or has no website URL.');
      return;
    }
    if (!confirm(`Deep-fetch icons for ${jobs.length} brand${jobs.length === 1 ? '' : 's'}? B/W variants will be derived automatically when a color icon lands.`)) return;

    setIconBulkRunning(true);
    setIconBulkProgress({ done: 0, total: jobs.length });
    const t = toast.loading(`Deep-fetching icons… 0/${jobs.length}`);
    let ok = 0;
    let fail = 0;
    const failed: string[] = [];
    for (let i = 0; i < jobs.length; i++) {
      const row = jobs[i];
      try {
        const { data, error } = await supabase.functions.invoke('deep-icon-fetch', {
          body: { website_url: row.website_url, logo_id: row.id, name: row.name, commit: true },
        });
        if (error) throw error;
        const r = data as { ok: boolean; total?: number; commit?: { ok?: boolean; files?: ClientLogoFile[]; error?: string }; error?: string };
        if (!r.ok) throw new Error(r.error || 'fetch failed');
        if (r.commit?.ok && r.commit.files?.length) {
          ok++;
          // Refresh this row from server so derived B/W variants (auto-triggered) show up
          const { data: fresh } = await supabase
            .from('global_client_logos')
            .select('files')
            .eq('id', row.id)
            .maybeSingle();
          if (fresh?.files) handleUploaded(row.id, (Array.isArray(fresh.files) ? fresh.files : []) as unknown as ClientLogoFile[]);
        } else {
          fail++;
          failed.push(row.name);
        }
      } catch (e) {
        fail++;
        failed.push(row.name);
        console.error('bulk deep-fetch failed', row.name, e);
      }
      setIconBulkProgress({ done: i + 1, total: jobs.length });
      toast.loading(`Deep-fetching icons… ${i + 1}/${jobs.length}`, { id: t });
    }
    toast.success(`Deep-fetch complete — ${ok} ok, ${fail} failed${failed.length ? ` (${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''})` : ''}`, { id: t });
    setIconBulkRunning(false);
    setIconBulkProgress(null);
  };








  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link to="/logohub">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Logo Hub
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Missing Logos Queue</h1>
          <p className="text-muted-foreground mt-1">
            Brands without complete public logo assets. Upload SVG or PNG files inline to fill the
            gaps.
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">Bulk derive B/W</span>
          <span className="text-muted-foreground ml-2">
            Generates black & white SVG/PNG variants from existing color assets for every visible row
            ({lockupScope === 'both' ? 'icons + wordmarks' : `${lockupScope}s`}).
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto gap-1"
          disabled={bulkRunning || loading || filtered.length === 0}
          onClick={handleBulkDeriveMono}
        >
          {bulkRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : 'Running…'}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Derive B/W for {filtered.length} visible
            </>
          )}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">Bulk rasterize wordmark PNGs</span>
          <span className="text-muted-foreground ml-2">
            Renders 2048px transparent PNGs from existing wordmark SVGs (color / black / white) for every
            visible row that's missing the PNG. Filter by category (e.g. Legal) first.
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto gap-1"
          disabled={rasterRunning || loading || filtered.length === 0}
          onClick={handleBulkRasterizeWordmarks}
        >
          {rasterRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {rasterProgress ? `${rasterProgress.done}/${rasterProgress.total}` : 'Running…'}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Rasterize PNGs for {filtered.length} visible
            </>
          )}
        </Button>
      </div>




      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Brands total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.empty}</div>
          <div className="text-sm text-muted-foreground">
            {lockupScope === 'icon'
              ? 'No icon assets'
              : lockupScope === 'wordmark'
                ? 'No wordmark assets'
                : 'No assets at all'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.missingColor}</div>
          <div className="text-sm text-muted-foreground">
            Missing color {lockupScope === 'icon' ? 'icon' : 'wordmark'}
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={lockupScope} onValueChange={(v) => setLockupScope(v as LockupScope)}>
          <SelectTrigger className="sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Wordmarks + icons</SelectItem>
            <SelectItem value="wordmark">Wordmarks only</SelectItem>
            <SelectItem value="icon">Icons only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">
              Empty ({lockupScope === 'icon' ? 'no icon' : lockupScope === 'wordmark' ? 'no wordmark' : 'no files'})
            </SelectItem>
            <SelectItem value="missing-color">
              Missing color {lockupScope === 'icon' ? 'icon' : 'wordmark'}
            </SelectItem>
            <SelectItem value="missing-any">Missing any variant</SelectItem>
            <SelectItem value="all">All brands</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="All categories" />
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
        <div className="ml-auto text-sm text-muted-foreground self-center">
          Showing {filtered.length} of {rows.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nothing in the queue. 🎉
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const missing = missingSlots(r.files, lockupScope);
            const visibleLockups: ClientLogoLockup[] =
              lockupScope === 'wordmark' ? ['wordmark'] : lockupScope === 'icon' ? ['icon'] : ['wordmark', 'icon'];
            const hasAny = visibleLockups.some((l) =>
              r.files.some((f) => f.lockup === l || (l === 'wordmark' && !f.lockup)),
            );
            return (
              <Card key={r.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base truncate">{r.name}</h3>
                      {r.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {r.category}
                        </Badge>
                      )}
                      {!hasAny ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Empty
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {missing.length} missing
                        </Badge>
                      )}
                      {r.website_url && (
                        <a
                          href={r.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          site
                        </a>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-[80px_repeat(6,1fr)] gap-1 text-[11px]">
                      <div />
                      {VARIANTS.map((v) =>
                        FORMATS.map((f) => (
                          <div
                            key={`h-${v}-${f}`}
                            className="text-center text-muted-foreground capitalize"
                          >
                            {v}
                            <div className="text-[9px] uppercase tracking-wider">{f}</div>
                          </div>
                        )),
                      )}
                      {visibleLockups.map((l) => (
                        <FragmentRow
                          key={`l-${l}`}
                          lockup={l}
                          files={r.files}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-48 shrink-0">
                    <UploadLogoVersion
                      logoId={r.id}
                      logoName={r.name}
                      existingFiles={r.files}
                      defaultLockup={lockupScope === 'icon' ? 'icon' : 'wordmark'}
                      defaultVariant="color"
                      onUploaded={(nextFiles) => handleUploaded(r.id, nextFiles)}
                      trigger={
                        <Button size="sm" className="w-full gap-1">
                          <Upload className="h-3.5 w-3.5" /> Upload asset
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full gap-1"
                      disabled={!r.website_url || fetchingId === r.id}
                      onClick={() => handleDeepFetch(r)}
                    >
                      {fetchingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Deep fetch icon
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full gap-1"
                      disabled={derivingId === r.id || !r.files.some((f) => f.variant === 'color' && ((f.lockup ?? 'wordmark') === (lockupScope === 'wordmark' ? 'wordmark' : 'icon')))}
                      onClick={() => handleDeriveMono(r, lockupScope === 'wordmark' ? 'wordmark' : 'icon')}
                    >
                      {derivingId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Derive B/W
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to={`/logohub/audit/${r.id}`}>Open audit</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
