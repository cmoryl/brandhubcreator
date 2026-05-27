/**
 * ExportCenterView — bundles, formats, and size matrix for production
 * exports. Bakes the active Style System recipe (variant, radius, stroke,
 * accent, accent2) into every exported SVG/PNG so downloads carry the same
 * look & feel users see in Style System cards.
 */

import { useMemo, useState } from 'react';
import {
  Package, Download, Image as ImageIcon, FileText, Code2, Layers,
  Smartphone, Library as LibraryIcon, Sparkles, Wand2, Loader2, ShieldCheck,
  Palette, Settings2, ChevronDown, Check, Rocket, Paintbrush, Globe, Boxes,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import JSZip from 'jszip';



import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import { BASE_STYLES, type BaseStyle } from './studioData';
import { IconSetPreview } from './IconSetPreview';
import { buildStyledSvg, svgToPng, slugify, resolveCssColor } from './styleSvgExporter';
import { buildSymbolSheet, buildSpriteCss, buildSpriteReadme, buildReactPackage, buildFigmaPackage, buildSvgIconFont, buildFavicons, buildPdfContactSheet, type EmitIcon } from './exportPackagers';
import type { ImportedIconEntry } from '@/hooks/useImportedIcons';
import { scoreIcon, BRAIN_AXIS_LABELS, type BrainAxis } from '@/lib/iconStudio/qa';




interface Props {
  libraries: IconLibrary[];
  organizationName: string;
  onOpenLibrary?: () => void;
  importedIcons?: ImportedIconEntry[];
}

interface FormatRow {
  id: 'svg' | 'svg-opt' | 'png' | 'json' | 'sprite' | 'react' | 'css' | 'figma' | 'font' | 'favicon' | 'pdf';
  label: string;
  description: string;
  icon: typeof Package;
  enabled: boolean;
  ext: string;
}

const DEFAULT_FORMATS: FormatRow[] = [
  { id: 'svg', label: 'Styled SVG', description: 'Self-contained SVG with baked-in look & feel', icon: ImageIcon, enabled: true, ext: '.svg' },
  { id: 'svg-opt', label: 'Raw glyph SVG', description: 'Source path only — no wrapper styling', icon: ImageIcon, enabled: false, ext: '.svg' },
  { id: 'png', label: 'PNG (styled)', description: 'Rasterized styled icons at every selected size', icon: ImageIcon, enabled: true, ext: '.png' },
  { id: 'sprite', label: 'SVG sprite + symbol sheet', description: 'Single <symbol> sheet for <use href> references', icon: Layers, enabled: false, ext: '.svg' },
  { id: 'react', label: 'React component package', description: 'TSX components + index.ts barrel export', icon: Code2, enabled: false, ext: '.tsx' },
  { id: 'css', label: 'CSS utility classes', description: 'Background-image classes from the sprite', icon: FileText, enabled: false, ext: '.css' },
  { id: 'figma', label: 'Figma frame export', description: 'Named Frame_<slug>.svg files for plugin import', icon: ImageIcon, enabled: false, ext: '.svg' },
  { id: 'font', label: 'Icon font (SVG source)', description: 'SVG font + CSS — convert to WOFF2 via fontforge', icon: FileText, enabled: false, ext: '.svg' },
  { id: 'favicon', label: 'Favicons (from brand mark)', description: '16/32/180/192/512 PNG + manifest from first icon', icon: Smartphone, enabled: false, ext: '.png' },
  { id: 'pdf', label: 'PDF contact sheet', description: 'Paginated grid of every icon with style recipe cover', icon: FileText, enabled: false, ext: '.pdf' },
  { id: 'json', label: 'JSON manifest', description: 'Style recipe, icon index, hashes, metadata', icon: FileText, enabled: true, ext: '.json' },
];

const COMING_SOON: FormatRow[] = [];

const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

const ACCENT_TOKENS = [
  { label: 'Digital Blue', token: '--tp-digital-blue' },
  { label: 'Pink', token: '--tp-pink' },
  { label: 'Orange', token: '--tp-orange' },
  { label: 'Teal', token: '--tp-teal' },
  { label: 'Green', token: '--tp-green' },
  { label: 'Purple', token: '--tp-purple' },
];

const PREVIEW_EMOJIS = ['⚙️', '📊', '🔐', '🛒', '✨', '🛡️'];

// Fallback path data (lucide-style 24x24) used when a library icon is missing
// its `svgPath` — keeps the export pipeline deterministic.
const FALLBACK_PATH = 'M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z';

export const ExportCenterView = ({ libraries, organizationName, onOpenLibrary, importedIcons = [] }: Props) => {
  const { toast } = useToast();
  const [formats, setFormats] = useState(DEFAULT_FORMATS);
  const [sizes, setSizes] = useState<Set<number>>(new Set([24, 48, 128, 512]));
  const [selectedSetId, setSelectedSetId] = useState<string | 'all'>('all');
  const [styleId, setStyleId] = useState<string>(BASE_STYLES[0].id);
  const [accentToken, setAccentToken] = useState<string>(ACCENT_TOKENS[0].token);
  const [exporting, setExporting] = useState(false);
  // Iconography Brain export gate — exclude icons whose worst axis falls below
  // the threshold so bundles never ship glyphs that violate the rubric.
  const [brainGateEnabled, setBrainGateEnabled] = useState(true);
  const [brainGateThreshold, setBrainGateThreshold] = useState(70);

  // Scoped libraries used by both the brain gate and the export pipeline.
  const scopedLibs = useMemo(
    () =>
      selectedSetId === 'all' || selectedSetId === 'imported'
        ? libraries
        : libraries.filter((l) => l.id === selectedSetId),
    [libraries, selectedSetId],
  );

  // Per-icon brain rubric scan (sync, cheap) — runs only over the active scope
  // so huge libraries don't pay for icons that won't be exported.
  // Compound key (libId::iconIndex::id/name) — prevents cross-library id/name
  // collisions from wrongly excluding or including icons in the export.
  const iconKey = (libId: string, iconIdx: number, icon: { id?: string; name?: string }) =>
    `${libId}::${iconIdx}::${String(icon.id ?? icon.name ?? iconIdx)}`;

  const brainScan = useMemo(() => {
    if (selectedSetId === 'imported') return { failing: [], worst: null as null | { axis: BrainAxis; score: number } };
    type FailRow = { key: string; name: string; worstAxis: BrainAxis; worstScore: number };
    const failing: FailRow[] = [];
    let worst: { axis: BrainAxis; score: number } | null = null;
    for (const lib of scopedLibs) {
      lib.icons.forEach((icon, idx) => {
        const r = scoreIcon(icon);
        let axis: BrainAxis = 'gridIntegrity';
        let score = 100;
        for (const k of Object.keys(r.scores.brainRubric) as BrainAxis[]) {
          if (r.scores.brainRubric[k] < score) {
            score = r.scores.brainRubric[k];
            axis = k;
          }
        }
        if (score < brainGateThreshold) {
          failing.push({
            key: iconKey(lib.id, idx, icon),
            name: icon.name ?? 'unnamed',
            worstAxis: axis,
            worstScore: score,
          });
        }
        if (!worst || score < worst.score) worst = { axis, score };
      });
    }
    return { failing, worst };
  }, [scopedLibs, selectedSetId, brainGateThreshold]);

  const excludedKeys = useMemo(
    () => (brainGateEnabled ? new Set(brainScan.failing.map((f) => f.key)) : new Set<string>()),
    [brainGateEnabled, brainScan],
  );


  const enabledCount = formats.filter((f) => f.enabled).length;
  const activeStyle: BaseStyle = useMemo(
    () => BASE_STYLES.find((s) => s.id === styleId) ?? BASE_STYLES[0],
    [styleId],
  );
  const accentCss = `hsl(var(${accentToken}))`;
  const accent2Css = activeStyle.preview.accent2
    ? `hsl(var(--${activeStyle.preview.accent2}))`
    : undefined;

  const targetIcons = useMemo(() => {
    const baseLib = scopedLibs.reduce((s, l) => s + l.icons.length, 0);
    const baseImported = selectedSetId === 'all' || selectedSetId === 'imported' ? importedIcons.length : 0;
    return baseLib + baseImported - excludedKeys.size;
  }, [scopedLibs, selectedSetId, importedIcons, excludedKeys]);


  const fileEstimate = useMemo(() => {
    const pngVariants = sizes.size;
    const perIcon =
      formats.filter((f) => f.enabled && (f.id === 'svg' || f.id === 'svg-opt')).length +
      (formats.find((f) => f.id === 'png')?.enabled ? pngVariants : 0);
    const manifest = formats.find((f) => f.id === 'json')?.enabled ? 1 : 0;
    return targetIcons * Math.max(0, perIcon) + manifest;
  }, [targetIcons, sizes.size, formats]);

  const toggleFormat = (id: FormatRow['id']) =>
    setFormats((p) => p.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));

  const toggleSize = (s: number) =>
    setSizes((p) => {
      const n = new Set(p);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const handleExport = async () => {
    const includeImported = selectedSetId === 'all' || selectedSetId === 'imported';
    const allIcons = scopedLibs.flatMap((lib) =>
      lib.icons
        .map((ic, idx) => ({ lib, icon: ic, idx }))
        .filter(({ lib: l, icon: ic, idx }) => !excludedKeys.has(iconKey(l.id, idx, ic)))
        .map(({ lib: l, icon: ic }) => ({ lib: l, icon: ic })),
    );


    let importedSvgData: { name: string; slug: string; svgPath: string; viewBox: string }[] = [];
    if (includeImported && importedIcons.length > 0) {
      const { materializeAsBrandIconography } = await import('@/lib/iconLibrary/loader');
      const fetched = await Promise.all(
        importedIcons.map(async (entry) => {
          try {
            const bi = await materializeAsBrandIconography(entry.pack, entry.name, entry.category);
            return {
              name: entry.label,
              slug: slugify(entry.label),
              svgPath: bi.svgPath,
              viewBox: bi.viewBox,
            };
          } catch {
            return null;
          }
        })
      );
      importedSvgData = fetched.filter(Boolean) as typeof importedSvgData;
    }

    const totalCount = allIcons.length + importedSvgData.length;

    if (totalCount === 0) {
      toast({ title: 'No icons in scope', description: 'Generate a set or import icons first.', variant: 'destructive' });
      return;
    }

    const wantPngEarly = formats.find((f) => f.id === 'png')?.enabled;
    if (wantPngEarly && sizes.size === 0) {
      toast({
        title: 'No PNG sizes selected',
        description: 'Pick at least one size or disable the PNG format.',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    try {
      const zip = new JSZip();
      const orgSlug = slugify(organizationName || 'org');
      const styleSlug = slugify(activeStyle.id);
      const root = zip.folder(`icon-system-${orgSlug}-${styleSlug}`)!;
      const resolvedAccent = resolveCssColor(accentCss);
      const resolvedAccent2 = accent2Css ? resolveCssColor(accent2Css) : undefined;

      // Manifest
      const manifest = {
        organization: organizationName,
        generatedAt: new Date().toISOString(),
        style: {
          id: activeStyle.id,
          name: activeStyle.name,
          variant: activeStyle.preview.variant,
          radius: activeStyle.preview.radius,
          strokeWidth: activeStyle.preview.strokeWidth,
          recipe: activeStyle.recipe,
        },
        accent: { token: accentToken, resolved: resolvedAccent },
        accent2: resolvedAccent2 ? { token: activeStyle.preview.accent2, resolved: resolvedAccent2 } : undefined,
        pngSizes: Array.from(sizes).sort((a, b) => a - b),
        formats: formats.filter((f) => f.enabled).map((f) => f.id),
        libraries: scopedLibs.map((l) => ({ id: l.id, name: l.name, count: l.icons.length })),
        imported: importedSvgData.length > 0 ? { count: importedSvgData.length, source: 'bundled' } : undefined,
        totals: { icons: totalCount },
      };

      if (formats.find((f) => f.id === 'json')?.enabled) {
        root.file('manifest.json', JSON.stringify(manifest, null, 2));
      }

      const wantStyled = formats.find((f) => f.id === 'svg')?.enabled;
      const wantRaw = formats.find((f) => f.id === 'svg-opt')?.enabled;
      const wantPng = formats.find((f) => f.id === 'png')?.enabled;
      const wantSprite = formats.find((f) => f.id === 'sprite')?.enabled;
      const wantReact = formats.find((f) => f.id === 'react')?.enabled;
      const wantCss = formats.find((f) => f.id === 'css')?.enabled;
      const pngList = Array.from(sizes).sort((a, b) => a - b);
      const collected: EmitIcon[] = [];

      // Per-icon emission
      for (const { lib, icon } of allIcons) {
        const libSlug = slugify(lib.name);
        const iconSlug = slugify(icon.name);
        const path = icon.svgPath || FALLBACK_PATH;
        const viewBox = icon.viewBox || '0 0 24 24';
        collected.push({ slug: `${libSlug}-${iconSlug}`, name: icon.name, svgPath: path, viewBox });

        if (wantStyled) {
          const svg = buildStyledSvg({
            svgPath: path,
            viewBox,
            style: activeStyle,
            accent: resolvedAccent,
            accent2: resolvedAccent2,
            size: 64,
            standalone: true,
          });
          root.file(`svg/${libSlug}/${iconSlug}.svg`, svg);
        }

        if (wantRaw) {
          const raw = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
          root.file(`svg-raw/${libSlug}/${iconSlug}.svg`, raw);
        }

        if (wantPng) {
          for (const px of pngList) {
            const styledForPx = buildStyledSvg({
              svgPath: path,
              viewBox,
              style: activeStyle,
              accent: resolvedAccent,
              accent2: resolvedAccent2,
              size: px,
              standalone: false,
            });
            try {
              const blob = await svgToPng(styledForPx, px);
              root.file(`png/${px}/${libSlug}/${iconSlug}.png`, blob);
            } catch {
              // Skip individual PNG failures rather than abort the whole bundle.
            }
          }
        }
      }

      // Per-icon emission — imported icons
      for (const ic of importedSvgData) {
        const iconSlug = ic.slug;
        const path = ic.svgPath || FALLBACK_PATH;
        const viewBox = ic.viewBox || '0 0 24 24';
        collected.push({ slug: `imported-${iconSlug}`, name: ic.name, svgPath: path, viewBox });

        if (wantStyled) {
          const svg = buildStyledSvg({
            svgPath: path,
            viewBox,
            style: activeStyle,
            accent: resolvedAccent,
            accent2: resolvedAccent2,
            size: 64,
            standalone: true,
          });
          root.file(`svg/imported/${iconSlug}.svg`, svg);
        }

        if (wantRaw) {
          const raw = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
          root.file(`svg-raw/imported/${iconSlug}.svg`, raw);
        }

        if (wantPng) {
          for (const px of pngList) {
            const styledForPx = buildStyledSvg({
              svgPath: path,
              viewBox,
              style: activeStyle,
              accent: resolvedAccent,
              accent2: resolvedAccent2,
              size: px,
              standalone: false,
            });
            try {
              const blob = await svgToPng(styledForPx, px);
              root.file(`png/${px}/imported/${iconSlug}.png`, blob);
            } catch {
              // Skip individual PNG failures.
            }
          }
        }
      }

      // Phase 7 — aggregated distribution formats
      if (wantSprite && collected.length > 0) {
        root.file('sprite/sprite.svg', buildSymbolSheet(collected));
        root.file('sprite/README.md', buildSpriteReadme('sprite.svg'));
      }
      if (wantCss && collected.length > 0) {
        root.file('sprite/icons.css', buildSpriteCss(collected, 'sprite.svg'));
      }
      if (wantReact && collected.length > 0) {
        for (const f of buildReactPackage(collected)) {
          root.file(f.path, f.content);
        }
      }

      // Phase 8 — Figma, icon font, favicons
      const wantFigma = formats.find((f) => f.id === 'figma')?.enabled;
      const wantFont = formats.find((f) => f.id === 'font')?.enabled;
      const wantFavicon = formats.find((f) => f.id === 'favicon')?.enabled;

      if (wantFigma && collected.length > 0) {
        const styledFor = (ic: EmitIcon) =>
          buildStyledSvg({
            svgPath: ic.svgPath,
            viewBox: ic.viewBox,
            style: activeStyle,
            accent: resolvedAccent,
            accent2: resolvedAccent2,
            size: 24,
            standalone: true,
          });
        for (const f of buildFigmaPackage(collected, styledFor)) {
          root.file(f.path, f.content);
        }
      }

      if (wantFont && collected.length > 0) {
        const fontFamily = `${slugify(organizationName || 'brand')}-icons`;
        for (const f of buildSvgIconFont(collected, fontFamily)) {
          root.file(f.path, f.content);
        }
      }

      if (wantFavicon && collected.length > 0) {
        const mark = collected[0];
        const markSvg = buildStyledSvg({
          svgPath: mark.svgPath,
          viewBox: mark.viewBox,
          style: activeStyle,
          accent: resolvedAccent,
          accent2: resolvedAccent2,
          size: 512,
          standalone: true,
        });
        try {
          const faviconFiles = await buildFavicons(markSvg, (svg, px) => svgToPng(svg, px));
          for (const f of faviconFiles) {
            root.file(f.path, f.content);
          }
        } catch (e) {
          logger.debug('[ExportCenter] favicon emit failed', e);
        }
      }

      const wantPdf = formats.find((f) => f.id === 'pdf')?.enabled;
      if (wantPdf && collected.length > 0) {
        try {
          const styledFor = (ic: EmitIcon) =>
            buildStyledSvg({
              svgPath: ic.svgPath,
              viewBox: ic.viewBox,
              style: activeStyle,
              accent: resolvedAccent,
              accent2: resolvedAccent2,
              size: 64,
              standalone: true,
            });
          const pdfBlob = await buildPdfContactSheet(
            collected,
            styledFor,
            (svg, px) => svgToPng(svg, px),
            {
              organization: organizationName,
              styleName: activeStyle.name,
              variant: activeStyle.preview.variant,
              accent: resolvedAccent,
            },
          );
          root.file('contact-sheet.pdf', pdfBlob);
        } catch (e) {
          logger.debug('[ExportCenter] pdf emit failed', e);
        }
      }





      // Contact sheet HTML — quick visual proof
      root.file(
        'README.html',
        `<!doctype html><meta charset="utf-8"><title>${organizationName} · ${activeStyle.name}</title>
<style>body{font-family:system-ui;background:#0f1422;color:#e7eaf3;padding:32px}h1{font-size:20px}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin-top:16px}.cell{background:#181f33;border-radius:8px;padding:8px;text-align:center;font-size:10px}img{width:48px;height:48px;display:block;margin:0 auto 4px}</style>
<h1>${organizationName} — ${activeStyle.name} (${activeStyle.preview.variant})</h1>
<p style="opacity:.7">Accent: ${resolvedAccent}${resolvedAccent2 ? ` · 2nd: ${resolvedAccent2}` : ''} · ${totalCount} icons</p>
<p style="opacity:.6">Open <code>svg/</code> for styled SVGs, <code>png/</code> for rasterized variants, <code>manifest.json</code> for metadata.</p>`,
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icon-system-${orgSlug}-${styleSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Bundle exported',
        description: `${totalCount} icons in “${activeStyle.name}” style.`,
      });
    } catch (e) {
      logger.debug('[ExportCenter] export failed', e);
      toast({
        title: 'Export failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

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
              <span>Production exports · style-locked</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Export Center</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Pick a style system + brand accent, then export a production ZIP where every
              SVG and PNG carries the exact look &amp; feel from the Style Systems gallery.
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            disabled={enabledCount === 0 || targetIcons === 0 || exporting}
            onClick={handleExport}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Building bundle…' : 'Export bundle'}
          </Button>
        </div>
      </header>

      {/* Style + accent picker — drives the look & feel of EVERY exported asset */}
      <section className="tp-card p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              Style system + accent
            </div>
            <p className="text-[11px] text-muted-foreground">
              The exporter bakes this recipe into every SVG/PNG in the bundle.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {activeStyle.preview.variant}
          </Badge>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Style ({BASE_STYLES.length})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
              {BASE_STYLES.map((s) => {
                const active = s.id === styleId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStyleId(s.id)}
                    className={cn(
                      'rounded-lg border p-2 text-left transition-colors group',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/40',
                    )}
                  >
                    <div className="text-[11px] font-semibold truncate">{s.name}</div>
                    <div className="mt-1.5">
                      <IconSetPreview
                        emojis={PREVIEW_EMOJIS}
                        accent={accentCss}
                        accent2={accent2Css}
                        size="sm"
                        count={4}
                        columns={4}
                        variant={s.preview.variant}
                        radius={s.preview.radius}
                        strokeWidth={s.preview.strokeWidth}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-2">
              Brand accent
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_TOKENS.map((c) => {
                const active = c.token === accentToken;
                return (
                  <button
                    key={c.token}
                    onClick={() => setAccentToken(c.token)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                      active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40',
                    )}
                  >
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ background: `hsl(var(${c.token}))` }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live preview — exactly what export will look like */}
          <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Export preview
            </div>
            <div className="text-sm font-semibold">{activeStyle.name}</div>
            <p className="text-[11px] text-muted-foreground">{activeStyle.description}</p>
            <IconSetPreview
              emojis={PREVIEW_EMOJIS}
              accent={accentCss}
              accent2={accent2Css}
              size="lg"
              count={6}
              columns={6}
              variant={activeStyle.preview.variant}
              radius={activeStyle.preview.radius}
              strokeWidth={activeStyle.preview.strokeWidth}
            />
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="outline" className="text-[10px]">
                Radius {activeStyle.preview.radius ?? 10}px
              </Badge>
              {activeStyle.preview.strokeWidth && (
                <Badge variant="outline" className="text-[10px]">
                  Stroke {activeStyle.preview.strokeWidth}px
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

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
            label={`Entire workspace (${libraries.length + (importedIcons.length > 0 ? 1 : 0)})`}
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
          {importedIcons.length > 0 && (
            <ScopeChip
              label={`Imported Assets · ${importedIcons.length}`}
              active={selectedSetId === 'imported'}
              onClick={() => setSelectedSetId('imported')}
            />
          )}
          {libraries.length === 0 && importedIcons.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No sets yet — generate one or import icons to enable scoped exports.
            </p>
          )}
        </div>
      </section>

      {/* Iconography Brain export gate */}
      <section className="tp-card p-5">
        <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Iconography Brain export gate
            </div>
            <p className="text-[11px] text-muted-foreground">
              Excludes icons whose worst rubric axis falls below the threshold so bundles never ship
              glyphs that violate the brain.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={brainScan.failing.length > 0 ? 'destructive' : 'secondary'}
              className="text-[10px]"
            >
              {brainScan.failing.length} failing · threshold {brainGateThreshold}
            </Badge>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <Checkbox
                checked={brainGateEnabled}
                onCheckedChange={(v) => setBrainGateEnabled(v === true)}
              />
              Gate on
            </label>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Threshold (per-axis)
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={brainGateThreshold}
              onChange={(e) => setBrainGateThreshold(Number(e.target.value))}
              className="w-full accent-primary"
              disabled={!brainGateEnabled}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
              <span>50</span>
              <span className="font-semibold text-foreground">{brainGateThreshold}</span>
              <span>95</span>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
            {brainScan.failing.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'hsl(var(--tp-green))' }} />
                Every icon in scope clears the rubric.
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Excluded icons (worst axis)
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {brainScan.failing.slice(0, 60).map((f) => (
                    <span
                      key={f.key}
                      title={`${BRAIN_AXIS_LABELS[f.worstAxis]} · ${f.worstScore}`}
                      className="rounded border border-border bg-card/60 px-1.5 py-0.5 text-[10px] tabular-nums"
                    >
                      {f.name}
                      <span className="ml-1 text-muted-foreground">{f.worstScore}</span>
                    </span>
                  ))}
                  {brainScan.failing.length > 60 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{brainScan.failing.length - 60} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>



      {/* Formats matrix */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Formats</h3>
            <p className="text-[11px] text-muted-foreground">
              Active formats are emitted with the chosen style baked in.
            </p>
          </div>
          <Badge variant="outline">{enabledCount} of {formats.length}</Badge>
        </header>
        <div className="grid gap-2 md:grid-cols-2">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleFormat(f.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFormat(f.id);
                  }
                }}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  f.enabled
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-secondary/20 hover:bg-secondary/40',
                )}
              >
                <Checkbox
                  checked={f.enabled}
                  className="mt-0.5 pointer-events-none"
                  aria-hidden="true"
                  tabIndex={-1}
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
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Coming soon
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {COMING_SOON.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-dashed border-border bg-secondary/10 px-3 py-2 text-[11px] text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PNG sizes */}
      <section className="tp-card p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">PNG sizes</h3>
            <p className="text-[11px] text-muted-foreground">
              Raster sizes rendered per icon — each carries the styled wrapper.
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
            Files generated under{' '}
            <span className="font-mono">
              icon-system-{slugify(organizationName || 'org')}-{slugify(activeStyle.id)}.zip
            </span>
          </p>
        </header>
        <pre className="text-[11px] leading-relaxed bg-secondary/30 rounded-md p-3 overflow-x-auto font-mono text-muted-foreground">
{`icon-system/
├── manifest.json          // style recipe + accent + scope metadata
├── README.html            // human-readable contact sheet
├── svg/                   // styled SVGs (look & feel baked in)
│   └── <set>/<icon>.svg
${formats.find((f) => f.id === 'svg-opt')?.enabled ? '├── svg-raw/               // glyph-only source paths\n' : ''}└── png/                   // styled PNGs per size
${Array.from(sizes).sort((a, b) => a - b).map((s) => `    ├── ${s}/<set>/<icon>.png`).join('\n')}`}
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
