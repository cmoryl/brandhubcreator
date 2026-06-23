import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Loader2, Download, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Variant = 'color' | 'black' | 'white';
type Format = 'svg' | 'png';

interface FileEntry {
  url?: string;
  variant?: Variant;
  format?: Format;
  lockup?: string;
}

interface BrandRow {
  id: string;
  name: string;
  files: FileEntry[];
}

interface ProbeResult {
  url: string;
  variant: Variant;
  format: Format;
  width: number;
  height: number;
  bytes: number;
  status: 'pass' | 'warn' | 'fail';
  reason?: string;
  error?: string;
}

interface IconAuditRow {
  id: string;
  name: string;
  probes: Record<Variant, ProbeResult | { status: 'missing' } | { status: 'pending' }>;
  worst: 'pass' | 'warn' | 'fail' | 'missing' | 'pending';
}

// Quality thresholds for an icon (square mark — should scale to retina app-icon use).
const MIN_PASS_PX = 512;       // ≥512 on shortest side = pass
const MIN_WARN_PX = 256;       // 256–511 = warn (usable but not retina-safe)
const MIN_SVG_BYTES = 400;     // SVGs smaller than this are usually placeholders

const VARIANTS: Variant[] = ['color', 'black', 'white'];

function pickIconFile(files: FileEntry[], variant: Variant): FileEntry | undefined {
  // Prefer explicit lockup === 'icon'. Fall back: a file with no lockup AND
  // a square-ish filename hint. Prefer PNG (we measure raster pixels), else SVG.
  const iconFiles = files.filter(
    (f) => f && f.variant === variant && (f.lockup === 'icon'),
  );
  if (iconFiles.length === 0) return undefined;
  return (
    iconFiles.find((f) => f.format === 'png') ||
    iconFiles.find((f) => f.format === 'svg') ||
    iconFiles[0]
  );
}

async function probeFile(file: FileEntry): Promise<ProbeResult> {
  const url = file.url!;
  const variant = file.variant!;
  const format = (file.format || (url.endsWith('.svg') ? 'svg' : 'png')) as Format;
  const base: ProbeResult = {
    url,
    variant,
    format,
    width: 0,
    height: 0,
    bytes: 0,
    status: 'pass',
  };

  try {
    if (format === 'svg') {
      // SVGs are vector — quality signal is byte size + parseable viewBox/size.
      const res = await fetch(url);
      const text = await res.text();
      base.bytes = new Blob([text]).size;
      const vb = text.match(/viewBox=["']\s*[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)/i);
      const w = vb ? parseFloat(vb[1]) : 0;
      const h = vb ? parseFloat(vb[2]) : 0;
      base.width = Math.round(w);
      base.height = Math.round(h);
      if (base.bytes < MIN_SVG_BYTES) {
        base.status = 'warn';
        base.reason = `Tiny SVG (${base.bytes}B) — likely a placeholder`;
      } else if (!vb) {
        base.status = 'warn';
        base.reason = 'No viewBox declared';
      } else {
        base.status = 'pass';
        base.reason = `Vector ${base.width}×${base.height}`;
      }
      return base;
    }

    // PNG: measure natural dimensions via Image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.referrerPolicy = 'no-referrer';
      const t = setTimeout(() => reject(new Error('timeout')), 12000);
      im.onload = () => {
        clearTimeout(t);
        resolve(im);
      };
      im.onerror = () => {
        clearTimeout(t);
        reject(new Error('load failed'));
      };
      im.src = url;
    });
    base.width = img.naturalWidth || 0;
    base.height = img.naturalHeight || 0;
    // Try to grab bytes (best-effort, may CORS-fail silently)
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const len = head.headers.get('content-length');
      if (len) base.bytes = parseInt(len, 10);
    } catch {
      /* noop */
    }
    const shortest = Math.min(base.width, base.height);
    if (shortest >= MIN_PASS_PX) {
      base.status = 'pass';
      base.reason = `${base.width}×${base.height}`;
    } else if (shortest >= MIN_WARN_PX) {
      base.status = 'warn';
      base.reason = `${base.width}×${base.height} — below 512px retina target`;
    } else {
      base.status = 'fail';
      base.reason = `${base.width}×${base.height} — too small for icon use`;
    }
    return base;
  } catch (e) {
    base.status = 'fail';
    base.error = (e as Error).message;
    base.reason = `Failed to load (${base.error})`;
    return base;
  }
}

