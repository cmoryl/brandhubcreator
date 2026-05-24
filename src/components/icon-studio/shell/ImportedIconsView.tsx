/**
 * ImportedIconsView — browse, search, filter, and download icons from the
 * project's bundled SVG library (public/icon-library). Auto-categorized by
 * filename keywords with a Light Blue / White color-variant toggle.
 */
import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Copy, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface IconEntry {
  id: string;
  slug: string;
  name: string;
  variant: 'light-blue' | 'white';
  category: string;
  path: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  medical: 'Medical',
  general: 'General',
  uncategorized: 'Uncategorized',
};

export const ImportedIconsView = () => {
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [variant, setVariant] = useState<'light-blue' | 'white'>('light-blue');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    fetch('/icon-library/manifest.json')
      .then((r) => r.json())
      .then((data: IconEntry[]) => setIcons(data))
      .catch(() => toast.error('Failed to load icon library'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    icons.forEach((i) => set.add(i.category));
    return ['all', ...Array.from(set).sort()];
  }, [icons]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: 0 };
    icons.forEach((i) => {
      if (i.variant !== variant) return;
      out.all = (out.all || 0) + 1;
      out[i.category] = (out[i.category] || 0) + 1;
    });
    return out;
  }, [icons, variant]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return icons.filter((i) => {
      if (i.variant !== variant) return false;
      if (category !== 'all' && i.category !== category) return false;
      if (!term) return true;
      return i.name.toLowerCase().includes(term) || i.slug.includes(term);
    });
  }, [icons, q, category, variant]);

  const downloadIcon = async (icon: IconEntry) => {
    const a = document.createElement('a');
    a.href = icon.path;
    a.download = `${icon.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyMarkup = async (icon: IconEntry) => {
    try {
      const txt = await fetch(icon.path).then((r) => r.text());
      await navigator.clipboard.writeText(txt);
      toast.success('SVG markup copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 0% 0%, hsl(var(--tp-light-blue) / 0.18), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Imported asset library</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Imported Icons</h1>
            <p className="text-sm text-muted-foreground">
              Curated SVG library bundled with the project — searchable, downloadable,
              copy-as-markup ready.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {icons.length} assets
          </Badge>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Variant toggle */}
        <div className="flex items-center gap-1.5 rounded-md border p-1" style={{ borderColor: 'hsl(var(--border))' }}>
          {(['light-blue','white'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={variant === v ? 'default' : 'ghost'}
              className="h-7"
              onClick={() => setVariant(v)}
            >
              {v === 'light-blue' ? 'Light Blue' : 'White'}
            </Button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c] ?? c} {counts[c] ? `${counts[c]}` : ''}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="tp-card flex flex-col items-center justify-center py-16 text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="tp-card flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'hsl(var(--tp-light-blue) / 0.12)', color: 'hsl(var(--tp-light-blue))' }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No icons match</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different search, category, or color variant.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {filtered.map((icon) => (
            <div
              key={icon.id}
              className="tp-card group relative flex flex-col items-center gap-2 p-3 transition-all hover:shadow-md"
            >
              <div
                className="flex aspect-square w-full items-center justify-center rounded-md"
                style={{
                  background:
                    variant === 'white'
                      ? 'hsl(var(--tp-digital-blue) / 0.85)'
                      : 'hsl(var(--tp-surface-2))',
                }}
              >
                <img
                  src={icon.path}
                  alt={icon.name}
                  loading="lazy"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="w-full truncate text-center text-[10px] text-muted-foreground" title={icon.name}>
                {icon.name}
              </div>
              <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  onClick={() => copyMarkup(icon)}
                  title="Copy SVG markup"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  onClick={() => downloadIcon(icon)}
                  title="Download SVG"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
