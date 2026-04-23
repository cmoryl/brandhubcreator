/**
 * RegenerateFromTemplatesDialog
 *
 * Bulk-regenerate existing Digital Collateral thumbnails by re-rendering
 * each item through the new Brand Layout Template system.
 *
 * Flow:
 *   1. User multi-selects items (default = all).
 *   2. Each item gets an auto-suggested template (mapped from category).
 *   3. User can override the template per row, or "Apply to all".
 *   4. On confirm, we render each LayoutTemplateCanvas off-screen, capture
 *      a PNG data URL, and patch the item's `thumbnailUrl`.
 *
 * Pure frontend: no uploads; patched URLs are inline data URLs the parent
 * persists as part of the brochure list.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { LayoutTemplateCanvas } from '@/components/brand/LayoutTemplateCanvas';
import {
  brandLayoutTemplates,
  resolveTemplate,
  type BrandLayoutTemplate,
  type BrandVisualsBundle,
  type LayoutTemplateCustomization,
} from '@/lib/brandLayoutTemplates';
import {
  findTemplateById,
  mapCategoryToTarget,
  pickDefaultTemplateId,
} from '@/lib/collateralCategoryMapping';
import { renderLayoutToDataUrl } from '@/lib/exportLayoutTemplate';
import type { BrandBrochure } from '@/types/brand';

interface RegenerateFromTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collateral: BrandBrochure[];
  /** Brand visuals bundle used to resolve slots for each template. */
  brandVisuals?: BrandVisualsBundle;
  /** Saved custom variants — surfaced as additional template options. */
  savedCustomizations?: LayoutTemplateCustomization[];
  /** Called with patched collateral after regeneration succeeds. */
  onApply: (next: BrandBrochure[]) => void;
}

interface RowState {
  itemId: string;
  selected: boolean;
  templateId: string;
  reason: string;
  /** Set after rendering completes for this row in the current run. */
  generatedDataUrl?: string;
  /** Set if rendering failed. */
  error?: string;
}

const SAVED_PREFIX = 'saved:';

