/**
 * SlotPresetsPanel
 *
 * Browse, apply, save, and delete reusable slot configurations. Renders a
 * compact card grid of presets with mini visual previews built from each
 * preset's slot positions. Used inside the Layout Templates gallery.
 */
import { useMemo, useState } from 'react';
import { Layers, Plus, Trash2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  expressionStateColor,
  type LayoutSlot,
} from '@/lib/brandLayoutTemplates';
import type { SlotPreset } from '@/lib/slotPresets';

interface SlotPresetsPanelProps {
  presets: SlotPreset[];
  onApply: (preset: SlotPreset) => void;
  onDelete: (id: string) => void;
  /** Optional callback that opens a "save current template as preset" flow.
   *  When provided, a "Save current" button is rendered. */
  onSaveCurrent?: () => void;
  className?: string;
}

const PresetThumbnail = ({
  slots,
  aspectRatio,
}: {
  slots: LayoutSlot[];
  aspectRatio: number;
}) => (
  <div
    className="relative w-full overflow-hidden rounded-md border border-border bg-muted/40"
    style={{ aspectRatio }}
  >
    {slots.map((slot) => {
      const pos = slot.position ?? { x: 0, y: 0, width: 100, height: 100 };
      const tint = expressionStateColor[slot.expressionState];
      return (
        <div
          key={slot.key}
          className="absolute rounded-[2px]"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${pos.width}%`,
            height: `${pos.height}%`,
            background: tint,
            opacity: 0.35,
            border: `1px solid ${tint}`,
          }}
        />
      );
    })}
  </div>
);

export const SlotPresetsPanel = ({
  presets,
  onApply,
  onDelete,
  onSaveCurrent,
  className,
}: SlotPresetsPanelProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...presets].sort((a, b) => {
        if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [presets],
  );

  const target = presets.find((p) => p.id === confirmDeleteId);

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Slot presets ({sorted.length})
          </p>
        </div>
        {onSaveCurrent && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onSaveCurrent}
          >
            <Plus className="mr-1 h-3 w-3" />
            Save current
          </Button>
        )}
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Reusable slot layouts (e.g. hero + metrics). Apply to spin up a new template starter.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((preset) => (
          <div
            key={preset.id}
            className="group flex flex-col gap-1.5 rounded-md border border-border bg-background p-2 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <PresetThumbnail slots={preset.slots} aspectRatio={preset.aspectRatio} />
            <div className="flex items-start justify-between gap-1">
              <p className="line-clamp-1 text-xs font-semibold leading-tight text-foreground">
                {preset.name}
              </p>
              {preset.isBuiltIn && (
                <span
                  className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1 py-0 text-[8px] font-semibold uppercase tracking-wide text-primary"
                  title="Built-in starter preset"
                >
                  Built-in
                </span>
              )}
            </div>
            {preset.description && (
              <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                {preset.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-6 flex-1 px-2 text-[10px]"
                onClick={() => onApply(preset)}
              >
                <Wand2 className="mr-1 h-2.5 w-2.5" />
                Apply
              </Button>
              {!preset.isBuiltIn && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDeleteId(preset.id)}
                  title="Delete preset"
                  aria-label={`Delete preset ${preset.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete slot preset?</DialogTitle>
            <DialogDescription>
              {target ? `"${target.name}" will be permanently removed from your saved presets.` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) {
                  onDelete(confirmDeleteId);
                  toast.success('Preset deleted');
                  setConfirmDeleteId(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SaveSlotPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  existingNames: string[];
  onConfirm: (name: string, description: string) => void;
}

export const SaveSlotPresetDialog = ({
  open,
  onOpenChange,
  defaultName,
  existingNames,
  onConfirm,
}: SaveSlotPresetDialogProps) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');

  // Reset whenever the dialog opens with a new default name
  useMemo(() => {
    if (open) {
      setName(defaultName);
      setDescription('');
    }
  }, [open, defaultName]);

  const trimmed = name.trim();
  const isDuplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase(),
  );
  const canSave = trimmed.length > 0 && trimmed.length <= 60 && !isDuplicate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as slot preset</DialogTitle>
          <DialogDescription>
            Save this template's slot layout (positions, expression states, aspect ratio) so you can reuse it on new templates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="preset-name" className="text-xs">
              Preset name
            </Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hero + 3 Metrics"
              maxLength={60}
            />
            {isDuplicate && (
              <p className="text-[11px] text-destructive">
                A preset with this name already exists — pick a different name.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preset-description" className="text-xs">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should this layout be used?"
              rows={3}
              maxLength={240}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              if (canSave) {
                onConfirm(trimmed, description.trim());
                onOpenChange(false);
              }
            }}
          >
            Save preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlotPresetsPanel;
