/**
 * Shared canvas renderer for a brand layout template (with optional copy + customization).
 * Used by the gallery preview, the customization editor, and the export utility.
 */
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import {
  applyCustomization,
  expressionStateColor,
  gradientBlurOverlayStyle,
  type BrandLayoutTemplate,
  type LayoutTemplateCustomization,
  type ResolvedSlot,
} from '@/lib/brandLayoutTemplates';
import { Image as ImageIcon, Film } from 'lucide-react';

export interface LayoutTemplateCanvasProps {
  template: BrandLayoutTemplate;
  resolved: ResolvedSlot[];
  customization?: LayoutTemplateCustomization;
  /** When true, renders only finished layout (no slot chips/dashed boxes) — used for export. */
  presentationMode?: boolean;
  className?: string;
  /** Optional brand colours for the overlay text. */
  primaryColor?: string;
}

export const LayoutTemplateCanvas = forwardRef<HTMLDivElement, LayoutTemplateCanvasProps>(
  (
    { template, resolved, customization, presentationMode = false, className, primaryColor },
    ref,
  ) => {
    const merged = applyCustomization(template, customization);
    const copy = customization?.copy;

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-md border border-border bg-muted/30',
          className,
        )}
        style={{ aspectRatio: merged.aspectRatio }}
      >
        {resolved.map(({ slot, asset }) => {
          const pos = slot.position ?? { x: 0, y: 0, width: 100, height: 100 };
          const fit = customization?.slotFitOverrides?.[slot.key] ?? {
            fit: 'cover' as const,
            focusX: 50,
            focusY: 50,
          };
          const mediaStyle: React.CSSProperties = {
            objectFit: fit.fit,
            objectPosition: `${fit.focusX}% ${fit.focusY}%`,
          };
          return (
            <div
              key={slot.key}
              className="absolute overflow-hidden"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.width}%`,
                height: `${pos.height}%`,
                // contain mode benefits from a subtle backdrop so letterboxing isn't pure white
                background: fit.fit === 'contain' ? 'hsl(var(--muted))' : undefined,
              }}
            >
              {asset.type === 'image' && (
                <img
                  src={asset.url}
                  alt={slot.label}
                  className="h-full w-full"
                  style={mediaStyle}
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              )}
              {asset.type === 'video' && (
                <video
                  src={asset.url}
                  className="h-full w-full"
                  style={mediaStyle}
                  autoPlay
                  muted
                  loop
                  playsInline
                  crossOrigin="anonymous"
                />
              )}
              {asset.type === 'empty' && (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed text-[10px]"
                  style={{
                    borderColor: expressionStateColor[slot.expressionState],
                    background: `${expressionStateColor[slot.expressionState]}14`,
                    color: expressionStateColor[slot.expressionState],
                  }}
                >
                  <ImageIcon className="h-3 w-3" />
                  <span>{slot.expressionState}</span>
                </div>
              )}

              {!presentationMode && (
                <div className="absolute left-1 top-1 flex items-center gap-1">
                  <span
                    className="rounded px-1 py-0.5 text-[9px] font-medium text-white shadow-sm"
                    style={{ background: `${expressionStateColor[slot.expressionState]}cc` }}
                  >
                    {asset.type === 'video' ? (
                      <Film className="inline h-2.5 w-2.5" />
                    ) : (
                      <ImageIcon className="inline h-2.5 w-2.5" />
                    )}{' '}
                    {slot.expressionState}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Overlay copy */}
        {merged.overlay?.eyebrow && (copy?.eyebrow || presentationMode) && (
          <div
            className="pointer-events-none absolute left-0 right-0 px-[6%]"
            style={{ top: `${merged.overlay.eyebrow.y}%` }}
          >
            <p
              className={cn(
                'text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 drop-shadow',
                merged.overlay.eyebrow.align === 'center' && 'text-center',
                merged.overlay.eyebrow.align === 'right' && 'text-right',
              )}
              style={{ color: primaryColor }}
            >
              {copy?.eyebrow ?? 'Eyebrow'}
            </p>
          </div>
        )}

        {merged.overlay?.headline && (
          <div
            className="pointer-events-none absolute left-0 right-0 px-[6%]"
            style={{ top: `${merged.overlay.headline.y}%` }}
          >
            {copy?.headline ? (
              <h2
                className={cn(
                  'text-[clamp(0.95rem,3vw,2.25rem)] font-bold leading-tight text-white drop-shadow-md',
                  merged.overlay.headline.align === 'center' && 'text-center',
                  merged.overlay.headline.align === 'right' && 'text-right',
                )}
              >
                {copy.headline}
              </h2>
            ) : (
              !presentationMode && (
                <div
                  className={cn(
                    'h-1.5 w-3/5 rounded bg-foreground/40',
                    merged.overlay.headline.align === 'center' && 'mx-auto',
                    merged.overlay.headline.align === 'right' && 'ml-auto',
                  )}
                />
              )
            )}
          </div>
        )}

        {merged.overlay?.cta && copy?.cta && (
          <div
            className="pointer-events-none absolute left-0 right-0 px-[6%]"
            style={{
              top: `${(merged.overlay.headline?.y ?? 70) + 12}%`,
              textAlign: merged.overlay.headline?.align ?? 'left',
            }}
          >
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow"
              style={{ background: primaryColor ?? 'hsl(229 100% 39%)' }}
            >
              {copy.cta}
            </span>
          </div>
        )}
      </div>
    );
  },
);

LayoutTemplateCanvas.displayName = 'LayoutTemplateCanvas';
