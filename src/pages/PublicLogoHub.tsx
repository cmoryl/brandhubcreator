import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeSvgContrast, type SvgContrastResult } from '@/lib/svgContrast';

// Hook: analyze an SVG URL and return whether it appears to be light artwork
// on a transparent background. Returns null until detection resolves, and null
// for non-SVG files. Results are cached globally by URL.
function useSvgContrast(url: string | undefined, format: string | undefined) {
  const [result, setResult] = useState<SvgContrastResult | null>(null);
  const lastUrl = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!url || format !== 'svg') {
      setResult(null);
      lastUrl.current = undefined;
      return;
    }
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    let cancelled = false;
    analyzeSvgContrast(url).then((r) => {
      if (!cancelled && lastUrl.current === url) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [url, format]);
  return result;
}


const setMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};
import { Search, Filter, Globe2, Loader2, Download, X, ZoomIn, Package, Trash2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';
import { AddLogoDialog } from '@/components/logohub/AddLogoDialog';
import { downloadManyLogosZip } from '@/lib/downloadLogoZip';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo';

const extFromUrl = (url: string, fallback?: string) => {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.([a-z0-9]+)$/i);
    if (m) return m[1].toLowerCase();
  } catch { /* noop */ }
  return (fallback || 'png').toLowerCase();
};