function worstOf(probes: IconAuditRow['probes']): IconAuditRow['worst'] {
  const states = VARIANTS.map((v) => probes[v].status);
  if (states.includes('pending')) return 'pending';
  if (states.includes('missing')) return 'missing';
  if (states.includes('fail')) return 'fail';
  if (states.includes('warn')) return 'warn';
  return 'pass';
}

export default function PublicLogoHubIconAudit() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [audit, setAudit] = useState<IconAuditRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'issues' | 'low-res' | 'missing'>('issues');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, files')
        .order('name');
      if (!error && data) {
        const rows: BrandRow[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          files: Array.isArray(d.files) ? d.files : [],
        }));
        setBrands(rows);
        // Seed audit with missing/pending placeholders so UI shows immediately.
        setAudit(
          rows.map((r) => {
            const probes = {} as IconAuditRow['probes'];
            for (const v of VARIANTS) {
              probes[v] = pickIconFile(r.files, v)
                ? { status: 'pending' }
                : { status: 'missing' };
            }
            return { id: r.id, name: r.name, probes, worst: worstOf(probes) };
          }),
        );
      }
      setLoading(false);
    })();
  }, []);

  const runAudit = async () => {
    setRunning(true);
    const tasks: { brandId: string; variant: Variant; file: FileEntry }[] = [];
    for (const b of brands) {
      for (const v of VARIANTS) {
        const file = pickIconFile(b.files, v);
        if (file?.url) tasks.push({ brandId: b.id, variant: v, file });
      }
    }
    setProgress({ done: 0, total: tasks.length });

    // 6-wide pool
    const POOL = 6;
    let i = 0;
    let done = 0;
    const results = new Map<string, ProbeResult>();
    await Promise.all(
      Array.from({ length: POOL }).map(async () => {
        while (i < tasks.length) {
          const idx = i++;
          const t = tasks[idx];
          const r = await probeFile(t.file);
          results.set(`${t.brandId}:${t.variant}`, r);
          done++;
          setProgress({ done, total: tasks.length });
        }
      }),
    );

    setAudit((prev) =>
      prev.map((row) => {
        const probes = { ...row.probes };
        for (const v of VARIANTS) {
          const hit = results.get(`${row.id}:${v}`);
          if (hit) probes[v] = hit;
        }
        return { ...row, probes, worst: worstOf(probes) };
      }),
    );
    setRunning(false);
  };

  const stats = useMemo(() => {
    let pass = 0, warn = 0, fail = 0, missing = 0, pending = 0;
    for (const r of audit) {
      if (r.worst === 'pass') pass++;
      else if (r.worst === 'warn') warn++;
      else if (r.worst === 'fail') fail++;
      else if (r.worst === 'missing') missing++;
      else pending++;
    }
    return { total: audit.length, pass, warn, fail, missing, pending };
  }, [audit]);

  const filtered = useMemo(() => {
    return audit.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'all') return true;
      if (filter === 'issues') return r.worst === 'fail' || r.worst === 'warn' || r.worst === 'missing';
      if (filter === 'low-res') return r.worst === 'fail' || r.worst === 'warn';
      if (filter === 'missing') return r.worst === 'missing';
      return true;
    });
  }, [audit, search, filter]);

  const downloadCsv = () => {
    const header = ['brand', ...VARIANTS.flatMap((v) => [`${v}_status`, `${v}_dim`, `${v}_format`, `${v}_url`]), 'worst'];
    const lines = [header.join(',')];
    for (const r of audit) {
      const row: string[] = [JSON.stringify(r.name)];
      for (const v of VARIANTS) {
        const p = r.probes[v];
        if (p.status === 'missing' || p.status === 'pending') {
          row.push(p.status, '', '', '');
        } else {
          const pr = p as ProbeResult;
          row.push(pr.status, `${pr.width}x${pr.height}`, pr.format, JSON.stringify(pr.url));
        }
      }
      row.push(r.worst);
      lines.push(row.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-icon-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCell = (probe: IconAuditRow['probes'][Variant]) => {
    if (probe.status === 'pending') {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline" />;
    }
    if (probe.status === 'missing') {
      return (
        <div className="text-center">
          <XCircle className="h-4 w-4 text-muted-foreground inline" />
          <div className="text-[10px] text-muted-foreground mt-0.5">no icon</div>
        </div>
      );
    }
    const pr = probe as ProbeResult;
    const Icon =
      pr.status === 'pass' ? CheckCircle2 : pr.status === 'warn' ? AlertTriangle : XCircle;
    const tone =
      pr.status === 'pass'
        ? 'text-emerald-500'
        : pr.status === 'warn'
          ? 'text-amber-500'
          : 'text-destructive';
    return (
      <a href={pr.url} target="_blank" rel="noreferrer" className="block group" title={pr.reason}>
        <Icon className={`h-4 w-4 ${tone} inline`} />
        <div className="text-[10px] text-muted-foreground mt-0.5 group-hover:text-foreground">
          {pr.format === 'svg' ? 'svg' : `${pr.width}×${pr.height}`}
        </div>
      </a>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
            <Link to="/logohub">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Logo Hub
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Icon Resolution Audit</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Loads each brand's icon (square mark) across color / black / white variants and
            measures its actual pixel dimensions. PNGs below {MIN_PASS_PX}px on the shortest side
            are flagged; below {MIN_WARN_PX}px they fail. SVGs are checked for sane viewBox and
            byte size.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAudit} disabled={running || loading || brands.length === 0} size="sm">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Auditing {progress.done}/{progress.total}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" /> Run audit
              </>
            )}
          </Button>
          <Button onClick={downloadCsv} variant="outline" size="sm" disabled={!audit.length}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Brands</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.pass}</div>
          <div className="text-sm text-muted-foreground">All icons hi-res</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.warn}</div>
          <div className="text-sm text-muted-foreground">Below retina target</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.fail}</div>
          <div className="text-sm text-muted-foreground">Failing / too small</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-muted-foreground">{stats.missing}</div>
          <div className="text-sm text-muted-foreground">Missing icon</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="issues">Issues only (low-res or missing)</SelectItem>
            <SelectItem value="low-res">Low-resolution only</SelectItem>
            <SelectItem value="missing">Missing icon only</SelectItem>
            <SelectItem value="all">All brands</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground self-center">
          Showing {filtered.length} of {audit.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Brand</th>
                  {VARIANTS.map((v) => (
                    <th key={v} className="px-3 py-3 font-medium text-center capitalize">
                      {v}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                  <th className="px-3 py-3 font-medium text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const notes: string[] = [];
                  for (const v of VARIANTS) {
                    const p = r.probes[v];
                    if (p.status === 'missing') notes.push(`${v}: no icon file`);
                    else if (p.status !== 'pending') {
                      const pr = p as ProbeResult;
                      if (pr.status !== 'pass') notes.push(`${v}: ${pr.reason}`);
                    }
                  }
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30 align-top">
                      <td className="px-4 py-2 font-medium">{r.name}</td>
                      {VARIANTS.map((v) => (
                        <td key={v} className="px-3 py-2 text-center">
                          {renderCell(r.probes[v])}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        {r.worst === 'pass' && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                            Pass
                          </Badge>
                        )}
                        {r.worst === 'warn' && (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">
                            Low-res
                          </Badge>
                        )}
                        {r.worst === 'fail' && <Badge variant="destructive">Failing</Badge>}
                        {r.worst === 'missing' && <Badge variant="outline">Missing</Badge>}
                        {r.worst === 'pending' && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-md">
                        {notes.length === 0 ? '—' : notes.join(' · ')}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No brands match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
