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

import { useCallback, useMemo, useRef, useState } from 'react';
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
import type { ZoneSeedMode } from '@/hooks/useZoneSeedMode';
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
  /** Set by `hydrateZoneDefaults` when seed mode === 'ai' so the editor can
   *  asynchronously replace the placeholder lorem with brand-aware AI copy. */
  _seedPending?: boolean;
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
              {selectedZone.type === 'logo' && (
                <BrandLogoVariantPicker
                  brandLogos={brandLogos}
                  selectedUrl={selectedZone.mediaUrl}
                  backgroundUrl={activeLogoBackgroundUrl}
                  autoMatchedLogoId={selectedZone.autoMatchedLogoId}
                  onSelect={(url) => setZoneLogoUrl(selectedZoneIndex!, url)}
                />
              )}

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
// Helper: pick a sensible piece of demo copy for an empty text / CTA zone so
// new templated assets render with realistic content instead of the raw zone
// label. Match is keyword-based on the zone label and falls back to a generic
// per-type default.
// ---------------------------------------------------------------------------

const demoTextByKeyword: Array<{ test: RegExp; text: string }> = [
  { test: /head(line|er)|title/i, text: 'Bold headline that anchors the story' },
  { test: /sub(head|title)|tagline/i, text: 'A short supporting line that frames the message' },
  { test: /body|description|paragraph|copy|text/i, text: 'Lorem ipsum supporting copy that explains the value, the audience and the outcome in two or three sentences.' },
  { test: /quote|testimonial/i, text: '"This partnership transformed how we go to market." — Client Name, Title' },
  { test: /stat|metric|number|kpi/i, text: '+42% lift in qualified pipeline' },
  { test: /date|when/i, text: 'Q4 2025' },
  { test: /location|where|venue/i, text: 'New York, NY' },
  { test: /name|author|by/i, text: 'Jane Doe, Brand Lead' },
];

const demoCtaByKeyword: Array<{ test: RegExp; text: string }> = [
  { test: /learn|read more|details/i, text: 'Learn more' },
  { test: /download|pdf|brochure/i, text: 'Download PDF' },
  { test: /register|rsvp|sign ?up/i, text: 'Register now' },
  { test: /contact|talk|reach/i, text: 'Get in touch' },
  { test: /case|story/i, text: 'Read the full case study' },
  { test: /demo|trial/i, text: 'Request a demo' },
];

const pickLoremContent = (zone: CanvasEditorZone): string | undefined => {
  if (zone.type !== 'text' && zone.type !== 'cta') return undefined;
  const label = zone.label || '';
  const table = zone.type === 'cta' ? demoCtaByKeyword : demoTextByKeyword;
  const match = table.find((entry) => entry.test.test(label));
  if (match) return match.text;
  // Generic fallbacks so the zone never renders as just its label.
  if (zone.type === 'cta') return 'Learn more';
  return 'Lorem ipsum supporting copy that explains the value, the audience and the outcome in two or three sentences.';
};

/**
 * @deprecated Use `pickLoremContent` directly, or call `hydrateZoneDefaults`
 * with an explicit `mode`. Kept for backwards compatibility.
 */
const pickDemoContent = pickLoremContent;
void pickDemoContent;

// ---------------------------------------------------------------------------
// Helper: hydrate a default zone array with brand logos pre-applied (and
// tagged for auto-matching) plus demo copy for empty text / CTA zones.
// Sections that ship default templates can use this so new assets always
// render with realistic content on first paint.
//
// `mode` controls how empty text / CTA zones are seeded:
//   - 'lorem' (default): synchronously seed curated keyword-matched copy.
//   - 'blank' : leave content undefined.
//   - 'ai'    : seed lorem as an immediate placeholder AND tag the zone with
//               `_seedPending: true` so the editor can replace it with
//               brand-aware AI copy on mount.
// ---------------------------------------------------------------------------

export const hydrateZoneDefaults = <Z extends CanvasEditorZone>(
  zones: Z[],
  brandLogos?: BrandLogo[],
  mode: ZoneSeedMode = 'lorem',
): Z[] => {
  const defaultLogo = pickDefaultBrandLogo(brandLogos);
  const defaultLogoUrl = pickDefaultBrandLogoUrl(brandLogos);
  return zones.map((zone) => {
    // Seed demo copy for empty text / CTA zones based on mode.
    if ((zone.type === 'text' || zone.type === 'cta') && !zone.content) {
      if (mode === 'lorem' || mode === 'ai') {
        const demo = pickLoremContent(zone);
        if (demo) zone = { ...zone, content: demo };
      }
      if (mode === 'ai') {
        zone = { ...zone, _seedPending: true } as Z;
      }
    }
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