export const RegenerateFromTemplatesDialog = ({
  open,
  onOpenChange,
  collateral,
  brandVisuals,
  savedCustomizations,
  onApply,
}: RegenerateFromTemplatesDialogProps) => {
  const [rows, setRows] = useState<RowState[]>([]);
  const [bulkTemplateId, setBulkTemplateId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  // Off-screen canvas refs keyed by item id — used by html-to-image capture.
  const canvasRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize rows whenever the dialog opens or the collateral list changes.
  useEffect(() => {
    if (!open) return;
    const next: RowState[] = collateral.map((item) => {
      const mapping = mapCategoryToTarget(item.category);
      const templateId = pickDefaultTemplateId(mapping.target) ?? brandLayoutTemplates[0]?.id ?? '';
      return {
        itemId: item.id,
        selected: true,
        templateId,
        reason: mapping.reason,
      };
    });
    setRows(next);
    setBulkTemplateId('');
  }, [open, collateral]);

  const selectedCount = rows.filter((r) => r.selected).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  /** Available template options — built-ins + saved customizations. */
  const templateOptions = useMemo(() => {
    const builtIn = brandLayoutTemplates.map((t) => ({
      value: t.id,
      label: t.name,
      target: t.target,
      group: 'Built-in',
    }));
    const saved = (savedCustomizations ?? []).map((c) => {
      const baseTpl = findTemplateById(c.baseTemplateId);
      return {
        value: `${SAVED_PREFIX}${c.id}`,
        label: c.name,
        target: baseTpl?.target ?? 'editorial',
        group: 'Saved variants',
      };
    });
    return [...builtIn, ...saved];
  }, [savedCustomizations]);

  /** Resolve a row's templateId selection into (template, customization?). */
  const resolveRowTemplate = (
    templateValue: string,
  ): { template: BrandLayoutTemplate; customization?: LayoutTemplateCustomization } | null => {
    if (templateValue.startsWith(SAVED_PREFIX)) {
      const customization = savedCustomizations?.find(
        (c) => c.id === templateValue.slice(SAVED_PREFIX.length),
      );
      const template = findTemplateById(customization?.baseTemplateId);
      if (!template || !customization) return null;
      return { template, customization };
    }
    const template = findTemplateById(templateValue);
    return template ? { template } : null;
  };

  const updateRow = (itemId: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.itemId === itemId ? { ...r, ...patch } : r)));
  };

  const toggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const applyTemplateToAll = () => {
    if (!bulkTemplateId) return;
    setRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, templateId: bulkTemplateId, reason: 'Applied to all' } : r)),
    );
    toast.success(`Template applied to ${selectedCount} item${selectedCount === 1 ? '' : 's'}`);
  };

  const handleRegenerate = async () => {
    const targets = rows.filter((r) => r.selected);
    if (targets.length === 0) {
      toast.error('Select at least one item to regenerate');
      return;
    }
    setIsGenerating(true);

    // Render rows sequentially — keeps memory predictable on large lists.
    const newDataUrls = new Map<string, string>();
    for (const row of targets) {
      const node = canvasRefs.current.get(row.itemId);
      if (!node) {
        updateRow(row.itemId, { error: 'Canvas not ready' });
        continue;
      }
      try {
        // Allow a tick so any newly-mounted images have a chance to load.
        await new Promise((r) => setTimeout(r, 50));
        const dataUrl = await renderLayoutToDataUrl(node, { pixelRatio: 2 });
        newDataUrls.set(row.itemId, dataUrl);
      } catch (err) {
        console.error('[RegenerateFromTemplates] render failed', err);
        updateRow(row.itemId, { error: 'Render failed' });
      }
    }

    if (newDataUrls.size === 0) {
      setIsGenerating(false);
      toast.error('Could not regenerate any thumbnails');
      return;
    }

    const patched = collateral.map((item) =>
      newDataUrls.has(item.id) ? { ...item, thumbnailUrl: newDataUrls.get(item.id)! } : item,
    );

    setRows((prev) =>
      prev.map((r) => (newDataUrls.has(r.itemId) ? { ...r, generatedDataUrl: newDataUrls.get(r.itemId), error: undefined } : r)),
    );

    onApply(patched);
    setIsGenerating(false);
    toast.success(`Regenerated ${newDataUrls.size} thumbnail${newDataUrls.size === 1 ? '' : 's'}`);
    onOpenChange(false);
  };

  const setCanvasRef = (itemId: string) => (el: HTMLDivElement | null) => {
    if (el) canvasRefs.current.set(itemId, el);
    else canvasRefs.current.delete(itemId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Refresh Collateral from Templates
          </DialogTitle>
          <DialogDescription>
            Regenerate existing Digital Collateral thumbnails using your latest brand layout
            templates. We&apos;ve auto-suggested a template for each item based on its category.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-y border-border py-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-collateral"
              checked={allSelected}
              onCheckedChange={(c) => toggleAll(Boolean(c))}
            />
            <label htmlFor="select-all-collateral" className="text-sm font-medium cursor-pointer">
              {selectedCount} of {rows.length} selected
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Apply template to selected:</span>
            <Select value={bulkTemplateId} onValueChange={setBulkTemplateId}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue placeholder="Choose template…" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {templateOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    <span className="ml-2 text-xs text-muted-foreground">{opt.target}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkTemplateId || selectedCount === 0}
              onClick={applyTemplateToAll}
            >
              Apply to all
            </Button>
          </div>
        </div>

        {/* Rows */}
        <ScrollArea className="flex-1 pr-3">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground gap-2">
              <Sparkles className="h-8 w-8 opacity-40" />
              <p>No collateral items to refresh yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const item = collateral.find((c) => c.id === row.itemId);
                if (!item) return null;
                const resolved = resolveRowTemplate(row.templateId);
                return (
                  <div
                    key={row.itemId}
                    className="grid grid-cols-[auto_1fr_1fr_1fr_220px] items-center gap-3 rounded-lg border border-border p-3 bg-card"
                  >
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(c) => updateRow(row.itemId, { selected: Boolean(c) })}
                    />

                    {/* Item info */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {item.category || 'Uncategorized'}
                      </Badge>
                    </div>

                    {/* Current thumbnail */}
                    <div className="aspect-video w-full max-w-[180px] overflow-hidden rounded-md border border-border bg-muted">
                      {item.thumbnailUrl || item.previewUrl ? (
                        <OptimizedImage
                          src={item.thumbnailUrl || item.previewUrl}
                          alt={`${item.title} current`}
                          className="w-full h-full"
                          objectFit="cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>

                    {/* New template preview */}
                    <div className="aspect-video w-full max-w-[180px]">
                      {resolved ? (
                        <LayoutTemplateCanvas
                          ref={setCanvasRef(row.itemId)}
                          template={resolved.template}
                          resolved={resolveTemplate(resolved.template, brandVisuals)}
                          customization={resolved.customization}
                          presentationMode
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full rounded-md border border-dashed text-xs text-muted-foreground">
                          Pick a template
                        </div>
                      )}
                    </div>

                    {/* Per-row template picker */}
                    <div className="space-y-1">
                      <Select
                        value={row.templateId}
                        onValueChange={(v) =>
                          updateRow(row.itemId, { templateId: v, reason: 'Manually selected' })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Template…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {templateOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                              <span className="ml-2 text-[10px] text-muted-foreground">
                                {opt.target}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{row.reason}</p>
                      {row.error && <p className="text-[10px] text-destructive">{row.error}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={isGenerating || selectedCount === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Regenerating…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate {selectedCount} item{selectedCount === 1 ? '' : 's'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateFromTemplatesDialog;
