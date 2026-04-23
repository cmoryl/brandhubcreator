/**
 * LayoutTemplateEditor
 *
 * Dialog for customizing a brand layout template:
 *   - edit copy (eyebrow, headline, CTA)
 *   - swap individual slot assets
 *   - export PNG / PDF
 *   - apply the resolved cover to a brand section (Hero / Social / Case Study)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, FileImage, FileText, Redo2, Save, Sparkles, SplitSquareHorizontal, Undo2, Wand2, Zap } from 'lucide-react';
import { useHistoryState } from '@/hooks/useHistoryState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  COMMON_CHANNELS,
  NAMING_FORMAT_PRESETS,
  formatVariantName,
  loadNamingFormat,
  resolvePattern,
  saveNamingFormat,
  type StoredFormat,
} from '@/lib/variantNamingFormat';
import {
  autoFillSlots,
  resolveTemplate,
  type BrandLayoutTemplate,
  type BrandVisualsBundle,
  type LayoutTemplateCustomization,
} from '@/lib/brandLayoutTemplates';
import { LayoutTemplateCanvas } from './LayoutTemplateCanvas';
import { exportLayoutAsPng, exportLayoutAsPdf } from '@/lib/exportLayoutTemplate';
import { SlotFitControl } from './SlotFitControl';

export type ApplyTarget = 'hero' | 'social' | 'casestudy';

interface LayoutTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: BrandLayoutTemplate;
  brandVisuals?: BrandVisualsBundle;
  initialCustomization?: LayoutTemplateCustomization;
  /** Existing saved variants for this brand — used to auto-increment version presets. */
  existingCustomizations?: LayoutTemplateCustomization[];
  onSave?: (customization: LayoutTemplateCustomization) => void;
  onApplyToSection?: (target: ApplyTarget, asset: { type: 'image' | 'video'; url: string }) => void;
}

/** Build smart naming presets based on the template + existing variants. */
function buildNamePresets(
  templateName: string,
  existing: LayoutTemplateCustomization[] = [],
): { label: string; value: string }[] {
  // Find next version number for "{templateName} - v{n}"
  const versionRegex = new RegExp(`^${templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*v(\\d+)$`, 'i');
  const usedVersions = existing
    .map((c) => c.name.match(versionRegex)?.[1])
    .filter(Boolean)
    .map(Number);
  const nextVersion = usedVersions.length > 0 ? Math.max(...usedVersions) + 1 : 1;

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return [
    { label: `v${nextVersion}`, value: `${templateName} - v${nextVersion}` },
    { label: 'Hero', value: `${templateName} - Hero` },
    { label: 'Social', value: `${templateName} - Social` },
    { label: 'Email', value: `${templateName} - Email` },
    { label: 'Pitch', value: `${templateName} - Pitch` },
    { label: today, value: `${templateName} - ${today}` },
  ];
}

