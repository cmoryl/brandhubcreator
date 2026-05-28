import { useState, useEffect, useRef } from 'react';
import { Layers, LayoutGrid, Eye, Download, ChevronDown, FileImage, FileArchive, Upload, FolderOpen } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { cn } from '@/lib/utils';
import { BrandLogo, SocialAssetTemplate, SocialTemplateZone } from '@/types/brand';
import { SlotFitControl } from '../SlotFitControl';
import { BrandLogoVariantPicker } from '../templating/BrandLogoVariantPicker';
import {
  defaultTemplatePreviewFit,
  detectAssetTransparency,
  sampleImageLuminance,
  renderZoneAtOriginalResolution,
} from '@/lib/templateZonePipeline';
import {
  clampZoneValue,
  getZoneMediaFit,
  getEditableZones,
  getSafeAreaGuide,
  zonePreviewStyles,
  zoneTypeLabels,
  findBackgroundZoneForLogo,
} from './helpers';

export const TemplatePreviewDialog = ({
  open,
  onOpenChange,
  platform,
  template,
  layoutOptions,
  onSelectTemplate,
  canEdit,
  onUploadZoneMedia,
  onSelectZoneMedia,
  onUpdateTemplate,
  brandLogos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  template: SocialAssetTemplate | null;
  layoutOptions: SocialAssetTemplate[];
  onSelectTemplate: (template: SocialAssetTemplate) => void;
  canEdit: boolean;
  onUploadZoneMedia: (zoneIndex: number, file: File) => Promise<void>;
  onSelectZoneMedia: (zoneIndex: number, url: string) => void;
  onUpdateTemplate: (updates: Partial<SocialAssetTemplate>) => void;
  brandLogos?: BrandLogo[];
}) => {
  if (!template) return null;

  const templateZones = getEditableZones(platform, template, brandLogos);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [activeFrameZoneIndex, setActiveFrameZoneIndex] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [zoomLevel, setZoomLevel] = useState('100');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportScale, setExportScale] = useState<'1' | '2' | '3'>('2');
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportIncludeGuides, setExportIncludeGuides] = useState(false);
  const [exportOriginalResolution, setExportOriginalResolution] = useState(false);
  const [exportTarget, setExportTarget] = useState<'preview' | 'frames'>('preview');
  const [hasTransparentLogoFrame, setHasTransparentLogoFrame] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const safeAreaGuide = getSafeAreaGuide(platform, template);
  const frameZones = templateZones
    .map((zone, index) => ({ zone, index }))
    .filter(({ zone }) => zone.type === 'image' || zone.type === 'logo');

  useEffect(() => {
    const firstFrameIndex = frameZones[0]?.index ?? 0;
    setSelectedZoneIndex(firstFrameIndex);
    setActiveFrameZoneIndex(frameZones[0]?.index ?? null);
  }, [frameZones, template?.id, open]);

  const selectedZone = templateZones[selectedZoneIndex] || null;
  const activeFrameZone = activeFrameZoneIndex !== null ? templateZones[activeFrameZoneIndex] || null : null;

  const activeLogoBackgroundZone = activeFrameZone && activeFrameZone.type === 'logo'
    ? findBackgroundZoneForLogo(activeFrameZone, templateZones)
    : null;
  const activeLogoBackgroundUrl = activeLogoBackgroundZone?.mediaUrl;
  const [activeLogoBgLuminance, setActiveLogoBgLuminance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!activeLogoBackgroundUrl) {
      setActiveLogoBgLuminance(null);
      return;
    }
    sampleImageLuminance(activeLogoBackgroundUrl).then((value) => {
      if (!cancelled) setActiveLogoBgLuminance(value);
    });
    return () => { cancelled = true; };
  }, [activeLogoBackgroundUrl]);

  const logoMediaUrls = templateZones
    .filter((z) => z.type === 'logo' && !!z.mediaUrl)
    .map((z) => z.mediaUrl as string)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const urls = logoMediaUrls ? logoMediaUrls.split('|') : [];
    if (urls.length === 0) {
      setHasTransparentLogoFrame(false);
      return;
    }
    Promise.all(urls.map((url) => detectAssetTransparency(url).catch(() => false)))
      .then((results) => {
        if (!cancelled) setHasTransparentLogoFrame(results.some(Boolean));
      });
    return () => { cancelled = true; };
  }, [logoMediaUrls]);

  const updateZone = (zoneIndex: number, updates: Partial<SocialTemplateZone>) => {
    const nextZones = templateZones.map((zone, index) =>
      index === zoneIndex ? { ...zone, ...updates } : zone
    );
    onUpdateTemplate({ templateZones: nextZones });
  };

  const applyCropToAllFrames = () => {
    if (activeFrameZoneIndex === null) return;
    const sourceZone = templateZones[activeFrameZoneIndex];
    if (!sourceZone || (sourceZone.type !== 'image' && sourceZone.type !== 'logo')) return;

    const sourceFit = getZoneMediaFit(sourceZone);
    const nextZones = templateZones.map((zone) => (
      zone.type === 'image' || zone.type === 'logo'
        ? { ...zone, mediaFit: { ...sourceFit } }
        : zone
    ));

    onUpdateTemplate({ templateZones: nextZones });
  };

  const sanitizeFileName = (name: string) =>
    name.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'frame';

  const triggerDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  interface ExportRenderOptions {
    pixelRatio: number;
    transparent: boolean;
    includeGuides: boolean;
    originalResolution?: boolean;
  }

  const renderCanvasToDataUrl = async (
    options: ExportRenderOptions,
  ): Promise<string | null> => {
    if (!canvasRef.current) return null;
    const previousGrid = showGrid;
    const previousSafe = showSafeArea;
    if (!options.includeGuides) {
      setShowGrid(false);
      setShowSafeArea(false);
    }
    setIsExporting(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    try {
      return await toPng(canvasRef.current, {
        pixelRatio: options.pixelRatio,
        cacheBust: true,
        skipFonts: false,
        backgroundColor: options.transparent ? undefined : '#ffffff',
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          if (node.dataset.exportExclude === 'true') return false;
          if (options.transparent && node === canvasRef.current) {
            node.dataset.exportPrevBg = node.style.background || '';
            node.style.background = 'transparent';
          }
          return true;
        },
      }).finally(() => {
        if (options.transparent && canvasRef.current) {
          const prev = canvasRef.current.dataset.exportPrevBg ?? '';
          canvasRef.current.style.background = prev;
          delete canvasRef.current.dataset.exportPrevBg;
        }
      });
    } finally {
      setShowGrid(previousGrid);
      setShowSafeArea(previousSafe);
      setIsExporting(false);
    }
  };

  const handleExportPreview = async (options: ExportRenderOptions) => {
    setIsExporting(true);
    try {
      const dataUrl = await renderCanvasToDataUrl(options);
      if (!dataUrl) {
        toast.error('Preview not ready to export');
        return;
      }
      triggerDownload(dataUrl, `${sanitizeFileName(template.name)}-preview@${options.pixelRatio}x.png`);
      toast.success('Preview exported');
    } catch (err) {
      console.error('Export preview failed', err);
      toast.error('Failed to export preview');
    } finally {
      setIsExporting(false);
    }
  };

  const renderFrameAtOriginalResolution = (
    zone: SocialTemplateZone,
    transparent: boolean,
  ) => renderZoneAtOriginalResolution(zone, transparent);

  const handleExportFramesZip = async (options: ExportRenderOptions) => {
    if (frameZones.length === 0) {
      toast.error('No frames to export');
      return;
    }
    setIsExporting(true);
    try {
      const fullDataUrl = await renderCanvasToDataUrl(options);
      if (!fullDataUrl || !canvasRef.current) {
        toast.error('Preview not ready to export');
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(sanitizeFileName(template.name)) || zip;
      folder.file('preview.png', fullDataUrl.split(',')[1], { base64: true });

      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new globalThis.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = fullDataUrl;
      });

      const baseW = baseImg.width;
      const baseH = baseImg.height;
      let originalUsed = 0;
      let originalFallback = 0;

      for (let i = 0; i < frameZones.length; i++) {
        const { zone } = frameZones[i];
        const safeLabel = sanitizeFileName(zone.label || `frame-${i + 1}`);
        let cropDataUrl: string | null = null;

        const logoNeedsTransparency = zone.type === 'logo'
          && !!zone.mediaUrl
          && await detectAssetTransparency(zone.mediaUrl).catch(() => false);

        if (options.originalResolution || logoNeedsTransparency) {
          cropDataUrl = await renderFrameAtOriginalResolution(zone, options.transparent);
          if (cropDataUrl) {
            if (options.originalResolution) originalUsed += 1;
          } else if (options.originalResolution) {
            originalFallback += 1;
          }
        }

        if (!cropDataUrl) {
          const sx = Math.max(0, Math.round((zone.x / 100) * baseW));
          const sy = Math.max(0, Math.round((zone.y / 100) * baseH));
          const sw = Math.max(1, Math.round((zone.width / 100) * baseW));
          const sh = Math.max(1, Math.round((zone.height / 100) * baseH));

          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(baseImg, sx, sy, sw, sh, 0, 0, sw, sh);
          cropDataUrl = canvas.toDataURL('image/png');
        }

        folder.file(
          `${String(i + 1).padStart(2, '0')}-${safeLabel}.png`,
          cropDataUrl.split(',')[1],
          { base64: true },
        );
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const suffix = options.originalResolution ? 'orig' : `${options.pixelRatio}x`;
      triggerDownload(url, `${sanitizeFileName(template.name)}-frames@${suffix}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      if (options.originalResolution && originalFallback > 0) {
        toast.success(
          `Exported ${frameZones.length} frame${frameZones.length === 1 ? '' : 's'} (${originalUsed} at original, ${originalFallback} from preview)`,
        );
      } else {
        toast.success(`Exported ${frameZones.length} frame${frameZones.length === 1 ? '' : 's'}`);
      }
    } catch (err) {
      console.error('Export frames failed', err);
      toast.error('Failed to export frames');
    } finally {
      setIsExporting(false);
    }
  };

  const openExportDialog = (target: 'preview' | 'frames') => {
    setExportTarget(target);
    if (target === 'frames' && hasTransparentLogoFrame) {
      setExportTransparent(true);
    }
    setExportDialogOpen(true);
  };

  const runExportFromDialog = async () => {
    const options: ExportRenderOptions = {
      pixelRatio: Number(exportScale),
      transparent: exportTransparent,
      includeGuides: exportIncludeGuides,
      originalResolution: exportTarget === 'frames' && exportOriginalResolution,
    };
    setExportDialogOpen(false);
    if (exportTarget === 'preview') {
      await handleExportPreview(options);
    } else {
      await handleExportFramesZip(options);
    }
  };

  const handleZonePointerDown = (
    event: React.PointerEvent<HTMLElement>,
    zoneIndex: number,
    mode: 'move' | 'resize',
  ) => {
    if (!canEdit) return;

    event.preventDefault();
    event.stopPropagation();

    const container = event.currentTarget.closest('[data-template-canvas="true"]') as HTMLDivElement | null;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startZone = templateZones[zoneIndex];
    if (!startZone) return;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      const nextZones = templateZones.map((zone, index) => {
        if (index !== zoneIndex) return zone;

        if (mode === 'move') {
          return {
            ...zone,
            x: clampZoneValue(startZone.x + deltaX, 0, 100 - startZone.width),
            y: clampZoneValue(startZone.y + deltaY, 0, 100 - startZone.height),
          };
        }

        return {
          ...zone,
          width: clampZoneValue(startZone.width + deltaX, 8, 100 - startZone.x),
          height: clampZoneValue(startZone.height + deltaY, 6, 100 - startZone.y),
        };
      });

      onUpdateTemplate({ templateZones: nextZones });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {layoutOptions.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  Layout switcher
                </div>
                <div className="flex flex-wrap gap-2">
                  {layoutOptions.map((option) => {
                    const isActive = option.id === template.id;
                    return (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className="h-8"
                        onClick={() => onSelectTemplate(option)}
                      >
                        {option.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 overflow-hidden rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={showGrid ? 'default' : 'outline'}
                    className="h-8 gap-1.5"
                    onClick={() => setShowGrid((current) => !current)}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Grid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={showSafeArea ? 'default' : 'outline'}
                    className="h-8 gap-1.5"
                    onClick={() => setShowSafeArea((current) => !current)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Safe area
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-8 gap-1.5"
                        disabled={isExporting}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isExporting ? 'Exporting…' : 'Export'}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => openExportDialog('preview')} disabled={isExporting}>
                        <FileImage className="mr-2 h-4 w-4" />
                        Export preview (PNG)…
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openExportDialog('frames')}
                        disabled={isExporting || frameZones.length === 0}
                      >
                        <FileArchive className="mr-2 h-4 w-4" />
                        Export frames (ZIP)…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Zoom</span>
                  <Select value={zoomLevel} onValueChange={setZoomLevel}>
                    <SelectTrigger className="h-8 w-[96px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                      <SelectItem value="125">125%</SelectItem>
                      <SelectItem value="150">150%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-border bg-muted/20 p-3">
                <div
                  className="mx-auto"
                  style={{
                    width: `${Math.max(Number(zoomLevel), 100)}%`,
                    minWidth: Number(zoomLevel) < 100 ? `${zoomLevel}%` : undefined,
                  }}
                >
                  <div ref={canvasRef} data-template-canvas="true" className="relative aspect-video overflow-hidden rounded-lg bg-muted/30">
                    {template.previewImageUrl ? (
                      <img
                        src={template.previewImageUrl}
                        alt={template.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted/50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent" />

                    {showGrid && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        aria-hidden="true"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, hsl(var(--foreground) / 0.14) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.14) 1px, transparent 1px)',
                          backgroundSize: '10% 100%, 100% 10%',
                        }}
                      />
                    )}

                    {showSafeArea && (
                      <div
                        className="pointer-events-none absolute rounded border border-dashed border-primary/80 bg-primary/10"
                        aria-hidden="true"
                        style={{
                          left: `${safeAreaGuide.x}%`,
                          top: `${safeAreaGuide.y}%`,
                          width: `${safeAreaGuide.width}%`,
                          height: `${safeAreaGuide.height}%`,
                        }}
                      >
                        <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                          {safeAreaGuide.label}
                        </span>
                      </div>
                    )}

                    {templateZones.map((zone, index) => (
                      <div
                        key={`${template.id}-editor-zone-${index}`}
                        className={cn(
                          'absolute overflow-hidden rounded shadow-sm backdrop-blur-[1px] transition-all',
                          !isExporting && 'border-2 border-dashed',
                          !isExporting && zonePreviewStyles[zone.type],
                          canEdit && !isExporting && 'cursor-move',
                          !isExporting && selectedZoneIndex === index && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                        )}
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                        }}
                        onClick={() => setSelectedZoneIndex(index)}
                        onPointerDown={(event) => {
                          setSelectedZoneIndex(index);
                          if (zone.type === 'image' || zone.type === 'logo') setActiveFrameZoneIndex(index);
                          handleZonePointerDown(event, index, 'move');
                        }}
                      >
                        {(zone.type === 'image' || zone.type === 'logo') && zone.mediaUrl ? (
                          <img
                            src={zone.mediaUrl}
                            alt={zone.label}
                            className="absolute inset-0 h-full w-full"
                            style={{
                              objectFit: getZoneMediaFit(zone).fit,
                              objectPosition: `${getZoneMediaFit(zone).focusX}% ${getZoneMediaFit(zone).focusY}%`,
                            }}
                          />
                        ) : null}
                        {!isExporting && (
                          <div
                            data-export-exclude="true"
                            className="relative flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium leading-tight"
                          >
                            <span className="truncate">{zone.content || zone.label}</span>
                          </div>
                        )}
                        {canEdit && zone.type !== 'image' && !isExporting && (
                          <button
                            type="button"
                            data-export-exclude="true"
                            className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-border bg-background shadow-sm"
                            onPointerDown={(event) => {
                              setSelectedZoneIndex(index);
                              handleZonePointerDown(event, index, 'resize');
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {templateZones.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {templateZones.map((zone, index) => (
                  <button
                    key={`${template.id}-detail-${index}`}
                    type="button"
                    onClick={() => setSelectedZoneIndex(index)}
                    className={cn(
                      'rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:border-primary/40',
                      selectedZoneIndex === index ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{zone.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{zone.type.toUpperCase()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Zone editor</p>
              <p className="text-xs text-muted-foreground">
                {selectedZone ? `${selectedZone.label} · ${selectedZone.type}` : 'Select a zone'}
              </p>
            </div>

            <div className="space-y-4 p-4">
              {frameZones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    Frame manager
                  </div>
                  <div className="space-y-2">
                    {frameZones.map(({ zone, index }) => {
                      const isSelected = activeFrameZoneIndex === index;
                      return (
                        <button
                          key={`${template.id}-frame-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedZoneIndex(index);
                            setActiveFrameZoneIndex(index);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary/40',
                            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{zone.label}</p>
                            <p className="text-[11px] text-muted-foreground">{zoneTypeLabels[zone.type]}</p>
                          </div>
                          <div className="shrink-0 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                            {Math.round(zone.width)} × {Math.round(zone.height)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeFrameZone && (activeFrameZone.type === 'image' || activeFrameZone.type === 'logo') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {activeFrameZone.label} · {zoneTypeLabels[activeFrameZone.type]}
                    </p>
                    {frameZones.length > 1 && canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={applyCropToAllFrames}
                      >
                        Apply to all frames
                      </Button>
                    )}
                  </div>
                  {canEdit && activeFrameZoneIndex !== null && (
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                        <Upload className="h-3 w-3" />
                        Upload media
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void onUploadZoneMedia(activeFrameZoneIndex, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <ImageLibraryPicker
                        onSelect={(url) => onSelectZoneMedia(activeFrameZoneIndex, url)}
                        trigger={
                          <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5">
                            <FolderOpen className="h-3 w-3" />
                            Library
                          </Button>
                        }
                        defaultCategory="Backgrounds"
                      />
                    </div>
                  )}
                  {canEdit
                    && activeFrameZoneIndex !== null
                    && activeFrameZone.type === 'logo'
                    && (brandLogos?.length ?? 0) > 0 && (
                      <BrandLogoVariantPicker
                        brandLogos={brandLogos}
                        selectedUrl={activeFrameZone.mediaUrl}
                        backgroundUrl={activeLogoBackgroundZone?.mediaUrl}
                        autoMatchedLogoId={activeFrameZone.autoMatchedLogoId}
                        onSelect={(url) => onSelectZoneMedia(activeFrameZoneIndex!, url)}
                      />
                    )}
                  <SlotFitControl
                    previewUrl={activeFrameZone.mediaUrl || template.previewImageUrl}
                    assetType={activeFrameZone.mediaUrl ? 'image' : 'empty'}
                    value={getZoneMediaFit(activeFrameZone)}
                    onChange={(next) => updateZone(activeFrameZoneIndex!, { mediaFit: next })}
                    onCommit={(next) => updateZone(activeFrameZoneIndex!, { mediaFit: next })}
                    onReset={() => updateZone(activeFrameZoneIndex!, { mediaFit: defaultTemplatePreviewFit })}
                  />
                </div>
              )}

              {selectedZone ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Label</label>
                    <Input
                      value={selectedZone.label}
                      onChange={(e) => updateZone(selectedZoneIndex, { label: e.target.value })}
                      className="h-8"
                    />
                  </div>

                {(selectedZone.type === 'text' || selectedZone.type === 'cta') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Content</label>
                    <Textarea
                      value={selectedZone.content || ''}
                      onChange={(e) => updateZone(selectedZoneIndex, { content: e.target.value })}
                      placeholder="Enter editable text"
                      className="min-h-[92px]"
                    />
                  </div>
                )}

                {(selectedZone.type === 'image' || selectedZone.type === 'logo') && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Media URL</label>
                    <Input
                      value={selectedZone.mediaUrl || ''}
                      onChange={(e) => updateZone(selectedZoneIndex, { mediaUrl: e.target.value })}
                      placeholder="Paste media or logo URL"
                      className="h-8"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Width %</label>
                    <Input
                      type="number"
                      min={8}
                      max={100}
                      value={Math.round(selectedZone.width)}
                      onChange={(e) => updateZone(selectedZoneIndex, {
                        width: clampZoneValue(Number(e.target.value) || selectedZone.width, 8, 100 - selectedZone.x),
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Height %</label>
                    <Input
                      type="number"
                      min={6}
                      max={100}
                      value={Math.round(selectedZone.height)}
                      onChange={(e) => updateZone(selectedZoneIndex, {
                        height: clampZoneValue(Number(e.target.value) || selectedZone.height, 6, 100 - selectedZone.y),
                      })}
                      className="h-8"
                    />
                  </div>
                </div>

                  {(selectedZone.type === 'text' || selectedZone.type === 'cta') && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Alignment</label>
                      <Select
                        value={selectedZone.align || 'center'}
                        onValueChange={(value) => updateZone(selectedZoneIndex, { align: value as SocialTemplateZone['align'] })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Click a zone to edit it.</div>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export options</DialogTitle>
          <DialogDescription>
            {exportTarget === 'preview'
              ? 'Configure how the preview PNG is rendered.'
              : 'Configure how the ZIP archive of frame assets is rendered.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {(() => {
            const scaleDisabled = exportTarget === 'frames' && exportOriginalResolution;
            return (
              <div className={cn('space-y-2', scaleDisabled && 'opacity-50 pointer-events-none')}>
                <Label className="text-sm font-medium">PNG scale</Label>
                <RadioGroup
                  value={exportScale}
                  onValueChange={(value) => setExportScale(value as '1' | '2' | '3')}
                  className="grid grid-cols-3 gap-2"
                >
                  {(['1', '2', '3'] as const).map((scale) => (
                    <Label
                      key={scale}
                      htmlFor={`export-scale-${scale}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent',
                        exportScale === scale && 'border-primary bg-accent'
                      )}
                    >
                      <RadioGroupItem id={`export-scale-${scale}`} value={scale} className="sr-only" />
                      <span className="font-medium">{scale}x</span>
                    </Label>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {scaleDisabled
                    ? 'Scale is ignored when exporting at original media resolution.'
                    : 'Higher scales produce sharper images at larger file sizes.'}
                </p>
              </div>
            );
          })()}

          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="export-transparent" className="text-sm font-medium">
                Transparent background
              </Label>
              <p className="text-xs text-muted-foreground">
                Export with a transparent canvas instead of the template background.
              </p>
              {exportTarget === 'frames' && hasTransparentLogoFrame && (
                <p className="text-xs font-medium text-primary">
                  Recommended — this template includes transparent logo assets that
                  will keep their alpha channel when exported individually.
                </p>
              )}
            </div>
            <Switch
              id="export-transparent"
              checked={exportTransparent}
              onCheckedChange={setExportTransparent}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="export-guides" className="text-sm font-medium">
                Include guides
              </Label>
              <p className="text-xs text-muted-foreground">
                Render the grid and safe-area overlays in the exported file.
              </p>
            </div>
            <Switch
              id="export-guides"
              checked={exportIncludeGuides}
              onCheckedChange={setExportIncludeGuides}
            />
          </div>

          {exportTarget === 'frames' && (
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="export-original" className="text-sm font-medium">
                  Original media resolution
                </Label>
                <p className="text-xs text-muted-foreground">
                  Render each frame from its source image at full native resolution
                  instead of the preview canvas. Frames without bound media fall back
                  to the preview slice.
                </p>
              </div>
              <Switch
                id="export-original"
                checked={exportOriginalResolution}
                onCheckedChange={setExportOriginalResolution}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportDialogOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={runExportFromDialog} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : exportTarget === 'preview' ? 'Export PNG' : 'Export ZIP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
