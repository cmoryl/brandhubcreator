/**
 * BulkExpandDialog — appends N freshly-generated icons to every brand-level
 * library in the org. Runs sequentially (the generator is heavy) and writes
 * each library back as soon as it finishes so partial progress is preserved.
 *
 * For diversity each library is hit twice with different (category, sectionIndex)
 * tuples that add up to the requested expansion size.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
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
  open: boolean;
  libraries: IconLibrary[];
  organizationId?: string;
  /** How many icons to add to each library. */
  expandBy?: number;
  /** Restrict expansion to a particular level (defaults to 'brand'). */
  level?: 'core' | 'product_line' | 'brand' | 'all';
  onClose: () => void;
}

type RowStatus = 'pending' | 'running' | 'done' | 'error';

interface Row {
  library: IconLibrary;
  status: RowStatus;
  added: number;
  error?: string;
}

/** Diversified category passes per library for maximum variety. */
const PASSES: Array<{ category: string; sectionIndex: number }> = [
  { category: 'Brand Signature', sectionIndex: 0 },
  { category: 'Industry Specific', sectionIndex: 0 },
  { category: 'Workflow & Actions', sectionIndex: 1 },
  { category: 'Objects & Tools', sectionIndex: 2 },
  { category: 'Data & Insights', sectionIndex: 3 },
  { category: 'People & Roles', sectionIndex: 4 },
  { category: 'Communication', sectionIndex: 5 },
  { category: 'Status & Feedback', sectionIndex: 6 },
];

export const BulkExpandDialog = ({
  open,
  libraries,
  organizationId,
  expandBy = 50,
  level = 'brand',
  onClose,
}: Props) => {
  const { updateLibrary } = useIconLibraries(organizationId);

  const targets = useMemo(
    () => (level === 'all' ? libraries : libraries.filter((l) => l.level === level)),
    [libraries, level],
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (open) {
      setRows(targets.map((lib) => ({ library: lib, status: 'pending', added: 0 })));
      setFinished(false);
    }
  }, [open, targets]);

  const completed = rows.filter((r) => r.status === 'done' || r.status === 'error').length;
  const total = rows.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const update = (idx: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const run = async () => {
    if (!organizationId || rows.length === 0) return;
    setBusy(true);
    setFinished(false);

    const perPass = Math.max(1, Math.round(expandBy / PASSES.length));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      update(i, { status: 'running', error: undefined, added: 0 });

      const added: BrandIconography[] = [];
      let lastError: string | undefined;

      for (const pass of PASSES) {
        const task: GenerationTask = {
          key: `expand::${row.library.id}::${pass.category}::${pass.sectionIndex}`,
          label: `${row.library.name} · ${pass.category}`,
          category: pass.category,
          sectionIndex: pass.sectionIndex,
          count: perPass,
        };
        try {
          const icons = await runGenerationTask(task, {
            entityName: row.library.name,
            industry: row.library.name,
            style: 'outlined',
          });
          added.push(...icons.map((ic) => ({ ...ic, category: ic.category || pass.category })));
          update(i, { added: added.length });
        } catch (err: any) {
          lastError = err?.message ?? 'Generation failed';
        }
      }

      if (added.length === 0) {
        update(i, { status: 'error', error: lastError ?? 'No icons generated' });
        continue;
      }

      try {
        const existingIds = new Set(row.library.icons.map((ic) => ic.id));
        const safe = added.filter((ic) => !existingIds.has(ic.id));
        const merged = [...row.library.icons, ...safe];
        await updateLibrary.mutateAsync({
          id: row.library.id,
          updates: { icons: merged },
        });
        update(i, { status: 'done', added: safe.length });
      } catch (err: any) {
        update(i, { status: 'error', error: err?.message ?? 'Save failed' });
      }
    }

    setBusy(false);
    setFinished(true);
    toast.success(`Expansion complete — added icons to ${rows.length} libraries`);
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
            <Plus className="h-4 w-4" />
            Expand every {level === 'all' ? '' : level + ' '}set by {expandBy}
          </DialogTitle>
          <DialogDescription>
            Generates {expandBy} additional icons for each library below and appends them to the
            existing set. Existing icons are not modified.
          </DialogDescription>
        </DialogHeader>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No matching libraries to expand.</p>
        ) : (
          <div className="space-y-3">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground tabular-nums">
              {completed} / {total} libraries · {progress}%
            </p>
            <ScrollArea className="h-72 rounded-md border border-border/60">
              <ul className="divide-y divide-border/40">
                {rows.map((row, i) => (
                  <li key={row.library.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <StatusIcon status={row.status} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{row.library.name}</div>
                      {row.error ? (
                        <div className="text-[11px] text-destructive truncate">{row.error}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground tabular-nums">
                          {row.library.icons.length} → {row.library.icons.length + row.added}
                          {row.status === 'running' ? ' (generating…)' : ''}
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
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {busy ? 'Expanding…' : finished ? 'Done' : `Add ${expandBy} to each`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StatusIcon = ({ status }: { status: RowStatus }) => {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <div className="h-4 w-4 rounded-full border border-border/60" />;
};
