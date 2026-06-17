import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Globe2, Loader2, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';

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
      <Helmet>
        <title>Global Logo Hub — Browse Brand & Partner Logos</title>
        <meta
          name="description"
          content="Public directory of brand, partner and client logos with color, black and white variants."
        />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

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
            icon and full wordmark variants.
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
              <TabsTrigger value="wordmark">Wordmark</TabsTrigger>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((logo) => {
              const preview = getPreview(logo.files, variant, lockup)!;
              const primaryFile =
                logo.files.find(
                  (f) =>
                    f.url === preview.url ||
                    (variant !== 'all' && f.variant === variant && f.format === 'svg'),
                ) || logo.files[0];
              return (
                <article
                  key={logo.id}
                  className="group border border-border rounded-xl overflow-hidden bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div
                    className={cn(
                      'aspect-square flex items-center justify-center p-6',
                      preview.isWhite ? 'bg-neutral-900' : 'bg-white',
                    )}
                  >
                    <img
                      src={preview.url}
                      alt={`${logo.name} logo`}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-3 border-t border-border space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-semibold truncate" title={logo.name}>
                        {logo.name}
                      </h2>
                      {logo.website_url && (
                        <a
                          href={logo.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary shrink-0"
                          aria-label={`Visit ${logo.name} website`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="truncate">{logo.category}</span>
                      <span>{logo.files.length} files</span>
                    </div>
                    {primaryFile && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[11px]"
                      >
                        <a href={primaryFile.url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
