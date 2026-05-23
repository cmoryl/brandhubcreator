/**
 * BulkRegenerateDialog — re-runs the icon generator across every section
 * represented in an existing icon library, then writes the merged result
 * back to organization_icon_libraries.
 *
 * Sections are inferred by grouping the library's current icons by
 * `category` (which is the only signal stored on BrandIconography). For each
 * unique category we issue one generation task with sectionIndex 0 and
 * count = original count for that category. Tasks run sequentially because
 * the edge function is heavy.
 */

import { useMemo, useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { runGenerationTask, type GenerationTask } from '@/lib/iconStudio/generationClient';
import { useIconLibraries, type IconLibrary } from '@/hooks/useIconLibraries';
import type { BrandIconography } from '@/types/brand';

interface Props {
  library: IconLibrary | null;
  organizationId?: string;
  onClose: () => void;
}

type SectionStatus = 'pending' | 'running' | 'done' | 'error';

interface SectionRow {
  category: string;
  count: number;
  status: SectionStatus;
  error?: string;
  newIcons?: BrandIconography[];
}

export const BulkRegenerateDialog = ({ library, organizationId, onClose }: Props) => {
  const open = !!library;
  const { updateLibrary } = useIconLibraries(organizationId);

  const initialRows: SectionRow[] = useMemo(() => {
    if (!library) return [];
    const grouped = new Map<string, number>();
    library.icons.forEach((i) => {
      const cat = i.category || 'General';
      grouped.set(cat, (grouped.get(cat) ?? 0) + 1);
    });
    return Array.from(grouped.entries()).map(([category, count]) => ({
      category,
      count,
      status: 'pending' as SectionStatus,
    }));
  }, [library]);

  const [rows, setRows] = useState<SectionRow[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  // Reset rows whenever the library changes (dialog reopened).
  useMemo(() => {
    setRows(initialRows);
    setFinished(false);
  }, [initialRows]);

  const completed = rows.filter((r) => r.status === 'done' || r.status === 'error').length;
  const total = rows.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const update = (idx: number, patch: Partial<SectionRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const run = async () => {
    if (!library || !organizationId) return;
    setBusy(true);
    setFinished(false);

    const accumulated: BrandIconography[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      update(i, { status: 'running', error: undefined });

      const task: GenerationTask = {
        key: `regen::${row.category}::0`,
        label: row.category,
        category: row.category,
        sectionIndex: 0,
        count: row.count,
      };

      try {
        const icons = await runGenerationTask(task, {
          entityName: library.name,
          industry: library.name,
          style: 'outlined',
        });
        // Stamp the original category so grouping is preserved on re-save.
        const stamped = icons.map((ic) => ({ ...ic, category: row.category }));
        accumulated.push(...stamped);
        update(i, { status: 'done', newIcons: stamped });
      } catch (err: any) {
        update(i, { status: 'error', error: err?.message ?? 'Failed' });
      }
    }

    if (accumulated.length === 0) {
      toast.error('Regeneration produced no icons — library left unchanged.');
      setBusy(false);
      setFinished(true);
      return;
    }

    try {
      await updateLibrary.mutateAsync({
        id: library.id,
        updates: { icons: accumulated },
      });
      toast.success(`${library.name} regenerated (${accumulated.length} icons)`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save regenerated icons');
    } finally {
      setBusy(false);
      setFinished(true);
    }
  };

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerate all sections
          </DialogTitle>
          <DialogDescription>
            {library
              ? `Re-runs the generator across every section in “${library.name}” and replaces the stored icons.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            This library has no sections to regenerate yet.
          </p>
        ) : (
          <div className="space-y-3">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground tabular-nums">
              {completed} / {total} sections · {progress}%
            </p>
            <ScrollArea className="h-64 rounded-md border border-border/60">
              <ul className="divide-y divide-border/40">
                {rows.map((row, i) => (
                  <li key={`${row.category}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <StatusIcon status={row.status} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{row.category}</div>
                      {row.error ? (
                        <div className="text-[11px] text-destructive truncate">{row.error}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          target {row.count} icons
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={busy}>
            {finished ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={run} disabled={busy || total === 0 || finished} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {busy ? 'Regenerating…' : finished ? 'Done' : 'Start regeneration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StatusIcon = ({ status }: { status: SectionStatus }) => {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <div className="h-4 w-4 rounded-full border border-border/60" />;
};
