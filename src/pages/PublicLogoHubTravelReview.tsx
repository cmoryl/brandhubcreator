import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
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

const VARIANTS: ClientLogoVariant[] = ['color', 'black', 'white'];
const LOCKUPS: ClientLogoLockup[] = ['wordmark', 'icon'];

interface Row {
  id: string;
  name: string;
  website_url: string | null;
  files: ClientLogoFile[];
}

function find(files: ClientLogoFile[], lockup: ClientLogoLockup, variant: ClientLogoVariant) {
  // Prefer SVG over PNG for preview clarity
  const matches = files.filter(
    (f) => f.variant === variant && (f.lockup === lockup || (!f.lockup && lockup === 'wordmark')),
  );
  return matches.find((f) => f.format === 'svg') ?? matches.find((f) => f.format === 'png') ?? matches[0];
}

function variantCount(files: ClientLogoFile[], lockup: ClientLogoLockup) {
  return VARIANTS.reduce((acc, v) => (find(files, lockup, v) ? acc + 1 : acc), 0);
}

type Filter = 'all' | 'incomplete' | 'missing-icon' | 'missing-wordmark' | 'empty';

function CellPreview({
  file,
  bg,
}: {
  file: ClientLogoFile | undefined;
  bg: 'light' | 'dark';
}) {
  if (!file) {
    return (
      <div className="flex h-20 items-center justify-center rounded border border-dashed border-destructive/40 bg-destructive/5 text-[10px] text-destructive">
        <XCircle className="mr-1 h-3 w-3" /> missing
      </div>
    );
  }
  return (
    <div
      className={`flex h-20 items-center justify-center rounded border p-2 ${
        bg === 'dark' ? 'bg-foreground' : 'bg-background'
      }`}
    >
      <img
        src={file.url}
        alt=""
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export default function PublicLogoHubTravelReview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_client_logos')
      .select('id, name, website_url, files')
      .eq('category', 'Travel')
      .order('name');
    if (error) {
      toast.error(error.message);
    } else {
      setRows(
        (data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      const ic = variantCount(r.files, 'icon');
      const wm = variantCount(r.files, 'wordmark');
      if (filter === 'empty') return ic + wm === 0;
      if (filter === 'missing-icon') return ic === 0;
      if (filter === 'missing-wordmark') return wm === 0;
      if (filter === 'incomplete') return ic < 3 || wm < 3;
      return true;
    });
  }, [rows, search, filter]);

  const stats = useMemo(() => {
    let full = 0;
    let partial = 0;
    let empty = 0;
    rows.forEach((r) => {
      const total = variantCount(r.files, 'icon') + variantCount(r.files, 'wordmark');
      if (total === 0) empty++;
      else if (total === 6) full++;
      else partial++;
    });
    return { total: rows.length, full, partial, empty };
  }, [rows]);

  const handleUploaded = (id: string, nextFiles: ClientLogoFile[]) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, files: nextFiles } : r)));
  };

  const handleDeepFetch = async (row: Row) => {
    if (!row.website_url) {
      toast.error('No website URL on this brand');
      return;
    }
    setBusy(row.id);
    const t = toast.loading(`Deep-fetching icon for ${row.name}…`);
    try {
      const { data, error } = await supabase.functions.invoke('deep-icon-fetch', {
        body: { website_url: row.website_url, logo_id: row.id, name: row.name, commit: true },
      });
      if (error) throw error;
      const r = data as {
        ok: boolean;
        total?: number;
        commit?: { ok?: boolean; files?: ClientLogoFile[]; error?: string };
        error?: string;
      };
      if (!r.ok) throw new Error(r.error || 'fetch failed');
      if (!r.total) toast.error('No candidate icons discovered', { id: t });
      else if (r.commit?.ok) {
        toast.success(`Saved icon (${r.total} candidates)`, { id: t });
        await load();
      } else toast.error(r.commit?.error || `Found ${r.total} candidates but failed to save`, { id: t });
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    } finally {
      setBusy(null);
    }
  };

  const handleDeriveMono = async (row: Row, lockup: ClientLogoLockup) => {
    setBusy(row.id);
    const t = toast.loading(`Deriving B/W ${lockup} for ${row.name}…`);
    try {
      const { data, error } = await supabase.functions.invoke('derive-mono-icons', {
        body: { logo_id: row.id, lockup },
      });
      if (error) throw error;
      const r = data as { ok: boolean; produced?: ClientLogoFile[]; files?: ClientLogoFile[]; error?: string };
      if (!r.ok) throw new Error(r.error || 'derive failed');
      toast.success(`Derived ${r.produced?.length ?? 0} variants`, { id: t });
      if (r.files) handleUploaded(row.id, r.files);
      else await load();
    } catch (e) {
      toast.error((e as Error).message, { id: t });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/logohub">
            <ArrowLeft className="h-4 w-4" /> Back to Logo Hub
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/logohub/missing">Full missing queue</Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Travel Brand Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visual review of every Travel category brand. Inspect icon &amp; wordmark coverage across
          color, black, and white, and replace any missing or low-quality variant directly from this
          page.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Travel brands</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.full}</div>
          <div className="text-sm text-muted-foreground">Full coverage (6/6)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.partial}</div>
          <div className="text-sm text-muted-foreground">Partial</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.empty}</div>
          <div className="text-sm text-muted-foreground">Empty</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search travel brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            <SelectItem value="incomplete">Incomplete (≠6/6)</SelectItem>
            <SelectItem value="missing-icon">Missing icon entirely</SelectItem>
            <SelectItem value="missing-wordmark">Missing wordmark entirely</SelectItem>
            <SelectItem value="empty">Empty (no assets)</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto self-center text-sm text-muted-foreground">
          Showing {filtered.length} of {rows.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No travel brands match.</Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const ic = variantCount(r.files, 'icon');
            const wm = variantCount(r.files, 'wordmark');
            const total = ic + wm;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold truncate">{r.name}</h3>
                  <Badge
                    variant={total === 6 ? 'default' : total === 0 ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {total}/6 variants
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Wordmark {wm}/3
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Icon {ic}/3
                  </Badge>
                  {r.website_url && (
                    <a
                      href={r.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" /> site
                    </a>
                  )}
                  <div className="ml-auto flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      disabled={!r.website_url || busy === r.id}
                      onClick={() => handleDeepFetch(r)}
                    >
                      {busy === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Deep fetch icon
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1"
                      disabled={busy === r.id || !r.files.some((f) => f.variant === 'color')}
                      onClick={() =>
                        handleDeriveMono(
                          r,
                          r.files.some((f) => f.variant === 'color' && (f.lockup ?? 'wordmark') === 'wordmark')
                            ? 'wordmark'
                            : 'icon',
                        )
                      }
                    >
                      {busy === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Derive B/W
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/logohub/audit/${r.id}`}>Open audit</Link>
                    </Button>
                  </div>
                </div>

                {LOCKUPS.map((lockup) => (
                  <div key={lockup} className="mb-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {lockup}
                      </div>
                      <UploadLogoVersion
                        logoId={r.id}
                        logoName={r.name}
                        existingFiles={r.files}
                        defaultLockup={lockup}
                        defaultVariant="color"
                        onUploaded={(nf) => handleUploaded(r.id, nf)}
                        trigger={
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                            <Upload className="h-3 w-3" /> Replace {lockup}
                          </Button>
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {VARIANTS.map((v) => {
                        const file = find(r.files, lockup, v);
                        const bg = v === 'white' ? 'dark' : 'light';
                        return (
                          <div key={`${lockup}-${v}`} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="capitalize">{v}</span>
                              {file ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {file.format.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-destructive">missing</span>
                              )}
                            </div>
                            <CellPreview file={file} bg={bg} />
                            <UploadLogoVersion
                              logoId={r.id}
                              logoName={r.name}
                              existingFiles={r.files}
                              defaultLockup={lockup}
                              defaultVariant={v}
                              onUploaded={(nf) => handleUploaded(r.id, nf)}
                              trigger={
                                <Button size="sm" variant="outline" className="h-7 w-full gap-1 text-[11px]">
                                  <Upload className="h-3 w-3" />
                                  {file ? 'Replace' : 'Upload'}
                                </Button>
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
