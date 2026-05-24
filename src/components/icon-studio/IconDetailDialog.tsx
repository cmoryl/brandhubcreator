/**
 * IconDetailDialog — the designer's workspace for a single icon.
 *
 * Replaces the wizard's "tile in a grid" view with a real workspace:
 *   - Large preview with light/dark background toggle
 *   - Size strip at 16/24/32/48/64
 *   - SVG code viewer with copy
 *   - Recipe editor (regenerate from edits)
 *   - QA panel with category scores + findings
 *   - Single-icon export bundle
 */

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sun,
  Moon,
  Copy,
  Check,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Package,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { BrandIconography } from '@/types/brand';
import { downloadIconBundle, downloadIconSvg } from '@/lib/iconStudio/exportIcon';
import { scoreIcon, scoreColor, type QAReport } from '@/lib/iconStudio/qa';
import { readRecipe, type IconRecipe } from '@/lib/iconStudio/recipe';
import { buildSvgString, sanitizeSvg } from '@/lib/svgUtils';
import { cn } from '@/lib/utils';
import { IconSvgRender } from './IconSvgRender';
import { toast } from 'sonner';

interface Props {
  icon: BrandIconography | null;
  /** Recipe to use if icon has none attached. */
  fallbackRecipe?: IconRecipe | null;
  /** Brand accent color (hex). */
  accent?: string;
  presentation?: 'auto' | 'outlined' | 'filled' | 'duotone';
  onClose: () => void;
  onRegenerate?: (recipe: IconRecipe) => Promise<void> | void;
  onApprove?: (icon: BrandIconography) => void;
  onReject?: (icon: BrandIconography) => void;
  /** Optional extra action buttons rendered alongside the default action row. */
  extraActions?: React.ReactNode;
  /** When true, hides Approve/Reject/Regenerate (used for read-only sources like imported icons). */
  hideReviewActions?: boolean;
}

const SIZE_STRIP = [16, 24, 32, 48, 64];

