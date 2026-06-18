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
import { Search, Filter, Globe2, Loader2, Download, X, ZoomIn, Package } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';

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
}

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
    const png = matches.find((f) => f.variant === v && f.format === 'png');
    if (png) return { url: png.url, isWhite: v === 'white' };
    const svg = matches.find((f) => f.variant === v && f.format === 'svg');
    if (svg) return { url: svg.url, isWhite: v === 'white' };
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, description, category, website_url, files')
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
    })();
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
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe2 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
              Public Library
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Global Logo Hub
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Browse every brand, partner and client logo in the library — with color, black, white,
            icon and full logo variants.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{logos.length}</span> brands
            </span>
            <span>•</span>
            <span>
              <span className="font-semibold text-foreground">
                {logos.reduce((sum, l) => sum + l.files.length, 0)}
              </span>{' '}
              files
            </span>
            <span>•</span>
            <span>
              <span className="font-semibold text-foreground">{categories.length}</span> categories
            </span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
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
      </section>

      {/* Grid */}
      <main className="container mx-auto max-w-7xl px-6 py-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((logo) => {
              const lockups: ClientLogoLockup[] =
                lockup === 'all' ? ['icon', 'wordmark'] : [lockup as ClientLogoLockup];
              const variants: ClientLogoVariant[] =
                variant === 'all'
                  ? ['color', 'black', 'white']
                  : [variant as ClientLogoVariant];

              const cells = lockups.flatMap((lk) =>
                variants.map((v) => {
                  const match =
                    logo.files.find(
                      (f) =>
                        (f.lockup || 'icon') === lk &&
                        f.variant === v &&
                        f.format === 'png',
                    ) ||
                    logo.files.find(
                      (f) =>
                        (f.lockup || 'icon') === lk &&
                        f.variant === v &&
                        f.format === 'svg',
                    ) ||
                    logo.files.find(
                      (f) => (f.lockup || 'icon') === lk && f.variant === v,
                    );
                  return { lockup: lk, variant: v, file: match };
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
                    {cells.map(({ lockup: lk, variant: v, file }) => (
                      <LogoCell
                        key={`${lk}-${v}`}
                        brandName={logo.name}
                        lockup={lk}
                        variant={v}
                        file={file}
                        onOpen={() => file && setPreview({ logo, file })}
                      />
                    ))}

                  </div>
                  <div className="p-3 flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-[10px] px-2"
                      onClick={() => downloadFilesAsZip(logo.name, logo.files)}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Download all ({logo.files.length})
                    </Button>
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative bg-background rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PreviewStage logo={preview.logo} file={preview.file} />

            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{preview.logo.name}</h2>
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
                      'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
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
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <Button asChild size="sm" className="flex-1 min-w-[160px]">
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
                        onClick={() => downloadFilesAsZip(preview.logo.name, preview.logo.files)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Download all ({preview.logo.files.length}) as ZIP
                      </Button>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {currentLockup === 'icon' ? 'Icon' : 'Wordmark'} · {currentVariant.charAt(0).toUpperCase() + currentVariant.slice(1)} · {currentFormat.toUpperCase()}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    </div>

                  </div>
                );
              })()}
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute right-3 top-3 rounded-sm p-1 bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <X className="h-4 w-4" />
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
  // Explicit "white" variants always use a dark canvas.
  if (variant === 'white') return { dark: true, auto: false, isStrokeOnly };
  if (contrast?.isLightOnTransparent) return { dark: true, auto: true, isStrokeOnly };
  return { dark: false, auto: false, isStrokeOnly };
}

function LogoCell({
  brandName,
  lockup,
  variant,
  file,
  onOpen,
}: {
  brandName: string;
  lockup: ClientLogoLockup;
  variant: ClientLogoVariant;
  file: ClientLogoFile | undefined;
  onOpen: () => void;
}) {
  const { dark, isStrokeOnly } = useAutoDarkBg(file, variant);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative aspect-square flex items-center justify-center p-4 text-left transition-opacity',
        dark ? 'bg-neutral-900' : 'bg-white',
        file ? 'hover:opacity-90 cursor-pointer' : 'cursor-default',
      )}
      title={`${lockup} • ${variant}`}
    >
      {file ? (
        <>
          <img
            src={file.url}
            alt={`${brandName} ${lockup} ${variant}`}
            loading="lazy"
            className="w-full h-full object-contain"
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
          dark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/50',
        )}
      >
        {lockup === 'icon' ? 'Icon' : 'Logo'} · {variant}
      </span>
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
  const { dark, auto } = useAutoDarkBg(file, file.variant as ClientLogoVariant);
  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center justify-center p-8 min-h-[320px]',
          dark ? 'bg-neutral-900' : 'bg-white',
        )}
      >
        <img
          src={file.url}
          alt={`${logo.name} preview`}
          className="h-[400px] w-full object-contain"
        />
      </div>
      {auto && (
        <div className="absolute left-3 bottom-3 text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 backdrop-blur-sm">
          Auto-contrast: dark background applied for light artwork
        </div>
      )}
    </div>
  );
}

