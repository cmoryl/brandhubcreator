/**
 * AutoLinkIndustryDialog
 *
 * Admin tool: for every brand in the current org, detect its industry from
 * `guide_data.industry`, generate a matching industry icon collection via
 * the existing generate-icon-set edge function, save it as a `brand`-level
 * library, and create a row in `icon_library_brand_links` so the brand picks
 * it up everywhere icons are surfaced.
 *
 * Designed to be re-runnable: brands that already have an auto-linked
 * industry library (matched by name suffix) are skipped unless "Regenerate
 * existing" is checked.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Sparkles, Check, AlertCircle, SkipForward } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { matchIndustryPreset } from '@/lib/iconStudio/industryMapping';
import { runGenerationQueue, subSetToTask } from '@/lib/iconStudio/generationClient';
import type { IndustryPreset } from '@/lib/iconStudio/industryPresets';
import type { BrandIconography } from '@/types/brand';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

interface BrandRow {
  id: string;
  name: string;
  industry: string | null;
  preset: IndustryPreset | null;
  /** Existing auto-link library for this brand, if any. */
  existingLibraryId?: string;
}

type RowStatus = 'idle' | 'queued' | 'generating' | 'done' | 'skipped' | 'error';

const AUTO_SUFFIX = '— Industry Set (auto)';

