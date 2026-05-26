/**
 * AbTestPanel — admin UI for icon A/B tests. Lists running tests, creates
 * new ones from any two+ icons in a library, shows live CTR results and a
 * "Promote winner" action that flips the test to completed.
 */

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Beaker, Trophy, Plus, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import { useIconAbResults } from '@/hooks/useIconAbTest';
import { IconSvgRender } from '@/components/icon-studio/IconSvgRender';

interface Test {
  id: string;
  name: string;
  slot_key: string;
  status: string;
  winner_variant_id: string | null;
  library_id: string | null;
  created_at: string;
}

interface Props {
  libraries: IconLibrary[];
  organizationId?: string;
}

export const AbTestPanel = ({ libraries, organizationId }: Props) => {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);

  const { data: tests = [] } = useQuery({
    queryKey: ['icon-ab-tests', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('icon_ab_tests')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Test[];
    },
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('icon_ab_tests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['icon-ab-tests', organizationId] });
      toast.success('Test deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="tp-card p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Beaker className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">A/B testing</h3>
            <p className="text-[11px] text-muted-foreground">
              Serve weighted icon variants in production, track impressions &amp; clicks,
              promote the winner.
            </p>
          </div>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={!organizationId}>
              <Plus className="h-3.5 w-3.5" /> New test
            </Button>
          </DialogTrigger>
          <CreateTestDialog
            libraries={libraries}
            organizationId={organizationId}
            onClose={() => setOpenCreate(false)}
          />
        </Dialog>
      </header>

      {tests.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No A/B tests yet. Create one to start comparing icon variants.
        </div>
      ) : (
        <ul className="space-y-3">
          {tests.map((t) => (
            <TestRow
              key={t.id}
              test={t}
              onDelete={() => deleteTest.mutate(t.id)}
              onChanged={() =>
                qc.invalidateQueries({ queryKey: ['icon-ab-tests', organizationId] })
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Single test row + results                                                   */
/* -------------------------------------------------------------------------- */

const TestRow = ({
  test,
  onDelete,
  onChanged,
}: {
  test: Test;
  onDelete: () => void;
  onChanged: () => void;
}) => {
  const { data: results = [], refetch } = useIconAbResults(test.id);

  const promote = useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from('icon_ab_tests')
        .update({ winner_variant_id: variantId, status: 'completed' })
        .eq('id', test.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Winner promoted');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalImpressions = results.reduce((s, r) => s + Number(r.impressions), 0);
  const totalClicks = results.reduce((s, r) => s + Number(r.clicks), 0);

  return (
    <li className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{test.name}</span>
            <Badge
              variant={test.status === 'completed' ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {test.status}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              slot: {test.slot_key}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              title="Copy <AbTestedIcon> snippet to wire this test into a surface"
              onClick={() => {
                const snippet = `<AbTestedIcon\n  slotKey="${test.slot_key}"\n  fallbackIcon={icon}\n  size={24}\n  onClick={() => { /* handle click */ }}\n/>`;
                navigator.clipboard.writeText(snippet);
                toast.success('Snippet copied to clipboard');
              }}
            >
              Copy snippet
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totalImpressions.toLocaleString()} impressions ·{' '}
            {totalClicks.toLocaleString()} clicks
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Refresh"
            onClick={() => refetch()}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            title="Delete"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="py-3 text-center text-[11px] text-muted-foreground">
          No traffic yet.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {results.map((r, i) => {
            const isWinner = test.winner_variant_id === r.variant_id;
            const isLeader = i === 0 && Number(r.impressions) > 0;
            return (
              <li
                key={r.variant_id}
                className="flex items-center gap-3 py-2 text-xs"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {isWinner && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                  <span className="truncate font-medium">
                    {r.label ?? 'variant'}
                  </span>
                  {isLeader && !isWinner && (
                    <Badge variant="outline" className="text-[9px]">
                      leader
                    </Badge>
                  )}
                </div>
                <span className="tabular-nums text-muted-foreground w-20 text-right">
                  {Number(r.impressions).toLocaleString()} imp
                </span>
                <span className="tabular-nums text-muted-foreground w-16 text-right">
                  {Number(r.clicks).toLocaleString()} clk
                </span>
                <span className="tabular-nums font-semibold w-14 text-right">
                  {(Number(r.ctr) * 100).toFixed(1)}%
                </span>
                {test.status !== 'completed' && Number(r.impressions) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => promote.mutate(r.variant_id)}
                  >
                    Promote
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

/* -------------------------------------------------------------------------- */
/* Create test dialog                                                          */
/* -------------------------------------------------------------------------- */

const CreateTestDialog = ({
  libraries,
  organizationId,
  onClose,
}: {
  libraries: IconLibrary[];
  organizationId?: string;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slot, setSlot] = useState('');
  const [libraryId, setLibraryId] = useState<string>(libraries[0]?.id ?? '');
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());

  const library = useMemo(
    () => libraries.find((l) => l.id === libraryId),
    [libraries, libraryId],
  );
  const icons = library?.icons ?? [];

  const toggleIcon = (id: string) => {
    setSelectedIcons((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization');
      if (!name.trim() || !slot.trim()) throw new Error('Name and slot are required');
      if (selectedIcons.size < 2) throw new Error('Pick at least 2 icons');

      const { data: test, error: te } = await supabase
        .from('icon_ab_tests')
        .insert({
          organization_id: organizationId,
          library_id: libraryId || null,
          name: name.trim(),
          slot_key: slot.trim(),
          status: 'running',
        })
        .select()
        .single();
      if (te) throw te;

      const variantRows = Array.from(selectedIcons)
        .map((id) => icons.find((i) => String(i.id) === id))
        .filter(Boolean)
        .map((ic) => ({
          test_id: test.id,
          icon_id: String(ic!.id ?? ic!.name),
          label: ic!.name,
          svg_path: (ic as { svgPath?: string }).svgPath ?? null,
          view_box: (ic as { viewBox?: string }).viewBox ?? '0 0 24 24',
          weight: 1,
        }));

      const { error: ve } = await supabase.from('icon_ab_variants').insert(variantRows);
      if (ve) throw ve;
    },
    onSuccess: () => {
      toast.success('A/B test created');
      qc.invalidateQueries({ queryKey: ['icon-ab-tests', organizationId] });
      onClose();
      setName('');
      setSlot('');
      setSelectedIcons(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>New A/B test</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Test name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homepage hero icon"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Slot key</label>
            <Input
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              placeholder="hero.primary"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Source library</label>
          <Select value={libraryId} onValueChange={setLibraryId}>
            <SelectTrigger><SelectValue placeholder="Pick a library" /></SelectTrigger>
            <SelectContent>
              {libraries.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({l.icons.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">
            Variants ({selectedIcons.size} selected — pick at least 2)
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 border rounded-md">
            {icons.map((ic) => {
              const id = String(ic.id ?? ic.name);
              const checked = selectedIcons.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleIcon(id)}
                  className={`relative flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] transition ${
                    checked ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                  }`}
                >
                  <Checkbox checked={checked} className="absolute top-1 right-1 h-3 w-3" />
                  <div className="h-8 w-8 flex items-center justify-center">
                    <IconSvgRender icon={ic} size={28} />
                  </div>
                  <span className="truncate w-full text-center">{ic.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create test'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
