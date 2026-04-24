/**
 * Generic templated single-page canvas editor.
 *
 * Renders a fixed-aspect canvas with absolutely-positioned, draggable, and
 * resizable zones (image / logo / text / cta). Designed to be reused across
 * Case Studies, Brochures, Digital Collateral and Event Print Collateral
 * single-page assets so they all share the same logo-aware, transparency-
 * preserving export pipeline as Social Assets.
 *
 * The component is intentionally headless about persistence — callers own the
 * `zones` array and receive change callbacks. Media binding (upload, library
 * picker, brand-logo variants with auto-match scoring) is built in.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import {
  TemplateZoneLike,
  TemplateZoneType,
  defaultTemplatePreviewFit,
  getZoneMediaFit,
  findBackgroundZoneForLogo,
  autoMatchLogosForZones,
  pickDefaultBrandLogoUrl,
  pickDefaultBrandLogo,
} from '@/lib/templateZonePipeline';
import type { BrandLogo } from '@/types/brand';
import { BrandLogoVariantPicker } from './BrandLogoVariantPicker';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CanvasEditorZone extends TemplateZoneLike {
  /** Stable id used as React key. */
  id: string;
  label: string;
  content?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TemplateCanvasEditorProps {
  zones: CanvasEditorZone[];
  onZonesChange: (zones: CanvasEditorZone[]) => void;
  /** Aspect ratio for the canvas (e.g. '16/9', '4/3', '1/1'). Defaults to 16/9. */
  aspect?: string;
  /** Background image painted behind all zones. */
  backgroundUrl?: string;
  /** Brand logo library — drives the variant picker and background-aware auto-matching. */
  brandLogos?: BrandLogo[];
  /** Optional async upload — receives a File, returns the persisted URL (or null). */
  onUploadFile?: (file: File) => Promise<string | null>;
  /** When false, the editor renders read-only (no drag, no controls, no chrome). */
  canEdit?: boolean;
  /** When true, hides editor chrome (selection ring, handles, dashed borders) for export. */
  isExporting?: boolean;
  className?: string;
}

