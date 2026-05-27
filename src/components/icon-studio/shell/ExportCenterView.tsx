/**
 * ExportCenterView — bundles, formats, and size matrix for production
 * exports. Bakes the active Style System recipe (variant, radius, stroke,
 * accent, accent2) into every exported SVG/PNG so downloads carry the same
 * look & feel users see in Style System cards.
 */

import { useMemo, useState, type ReactNode } from 'react';
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

type FormatId = FormatRow['id'];
type PresetId = 'designer' | 'developer' | 'web' | 'everything';

interface Preset {
  id: PresetId;
  label: string;
  blurb: string;
  icon: typeof Package;
  token: string;
  formats: FormatId[];
}

const PRESETS: Preset[] = [
  {
    id: 'designer',
    label: 'Designer kit',
    blurb: 'Styled SVG + PNG + PDF contact sheet. Drop-in for Figma & decks.',
    icon: Paintbrush,
    token: '--tp-pink',
    formats: ['svg', 'png', 'pdf', 'json'],
  },
  {
    id: 'developer',
    label: 'Developer kit',
    blurb: 'React components, sprite sheet, CSS utilities, JSON manifest.',
    icon: Code2,
    token: '--tp-digital-blue',
    formats: ['svg', 'sprite', 'react', 'css', 'json'],
  },
  {
    id: 'web',
    label: 'Web bundle',
    blurb: 'Favicons, icon font, sprite + CSS — everything a site needs.',
    icon: Globe,
    token: '--tp-teal',
    formats: ['svg', 'sprite', 'css', 'font', 'favicon', 'json'],
  },
  {
    id: 'everything',
    label: 'The works',
    blurb: 'Every format in every size. Largest bundle.',
    icon: Boxes,
    token: '--tp-orange',
    formats: ['svg', 'svg-opt', 'png', 'sprite', 'react', 'css', 'figma', 'font', 'favicon', 'pdf', 'json'],
  },
];



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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetId | 'custom'>('designer');



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

  const toggleFormat = (id: FormatRow['id']) => {
    setActivePreset('custom');
    setFormats((p) => p.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setFormats((p) => p.map((f) => ({ ...f, enabled: preset.formats.includes(f.id) })));
  };

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
    <div className="space-y-6 pb-28">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-orange) / 0.16), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span>Export Center</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ship your icons</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Three quick steps: pick what to export, choose a look, and select a bundle preset.
            Your style is baked into every file.
          </p>
        </div>
      </header>

      {/* ── Step 1 · Scope ─────────────────────────────────────────────── */}
      <StepCard
        step={1}
        title="What do you want to export?"
        hint={`${targetIcons.toLocaleString()} icon${targetIcons === 1 ? '' : 's'} in scope`}
        action={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onOpenLibrary}>
            <LibraryIcon className="h-3.5 w-3.5" /> Library
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <ScopeChip
            label={`Everything · ${libraries.reduce((s, l) => s + l.icons.length, 0) + importedIcons.length}`}
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
              label={`Imported · ${importedIcons.length}`}
              active={selectedSetId === 'imported'}
              onClick={() => setSelectedSetId('imported')}
            />
          )}
          {libraries.length === 0 && importedIcons.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              No icons yet — generate a set or import some to start exporting.
            </p>
          )}
        </div>
      </StepCard>

      {/* ── Step 2 · Look & feel ──────────────────────────────────────── */}
      <StepCard
        step={2}
        title="Choose your look"
        hint={`${activeStyle.name} · ${activeStyle.preview.variant}`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Wand2 className="h-3 w-3" /> Style system
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                {BASE_STYLES.map((s) => {
                  const active = s.id === styleId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStyleId(s.id)}
                      className={cn(
                        'rounded-lg border p-2 text-left transition-all',
                        active
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:bg-secondary/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-[11px] font-semibold truncate">{s.name}</div>
                        {active && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                      </div>
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
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Palette className="h-3 w-3" /> Brand accent
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
                        className="h-3 w-3 rounded-sm ring-1 ring-border/50"
                        style={{ background: `hsl(var(${c.token}))` }}
                      />
                      {c.label}
                      {active && <Check className="h-3 w-3 text-primary ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Live preview
            </div>
            <IconSetPreview
              emojis={PREVIEW_EMOJIS}
              accent={accentCss}
              accent2={accent2Css}
              size="lg"
              count={6}
              columns={3}
              variant={activeStyle.preview.variant}
              radius={activeStyle.preview.radius}
              strokeWidth={activeStyle.preview.strokeWidth}
            />
            <p className="text-[11px] text-muted-foreground leading-snug">
              {activeStyle.description}
            </p>
            <div className="flex flex-wrap gap-1">
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
      </StepCard>

      {/* ── Step 3 · Bundle preset ────────────────────────────────────── */}
      <StepCard
        step={3}
        title="Pick a bundle"
        hint={`${enabledCount} format${enabledCount === 1 ? '' : 's'} · ~${fileEstimate.toLocaleString()} files`}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={cn(
                  'group relative rounded-xl border p-4 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border bg-card/40 hover:bg-secondary/40 hover:border-border/80',
                )}
              >
                {active && (
                  <div
                    className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center mb-2"
                  style={{
                    background: `hsl(var(${p.token}) / 0.12)`,
                    color: `hsl(var(${p.token}))`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">{p.label}</div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{p.blurb}</p>
                <div className="mt-2 text-[10px] text-muted-foreground tabular-nums">
                  {p.formats.length} formats
                </div>
              </button>
            );
          })}
        </div>

        {activePreset === 'custom' && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground rounded-md bg-secondary/30 border border-border/50 px-3 py-2">
            <Settings2 className="h-3.5 w-3.5" />
            Custom selection — adjust formats in the Advanced section below.
          </div>
        )}

        {/* PNG sizes — inline & compact, only when PNG is on */}
        {formats.find((f) => f.id === 'png')?.enabled && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                PNG sizes
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {sizes.size} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PNG_SIZES.map((s) => {
                const active = sizes.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors tabular-nums',
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary/30 hover:bg-secondary/60 border-border',
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Advanced (collapsible) ────────────────────────────────────── */}
      <section className="tp-card overflow-hidden">
        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">Advanced</div>
              <div className="text-[11px] text-muted-foreground">
                Fine-tune individual formats and the quality gate
                {brainGateEnabled && brainScan.failing.length > 0 && (
                  <span className="ml-2 text-destructive">
                    · {brainScan.failing.length} icons will be excluded
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              advancedOpen && 'rotate-180',
            )}
          />
        </button>

        {advancedOpen && (
          <div className="border-t border-border/40 p-5 space-y-5">
            {/* Quality gate */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Quality gate
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <Checkbox
                    checked={brainGateEnabled}
                    onCheckedChange={(v) => setBrainGateEnabled(v === true)}
                  />
                  Skip icons below {brainGateThreshold}
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Auto-excludes glyphs whose worst rubric axis falls below the threshold.
              </p>
              <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                <div>
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
                <div className="rounded-md border border-border/60 bg-secondary/20 p-3 min-h-[60px]">
                  {brainScan.failing.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck
                        className="h-3.5 w-3.5"
                        style={{ color: 'hsl(var(--tp-green))' }}
                      />
                      Every icon in scope clears the rubric.
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        {brainScan.failing.length} excluded
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {brainScan.failing.slice(0, 40).map((f) => (
                          <span
                            key={f.key}
                            title={`${BRAIN_AXIS_LABELS[f.worstAxis]} · ${f.worstScore}`}
                            className="rounded border border-border bg-card/60 px-1.5 py-0.5 text-[10px] tabular-nums"
                          >
                            {f.name}
                            <span className="ml-1 text-muted-foreground">{f.worstScore}</span>
                          </span>
                        ))}
                        {brainScan.failing.length > 40 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{brainScan.failing.length - 40} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Format-level toggles */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Formats</div>
                <Badge variant="outline" className="text-[10px]">
                  {enabledCount} of {formats.length}
                </Badge>
              </div>
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
                        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer',
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
            </div>
          </div>
        )}
      </section>

      {/* ── Sticky export bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(96vw,860px)]">
        <div className="tp-card flex items-center gap-3 p-3 shadow-2xl backdrop-blur bg-card/95 border-border">
          <div className="flex items-center gap-2 px-2 min-w-0">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'hsl(var(--tp-digital-blue) / 0.12)',
                color: 'hsl(var(--tp-digital-blue))',
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-sm font-semibold truncate">
                {targetIcons.toLocaleString()} icons · {activeStyle.name}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {enabledCount} formats · ~{fileEstimate.toLocaleString()} files
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <Button
            size="lg"
            className="gap-2 flex-shrink-0"
            disabled={enabledCount === 0 || targetIcons === 0 || exporting}
            onClick={handleExport}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Building…</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export ZIP</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({
  step,
  title,
  hint,
  action,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="tp-card p-5">
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
        </div>
      </div>
      {action}
    </header>
    {children}
  </section>
);


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
