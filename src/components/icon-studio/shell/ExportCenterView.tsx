/**
 * ExportCenterView — bundles, formats, and size matrix for production
 * exports. Wires to existing bulk export flows when a target set is picked.
 */

import { useMemo, useState } from 'react';
import {
  Package, Download, Image as ImageIcon, FileText, Code2, Layers,
  Smartphone, Palette, Library as LibraryIcon, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { IconLibrary } from '@/hooks/useIconLibraries';

interface Props {
  libraries: IconLibrary[];
  organizationName: string;
  onOpenLibrary?: () => void;
}

interface FormatRow {
  id: string;
  label: string;
  description: string;
  icon: typeof Package;
  enabled: boolean;
  ext: string;
}

const DEFAULT_FORMATS: FormatRow[] = [
  { id: 'svg', label: 'SVG', description: 'Raw, source SVG files', icon: ImageIcon, enabled: true, ext: '.svg' },
  { id: 'svg-opt', label: 'Optimized SVG', description: 'SVGO-cleaned, minified', icon: ImageIcon, enabled: true, ext: '.svg' },
  { id: 'png', label: 'PNG (transparent)', description: 'All sizes, transparent background', icon: ImageIcon, enabled: true, ext: '.png' },
  { id: 'webp', label: 'WebP', description: 'Smaller, transparent web format', icon: ImageIcon, enabled: false, ext: '.webp' },
  { id: 'pdf', label: 'PDF contact sheet', description: 'Searchable preview of the system', icon: FileText, enabled: true, ext: '.pdf' },
  { id: 'figma', label: 'Figma-ready SVG', description: 'Frame-named, plugin-import ready', icon: ImageIcon, enabled: false, ext: '.svg' },
  { id: 'react', label: 'React component lib', description: 'TSX icons + index export', icon: Code2, enabled: false, ext: '.tsx' },
  { id: 'vue', label: 'Vue component lib', description: 'SFCs with named exports', icon: Code2, enabled: false, ext: '.vue' },
  { id: 'sprite', label: 'CSS sprite', description: 'Single sprite + class map', icon: Layers, enabled: false, ext: '.css' },
  { id: 'iconfont', label: 'Icon font', description: 'WOFF2 + CSS class names', icon: FileText, enabled: false, ext: '.woff2' },
  { id: 'json', label: 'JSON manifest', description: 'Index, hashes, metadata', icon: FileText, enabled: true, ext: '.json' },
  { id: 'tokens', label: 'Design tokens', description: 'CSS / JSON / Tailwind', icon: Palette, enabled: false, ext: '.json' },
  { id: 'favicons', label: 'Favicons', description: 'ICO + 16/32/180/512 PNG', icon: Smartphone, enabled: false, ext: '.zip' },
  { id: 'apps', label: 'App icon package', description: 'iOS/Android/PWA/macOS/Windows', icon: Smartphone, enabled: false, ext: '.zip' },
];

const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

export const ExportCenterView = ({ libraries, organizationName, onOpenLibrary }: Props) => {
  const [formats, setFormats] = useState(DEFAULT_FORMATS);
  const [sizes, setSizes] = useState<Set<number>>(new Set([24, 48, 128, 512]));
  const [selectedSetId, setSelectedSetId] = useState<string | 'all'>('all');

  const enabledCount = formats.filter((f) => f.enabled).length;

  const targetIcons = useMemo(() => {
    if (selectedSetId === 'all') return libraries.reduce((s, l) => s + l.icons.length, 0);
    return libraries.find((l) => l.id === selectedSetId)?.icons.length ?? 0;
  }, [libraries, selectedSetId]);

  const fileEstimate = useMemo(() => {
    const pngVariants = sizes.size;
    const perIcon =
      formats.filter((f) => f.enabled && f.id === 'svg').length +
      formats.filter((f) => f.enabled && f.id === 'svg-opt').length +
      (formats.find((f) => f.id === 'png')?.enabled ? pngVariants : 0) +
      (formats.find((f) => f.id === 'webp')?.enabled ? pngVariants : 0);
    return targetIcons * Math.max(1, perIcon);
  }, [targetIcons, sizes.size, formats]);

  const toggleFormat = (id: string) =>
    setFormats((p) => p.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));

  const toggleSize = (s: number) =>
    setSizes((p) => {
      const n = new Set(p);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-orange) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span>Production exports</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Export Center</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Configure bundle formats, PNG sizes, and per-set scope — then ship a
              production-ready ZIP with brand metadata, components, and docs.
            </p>
          </div>
          <Button size="lg" className="gap-2" disabled={enabledCount === 0 || targetIcons === 0}>
            <Download className="h-4 w-4" />
            Export bundle
          </Button>
        </div>
      </header>

      {/* Summary tiles */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Icons in scope" value={targetIcons.toLocaleString()} token="--tp-digital-blue" icon={Sparkles} />
        <SummaryTile label="Formats enabled" value={enabledCount} token="--tp-pink" icon={Package} />
        <SummaryTile label="PNG sizes" value={sizes.size} token="--tp-teal" icon={ImageIcon} />
        <SummaryTile label="Files in bundle" value={fileEstimate.toLocaleString()} token="--tp-green" icon={FileText} />
      </section>

      {/* Scope selector */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Scope</h3>
            <p className="text-[11px] text-muted-foreground">
              Choose a single set or bundle everything.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onOpenLibrary}>
            <LibraryIcon className="h-3.5 w-3.5" /> Open library
          </Button>
        </header>
        <div className="flex flex-wrap gap-2">
          <ScopeChip
            label={`Entire workspace (${libraries.length})`}
            active={selectedSetId === 'all'}
            onClick={() => setSelectedSetId('all')}
          />
          {libraries.map((l) => (
            <ScopeChip
              key={l.id}
              label={`${l.name} · ${l.icons.length}`}
              active={selectedSetId === l.id}
              onClick={() => setSelectedSetId(l.id)}
            />
          ))}
          {libraries.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sets yet — generate one to enable scoped exports.
            </p>
          )}
        </div>
      </section>

      {/* Formats matrix */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Formats</h3>
            <p className="text-[11px] text-muted-foreground">
              Toggle the formats included in the bundle.
            </p>
          </div>
          <Badge variant="outline">{enabledCount} of {formats.length}</Badge>
        </header>
        <div className="grid gap-2 md:grid-cols-2">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => toggleFormat(f.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  f.enabled
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-secondary/20 hover:bg-secondary/40',
                )}
              >
                <Checkbox
                  checked={f.enabled}
                  className="mt-0.5"
                  onCheckedChange={() => toggleFormat(f.id)}
                />
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {f.label}
                    <Badge variant="secondary" className="text-[10px]">
                      {f.ext}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{f.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* PNG sizes */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">PNG / WebP sizes</h3>
            <p className="text-[11px] text-muted-foreground">
              Pick the raster sizes to render per icon.
            </p>
          </div>
          <Badge variant="outline">{sizes.size} sizes</Badge>
        </header>
        <div className="flex flex-wrap gap-1.5">
          {PNG_SIZES.map((s) => {
            const active = sizes.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors tabular-nums',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/30 hover:bg-secondary/60 border-border',
                )}
              >
                {s} px
              </button>
            );
          })}
        </div>
      </section>

      {/* Bundle tree preview */}
      <section className="tp-card p-5">
        <header className="mb-3">
          <h3 className="text-sm font-semibold">Bundle tree preview</h3>
          <p className="text-[11px] text-muted-foreground">
            Files generated under <span className="font-mono">icon-system-{(organizationName || 'org').toLowerCase().replace(/\s+/g, '-')}.zip</span>
          </p>
        </header>
        <pre className="text-[11px] leading-relaxed bg-secondary/30 rounded-md p-3 overflow-x-auto font-mono text-muted-foreground">
{`icon-system/
├── brand/
│   ├── tokens.json
│   └── manifest.json
├── svg/
│   ├── core/...
│   └── packs/...
├── png/
${Array.from(sizes).sort((a, b) => a - b).map((s) => `│   ├── ${s}/`).join('\n')}
├── react/
│   └── index.tsx
├── figma/
│   └── icons.svg
└── docs/
    └── contact-sheet.pdf`}
        </pre>
      </section>
    </div>
  );
};

const ScopeChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-secondary/30 hover:bg-secondary/60 border-border',
    )}
  >
    {label}
  </button>
);

const SummaryTile = ({
  label,
  value,
  token,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  token: string;
  icon: typeof Package;
}) => (
  <div className="tp-card p-4">
    <div className="flex items-start justify-between">
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center"
        style={{ background: `hsl(var(${token}) / 0.12)`, color: `hsl(var(${token}))` }}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
  </div>
);
