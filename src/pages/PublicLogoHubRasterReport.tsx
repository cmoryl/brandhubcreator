import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
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

interface Row {
  id: string;
  name: string;
  files: FileEntry[];
}

interface Cell {
  present: boolean;
  url?: string;
}

interface ReportRow {
  id: string;
  name: string;
  cells: Record<`${Variant}-${Format}`, Cell>;
  missingCount: number;
  hasAnyPng: boolean;
}

const VARIANTS: Variant[] = ['color', 'black', 'white'];
const FORMATS: Format[] = ['svg', 'png'];

function buildReport(rows: Row[]): ReportRow[] {
  return rows.map((r) => {
    const files = Array.isArray(r.files) ? r.files : [];
    const cells = {} as ReportRow['cells'];
    let missing = 0;
    let hasAnyPng = false;
    for (const v of VARIANTS) {
      for (const fmt of FORMATS) {
        const match = files.find(
          (f) =>
            f &&
            f.variant === v &&
            f.format === fmt &&
            (f.lockup === 'wordmark' || !f.lockup || v === 'color'),
        );
        const present = !!match?.url;
        cells[`${v}-${fmt}`] = { present, url: match?.url };
        if (!present) missing += 1;
        if (present && fmt === 'png') hasAnyPng = true;
      }
    }
    return { id: r.id, name: r.name, cells, missingCount: missing, hasAnyPng };
  });
}

export default function PublicLogoHubRasterReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing-png' | 'missing-any' | 'complete'>('missing-png');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, files')
        .order('name');
      if (!error) {
        setRows(
          (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            files: Array.isArray(d.files) ? d.files : [],
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  const report = useMemo(() => buildReport(rows), [rows]);

  const filtered = useMemo(() => {
    return report.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'missing-png') {
        return VARIANTS.some((v) => !r.cells[`${v}-png`].present);
      }
      if (filter === 'missing-any') return r.missingCount > 0;
      if (filter === 'complete') return r.missingCount === 0;
      return true;
    });
  }, [report, search, filter]);

  const stats = useMemo(() => {
    const total = report.length;
    const counts = {
      'color-svg': 0,
      'color-png': 0,
      'black-svg': 0,
      'black-png': 0,
      'white-svg': 0,
      'white-png': 0,
    } as Record<`${Variant}-${Format}`, number>;
    for (const r of report) {
      for (const v of VARIANTS) {
        for (const f of FORMATS) {
          if (r.cells[`${v}-${f}`].present) counts[`${v}-${f}`] += 1;
        }
      }
    }
    const missingAnyPng = report.filter((r) =>
      VARIANTS.some((v) => !r.cells[`${v}-png`].present),
    ).length;
    return { total, counts, missingAnyPng };
  }, [report]);

  const downloadCsv = () => {
    const header = ['brand', ...VARIANTS.flatMap((v) => FORMATS.map((f) => `${v}-${f}`)), 'missing_count'];
    const lines = [header.join(',')];
    for (const r of report) {
      const row = [
        JSON.stringify(r.name),
        ...VARIANTS.flatMap((v) =>
          FORMATS.map((f) => (r.cells[`${v}-${f}`].present ? '1' : '0')),
        ),
        String(r.missingCount),
      ];
      lines.push(row.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-rasterization-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold">PNG Rasterization Report</h1>
          <p className="text-muted-foreground mt-1">
            Per-brand coverage of SVG + PNG variants (color / black / white). PNGs are rasterized
            from the SVG source at 2048px wide with transparent backgrounds.
          </p>
        </div>
        <Button onClick={downloadCsv} variant="outline" size="sm" disabled={!report.length}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Brands</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.missingAnyPng}</div>
          <div className="text-sm text-muted-foreground">Missing ≥1 PNG variant</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.counts['black-png']}/{stats.total}</div>
          <div className="text-sm text-muted-foreground">Black PNG present</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.counts['white-png']}/{stats.total}</div>
          <div className="text-sm text-muted-foreground">White PNG present</div>
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
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="missing-png">Missing any PNG</SelectItem>
            <SelectItem value="missing-any">Missing any variant</SelectItem>
            <SelectItem value="complete">Fully complete</SelectItem>
            <SelectItem value="all">All brands</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground self-center">
          Showing {filtered.length} of {report.length}
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
                  {VARIANTS.map((v) =>
                    FORMATS.map((f) => (
                      <th key={`${v}-${f}`} className="px-3 py-3 font-medium text-center capitalize">
                        {v}
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{f}</div>
                      </th>
                    )),
                  )}
                  <th className="px-3 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    {VARIANTS.map((v) =>
                      FORMATS.map((f) => {
                        const cell = r.cells[`${v}-${f}`];
                        return (
                          <td key={`${v}-${f}`} className="px-3 py-2 text-center">
                            {cell.present ? (
                              cell.url ? (
                                <a
                                  href={cell.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open file"
                                  className="inline-flex"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </a>
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                              )
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive inline" />
                            )}
                          </td>
                        );
                      }),
                    )}
                    <td className="px-3 py-2 text-center">
                      {r.missingCount === 0 ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{r.missingCount} missing</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
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