const safeId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lt-${Date.now()}`);

export const LayoutTemplateEditor = ({
  open,
  onOpenChange,
  template,
  brandVisuals,
  initialCustomization,
  existingCustomizations,
  onSave,
  onApplyToSection,
}: LayoutTemplateEditorProps) => {
  // Persisted user preference for variant naming format.
  const [namingFormat, setNamingFormat] = useState<StoredFormat>(() => loadNamingFormat());
  const [activeChannel, setActiveChannel] = useState<string>('Hero');

  // Persist whenever the user changes their format choice.
  useEffect(() => {
    saveNamingFormat(namingFormat);
  }, [namingFormat]);

  /** Generated name from the active format + channel + existing variants. */
  const formattedName = useMemo(
    () =>
      formatVariantName(namingFormat, {
        templateName: template.name,
        channel: activeChannel,
        existingCustomizations,
      }),
    [namingFormat, template.name, activeChannel, existingCustomizations],
  );

  const namePresets = useMemo(
    () => buildNamePresets(template.name, existingCustomizations),
    [template.name, existingCustomizations],
  );
  const initialValue = useMemo<LayoutTemplateCustomization>(
    () =>
      initialCustomization ?? {
        id: safeId(),
        baseTemplateId: template.id,
        name: template.name,
        copy: { eyebrow: '', headline: '', cta: '' },
        slotOverrides: {},
        overlayOverrides: template.overlay,
        createdAt: new Date().toISOString(),
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template.id],
  );

  const {
    state: customization,
    set: setCustomization,
    replace: replaceCustomization,
    reset: resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historySize,
    cursor,
  } = useHistoryState<LayoutTemplateCustomization>(initialValue);

  // Reset history when a new template is opened or initial customization changes
  useEffect(() => {
    if (open) {
      resetHistory(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template.id]);

  // Keyboard shortcuts: Cmd/Ctrl+Z (undo), Shift+Cmd/Ctrl+Z or Cmd/Ctrl+Y (redo)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, undo, redo]);

  const resolved = useMemo(
    () => resolveTemplate(template, brandVisuals, customization),
    [template, brandVisuals, customization],
  );

  const previewRef = useRef<HTMLDivElement>(null);

  const updateCopy = (key: 'eyebrow' | 'headline' | 'cta', value: string) =>
    setCustomization((c) => ({ ...c, copy: { ...(c.copy ?? {}), [key]: value } }));

  const setHeadlineAlign = (align: 'left' | 'center' | 'right') =>
    setCustomization((c) => ({
      ...c,
      overlayOverrides: {
        ...(c.overlayOverrides ?? template.overlay ?? {}),
        headline: { y: c.overlayOverrides?.headline?.y ?? template.overlay?.headline?.y ?? 60, align },
      },
    }));

  // Slider drag — use `replace` while dragging so we don't flood history,
  // then commit a single history entry on pointer release.
  const setHeadlineY = (y: number, commit: boolean) => {
    const updater = (c: LayoutTemplateCustomization) => ({
      ...c,
      overlayOverrides: {
        ...(c.overlayOverrides ?? template.overlay ?? {}),
        headline: {
          y,
          align: c.overlayOverrides?.headline?.align ?? template.overlay?.headline?.align ?? 'left',
        },
      },
    });
    if (commit) setCustomization(updater);
    else replaceCustomization(updater);
  };

  const setSlotOverride = (slotKey: string, assetIdAndType: string) => {
    if (assetIdAndType === '__auto__') {
      setCustomization((c) => {
        const next = { ...(c.slotOverrides ?? {}) };
        delete next[slotKey];
        return { ...c, slotOverrides: next };
      });
      return;
    }
    const [type, id] = assetIdAndType.split(':') as ['image' | 'video', string];
    setCustomization((c) => ({
      ...c,
      slotOverrides: { ...(c.slotOverrides ?? {}), [slotKey]: { type, assetId: id } },
    }));
  };

  const setSlotFit = (slotKey: string, next: { fit: 'cover' | 'contain'; focusX: number; focusY: number }) =>
    replaceCustomization((c) => ({
      ...c,
      slotFitOverrides: { ...(c.slotFitOverrides ?? {}), [slotKey]: next },
    }));

  const commitSlotFit = (slotKey: string, next: { fit: 'cover' | 'contain'; focusX: number; focusY: number }) =>
    setCustomization((c) => ({
      ...c,
      slotFitOverrides: { ...(c.slotFitOverrides ?? {}), [slotKey]: next },
    }));

  const resetSlotFit = (slotKey: string) =>
    setCustomization((c) => {
      const next = { ...(c.slotFitOverrides ?? {}) };
      delete next[slotKey];
      return { ...c, slotFitOverrides: next };
    });

  const handleAutoFill = () => {
    const { customization: next, filledCount } = autoFillSlots(template, brandVisuals, customization);
    if (filledCount === 0) {
      toast.info('All slots already filled — nothing to auto-fill');
      return;
    }
    setCustomization(() => next);
    toast.success(`Auto-filled ${filledCount} slot${filledCount === 1 ? '' : 's'}`);
  };

  /** Filesystem-safe slug for downloads. Strips punctuation, collapses whitespace, lower-cases. */
  const slugifyForFilename = (raw: string): string => {
    const cleaned = (raw || 'variant')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^\p{Letter}\p{Number}\s\-_]+/gu, '') // drop punctuation/symbols
      .trim()
      .replace(/[\s_]+/g, '-') // spaces/underscores → dash
      .replace(/-+/g, '-') // collapse dashes
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 80); // keep filenames sane
    return cleaned || 'variant';
  };

  /** Build a download filename: "{slug}-{YYYY-MM-DD}.{ext}". */
  const buildExportFilename = (ext: 'png' | 'pdf'): string => {
    const slug = slugifyForFilename(customization.name);
    const stamp = new Date().toISOString().slice(0, 10);
    return `${slug}-${stamp}.${ext}`;
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    const fileName = buildExportFilename('png');
    try {
      await exportLayoutAsPng(previewRef.current, { fileName });
      toast.success(`Downloaded ${fileName}`);
    } catch {
      toast.error('Could not export PNG');
    }
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    const fileName = buildExportFilename('pdf');
    try {
      await exportLayoutAsPdf(previewRef.current, {
        fileName,
        aspectRatio: template.aspectRatio,
      });
      toast.success(`Downloaded ${fileName}`);
    } catch {
      toast.error('Could not export PDF');
    }
  };

  const handleApply = (target: ApplyTarget) => {
    const cover = resolved.find((r) => r.asset.type !== 'empty');
    if (!cover || cover.asset.type === 'empty') {
      toast.error('No visual available to apply');
      return;
    }
    onApplyToSection?.(target, { type: cover.asset.type, url: cover.asset.url });
    toast.success(`Applied to ${target === 'casestudy' ? 'Case Study' : target}`);
  };

  const handleSave = () => {
    onSave?.(customization);
    toast.success('Variant saved');
    onOpenChange(false);
  };

  /** Duplicate: save a fresh copy (new id + "(copy)" suffix) without closing the editor. */
  const handleDuplicate = () => {
    if (!onSave) return;
    const baseName = customization.name.replace(/\s*\(copy(?:\s*\d+)?\)\s*$/i, '');
    const copyMatches = (existingCustomizations ?? [])
      .map((c) => c.name.match(/\(copy(?:\s*(\d+))?\)\s*$/i))
      .filter(Boolean);
    const nextCopyN = copyMatches.length === 0 ? '' : ` ${copyMatches.length + 1}`;
    const duplicate: LayoutTemplateCustomization = {
      ...customization,
      id: safeId(),
      name: `${baseName} (copy${nextCopyN})`,
      createdAt: new Date().toISOString(),
    };
    onSave(duplicate);
    toast.success('Variant duplicated');
  };

  // Side-by-side compare against the unmodified base template
  const [compareMode, setCompareMode] = useState(false);
  const baseResolved = useMemo(
    () => resolveTemplate(template, brandVisuals, undefined),
    [template, brandVisuals],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Customize "{template.name}"
          </DialogTitle>
          <DialogDescription>
            Edit headline copy, swap individual visuals, then export or apply to a brand section.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Live preview */}
          <div className="space-y-3">
            {compareMode ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Base template
                    </span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                      Original
                    </span>
                  </div>
                  <LayoutTemplateCanvas
                    template={template}
                    resolved={baseResolved}
                    presentationMode
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Your edits
                    </span>
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                      Live
                    </span>
                  </div>
                  <LayoutTemplateCanvas
                    ref={previewRef}
                    template={template}
                    resolved={resolved}
                    customization={customization}
                    presentationMode
                  />
                </div>
              </div>
            ) : (
              <LayoutTemplateCanvas
                ref={previewRef}
                template={template}
                resolved={resolved}
                customization={customization}
                presentationMode
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <div className="mr-1 flex items-center gap-0.5 rounded-md border bg-background p-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={!canUndo}
                        onClick={undo}
                        aria-label="Undo"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px]">
                      Undo (⌘Z)
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={!canRedo}
                        onClick={redo}
                        aria-label="Redo"
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px]">
                      Redo (⇧⌘Z)
                    </TooltipContent>
                  </Tooltip>
                  <span className="px-1.5 text-[10px] tabular-nums text-muted-foreground">
                    {cursor + 1}/{historySize}
                  </span>
                </div>
              </TooltipProvider>
              <Button
                size="sm"
                variant={compareMode ? 'default' : 'outline'}
                onClick={() => setCompareMode((v) => !v)}
                title="Toggle side-by-side compare with the base template"
              >
                <SplitSquareHorizontal className="mr-1.5 h-3.5 w-3.5" />
                {compareMode ? 'Exit compare' : 'Compare base'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoFill}
                title="Fill empty slots with the best-matching brand visuals"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Auto-fill slots
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPng}>
                <FileImage className="mr-1.5 h-3.5 w-3.5" />
                PNG
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPdf}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>
              {onApplyToSection && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('hero')}>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Apply to Hero
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('social')}>
                    Apply to Social
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleApply('casestudy')}>
                    Apply to Case Study
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Edit panel */}
          <ScrollArea className="max-h-[520px] rounded-lg border bg-muted/20 p-3">
            <Tabs defaultValue="copy">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="slots">Slots</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="copy" className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs">Variant name</Label>
                  <Input
                    value={customization.name}
                    onChange={(e) => setCustomization((c) => ({ ...c, name: e.target.value }))}
                    className="mt-1 h-8"
                  />

                  {/* Naming format picker */}
                  <div className="mt-2 space-y-1.5 rounded-md border border-border bg-background/60 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Naming format
                      </Label>
                      <button
                        type="button"
                        onClick={() => setCustomization((c) => ({ ...c, name: formattedName }))}
                        className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        title={`Apply: ${formattedName}`}
                      >
                        Apply format
                      </button>
                    </div>

                    <Select
                      value={namingFormat.presetId}
                      onValueChange={(id) =>
                        setNamingFormat((prev) => ({
                          presetId: id,
                          customPattern:
                            id === 'custom' ? (prev.customPattern ?? resolvePattern(prev)) : undefined,
                        }))
                      }
                    >
                      <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NAMING_FORMAT_PRESETS.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-[11px]">
                            <div className="flex flex-col">
                              <span className="font-medium">{p.label}</span>
                              <span className="text-[10px] text-muted-foreground">{p.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {namingFormat.presetId === 'custom' && (
                      <Input
                        value={namingFormat.customPattern ?? ''}
                        onChange={(e) =>
                          setNamingFormat({ presetId: 'custom', customPattern: e.target.value })
                        }
                        placeholder="{template} - {version} - {date}"
                        className="h-7 text-[11px] font-mono"
                      />
                    )}

                    {/* Channel chips — affects {channel} token */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="mr-0.5 self-center text-[10px] uppercase tracking-wide text-muted-foreground">
                        Channel:
                      </span>
                      {COMMON_CHANNELS.map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setActiveChannel(ch)}
                          className={
                            activeChannel === ch
                              ? 'rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground'
                              : 'rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary'
                          }
                        >
                          {ch}
                        </button>
                      ))}
                    </div>

                    {/* Live preview of generated name */}
                    <div className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Preview:</span>
                      <span className="truncate font-mono text-[11px] text-foreground">{formattedName}</span>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Tokens: <code>{'{template}'}</code> <code>{'{version}'}</code>{' '}
                      <code>{'{channel}'}</code> <code>{'{date}'}</code> <code>{'{iso}'}</code>
                    </p>
                  </div>

                  {/* Legacy quick chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground self-center mr-0.5">
                      Quick:
                    </span>
                    {namePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setCustomization((c) => ({ ...c, name: preset.value }))}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                        title={preset.value}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                {template.overlay?.eyebrow && (
                  <div>
                    <Label className="text-xs">Eyebrow</Label>
                    <Input
                      value={customization.copy?.eyebrow ?? ''}
                      onChange={(e) => updateCopy('eyebrow', e.target.value)}
                      placeholder="e.g. New release"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
                {template.overlay?.headline && (
                  <div>
                    <Label className="text-xs">Headline</Label>
                    <Input
                      value={customization.copy?.headline ?? ''}
                      onChange={(e) => updateCopy('headline', e.target.value)}
                      placeholder="Your headline here"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
                {template.overlay?.cta && (
                  <div>
                    <Label className="text-xs">CTA</Label>
                    <Input
                      value={customization.copy?.cta ?? ''}
                      onChange={(e) => updateCopy('cta', e.target.value)}
                      placeholder="e.g. Get started"
                      className="mt-1 h-8"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="slots" className="mt-3 space-y-4">
                {template.slots.map((slot) => {
                  const matchingStatic = (brandVisuals?.staticAssets ?? []).filter(
                    (s) => s.expressionState === slot.expressionState,
                  );
                  const matchingMotion = (brandVisuals?.motionAssets ?? []).filter(
                    (m) => m.expressionState === slot.expressionState,
                  );
                  const ov = customization.slotOverrides?.[slot.key];
                  const value = ov && 'assetId' in ov ? `${ov.type}:${ov.assetId}` : '__auto__';
                  const resolvedSlot = resolved.find((r) => r.slot.key === slot.key);
                  const previewUrl =
                    resolvedSlot?.asset.type === 'image' || resolvedSlot?.asset.type === 'video'
                      ? resolvedSlot.asset.url
                      : undefined;
                  const fitValue = customization.slotFitOverrides?.[slot.key];

                  return (
                    <div key={slot.key} className="space-y-2 rounded-lg border border-border/60 p-2">
                      <Label className="text-xs">
                        {slot.label}{' '}
                        <span className="text-muted-foreground">({slot.expressionState})</span>
                      </Label>
                      <Select value={value} onValueChange={(v) => setSlotOverride(slot.key, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__auto__">Auto (best match)</SelectItem>
                          {matchingStatic.length > 0 && (
                            <>
                              {matchingStatic.map((a) => (
                                <SelectItem key={`i-${a.id}`} value={`image:${a.id}`}>
                                  🖼 {a.name} · {a.aspectRatio}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {matchingMotion.map((m) => (
                            <SelectItem key={`v-${m.id}`} value={`video:${m.id}`}>
                              🎞 {m.name} · {m.aspectRatio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <SlotFitControl
                        previewUrl={previewUrl}
                        assetType={resolvedSlot?.asset.type ?? 'empty'}
                        value={fitValue}
                        onChange={(next) => setSlotFit(slot.key, next)}
                        onCommit={(next) => commitSlotFit(slot.key, next)}
                        onReset={() => resetSlotFit(slot.key)}
                      />
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="layout" className="mt-3 space-y-3">
                {template.overlay?.headline && (
                  <>
                    <div>
                      <Label className="text-xs">Headline alignment</Label>
                      <div className="mt-1 flex gap-1">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <Button
                            key={a}
                            size="sm"
                            variant={
                              (customization.overlayOverrides?.headline?.align ??
                                template.overlay?.headline?.align) === a
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() => setHeadlineAlign(a)}
                            className="h-7 flex-1 text-xs"
                          >
                            {a}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">
                        Headline vertical position (
                        {customization.overlayOverrides?.headline?.y ??
                          template.overlay?.headline?.y ??
                          60}
                        %)
                      </Label>
                      <Input
                        type="range"
                        min={0}
                        max={95}
                        value={
                          customization.overlayOverrides?.headline?.y ??
                          template.overlay?.headline?.y ??
                          60
                        }
                        onChange={(e) => setHeadlineY(Number(e.target.value), false)}
                        onPointerUp={(e) => setHeadlineY(Number((e.target as HTMLInputElement).value), true)}
                        onKeyUp={(e) => setHeadlineY(Number((e.target as HTMLInputElement).value), true)}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                <p className="rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                  Need finer control? Save the variant, then duplicate and tweak per channel.
                </p>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onSave && (
            <Button
              variant="outline"
              onClick={handleDuplicate}
              title="Save a copy of this variant without closing the editor"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Duplicate variant
            </Button>
          )}
          {onSave && (
            <Button onClick={handleSave}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save variant
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPng}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayoutTemplateEditor;
