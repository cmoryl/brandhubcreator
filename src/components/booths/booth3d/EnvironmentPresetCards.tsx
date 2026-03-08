/**
 * EnvironmentPresetCards - Visual environment preset selector
 * Replaces dropdown with clickable preset cards
 */
import { cn } from '@/lib/utils';
import { ENVIRONMENT_PRESETS, type EnvironmentRealism } from './environmentPresets';

interface EnvironmentPresetCardsProps {
  current: EnvironmentRealism;
  onSelect: (preset: EnvironmentRealism) => void;
}

export function EnvironmentPresetCards({ current, onSelect }: EnvironmentPresetCardsProps) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Environment</p>
      <div className="space-y-1">
        {(Object.entries(ENVIRONMENT_PRESETS) as [EnvironmentRealism, typeof ENVIRONMENT_PRESETS[EnvironmentRealism]][]).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
              current === key
                ? "bg-primary/10 border border-primary/30 shadow-sm"
                : "hover:bg-muted/50 border border-transparent"
            )}
          >
            <span className="text-lg shrink-0">{preset.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-[11px] font-semibold",
                current === key ? "text-primary" : "text-foreground"
              )}>
                {preset.label}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">{preset.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
