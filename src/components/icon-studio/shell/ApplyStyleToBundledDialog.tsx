/**
 * ApplyStyleToBundledDialog — bulk-restyle bundled icons through a Style
 * System recipe and save the result as a new core icon library.
 *
 * Pipeline:
 *   1. User picks a pack, optional category, optional variant, and a count cap.
 *   2. We pull the pack index, filter, and stream through `restyleBundledIcon`
 *      sequentially (cheap thanks to its memory + localStorage cache).
 *   3. Results become a `BrandIconography[]` payload, persisted via the
 *      existing `createLibrary` mutation. No DB schema changes needed.
 *   4. On success we toast and deep-link the new library in LibraryView via
 *      the `onCreated(libraryId)` callback the page wires up.
 */

import { useEffect, useMemo, useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { BaseStyle } from './studioData';
import { getStyleSource, styleRecipeToDna } from './styleRecipeToDna';
import { useImportedIcons } from '@/hooks/useImportedIcons';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { loadPackIndex } from '@/lib/iconLibrary/loader';
import { restyleBundledIcon } from '@/lib/iconLibrary/restyle';
import type { IconIndexEntry } from '@/lib/iconLibrary/types';
import type { BrandIconography } from '@/types/brand';

const VARIANT_TOKENS = [
  'outline', 'outlined', 'filled', 'fill', 'solid', 'duotone',
  'two-tone', 'twotone', 'bold', 'thin', 'light', 'regular',
  'rounded', 'sharp', 'linear', 'broken', 'mono', 'color',
] as const;

const variantsOf = (name: string): string[] => {
  const tokens = name.toLowerCase().split(/[-_]/);
  return VARIANT_TOKENS.filter((v) => tokens.includes(v));
};

const MAX_COUNT = 250;
const DEFAULT_COUNT = 48;

interface Props {
  style: BaseStyle | null;
  accent: string;
  organizationId?: string;
  onClose: () => void;
  /** Called with the new library id so the parent can deep-link to it. */
  onCreated?: (libraryId: string) => void;
}

export function ApplyStyleToBundledDialog({
  style,
  accent,
  organizationId,
  onClose,
  onCreated,
}: Props) {
  const open = !!style && !!organizationId;
  const { packs } = useImportedIcons();
  const { createLibrary } = useIconLibraries(organizationId);

  const source = useMemo(() => (style ? getStyleSource(style) : null), [style]);
  const preferredPackId = source?.packs[0];

  const [packId, setPackId] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [variant, setVariant] = useState<string>('all');
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [name, setName] = useState<string>('');
  const [index, setIndex] = useState<IconIndexEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize selections when dialog opens / style changes.
  useEffect(() => {
    if (!open || !style) return;
    const initial =
      preferredPackId && packs.some((p) => p.id === preferredPackId)
        ? preferredPackId
        : packs[0]?.id ?? '';
    setPackId(initial);
    setCategory('all');
    setVariant(source?.variants[0] ?? 'all');
    setCount(DEFAULT_COUNT);
    setName(`${style.name}`);
  }, [open, style, preferredPackId, packs, source]);

  // Load the chosen pack's index for filtering / preview counts.
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadPackIndex(packId)
      .then((d) => {
        if (!cancelled) setIndex(d);
      })
      .catch(() => {
        if (!cancelled) setIndex([]);
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  const currentPack = useMemo(() => packs.find((p) => p.id === packId), [packs, packId]);
  const categories = useMemo(() => {
    if (!currentPack) return ['all'];
    return ['all', ...Object.keys(currentPack.categories).sort()];
  }, [currentPack]);
  const availableVariants = useMemo(() => {
    const present = new Set<string>();
    for (const e of index) for (const v of variantsOf(e.n)) present.add(v);
    return VARIANT_TOKENS.filter((v) => present.has(v));
  }, [index]);

  const filtered = useMemo(() => {
    return index.filter((e) => {
      if (category !== 'all' && e.c !== category) return false;
      if (variant !== 'all' && !variantsOf(e.n).includes(variant)) return false;
      return true;
    });
  }, [index, category, variant]);

  const eligibleCount = Math.min(filtered.length, count);

  const handleApply = async () => {
    if (!style || !packId || !organizationId || filtered.length === 0) return;
    setBusy(true);
    setProgress(0);
    const dna = styleRecipeToDna(style, accent);
    const slice = filtered.slice(0, count);
    const icons: BrandIconography[] = [];

    try {
      for (let i = 0; i < slice.length; i++) {
        const entry = slice[i];
        try {
          const r = await restyleBundledIcon(packId, entry.n, dna);
          icons.push({
            id: `restyled:${packId}/${entry.n}/${style.id}`,
            name: entry.n,
            svgPath: r.svg, // full <svg> string — supported downstream
            category: entry.c || 'misc',
            viewBox: '0 0 24 24',
            fillMode: dna.fillMode === 'stroke' ? 'stroke' : 'fill',
          });
        } catch {
          // Skip individual failures; pipeline keeps going.
        }
        setProgress(Math.round(((i + 1) / slice.length) * 100));
      }

      if (icons.length === 0) {
        toast.error('No icons could be restyled');
        return;
      }

      const finalName = name.trim() || `${currentPack?.name ?? packId} · ${style.name}`;
      const created = await createLibrary.mutateAsync({
        organization_id: organizationId,
        name: finalName,
        level: 'core',
        description: `${icons.length} icons restyled from ${currentPack?.name ?? packId} with the “${style.name}” style.`,
        icons,
      });
      if (created?.id) onCreated?.(created.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!style) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Apply “{style.name}” to a bundled pack
          </DialogTitle>
          <DialogDescription>
            Restyles bundled icons through this Style System and saves the
            result as a new core library you can use across brand sections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label className="text-xs">Source pack</Label>
            <Select value={packId} onValueChange={setPackId} disabled={busy}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pick a pack" />
              </SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {packs.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-[12px]">
                    <span className="flex items-center justify-between gap-3 w-full">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {p.count.toLocaleString()}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preferredPackId && (
              <p className="text-[10px] text-muted-foreground">
                Recommended for this style: <span className="font-medium">{preferredPackId}</span>
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={busy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh]">
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-[12px] capitalize">
                      {c === 'all' ? 'All categories' : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Variant</Label>
              <Select
                value={variant}
                onValueChange={setVariant}
                disabled={busy || availableVariants.length === 0}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All variants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All variants</SelectItem>
                  {availableVariants.map((v) => (
                    <SelectItem key={v} value={v} className="text-[12px] capitalize">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs">Icon count (max {MAX_COUNT})</Label>
              <Input
                type="number"
                min={1}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setCount(Math.max(1, Math.min(MAX_COUNT, n)));
                }}
                disabled={busy}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Library name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${currentPack?.name ?? packId} · ${style.name}`}
                disabled={busy}
              />
            </div>
          </div>

          <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} icons match — will restyle{' '}
            <span className="font-medium text-foreground">{eligibleCount.toLocaleString()}</span>.
          </div>

          {busy && (
            <div className="space-y-1">
              <Progress value={progress} />
              <div className="text-[11px] text-muted-foreground text-right">{progress}%</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleApply}
            disabled={busy || eligibleCount === 0 || !organizationId}
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Restyling…
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                Restyle & save library
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
