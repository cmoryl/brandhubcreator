import { useMemo } from "react";
import { X, Copy, Wand2, Check } from "lucide-react";
import {
  parseColor,
  contrastRatio,
  wcagLevel,
  suggestAccessibleAlternatives,
  TEXT_LIGHT,
  TEXT_DARK,
} from "@/lib/gradientA11y";
import { toast } from "sonner";

interface Props {
  hex: string;
  /** Called when the user picks a suggestion to replace the stop's color. */
  onApply: (newHex: string) => void;
  onClose: () => void;
}

const Row = ({
  label,
  ratio,
  swatch,
  fg,
}: {
  label: string;
  ratio: number;
  swatch: string;
  fg: string;
}) => {
  const level = wcagLevel(ratio);
  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;
  const passLarge = ratio >= 3;
  const tone =
    passAA ? "text-emerald-600 dark:text-emerald-400"
    : passLarge ? "text-amber-600 dark:text-amber-400"
    : "text-destructive";
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border/50">
      <div
        className="w-12 h-12 rounded-md flex items-center justify-center text-xs font-bold shrink-0 shadow-inner ring-1 ring-border"
        style={{ background: swatch, color: fg }}
        aria-hidden
      >
        Aa
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
        <div className={`text-lg font-bold tabular-nums ${tone}`}>{ratio.toFixed(2)}:1</div>
      </div>
      <div className="flex flex-col items-end gap-1 text-[10px] font-mono">
        <Pill ok={passLarge} label="AA Large (3:1)" />
        <Pill ok={passAA} label="AA (4.5:1)" />
        <Pill ok={passAAA} label="AAA (7:1)" />
      </div>
    </div>
  );
};

const Pill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold ${
      ok
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
        : "bg-destructive/10 text-destructive ring-1 ring-destructive/25"
    }`}
  >
    {ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
    {label}
  </span>
);

export const StopAccessibilityPanel = ({ hex, onApply, onClose }: Props) => {
  const rgb = useMemo(() => parseColor(hex), [hex]);
  const ratioW = contrastRatio(rgb, TEXT_LIGHT);
  const ratioD = contrastRatio(rgb, TEXT_DARK);
  const preferLight = ratioW >= ratioD;
  const bestRatio = Math.max(ratioW, ratioD);
  const bestLevel = wcagLevel(bestRatio);
  const passesAA = bestRatio >= 4.5;

  // Suggest alternatives only if it doesn't already pass AA against the
  // preferred text; if it already passes AA, suggest AAA-grade alternatives.
  const targetTextHex = preferLight ? "#FFFFFF" : "#111111";
  const targetRatio = passesAA ? 7 : 4.5;
  const alts = useMemo(
    () => suggestAccessibleAlternatives(hex, targetTextHex, targetRatio),
    [hex, targetTextHex, targetRatio],
  );

  const explanation = passesAA
    ? `Passes WCAG AA against ${preferLight ? "light" : "dark"} text at ${bestRatio.toFixed(2)}:1. ${
        bestRatio >= 7
          ? "Also meets the stricter AAA bar — safe for body copy at any size."
          : "Below 7:1 so it would fail AAA for normal body copy. Suggestions below tighten contrast further."
      }`
    : `Fails WCAG AA on both light and dark text (best is ${bestRatio.toFixed(2)}:1 against ${
        preferLight ? "white" : "near-black"
      }, AA needs 4.5:1). ${
        bestRatio >= 3
          ? "Works only for large or bold text ≥ 18pt. Suggestions below bring it to AA for any size."
          : "Not usable for any text. Suggestions below shift lightness until AA passes."
      }`;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value.toUpperCase());
      toast.success(`Copied ${value.toUpperCase()}`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-14 h-14 rounded-lg shrink-0 ring-1 ring-border shadow-inner"
            style={{ background: hex }}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Stop accessibility</h3>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  bestLevel === "AAA" || bestLevel === "AA"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : bestLevel === "AA-Large"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/30"
                }`}
              >
                {bestLevel === "AA-Large" ? "AA Large" : bestLevel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copy(hex)}
              className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-foreground/80 hover:text-foreground mt-1 group"
              title="Copy hex"
            >
              {hex.toUpperCase()}
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
            </button>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-prose">{explanation}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close accessibility details"
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contrast breakdown */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Row label="vs. Light text (#FFF)" ratio={ratioW} swatch={hex} fg="#fff" />
        <Row label="vs. Dark text (#111)" ratio={ratioD} swatch={hex} fg="#111" />
      </div>

      {/* Suggestions */}
      <div className="p-4 pt-0 space-y-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {passesAA ? "Closest AAA-grade alternatives" : "Closest accessible alternatives"}
          </h4>
        </div>
        {alts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1">
            No nearby color satisfies the target ratio — try a fundamentally different hue.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {alts.map((alt) => (
              <button
                key={alt.hex}
                type="button"
                onClick={() => {
                  onApply(alt.hex);
                  toast.success(`Stop updated to ${alt.hex.toUpperCase()}`);
                }}
                title={`Apply ${alt.hex.toUpperCase()} — ${alt.ratio.toFixed(2)}:1 (${alt.level})`}
                className="group text-left rounded-lg border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-primary/50 hover:shadow-md transition-all p-2"
              >
                <div
                  className="h-12 w-full rounded-md ring-1 ring-border mb-2"
                  style={{ background: alt.hex }}
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-foreground">
                    {alt.hex.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {alt.ratio.toFixed(2)}:1
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
                    {alt.strategy}
                  </span>
                  <span className="text-[9px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Apply →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
