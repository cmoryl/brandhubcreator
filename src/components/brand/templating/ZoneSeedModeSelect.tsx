/**
 * ZoneSeedModeSelect
 *
 * Compact select for the global "how should empty zones be seeded?"
 * preference. Renders inline in the templated editor toolbar so the user
 * can flip modes without leaving the canvas.
 */

import { Sparkles, FileText, Square } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useZoneSeedMode, type ZoneSeedMode } from '@/hooks/useZoneSeedMode';

const modeMeta: Record<ZoneSeedMode, { label: string; hint: string; Icon: typeof Sparkles }> = {
  ai:    { label: 'AI demo copy', hint: 'Brand-aware AI', Icon: Sparkles },
  lorem: { label: 'Generic lorem', hint: 'Curated placeholder', Icon: FileText },
  blank: { label: 'Blank zones',   hint: 'No content', Icon: Square },
};

export const ZoneSeedModeSelect = ({ className }: { className?: string }) => {
  const { mode, setMode, isLoaded } = useZoneSeedMode();

  return (
    <div className={className}>
      <Select
        value={mode}
        onValueChange={(v) => setMode(v as ZoneSeedMode)}
        disabled={!isLoaded}
      >
        <SelectTrigger
          className="h-8 gap-1.5 px-2 text-xs"
          aria-label="Default zone seeding mode"
        >
          <SelectValue placeholder="Seed mode" />
        </SelectTrigger>
        <SelectContent align="end">
          {(Object.keys(modeMeta) as ZoneSeedMode[]).map((key) => {
            const { label, hint, Icon } = modeMeta[key];
            return (
              <SelectItem key={key} value={key} className="text-xs">
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span className="font-medium leading-tight">{label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{hint}</span>
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