const zonePreviewStyles: Record<TemplateZoneType, string> = {
  image: 'border-primary/60 bg-primary/5 text-primary-foreground',
  text: 'border-accent/60 bg-accent/5 text-accent-foreground',
  logo: 'border-secondary/60 bg-secondary/5 text-secondary-foreground',
  cta: 'border-amber-500/60 bg-amber-500/5 text-amber-700 dark:text-amber-200',
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TemplateCanvasEditor = ({
  zones,
  onZonesChange,
  aspect = '16 / 9',
  backgroundUrl,
  brandLogos,
  onUploadFile,
  canEdit = true,
  isExporting = false,
  className,
}: TemplateCanvasEditorProps) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const [activeLogoBgLuminance, setActiveLogoBgLuminance] = useState<number | null>(null);

  const selectedZone = selectedZoneIndex !== null ? zones[selectedZoneIndex] : null;

  // Resolve the background URL sitting behind the active logo zone (if any) so
  // the reusable picker can sample its luminance and rank variants.
  const activeLogoBackgroundUrl = useMemo(() => {
    if (!selectedZone || selectedZone.type !== 'logo') return undefined;
    const bgZone = findBackgroundZoneForLogo(selectedZone, zones);
    return bgZone?.mediaUrl || backgroundUrl;
  }, [selectedZone, zones, backgroundUrl]);

  // -------------------------------------------------------------------------
  // Mutators
  // -------------------------------------------------------------------------

  const updateZone = useCallback((index: number, updates: Partial<CanvasEditorZone>) => {
    const next = zones.map((zone, i) => (i === index ? { ...zone, ...updates } : zone));
    onZonesChange(next);
  }, [zones, onZonesChange]);

  /** Update a logo zone's media; clears auto-match marker so user choice sticks. */
  const setZoneLogoUrl = useCallback((index: number, url: string) => {
    const next = zones.map((zone, i) => {
      if (i !== index) return zone;
      const updated: CanvasEditorZone = { ...zone, mediaUrl: url };
      // Manual selection: drop the auto-match marker so the matcher stops swapping.
      if (updated.autoMatchedLogoId) delete updated.autoMatchedLogoId;
      return updated;
    });
    onZonesChange(next);
  }, [zones, onZonesChange]);

  /** Update an image zone's media + run logo auto-matcher against new background. */
  const setZoneImageUrl = useCallback(async (index: number, url: string) => {
    const baseNext = zones.map((zone, i) => (
      i === index ? { ...zone, mediaUrl: url } : zone
    ));
    const { zones: matched, changed } = await autoMatchLogosForZones(baseNext, brandLogos);
    onZonesChange(changed ? matched : baseNext);
  }, [zones, brandLogos, onZonesChange]);

  const handleZoneMediaUpload = useCallback(async (index: number, file: File) => {
    if (!onUploadFile) return;
    const url = await onUploadFile(file);
    if (!url) return;
    const zone = zones[index];
    if (zone.type === 'logo') setZoneLogoUrl(index, url);
    else await setZoneImageUrl(index, url);
  }, [onUploadFile, zones, setZoneLogoUrl, setZoneImageUrl]);

  const handleZoneMediaUrl = useCallback(async (index: number, url: string) => {
    const zone = zones[index];
    if (zone.type === 'logo') setZoneLogoUrl(index, url);
    else await setZoneImageUrl(index, url);
  }, [zones, setZoneLogoUrl, setZoneImageUrl]);

  // -------------------------------------------------------------------------
  // Drag + resize via pointer events
  // -------------------------------------------------------------------------

  const handlePointerDown = useCallback((
    event: React.PointerEvent<HTMLElement>,
    zoneIndex: number,
    mode: 'move' | 'resize',
  ) => {
    if (!canEdit) return;
    event.preventDefault();
    event.stopPropagation();

    const container = canvasRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startZone = zones[zoneIndex];
    if (!startZone) return;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      const next = zones.map((zone, i) => {
        if (i !== zoneIndex) return zone;
        if (mode === 'move') {
          return {
            ...zone,
            x: clamp(startZone.x + deltaX, 0, 100 - startZone.width),
            y: clamp(startZone.y + deltaY, 0, 100 - startZone.height),
          };
        }
        return {
          ...zone,
          width: clamp(startZone.width + deltaX, 8, 100 - startZone.x),
          height: clamp(startZone.height + deltaY, 6, 100 - startZone.y),
        };
      });
      onZonesChange(next);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [canEdit, zones, onZonesChange]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const usableLogos = useMemo(
    () => (brandLogos || []).filter((logo) => !!logo.url),
    [brandLogos],
  );

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]', className)}>
      {/* Canvas */}
      <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-3">
        <div
          ref={canvasRef}
          data-template-canvas="true"
          className="relative w-full overflow-hidden rounded-lg bg-muted/30"
          style={{ aspectRatio: aspect }}
          onClick={() => setSelectedZoneIndex(null)}
        >
          {backgroundUrl ? (
            <img
              src={backgroundUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-muted/40" />
          )}

          {zones.map((zone, index) => {
            const fit = getZoneMediaFit(zone);
            const isSelected = !isExporting && selectedZoneIndex === index;
            return (
              <div
                key={zone.id}
                className={cn(
                  'absolute overflow-hidden rounded transition-all',
                  !isExporting && 'border-2 border-dashed shadow-sm',
                  !isExporting && zonePreviewStyles[zone.type],
                  canEdit && !isExporting && 'cursor-move',
                  isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                )}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedZoneIndex(index);
                }}
                onPointerDown={(event) => {
                  setSelectedZoneIndex(index);
                  handlePointerDown(event, index, 'move');
                }}
              >
                {(zone.type === 'image' || zone.type === 'logo') && zone.mediaUrl ? (
                  <img
                    src={zone.mediaUrl}
                    alt={zone.label}
                    className="absolute inset-0 h-full w-full"
                    style={{
                      objectFit: fit.fit,
                      objectPosition: `${fit.focusX}% ${fit.focusY}%`,
                    }}
                  />
                ) : null}

                {(zone.type === 'text' || zone.type === 'cta') && (
                  <div
                    className={cn(
                      'relative flex h-full w-full items-center px-3 text-xs font-medium leading-snug text-foreground',
                      zone.align === 'left' && 'justify-start text-left',
                      zone.align === 'right' && 'justify-end text-right',
                      (!zone.align || zone.align === 'center') && 'justify-center text-center',
                    )}
                  >
                    <span className="line-clamp-3">{zone.content || zone.label}</span>
                  </div>
                )}

                {!isExporting && (zone.type === 'image' || zone.type === 'logo') && !zone.mediaUrl && (
                  <div
                    data-export-exclude="true"
                    className="relative flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    <span className="truncate">{zone.label}</span>
                  </div>
                )}

                {canEdit && !isExporting && (
                  <button
                    type="button"
                    aria-label={`Resize ${zone.label}`}
                    data-export-exclude="true"
                    className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-border bg-background shadow-sm"
                    onPointerDown={(event) => {
                      setSelectedZoneIndex(index);
                      handlePointerDown(event, index, 'resize');
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      {canEdit && (
        <aside className="space-y-3 rounded-xl border border-border bg-card p-3">
          {!selectedZone && (
            <p className="text-xs text-muted-foreground">
              Click a zone to edit its label, media, or position.
            </p>
          )}

          {selectedZone && selectedZoneIndex !== null && (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {selectedZone.type} zone
                </p>
                <Input
                  value={selectedZone.label}
                  onChange={(e) => updateZone(selectedZoneIndex, { label: e.target.value })}
                  className="mt-1 h-8"
                  placeholder="Zone label"
                />
              </div>

              {/* Media binding for image / logo zones */}
              {(selectedZone.type === 'image' || selectedZone.type === 'logo') && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {onUploadFile && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                        <Upload className="h-3 w-3" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleZoneMediaUpload(selectedZoneIndex, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    <ImageLibraryPicker
                      onSelect={(url) => void handleZoneMediaUrl(selectedZoneIndex, url)}
                      trigger={
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5">
                          <FolderOpen className="h-3 w-3" />
                          Library
                        </Button>
                      }
                      defaultCategory="Backgrounds"
                    />
                  </div>

                  {selectedZone.mediaUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-muted-foreground"
                      onClick={() => updateZone(selectedZoneIndex, { mediaUrl: undefined })}
                    >
                      Remove media
                    </Button>
                  )}
                </div>
              )}

              {/* Logo variant picker with background-aware ranking */}
              {selectedZone.type === 'logo' && usableLogos.length > 0 && (() => {
                const bgLum = activeLogoBgLuminance;
                const bgTone = bgLum !== null ? describeBackgroundTone(bgLum) : null;
                const ranked = usableLogos
                  .map((logo) => ({
                    logo,
                    score: bgLum !== null ? scoreLogoForBackground(logo.variant, bgLum) : 0.5,
                  }))
                  .sort((a, b) => b.score - a.score);
                const topScore = ranked[0]?.score ?? 0;
                return (
                  <div className="space-y-1.5 rounded-lg border border-dashed border-border bg-muted/10 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Brand logo variants
                      </p>
                      {bgTone && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span
                            className={cn(
                              'h-2.5 w-2.5 rounded-full border border-border',
                              bgTone === 'dark' && 'bg-foreground',
                              bgTone === 'light' && 'bg-background',
                              bgTone === 'mid' && 'bg-muted',
                            )}
                          />
                          {bgTone === 'dark' ? 'Dark' : bgTone === 'light' ? 'Light' : 'Mid-tone'} background
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ranked.map(({ logo, score }) => {
                        const isActive = selectedZone.mediaUrl === logo.url;
                        const isRecommended = bgLum !== null && score === topScore && score >= 0.7;
                        const isPoorMatch = bgLum !== null && score < 0.3;
                        return (
                          <button
                            key={logo.id}
                            type="button"
                            title={`${logo.name} (${logo.variant})${
                              isRecommended ? ' — recommended for this background'
                              : isPoorMatch ? ' — low contrast on this background' : ''
                            }`}
                            onClick={() => setZoneLogoUrl(selectedZoneIndex!, logo.url)}
                            className={cn(
                              'relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-md border p-1 transition-colors',
                              logo.variant === 'reversed' || logo.variant === 'monochrome'
                                ? 'bg-foreground'
                                : 'bg-background',
                              isActive
                                ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background'
                                : isRecommended
                                  ? 'border-primary/60 hover:border-primary'
                                  : 'border-border hover:border-primary/40',
                              isPoorMatch && !isActive && 'opacity-50',
                            )}
                          >
                            <img
                              src={logo.url}
                              alt={logo.name}
                              className="max-h-full max-w-full object-contain"
                            />
                            {isRecommended && (
                              <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1 text-[8px] font-semibold leading-3 text-primary-foreground shadow">
                                ★
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Text content */}
              {(selectedZone.type === 'text' || selectedZone.type === 'cta') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Content</label>
                  <Textarea
                    value={selectedZone.content || ''}
                    onChange={(e) => updateZone(selectedZoneIndex, { content: e.target.value })}
                    placeholder="Editable text"
                    className="min-h-[72px] text-xs"
                  />
                </div>
              )}

              {/* Position numerics */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">W %</label>
                  <Input
                    type="number"
                    min={8}
                    max={100}
                    value={Math.round(selectedZone.width)}
                    onChange={(e) => updateZone(selectedZoneIndex, {
                      width: clamp(Number(e.target.value) || selectedZone.width, 8, 100 - selectedZone.x),
                    })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">H %</label>
                  <Input
                    type="number"
                    min={6}
                    max={100}
                    value={Math.round(selectedZone.height)}
                    onChange={(e) => updateZone(selectedZoneIndex, {
                      height: clamp(Number(e.target.value) || selectedZone.height, 6, 100 - selectedZone.y),
                    })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: hydrate a default zone array with brand logos pre-applied (and
// tagged for auto-matching). Sections that ship default templates can use this
// to ensure logo zones have a real logo on first paint.
// ---------------------------------------------------------------------------

export const hydrateZoneDefaults = <Z extends CanvasEditorZone>(
  zones: Z[],
  brandLogos?: BrandLogo[],
): Z[] => {
  const defaultLogo = pickDefaultBrandLogo(brandLogos);
  const defaultLogoUrl = pickDefaultBrandLogoUrl(brandLogos);
  return zones.map((zone) => {
    if (zone.type !== 'logo') return zone;
    if (zone.mediaUrl) return zone;
    if (!defaultLogoUrl) return zone;
    return {
      ...zone,
      mediaUrl: defaultLogoUrl,
      mediaFit: zone.mediaFit || { ...defaultTemplatePreviewFit, fit: 'contain' },
      autoMatchedLogoId: defaultLogo?.id,
    };
  });
};
