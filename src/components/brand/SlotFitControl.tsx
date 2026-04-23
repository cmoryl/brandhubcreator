/**
 * SlotFitControl
 *
 * Compact crop/fit editor for a single layout-template slot:
 *   - Cover / Contain toggle (object-fit)
 *   - Focal point picker — click anywhere on the thumbnail to set object-position
 *   - Reset to default (50/50, cover)
 *
 * Designed for use inside the LayoutTemplateEditor "Slots" tab.
 * Pure controlled component: parent owns the override value.
 */
import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { defaultSlotFit } from '@/lib/brandLayoutTemplates';

export interface SlotFit {
  fit: 'cover' | 'contain';
  focusX: number; // 0–100
  focusY: number; // 0–100
}

interface SlotFitControlProps {
  /** Preview thumbnail URL (image still or video poster). Empty slots render a placeholder. */
  previewUrl?: string;
  /** Asset kind for icon hint. */
  assetType: 'image' | 'video' | 'empty';
  value?: SlotFit;
  onChange: (next: SlotFit) => void;
  /** Reset removes the override entirely. */
  onReset?: () => void;
}

export const SlotFitControl = ({
  previewUrl,
  assetType,
  value,
  onChange,
  onReset,
}: SlotFitControlProps) => {
  const fit: SlotFit = value ?? defaultSlotFit;
  const thumbRef = useRef<HTMLDivElement>(null);

  const setFromPointer = (clientX: number, clientY: number) => {
    const node = thumbRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onChange({ ...fit, focusX: Math.round(x), focusY: Math.round(y) });
  };

  const isDefault = fit.fit === 'cover' && fit.focusX === 50 && fit.focusY === 50;

  return (
    <div className="rounded-md border border-border bg-background/50 p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Crop & fit
        </span>
        <div className="flex items-center gap-1">
          {(['cover', 'contain'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...fit, fit: mode })}
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                fit.fit === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {mode === 'cover' ? 'Cover' : 'Contain'}
            </button>
          ))}
          {!isDefault && onReset && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={onReset}
              aria-label="Reset crop"
              title="Reset crop"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Focal point picker */}
      <div
        ref={thumbRef}
        role="button"
        tabIndex={0}
        aria-label="Set focal point"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          setFromPointer(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 5;
          if (e.key === 'ArrowLeft') onChange({ ...fit, focusX: Math.max(0, fit.focusX - step) });
          else if (e.key === 'ArrowRight') onChange({ ...fit, focusX: Math.min(100, fit.focusX + step) });
          else if (e.key === 'ArrowUp') onChange({ ...fit, focusY: Math.max(0, fit.focusY - step) });
          else if (e.key === 'ArrowDown') onChange({ ...fit, focusY: Math.min(100, fit.focusY + step) });
        }}
        className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{
          background: fit.fit === 'contain' ? 'hsl(var(--muted))' : undefined,
        }}
      >
        {previewUrl && assetType !== 'empty' ? (
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
            style={{ objectFit: fit.fit, objectPosition: `${fit.focusX}% ${fit.focusY}%` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No preview
          </div>
        )}

        {/* Crosshair indicator */}
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 shadow-[0_0_0_1px_hsl(var(--background))]"
          style={{ left: `${fit.focusX}%`, top: `${fit.focusY}%` }}
        />
        {/* Coordinate readout */}
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-background/80 px-1 py-0.5 text-[9px] font-mono text-muted-foreground">
          {fit.focusX}, {fit.focusY}
        </span>
      </div>
    </div>
  );
};

export default SlotFitControl;