export const IconDetailDialog = ({
  icon,
  fallbackRecipe,
  accent = '#139DD8',
  presentation = 'auto',
  onClose,
  onRegenerate,
  onApprove,
  onReject,
}: Props) => {
  const [bg, setBg] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [recipeDraft, setRecipeDraft] = useState<IconRecipe | null>(null);

  const baseRecipe = useMemo(
    () => (icon ? readRecipe(icon) ?? fallbackRecipe ?? null : null),
    [icon, fallbackRecipe],
  );
  const recipe = recipeDraft ?? baseRecipe;

  const svgString = useMemo(() => {
    if (!icon?.svgPath) return '';
    return sanitizeSvg(
      buildSvgString({
        svgPath: icon.svgPath,
        viewBox: icon.viewBox || '0 0 24 24',
        fillMode: icon.fillMode,
        name: icon.name,
      }),
    );
  }, [icon]);

  const qa: QAReport | null = useMemo(
    () => (icon ? scoreIcon(icon, baseRecipe) : null),
    [icon, baseRecipe],
  );

  if (!icon) return null;

  const copyCode = async () => {
    await navigator.clipboard.writeText(svgString);
    setCopied(true);
    toast.success('SVG copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = async () => {
    if (!recipe || !onRegenerate) return;
    setRegenerating(true);
    try {
      await onRegenerate(recipe);
      toast.success('Regeneration queued');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={!!icon} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="icon-studio-tp max-w-6xl max-h-[92vh] overflow-y-auto p-0 bg-background text-foreground" data-theme={bg}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
          {/* LEFT: visual workspace */}
          <div className="border-r border-border/60">
            <DialogHeader className="p-6 pb-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Icon workspace</span>
                {icon.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {icon.category}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {icon.name}
              </DialogTitle>
            </DialogHeader>

            {/* Large preview with bg toggle */}
            <div className="px-6">
              <div className="flex items-center justify-end gap-1 mb-2">
                <Button
                  variant={bg === 'light' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1.5"
                  onClick={() => setBg('light')}
                >
                  <Sun className="h-3.5 w-3.5" /> Light
                </Button>
                <Button
                  variant={bg === 'dark' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 gap-1.5"
                  onClick={() => setBg('dark')}
                >
                  <Moon className="h-3.5 w-3.5" /> Dark
                </Button>
              </div>
              <div
                className={cn(
                  'rounded-xl border flex items-center justify-center transition-colors',
                  bg === 'light' ? 'bg-background border-border' : 'bg-background border-border',
                )}
                style={{ height: 280 }}
              >
                <IconSvgRender icon={icon} size={160} color={accent} presentation={presentation} />
              </div>
            </div>

            {/* Size strip */}
            <div className="p-6">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
                Size ladder
              </div>
              <div className="flex items-end justify-around gap-4 rounded-lg border bg-secondary/30 p-4">
                {SIZE_STRIP.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-md',
                        'bg-background',
                      )}
                      style={{ width: s + 16, height: s + 16 }}
                    >
                      <IconSvgRender icon={icon} size={s} color={accent} presentation={presentation} />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {s}px
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => onApprove?.(icon)}
              >
                <ThumbsUp className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => onReject?.(icon)}
              >
                <ThumbsDown className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleRegenerate}
                disabled={!onRegenerate || regenerating || !recipe}
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')}
                />
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => downloadIconSvg(icon)}
              >
                <Download className="h-3.5 w-3.5" /> SVG
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => downloadIconBundle(icon)}
              >
                <Package className="h-3.5 w-3.5" /> Bundle
              </Button>
            </div>
          </div>

          {/* RIGHT: tabs */}
          <div className="p-6">
            <Tabs defaultValue="qa">
              <TabsList className="w-full">
                <TabsTrigger value="qa" className="flex-1">
                  QA
                </TabsTrigger>
                <TabsTrigger value="recipe" className="flex-1">
                  Recipe
                </TabsTrigger>
                <TabsTrigger value="code" className="flex-1">
                  Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qa" className="space-y-4 pt-4">
                {qa && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <ScoreTile label="Brand Fit" value={qa.scores.brandFit} />
                      <ScoreTile label="SVG Health" value={qa.scores.svgHealth} />
                      <ScoreTile
                        label="Small Size"
                        value={qa.scores.smallSizeReadable}
                      />
                      <ScoreTile label="Export Ready" value={qa.scores.exportReady} />
                    </div>
                    <div className="rounded-lg border bg-secondary/30 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Overall</span>
                      <span
                        className="text-xl font-semibold tabular-nums"
                        style={{ color: scoreColor(qa.scores.overall) }}
                      >
                        {qa.scores.overall}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Findings ({qa.findings.length})
                      </div>
                      {qa.findings.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          All checks passed.
                        </div>
                      ) : (
                        qa.findings.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
                          >
                            <AlertTriangle
                              className={cn(
                                'h-3.5 w-3.5 mt-0.5 shrink-0',
                                f.severity === 'fail' ? 'text-destructive' : 'text-amber-500',
                              )}
                            />
                            <span>{f.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="recipe" className="space-y-3 pt-4">
                {recipe ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow
                        label="Style"
                        value={recipe.style}
                        onChange={(v) =>
                          setRecipeDraft({ ...recipe, style: v as IconRecipe['style'] })
                        }
                      />
                      <FieldRow
                        label="Grid"
                        value={String(recipe.grid)}
                        onChange={(v) =>
                          setRecipeDraft({ ...recipe, grid: Number(v) as IconRecipe['grid'] })
                        }
                      />
                      <FieldRow
                        label="Stroke"
                        value={String(recipe.strokeWidth)}
                        onChange={(v) =>
                          setRecipeDraft({ ...recipe, strokeWidth: Number(v) })
                        }
                      />
                      <FieldRow
                        label="Corners"
                        value={recipe.cornerRadius}
                        onChange={(v) =>
                          setRecipeDraft({
                            ...recipe,
                            cornerRadius: v as IconRecipe['cornerRadius'],
                          })
                        }
                      />
                      <FieldRow
                        label="Primary"
                        value={recipe.primaryColor}
                        onChange={(v) => setRecipeDraft({ ...recipe, primaryColor: v })}
                      />
                      <FieldRow
                        label="Detail"
                        value={recipe.detailLevel}
                        onChange={(v) =>
                          setRecipeDraft({
                            ...recipe,
                            detailLevel: v as IconRecipe['detailLevel'],
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Metaphor
                      </label>
                      <Input
                        value={recipe.metaphor}
                        onChange={(e) =>
                          setRecipeDraft({ ...recipe, metaphor: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Avoid (one per line)
                      </label>
                      <Textarea
                        rows={4}
                        value={recipe.avoid.join('\n')}
                        onChange={(e) =>
                          setRecipeDraft({
                            ...recipe,
                            avoid: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border bg-secondary/30 px-3 py-6 text-center text-xs text-muted-foreground">
                    No recipe attached to this icon. Recipes are stored when icons are
                    generated through Golden Path or recipe-aware wizards.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="code" className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    SVG source
                  </span>
                  <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={copyCode}>
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-[480px] overflow-auto rounded-md border bg-zinc-950 p-3 text-[11px] text-zinc-100 font-mono whitespace-pre-wrap break-all">
                  {svgString || '<!-- No SVG content -->'}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const ScoreTile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border bg-secondary/30 px-3 py-2.5">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div
      className="text-lg font-semibold tabular-nums"
      style={{ color: scoreColor(value) }}
    >
      {value}
    </div>
  </div>
);

const FieldRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
  </div>
);