async function downloadFilesAsZip(brandName: string, files: ClientLogoFile[]) {
  if (!files.length) {
    toast.error('No files to download');
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder(slugify(brandName))!;
  const used = new Set<string>();
  toast.loading(`Packaging ${files.length} files…`, { id: 'zip' });
  try {
    const results = await Promise.all(
      files.map(async (f) => {
        try {
          const res = await fetch(f.url, { mode: 'cors' });
          if (!res.ok) throw new Error(String(res.status));
          return { f, blob: await res.blob() };
        } catch {
          return { f, blob: null as Blob | null };
        }
      }),
    );
    let ok = 0;
    for (const { f, blob } of results) {
      if (!blob) continue;
      const lk = (f.lockup || 'icon');
      const ext = extFromUrl(f.url, f.format);
      let base = `${slugify(brandName)}-${lk}-${f.variant}.${ext}`;
      let i = 2;
      while (used.has(base)) {
        base = `${slugify(brandName)}-${lk}-${f.variant}-${i}.${ext}`;
        i++;
      }
      used.add(base);
      folder.file(base, blob);
      ok++;
    }
    if (!ok) {
      toast.error('Could not download any files (CORS)', { id: 'zip' });
      return;
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(brandName)}-logos.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${ok} file${ok === 1 ? '' : 's'}`, { id: 'zip' });
  } catch (e) {
    toast.error('Failed to build ZIP', { id: 'zip' });
  }
}

interface GlobalLogoRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  website_url: string | null;
  files: ClientLogoFile[];
  updated_at: string | null;
}

const ASSET_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const formatAssetDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return ASSET_DATE_FMT.format(d);
};

type VariantFilter = ClientLogoVariant | 'all';
type LockupFilter = ClientLogoLockup | 'all';

const getPreview = (
  files: ClientLogoFile[],
  variant: VariantFilter,
  lockup: LockupFilter,
): { url: string; isWhite: boolean } | null => {
  const matches = files.filter((f) => {
    const lk = (f.lockup || 'icon') as ClientLogoLockup;
    if (lockup !== 'all' && lk !== lockup) return false;
    if (variant !== 'all' && f.variant !== variant) return false;
    return true;
  });
  const order: ClientLogoVariant[] =
    variant === 'all' ? ['color', 'black', 'white'] : [variant as ClientLogoVariant];
  for (const v of order) {
    const svg = matches.find((f) => f.variant === v && f.format === 'svg');
    if (svg) return { url: svg.url, isWhite: v === 'white' };
    const png = matches.find((f) => f.variant === v && f.format === 'png');
    if (png) return { url: png.url, isWhite: v === 'white' };
  }
  if (matches[0]) return { url: matches[0].url, isWhite: matches[0].variant === 'white' };
  return null;
};

export default function PublicLogoHub() {
  const [logos, setLogos] = useState<GlobalLogoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [variant, setVariant] = useState<VariantFilter>('all');
  const [lockup, setLockup] = useState<LockupFilter>('all');
  const [preview, setPreview] = useState<{
    logo: GlobalLogoRow;
    file: ClientLogoFile;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    logoId: string;
    title: string;
    message: string;
  } | null>(null);
  const { isAdmin } = useAuth();
  const previewCloseRef = useRef<HTMLButtonElement | null>(null);
  const previewReturnFocusRef = useRef<HTMLElement | null>(null);

  // Escape-to-close, focus close button on open, restore focus on close,
  // and lock body scroll while the custom preview modal is open.
  useEffect(() => {
    if (!preview) return;
    previewReturnFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPreview(null);
      }
    };
    document.addEventListener('keydown', onKey);
    // Defer focus until the dialog is mounted.
    const t = window.setTimeout(() => previewCloseRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      previewReturnFocusRef.current?.focus?.();
    };
  }, [preview]);

  const handleDeleteLogo = async (logo: GlobalLogoRow) => {
    setDeletingId(logo.id);
    setDeleteError(null);
    try {
      const { error } = await supabase
        .from('global_client_logos')
        .delete()
        .eq('id', logo.id);
      if (error) {
        const detail = [error.code && `Code: ${error.code}`, error.hint, error.details]
          .filter(Boolean)
          .join(' | ');
        throw new Error(detail || error.message);
      }
      setLogos((prev) => prev.filter((l) => l.id !== logo.id));
      setDeleteDialogOpenId(null);
      setDeleteError(null);
      toast.success(`Deleted ${logo.name}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete logo';
      setDeleteError({ logoId: logo.id, title: `Could not delete ${logo.name}`, message: msg });
    } finally {
      setDeletingId(null);
    }
  };


  const loadLogos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_client_logos')
      .select('id, name, description, category, website_url, files, updated_at')
      .order('category')
      .order('name')
      .limit(2000);
    if (!error) {
      setLogos(
        (data || []).map((d) => ({
          ...d,
          files: (Array.isArray(d.files) ? d.files : []) as unknown as ClientLogoFile[],
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogos();
  }, []);

  useEffect(() => {
    document.title = 'Global Logo Hub — Browse Brand & Partner Logos';
    setMeta(
      'description',
      'Public directory of brand, partner and client logos with color, black, white, icon and wordmark variants.',
    );
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(logos.map((l) => l.category))).sort(),
    [logos],
  );

  const filtered = useMemo(
    () =>
      logos.filter((l) => {
        const matchesSearch =
          !search ||
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || l.category === category;
        const hasPreview = !!getPreview(l.files, variant, lockup);
        return matchesSearch && matchesCategory && hasPreview;
      }),
    [logos, search, category, variant, lockup],
  );

  return (
    <div className="min-h-dvh bg-background">

      {/* Hero */}
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe2 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
              Public Library
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
                Global Logo Hub
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
                Browse every brand, partner and client logo in the library — with color, black, white,
                icon and full logo variants.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <AddLogoDialog categories={categories} onAdded={loadLogos} />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  downloadManyLogosZip(
                    filtered.map((l) => ({ name: l.name, files: l.files })),
                    `global-logo-hub-${new Date().toISOString().slice(0, 10)}.zip`,
                  )
                }
                disabled={filtered.length === 0}
                aria-label="Download all logos as ZIP"
              >
                <Package className="h-4 w-4" />
                Download all ({filtered.length})
              </Button>
              <a
                href="/logohub/audit"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:border-primary/50 hover:bg-accent transition-colors"
              >
                View full audit →
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{logos.length}</span> brands
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              <span className="font-semibold text-foreground">
                {logos.reduce((sum, l) => sum + l.files.length, 0)}
              </span>{' '}
              files
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              <span className="font-semibold text-foreground">{categories.length}</span> categories
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-2 sm:py-4 space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="flex gap-2 md:flex-1 md:min-w-[220px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Filter by category" className="w-[130px] sm:w-[180px] shrink-0">
                <Filter className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
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
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 md:overflow-visible">
            <Tabs value={lockup} onValueChange={(v) => setLockup(v as LockupFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="icon">Icon</TabsTrigger>
                <TabsTrigger value="wordmark">Logo</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={variant} onValueChange={(v) => setVariant(v as VariantFilter)}>
              <TabsList>
                <TabsTrigger value="all">All colors</TabsTrigger>
                <TabsTrigger value="color">Color</TabsTrigger>
                <TabsTrigger value="black">Black</TabsTrigger>
                <TabsTrigger value="white">White</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section aria-label="Logos" className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-medium">No logos found</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filtered.map((logo) => {
              const lockups: ClientLogoLockup[] =
                lockup === 'all' ? ['icon', 'wordmark'] : [lockup as ClientLogoLockup];
              const variants: ClientLogoVariant[] =
                variant === 'all'
                  ? ['color', 'black', 'white']
                  : [variant as ClientLogoVariant];

              const cells = lockups.flatMap((lk) =>
                variants.map((v) => {
                  const inLockup = logo.files.filter(
                    (f) => (f.lockup || 'icon') === lk,
                  );
                  const exactSvg = inLockup.find(
                    (f) => f.variant === v && f.format === 'svg',
                  );
                  const exactPng = inLockup.find(
                    (f) => f.variant === v && f.format === 'png',
                  );
                  const exactAny = inLockup.find((f) => f.variant === v);
                  const file = exactSvg || exactPng || exactAny;
                  const display = file;
                  const tint: 'none' | 'black' | 'white' = 'none';
                  return { lockup: lk, variant: v, file, display, tint };
                }),
              );


              return (
                <article
                  key={logo.id}
                  className="group border border-border rounded-xl overflow-hidden bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="p-4 border-b border-border flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold truncate" title={logo.name}>
                        {logo.name}
                      </h2>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {logo.category} • {logo.files.length} files
                      </p>
                      {formatAssetDate(logo.updated_at) && (
                        <p
                          className="text-[10px] text-muted-foreground/80 truncate mt-0.5"
                          title={`Assets last updated ${formatAssetDate(logo.updated_at)}`}
                        >
                          Updated {formatAssetDate(logo.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'grid gap-px bg-border',
                      lockups.length === 1 || variants.length === 1
                        ? `grid-cols-${Math.max(lockups.length, variants.length)}`
                        : 'grid-cols-3',
                    )}
                  >
                    {cells.map(({ lockup: lk, variant: v, file, display, tint }) => (
                      <LogoCell
                        key={`${lk}-${v}`}
                        brandName={logo.name}
                        lockup={lk}
                        variant={v}
                        file={file}
                        displayFile={display}
                        tint={tint}
                        onOpen={() => file && setPreview({ logo, file })}
                      />
                    ))}

                  </div>
                  <div className="p-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="min-h-11 sm:min-h-9 text-xs px-3 flex-1 sm:flex-none"
                      onClick={() => downloadFilesAsZip(logo.name, logo.files)}
                    >
                      <Package className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Download all ({logo.files.length})
                    </Button>
                    {isAdmin && (
                      <AlertDialog
                        open={deleteDialogOpenId === logo.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDeleteDialogOpenId(null);
                            setDeleteError((prev) =>
                              prev?.logoId === logo.id ? null : prev,
                            );
                          } else {
                            setDeleteDialogOpenId(logo.id);
                            setDeleteError((prev) =>
                              prev?.logoId === logo.id ? null : prev,
                            );
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                            disabled={deletingId === logo.id}
                            aria-label={`Delete ${logo.name}`}
                            onClick={() => {
                              setDeleteDialogOpenId(logo.id);
                              setDeleteError((prev) =>
                                prev?.logoId === logo.id ? null : prev,
                              );
                            }}
                          >
                            {deletingId === logo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {logo.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the brand entry and unlinks its{' '}
                              {logo.files.length} file{logo.files.length === 1 ? '' : 's'} from the
                              hub. The underlying files in storage are not deleted and can be
                              cleaned up from the audit page if orphaned.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          {deleteError?.logoId === logo.id && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                  <p className="font-medium">{deleteError.title}</p>
                                  <p className="text-destructive/80 text-xs">{deleteError.message}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                setDeleteDialogOpenId(null);
                                setDeleteError((prev) =>
                                  prev?.logoId === logo.id ? null : prev,
                                );
                              }}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteLogo(logo)}
                              disabled={deletingId === logo.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === logo.id && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>


                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
          <div
            className="relative bg-background rounded-t-2xl sm:rounded-xl shadow-2xl max-w-3xl w-full max-h-[92dvh] sm:max-h-[95vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              (e.currentTarget as any)._touchY = e.touches[0].clientY;
              (e.currentTarget as any)._scrollTop = e.currentTarget.scrollTop;
            }}
            onTouchEnd={(e) => {
              const startY = (e.currentTarget as any)._touchY ?? 0;
              const startScroll = (e.currentTarget as any)._scrollTop ?? 0;
              const dy = e.changedTouches[0].clientY - startY;
              // Swipe down from top edge to dismiss (mobile only).
              if (startScroll <= 0 && dy > 90) setPreview(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logo-preview-title"
          >
            {/* Mobile grab handle */}
            <div
              className="sm:hidden sticky top-0 z-10 flex justify-center pt-2 pb-1 bg-background"
              aria-hidden="true"
            >
              <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <PreviewStage logo={preview.logo} file={preview.file} />

            <div className="p-4 sm:p-6 space-y-4">
              <h2 id="logo-preview-title" className="text-lg font-semibold pr-12">{preview.logo.name}</h2>
              {(() => {
                const files = preview.logo.files;
                const currentLockup = (preview.file.lockup || 'icon') as ClientLogoLockup;
                const currentVariant = preview.file.variant as ClientLogoVariant;
                const currentFormat = preview.file.format;

                const switchTo = (next: Partial<{ lockup: ClientLogoLockup; variant: ClientLogoVariant; format: string }>) => {
                  const lk = next.lockup ?? currentLockup;
                  const vr = next.variant ?? currentVariant;
                  const fmt = next.format ?? currentFormat;
                  const exact = files.find(
                    (f) => (f.lockup || 'icon') === lk && f.variant === vr && f.format === fmt,
                  );
                  if (exact) return setPreview({ logo: preview.logo, file: exact });
                  const anyFmt = files.find(
                    (f) => (f.lockup || 'icon') === lk && f.variant === vr,
                  );
                  if (anyFmt) return setPreview({ logo: preview.logo, file: anyFmt });
                };

                const has = (opts: Partial<{ lockup: ClientLogoLockup; variant: ClientLogoVariant; format: string }>) =>
                  files.some(
                    (f) =>
                      (opts.lockup === undefined || (f.lockup || 'icon') === opts.lockup) &&
                      (opts.variant === undefined || f.variant === opts.variant) &&
                      (opts.format === undefined || f.format === opts.format),
                  );

                const formatsAvailable = Array.from(
                  new Set(
                    files
                      .filter(
                        (f) =>
                          (f.lockup || 'icon') === currentLockup && f.variant === currentVariant,
                      )
                      .map((f) => f.format),
                  ),
                );

                const Chip = ({
                  active,
                  disabled,
                  onClick,
                  children,
                }: {
                  active: boolean;
                  disabled?: boolean;
                  onClick: () => void;
                  children: React.ReactNode;
                }) => (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onClick}
                    className={cn(
                      'min-h-11 sm:min-h-9 px-4 sm:px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary/50',
                      disabled && 'opacity-40 cursor-not-allowed hover:border-border',
                    )}
                  >
                    {children}
                  </button>
                );

                return (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Lockup</p>
                      <div className="flex flex-wrap gap-2">
                        {(['icon', 'wordmark'] as ClientLogoLockup[]).map((lk) => (
                          <Chip
                            key={lk}
                            active={currentLockup === lk}
                            disabled={!has({ lockup: lk })}
                            onClick={() => switchTo({ lockup: lk })}
                          >
                            {lk === 'icon' ? 'Icon' : 'Wordmark'}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {(['color', 'black', 'white'] as ClientLogoVariant[]).map((v) => (
                          <Chip
                            key={v}
                            active={currentVariant === v}
                            disabled={!has({ lockup: currentLockup, variant: v })}
                            onClick={() => switchTo({ variant: v })}
                          >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Format</p>
                      <div className="flex flex-wrap gap-2">
                        {(['png', 'svg'] as const).map((fmt) => (
                          <Chip
                            key={fmt}
                            active={currentFormat === fmt}
                            disabled={!formatsAvailable.includes(fmt)}
                            onClick={() => switchTo({ format: fmt })}
                          >
                            {fmt.toUpperCase()}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-2 sm:flex-wrap">
                      <Button asChild size="sm" className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
                        <a
                          href={preview.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download selected
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => downloadFilesAsZip(preview.logo.name, preview.logo.files)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Download all ({preview.logo.files.length}) as ZIP
                      </Button>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {currentLockup === 'icon' ? 'Icon' : 'Wordmark'} · {currentVariant.charAt(0).toUpperCase() + currentVariant.slice(1)} · {currentFormat.toUpperCase()}
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setPreview(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    </div>

                  </div>
                );
              })()}
            </div>
            <button
              type="button"
              ref={previewCloseRef}
              onClick={() => setPreview(null)}
              aria-label="Close preview"
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-md bg-black/30 text-white hover:bg-black/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cell + preview stage with automatic light-on-transparent SVG detection.

function useAutoDarkBg(file: ClientLogoFile | undefined, variant: ClientLogoVariant) {
  const contrast = useSvgContrast(file?.url, file?.format);
  const isStrokeOnly = !!contrast?.isStrokeOnly;
  const hasForcedStrokeOutline = !!contrast?.hasForcedStrokeOutline;
  const hasTextNodes = !!contrast?.hasTextNodes;
  const usesCurrentColor = !!contrast?.usesCurrentColor;
  // Explicit "white" variants always use a dark canvas.
  const base = {
    isStrokeOnly,
    hasForcedStrokeOutline,
    hasTextNodes,
    usesCurrentColor,
    safePreviewUrl: contrast?.safePreviewUrl,
  };
  if (variant === 'white') return { dark: true, auto: false, ...base };
  if (contrast?.isLightOnTransparent) return { dark: true, auto: true, ...base };
  return { dark: false, auto: false, ...base };
}

function LogoCell({
  brandName,
  lockup,
  variant,
  file,
  displayFile,
  tint = 'none',
  onOpen,
}: {
  brandName: string;
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  file: ClientLogoFile | undefined;
  displayFile?: ClientLogoFile | undefined;
  tint?: 'none' | 'black' | 'white';
  onOpen: () => void;
}) {
  // Use displayFile for rendering only; `file` remains the canonical asset
  // (the one that gets downloaded / previewed). This lets us swap to a
  // color PNG with a CSS tint when the exact variant SVG renders badly.
  const shown = displayFile ?? file;
  const {
    dark,
    isStrokeOnly,
    hasForcedStrokeOutline,
    hasTextNodes,
    usesCurrentColor,
    safePreviewUrl,
  } = useAutoDarkBg(file, variant);
  const isDisplayFallback = !!displayFile && displayFile.url !== file?.url;
  const shownUrl = shown
    ? (!isDisplayFallback && shown.format === 'svg' && safePreviewUrl ? safePreviewUrl : shown.url)
    : undefined;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!file}
      aria-label={
        file
          ? `Preview ${brandName} ${lockup === 'icon' ? 'icon' : 'wordmark'} ${variant}`
          : `${brandName} ${lockup === 'icon' ? 'icon' : 'wordmark'} ${variant} not available`
      }
      className={cn(
        'relative aspect-square flex items-center justify-center p-4 text-left transition-opacity',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:z-10',
        dark ? 'bg-neutral-900' : 'bg-white',
        file ? 'hover:opacity-90 cursor-pointer' : 'cursor-default',
      )}
      title={`${lockup} • ${variant}`}
    >
      {shownUrl ? (
        <>
          <img
            src={shownUrl}
            alt={`${brandName} ${lockup} ${variant}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="w-full h-full object-contain select-none pointer-events-none"
            style={
              tint === 'black'
                ? { filter: 'brightness(0) saturate(100%)' }
                : tint === 'white'
                  ? { filter: 'brightness(0) saturate(100%) invert(1)' }
                  : undefined
            }
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none">
            <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" />
          </div>
        </>
      ) : (
        <span
          className={cn(
            'text-[10px]',
            dark ? 'text-neutral-600' : 'text-neutral-300',
          )}
        >
          —
        </span>
      )}
      <span
        className={cn(
          'absolute bottom-1 left-1 text-[8px] uppercase tracking-wider px-1 rounded',
          dark ? 'bg-black/70 text-white' : 'bg-white/90 text-black',
        )}
      >
        {lockup === 'icon' ? 'Icon' : 'Logo'} · {variant}
      </span>
      {file && isStrokeOnly && (
        <span
          title="Source artwork is a stroke-only outline — this is how the file is drawn, not a rendering issue."
          className={cn(
            'absolute top-1 right-1 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
            dark
              ? 'bg-amber-400/15 text-amber-200 border-amber-300/30'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}
        >
          Outline
        </span>
      )}
      {file && !isStrokeOnly && hasForcedStrokeOutline && (
        <span
          title="Preview fixed: this SVG had forced stroke paint that made filled artwork look thick and outlined. Downloads keep the original file."
          className={cn(
            'absolute top-1 right-1 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
            dark
              ? 'bg-primary/20 text-primary-foreground border-primary/40'
              : 'bg-primary/10 text-primary border-primary/30',
          )}
        >
          Cleaned
        </span>
      )}
      {file && !isStrokeOnly && !hasForcedStrokeOutline && (hasTextNodes || usesCurrentColor) && (
        <span
          title={hasTextNodes ? 'This SVG contains live text and may render differently if its font is unavailable.' : 'This SVG uses currentColor and can inherit an unintended color.'}
          className={cn(
            'absolute top-1 right-1 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
            dark
              ? 'bg-amber-400/15 text-amber-200 border-amber-300/30'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}
        >
          SVG issue
        </span>
      )}
    </button>
  );
}

function PreviewStage({
  logo,
  file,
}: {
  logo: { name: string };
  file: ClientLogoFile;
}) {
  const {
    dark,
    auto,
    isStrokeOnly,
    hasForcedStrokeOutline,
    hasTextNodes,
    usesCurrentColor,
    safePreviewUrl,
  } = useAutoDarkBg(file, file.variant as ClientLogoVariant);
  const previewUrl = file.format === 'svg' && safePreviewUrl ? safePreviewUrl : file.url;
  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center justify-center p-4 sm:p-8 min-h-[180px] sm:min-h-[320px]',
          dark ? 'bg-neutral-900' : 'bg-white',
        )}
      >
        <img
          src={previewUrl}
          alt={`${logo.name} preview`}
          decoding="async"
          draggable={false}
          className="max-h-[240px] sm:max-h-[400px] w-full object-contain select-none"
        />
      </div>
      <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
        {auto && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 backdrop-blur-sm">
            Auto-contrast: dark background applied for light artwork
          </span>
        )}
        {isStrokeOnly && (
          <span
            title="The source SVG is drawn with strokes and no fills, so it renders as an outline at every size."
            className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-100 border border-amber-400/30 backdrop-blur-sm"
          >
            Outline artwork · source is stroke-only
          </span>
        )}
        {!isStrokeOnly && hasForcedStrokeOutline && (
          <span
            title="The preview removes forced SVG stroke paint that was making the logo look thick and outlined. The downloaded SVG remains unchanged."
            className="text-[10px] px-2 py-1 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 backdrop-blur-sm"
          >
            Clean preview · forced outline removed
          </span>
        )}
        {!isStrokeOnly && !hasForcedStrokeOutline && (hasTextNodes || usesCurrentColor) && (
          <span
            title={hasTextNodes ? 'This source SVG contains live text and depends on external fonts.' : 'This source SVG uses currentColor and may inherit an unintended color.'}
            className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-100 border border-amber-400/30 backdrop-blur-sm"
          >
            SVG source issue detected
          </span>
        )}
      </div>
    </div>
  );
}

