import { useMemo } from "react";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
import { scoreGradient } from "@/lib/gradientA11y";

interface Props {
  gradient: StudioGradient;
  onPick: (g: StudioGradient) => void;
}

// Deterministic variations of the current gradient — no randomness, predictable to scrub.
const makeVariations = (g: StudioGradient): { label: string; gradient: StudioGradient }[] => {
  const reversedStops = [...g.stops].map((s, i, arr) => ({
    ...s,
    position: 100 - arr[arr.length - 1 - i].position,
    color: arr[arr.length - 1 - i].color,
  }));
  const rotated = (deg: number): StudioGradient => ({ ...g, id: crypto.randomUUID(), angle: (g.angle + deg + 360) % 360 });
  return [
    { label: "Reverse", gradient: { ...g, id: crypto.randomUUID(), stops: reversedStops } },
    { label: "+45°", gradient: rotated(45) },
    { label: "+90°", gradient: rotated(90) },
    { label: "Radial", gradient: { ...g, id: crypto.randomUUID(), type: "radial" } },
    { label: "Conic", gradient: { ...g, id: crypto.randomUUID(), type: "conic" } },
    { label: "Linear", gradient: { ...g, id: crypto.randomUUID(), type: "linear", angle: 180 } },
  ];
};

export const GradientVariations = ({ gradient, onPick }: Props) => {
  const variations = useMemo(() => makeVariations(gradient), [gradient]);

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Variations</h3>
        <span className="text-[10px] text-muted-foreground/70">Click to apply</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {variations.map(({ label, gradient: v }) => {
          const score = scoreGradient(v);
          const best = Math.max(score.minRatioWhite, score.minRatioDark);
          const tone = best >= 4.5 ? "text-emerald-600 dark:text-emerald-400" : best >= 3 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPick(v)}
              className="group rounded-lg border border-border/60 overflow-hidden hover:border-primary/60 hover:shadow-md transition-all bg-secondary/30"
              title={`${label} — best contrast ${best.toFixed(2)}:1`}
            >
              <div
                className="h-14 w-full"
                style={{ background: toCssGradient(v) }}
              />
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-foreground/80 truncate">{label}</span>
                <span className={`text-[9px] font-mono font-bold ${tone}`}>{best.toFixed(1)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
