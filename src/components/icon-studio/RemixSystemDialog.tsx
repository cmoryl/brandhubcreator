/**
 * RemixSystemDialog — pick a remix mutation to clone an icon system into a
 * new variant (filled/duotone/softer/sharper/marketing/ui/presentation/dark).
 *
 * UI-only: passes the chosen mutation key + mutated recipe up to the parent,
 * which is responsible for actually creating the new library and regenerating.
 */

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Sparkles, Moon, Layers, PenTool, Megaphone, Box, Presentation, Square } from 'lucide-react';
import { REMIX_MUTATIONS, type IconRecipe } from '@/lib/iconStudio/recipe';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  systemName?: string;
  baseRecipe?: IconRecipe | null;
  accent?: string;
  onClose: () => void;
  onRemix?: (mutationKey: string, nextRecipe: IconRecipe | null) => void;
}

const MUTATION_META: Record<string, { icon: any; description: string }> = {
  filled: { icon: Square, description: 'Solid, weight-forward icons. Great for navigation and small UI.' },
  duotone: { icon: Layers, description: 'Two-tone treatment using a primary + supporting brand color.' },
  softer: { icon: PenTool, description: 'Rounded corners, thinner strokes. Approachable, friendly tone.' },
  sharper: { icon: PenTool, description: 'Crisp corners, heavier strokes. Editorial and confident.' },
  marketing: { icon: Megaphone, description: 'Higher detail + tinted backplates for hero sections and slides.' },
  ui: { icon: Box, description: 'Compact 24-grid, lighter strokes, tuned for product UI density.' },
  presentation: { icon: Presentation, description: 'Larger grid + detailed strokes for keynote-scale rendering.' },
  dark: { icon: Moon, description: 'Inverted contrast pairing, optimised for dark surfaces and overlays.' },
};

export const RemixSystemDialog = ({
  open,
  systemName,
  baseRecipe,
  accent = '#139DD8',
  onClose,
  onRemix,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null);

  const options = useMemo(() => {
    const keys = Object.keys(REMIX_MUTATIONS);
    // Add a virtual "dark" option that just signals a dark companion variant.
    return [...keys, 'dark'];
  }, []);

  const handleConfirm = () => {
    if (!selected) return;
    let next: IconRecipe | null = null;
    if (baseRecipe && REMIX_MUTATIONS[selected]) {
      next = REMIX_MUTATIONS[selected].mutate(baseRecipe);
    }
    onRemix?.(selected, next);
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">Remix</Badge>
            <Wand2 className="h-3 w-3" />
            <span>Create a new system variant</span>
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Remix {systemName || 'this system'}
          </DialogTitle>
          <DialogDescription>
            Spin up a new system that inherits this brand DNA, then re-shaped by your chosen style direction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {options.map((key) => {
            const meta = MUTATION_META[key];
            const label =
              REMIX_MUTATIONS[key]?.label ?? (key === 'dark' ? 'Dark mode version' : key);
            const Icon = meta?.icon ?? Sparkles;
            const isSelected = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-transparent shadow-md'
                    : 'border-border/60 hover:border-border bg-card',
                )}
                style={
                  isSelected
                    ? {
                        background: `color-mix(in oklab, ${accent} 12%, var(--card))`,
                        boxShadow: `0 0 0 1.5px ${accent} inset`,
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                    style={{
                      background: `color-mix(in oklab, ${accent} 16%, transparent)`,
                      color: accent,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {meta?.description ?? 'Variant of the base system.'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/60 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Create remix
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
