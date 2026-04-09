/**
 * IconStudioExport - Final wizard step for batch export in multiple formats
 * Supports: SVG ZIP, PNG sprite sheet, Icon font (CSS), Design tokens (JSON/CSS)
 * + Import to Entity (Brand/Product/Event)
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileArchive,
  Image,
  Type,
  Code2,
  Loader2,
  CheckCircle2,
  Package,
  Sparkles,
  Import,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { sanitizeSvg, buildSvgString } from '@/lib/svgUtils';
import { toast } from 'sonner';

interface IconStudioExportProps {
  libraries: IconLibrary[];
  brandColors?: Array<{ hex: string; name: string }>;
  organizationName?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  entityName?: string;
  onImportToEntity?: (icons: BrandIconography[]) => void;
}

type ExportFormat = 'svg-zip' | 'png-sprite' | 'icon-font' | 'design-tokens';

interface FormatConfig {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const FORMATS: FormatConfig[] = [
  {
    id: 'svg-zip',
    label: 'SVG Bundle (ZIP)',
    description: 'Individual SVG files in a ZIP archive, organized by library',
    icon: FileArchive,
    available: true,
  },
  {
    id: 'png-sprite',
    label: 'PNG Sprite Sheet',
    description: 'All icons rendered as PNGs at multiple sizes (16, 24, 32, 48, 64px)',
    icon: Image,
    available: true,
  },
  {
    id: 'icon-font',
    label: 'Icon Font (CSS)',
    description: 'CSS classes with embedded SVG icon references for web use',
    icon: Type,
    available: true,
  },
  {
    id: 'design-tokens',
    label: 'Design Tokens',
    description: 'JSON + CSS variables with icon metadata, colors, and usage guidelines',
    icon: Code2,
    available: true,
  },
];

const PNG_SIZES = [16, 24, 32, 48, 64];

export const IconStudioExport = ({
  libraries,
  brandColors = [],
  organizationName = 'icons',
  entityId,
  entityType,
  entityName,
  onImportToEntity,
}: IconStudioExportProps) => {
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(new Set(['svg-zip']));
  const [selectedLibraries, setSelectedLibraries] = useState<Set<string>>(new Set(libraries.map(l => l.id)));
  const [pngSizes, setPngSizes] = useState<number[]>([24, 48]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  // Import to entity state
  const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(new Set());

  const allIcons = useMemo(() => {
    return libraries
      .filter(l => selectedLibraries.has(l.id))
      .flatMap(l => l.icons);
  }, [libraries, selectedLibraries]);

  const allLibraryIcons = useMemo(() => {
    return libraries.flatMap(l => l.icons);
  }, [libraries]);

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  };

  const toggleLibrary = (id: string) => {
    setSelectedLibraries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Import selection helpers
  const toggleImportIcon = (iconId: string) => {
    setImportSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) next.delete(iconId);
      else next.add(iconId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (importSelectedIds.size === allLibraryIcons.length) {
      setImportSelectedIds(new Set());
    } else {
      setImportSelectedIds(new Set(allLibraryIcons.map(i => i.id)));
    }
  };

  const handleImportToEntity = () => {
    if (!onImportToEntity || importSelectedIds.size === 0) return;
    const iconsToImport = allLibraryIcons.filter(i => importSelectedIds.has(i.id));
    onImportToEntity(iconsToImport);
    toast.success(`Imported ${iconsToImport.length} icon(s) to ${entityName || entityType}`);
    setImportSelectedIds(new Set());
  };

  const buildIconSvg = (icon: BrandIconography): string => buildSvgString(icon);

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const exportSvgZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    libraries
      .filter(l => selectedLibraries.has(l.id))
      .forEach(lib => {
        const folder = zip.folder(slugify(lib.name)) || zip;
        lib.icons.forEach(icon => {
          folder.file(`${slugify(icon.name)}.svg`, sanitizeSvg(icon));
        });
      });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${slugify(organizationName)}-icons.zip`);
  };

  const exportPngSprite = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const iconCount = allIcons.length;
    const cols = Math.ceil(Math.sqrt(iconCount));
    const padding = 4;

    for (const size of pngSizes) {
      canvas.width = cols * (size + padding);
      canvas.height = Math.ceil(iconCount / cols) * (size + padding);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < allIcons.length; i++) {
        const icon = allIcons[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (size + padding);
        const y = row * (size + padding);

        const svgStr = sanitizeSvg(icon);
        const img = new window.Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, x, y, size, size);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }

      canvas.toBlob(blob => {
        if (blob) downloadBlob(blob, `${slugify(organizationName)}-sprite-${size}px.png`);
      });
    }
  };

  const exportIconFont = () => {
    const prefix = slugify(organizationName) || 'icon';
    let css = `/* ${organizationName} Icon Font - Generated by Icon Studio */\n\n`;

    css += `[class^="${prefix}-"], [class*=" ${prefix}-"] {\n`;
    css += `  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n`;
    css += `  width: 1em;\n  height: 1em;\n  fill: currentColor;\n  line-height: 1;\n}\n\n`;

    allIcons.forEach(icon => {
      const className = `${prefix}-${slugify(icon.name)}`;
      const svgEncoded = btoa(sanitizeSvg(icon));
      css += `.${className} {\n`;
      css += `  background-image: url("data:image/svg+xml;base64,${svgEncoded}");\n`;
      css += `  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n`;
      css += `}\n`;
    });

    downloadBlob(new Blob([css], { type: 'text/css' }), `${slugify(organizationName)}-icons.css`);
  };

  const exportDesignTokens = () => {
    const tokens = {
      $schema: 'icon-studio-tokens/1.0',
      organization: organizationName,
      generatedAt: new Date().toISOString(),
      totalIcons: allIcons.length,
      brandColors: brandColors.map(c => ({ name: c.name, hex: c.hex })),
      libraries: libraries
        .filter(l => selectedLibraries.has(l.id))
        .map(lib => ({
          name: lib.name,
          level: lib.level,
          iconCount: lib.icons.length,
          icons: lib.icons.map(icon => ({
            id: icon.id,
            name: icon.name,
            category: icon.category || 'general',
            viewBox: icon.viewBox || '0 0 24 24',
            fillMode: icon.fillMode || 'stroke',
            cssClass: `icon-${slugify(icon.name)}`,
          })),
        })),
    };

    let cssVars = `:root {\n  /* Icon Studio Design Tokens */\n`;
    cssVars += `  --icon-count: ${allIcons.length};\n`;
    cssVars += `  --icon-viewbox: 0 0 24 24;\n`;
    brandColors.forEach(c => {
      cssVars += `  --icon-color-${slugify(c.name)}: ${c.hex};\n`;
    });
    cssVars += `}\n`;

    downloadBlob(new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' }), `${slugify(organizationName)}-tokens.json`);
    downloadBlob(new Blob([cssVars], { type: 'text/css' }), `${slugify(organizationName)}-tokens.css`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedFormats.size === 0) {
      toast.error('Select at least one export format');
      return;
    }
    if (allIcons.length === 0) {
      toast.error('No icons to export. Go back and create some icons first.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    const formats = Array.from(selectedFormats);
    const step = 100 / formats.length;

    try {
      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        setExportProgress(Math.round(i * step));

        switch (format) {
          case 'svg-zip': await exportSvgZip(); break;
          case 'png-sprite': await exportPngSprite(); break;
          case 'icon-font': exportIconFont(); break;
          case 'design-tokens': exportDesignTokens(); break;
        }
      }

      setExportProgress(100);
      setExportComplete(true);
      toast.success(`Exported ${allIcons.length} icons in ${formats.length} format(s)`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const entityLabel = entityName || entityType || '';
  const entityTypeLabel = entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : '';

  return (
    <div className="space-y-6">
      {/* Import to Entity - shown when opened from a brand/product/event */}
      {onImportToEntity && entityId && allLibraryIcons.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Import className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm">Import to {entityLabel}</h4>
                  <p className="text-xs text-muted-foreground">
                    Select icons from your libraries to add to this {entityTypeLabel.toLowerCase()}'s icon set
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={toggleSelectAll}
              >
                {importSelectedIds.size === allLibraryIcons.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Icon selection grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-[240px] overflow-y-auto p-1">
              {allLibraryIcons.map(icon => {
                const selected = importSelectedIds.has(icon.id);
                return (
                  <button
                    key={icon.id}
                    onClick={() => toggleImportIcon(icon.id)}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all aspect-square',
                      selected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 bg-background'
                    )}
                    title={icon.name}
                  >
                    {selected && (
                      <div className="absolute top-0.5 right-0.5">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className="w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSvg(buildSvgString(icon)),
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Import button */}
            <Button
              onClick={handleImportToEntity}
              disabled={importSelectedIds.size === 0}
              className="w-full gap-2"
            >
              <Import className="h-4 w-4" />
              Import {importSelectedIds.size} Icon{importSelectedIds.size !== 1 ? 's' : ''} to {entityLabel}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Export & Deliver</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Package your {allIcons.length} icon{allIcons.length !== 1 ? 's' : ''} for production use. 
          Select formats and libraries to include.
        </p>
      </div>

      {/* Library Selection */}
      {libraries.length > 1 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Include Libraries</Label>
          <div className="flex flex-wrap gap-2">
            {libraries.map(lib => (
              <button
                key={lib.id}
                onClick={() => toggleLibrary(lib.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all',
                  selectedLibraries.has(lib.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <span>{lib.name}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">{lib.icons.length}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Format Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Export Formats</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORMATS.map(format => {
            const Icon = format.icon;
            const selected = selectedFormats.has(format.id);
            return (
              <button
                key={format.id}
                onClick={() => toggleFormat(format.id)}
                disabled={!format.available}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40',
                  !format.available && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  selected ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{format.label}</span>
                    {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{format.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PNG Size Options */}
      {selectedFormats.has('png-sprite') && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">PNG Sizes</Label>
          <div className="flex gap-2">
            {PNG_SIZES.map(size => (
              <button
                key={size}
                onClick={() => {
                  setPngSizes(prev =>
                    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                  );
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md border text-xs font-medium transition-all',
                  pngSizes.includes(size)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Export Progress */}
      {(isExporting || exportComplete) && (
        <div className="space-y-2 p-4 rounded-xl bg-muted/50 border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {exportComplete ? 'Export complete!' : 'Exporting...'}
            </span>
            <span className="font-medium">{exportProgress}%</span>
          </div>
          <Progress value={exportProgress} className="h-2" />
        </div>
      )}

      {/* Export Button */}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={handleExport}
        disabled={isExporting || selectedFormats.size === 0 || allIcons.length === 0}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : exportComplete ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Export Again
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export {allIcons.length} Icons in {selectedFormats.size} Format{selectedFormats.size !== 1 ? 's' : ''}
          </>
        )}
      </Button>
    </div>
  );
};