export const AutoLinkIndustryDialog = ({ open, onOpenChange, organizationId }: Props) => {
  const { libraries } = useIconLibraries(organizationId);
  const { links, linkLibraryToEntity } = useIconLibraryBrandLinks(organizationId);

  // Pull brands + industry from guide_data
  const { data: brandRows = [], isLoading } = useQuery({
    queryKey: ['auto-link-brands', organizationId],
    enabled: open && !!organizationId,
    queryFn: async (): Promise<BrandRow[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, guide_data')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return (data || []).map((b: { id: string; name: string; guide_data: unknown }) => {
        const industry = (b.guide_data as { industry?: string } | null)?.industry?.trim() || null;
        return {
          id: b.id,
          name: b.name,
          industry,
          preset: matchIndustryPreset(industry),
        };
      });
    },
  });

  // Annotate with existing auto-link library matches
  const enrichedRows = useMemo<BrandRow[]>(() => {
    return brandRows.map((row) => {
      const linkedLibIds = new Set(
        links.filter((l) => l.brand_id === row.id).map((l) => l.library_id),
      );
      const match = libraries.find(
        (lib) => linkedLibIds.has(lib.id) && lib.name.endsWith(AUTO_SUFFIX),
      );
      return { ...row, existingLibraryId: match?.id };
    });
  }, [brandRows, libraries, links]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [regenerate, setRegenerate] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Record<string, RowStatus>>({});
  const [progress, setProgress] = useState(0);

  // Default-select all rows that have a preset match and no existing library
  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    enrichedRows.forEach((r) => {
      next[r.id] = !!r.preset && (regenerate || !r.existingLibraryId);
    });
    setSelected(next);
    setStatus({});
    setProgress(0);
  }, [open, enrichedRows, regenerate]);

  const eligible = enrichedRows.filter((r) => r.preset && selected[r.id]);
  const noPresetCount = enrichedRows.filter((r) => !r.preset).length;
  const skipCount = enrichedRows.filter((r) => r.preset && !regenerate && r.existingLibraryId).length;

  const run = async () => {
    if (!eligible.length || running) return;
    setRunning(true);
    let completed = 0;
    for (const row of eligible) {
      if (!row.preset) continue;
      setStatus((s) => ({ ...s, [row.id]: 'generating' }));
      try {
        // Generate only the sub-sets (department + feature + context) — core is
        // shared across all brands so we don't burn tokens regenerating it.
        const tasks = row.preset.subSets.map(subSetToTask);
        const results = await runGenerationQueue(tasks, {
          entityName: row.name,
          entityId: row.id,
          entityType: 'brand',
          industry: row.preset.name,
          style: 'outlined',
          detailLevel: 'medium',
          gridSize: 24,
        });
        const icons: BrandIconography[] = results.flatMap((r) => r.icons);
        if (!icons.length) {
          setStatus((s) => ({ ...s, [row.id]: 'error' }));
          continue;
        }

        const libName = `${row.name} ${AUTO_SUFFIX}`;
        const { data: lib, error: insertErr } = await supabase
          .from('organization_icon_libraries')
          .insert({
            organization_id: organizationId,
            name: libName,
            level: 'brand',
            description: `Auto-generated ${row.preset.name} industry icons for ${row.name}.`,
            icons: JSON.parse(JSON.stringify(icons)),
          })
          .select('id')
          .single();
        if (insertErr || !lib) {
          logger.debug('Auto-link library insert failed', insertErr);
          setStatus((s) => ({ ...s, [row.id]: 'error' }));
          continue;
        }

        await linkLibraryToEntity.mutateAsync({
          libraryId: lib.id,
          entityId: row.id,
          entityType: 'brand',
        });
        setStatus((s) => ({ ...s, [row.id]: 'done' }));
      } catch (err) {
        logger.debug('Auto-link generation failed', err);
        setStatus((s) => ({ ...s, [row.id]: 'error' }));
      } finally {
        completed += 1;
        setProgress(Math.round((completed / eligible.length) * 100));
      }
    }
    setRunning(false);
    toast.success(`Industry icons processed for ${completed} brand${completed === 1 ? '' : 's'}`);
  };

  const renderStatus = (row: BrandRow) => {
    const st = status[row.id];
    if (st === 'generating') return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    if (st === 'done') return <Check className="h-3.5 w-3.5 text-emerald-500" />;
    if (st === 'error') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    if (st === 'skipped') return <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />;
    if (!row.preset) return <span className="text-[10px] text-muted-foreground">no match</span>;
    if (!regenerate && row.existingLibraryId) return <Badge variant="outline" className="text-[10px]">already linked</Badge>;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !running && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Auto-link industry icons to brands
          </DialogTitle>
          <DialogDescription>
            Detects each brand's industry, generates the matching icon collection, and links it
            automatically. Uses the existing AI generation pipeline — runs sequentially to respect rate limits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 px-1 pt-1 text-xs text-muted-foreground">
          <span>{enrichedRows.length} brand{enrichedRows.length === 1 ? '' : 's'}</span>
          {noPresetCount > 0 && <span>{noPresetCount} without industry match</span>}
          {skipCount > 0 && <span>{skipCount} already linked</span>}
          <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
            <Checkbox checked={regenerate} onCheckedChange={(v) => setRegenerate(!!v)} disabled={running} />
            Regenerate existing
          </label>
        </div>

        <Separator className="my-2" />

        <ScrollArea className="flex-1 -mx-2 px-2">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading brands…</div>
          ) : enrichedRows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No brands in this organization.</div>
          ) : (
            <ul className="space-y-1">
              {enrichedRows.map((row) => {
                const disabled = !row.preset || running || (!regenerate && !!row.existingLibraryId);
                return (
                  <li
                    key={row.id}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-md border text-sm',
                      disabled ? 'border-transparent opacity-60' : 'border-border hover:bg-muted/30',
                    )}
                  >
                    <Checkbox
                      checked={!!selected[row.id]}
                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [row.id]: !!v }))}
                      disabled={disabled}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{row.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {row.industry || 'No industry set'}
                        {row.preset && <> → <span className="text-foreground/80">{row.preset.name}</span></>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">{renderStatus(row)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {running && (
          <div className="pt-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground mt-1">{progress}% complete — keep this dialog open.</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
            Close
          </Button>
          <Button onClick={run} disabled={running || eligible.length === 0}>
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate &amp; link {eligible.length || ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
