import { useMemo, useState } from "react";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
import {
  sampleGradientColors,
  contrastRatio,
  parseColor,
  RGB,
} from "@/lib/gradientA11y";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type StateKey = "default" | "hover" | "active" | "focus" | "disabled";
const STATES: StateKey[] = ["default", "hover", "active", "focus", "disabled"];

interface Props {
  gradient: StudioGradient;
  compact?: boolean;
}

interface StateStyle {
  bg: string;
  fg: string;
  border?: string;
  ring?: string;       // focus ring color
  opacity?: number;
  underline?: boolean;
}

const clampHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const mix = (hex: string, withHex: string, t: number) => {
  const a = parseColor(hex), b = parseColor(withHex);
  return "#" + clampHex(a.r + (b.r - a.r) * t) + clampHex(a.g + (b.g - a.g) * t) + clampHex(a.b + (b.b - a.b) * t);
};

/** Token-style state generator: derive hover/active by mixing toward black/white. */
const deriveStates = (base: { bg: string; fg: string; border?: string; ring: string }, kind: "solid" | "outline" | "link"): Record<StateKey, StateStyle> => {
  const { bg, fg, border, ring } = base;
  if (kind === "solid") {
    return {
      default:  { bg, fg, ring },
      hover:    { bg: mix(bg, "#000000", 0.12), fg, ring },
      active:   { bg: mix(bg, "#000000", 0.22), fg, ring },
      focus:    { bg, fg, ring },
      disabled: { bg, fg, ring, opacity: 0.45 },
    };
  }
  if (kind === "outline") {
    return {
      default:  { bg: "transparent", fg, border, ring },
      hover:    { bg: mix(fg, "#000000", 0.0) + "22", fg, border, ring }, // 13% tint of fg
      active:   { bg: mix(fg, "#000000", 0.0) + "44", fg, border, ring },
      focus:    { bg: "transparent", fg, border, ring },
      disabled: { bg: "transparent", fg, border, ring, opacity: 0.45 },
    };
  }
  // link
  return {
    default:  { bg: "transparent", fg, ring, underline: true },
    hover:    { bg: "transparent", fg: mix(fg, "#000000", 0.2), ring, underline: true },
    active:   { bg: "transparent", fg: mix(fg, "#000000", 0.35), ring, underline: true },
    focus:    { bg: "transparent", fg, ring, underline: true },
    disabled: { bg: "transparent", fg, ring, underline: false, opacity: 0.45 },
  };
};

/** Worst-case contrast of a single color vs the gradient. */
const worstVs = (samples: RGB[], color: RGB) => {
  let min = Infinity;
  for (const s of samples) min = Math.min(min, contrastRatio(s, color));
  return min;
};

interface Check {
  label: string;
  ratio: number;
  required: number;        // WCAG threshold to pass
  exempt?: boolean;        // disabled states are exempt from contrast
  kind: "text" | "ui";
}

const judge = (c: Check) => {
  if (c.exempt) return "exempt" as const;
  if (c.ratio >= c.required * (c.kind === "text" ? 7 / 4.5 : 4.5 / 3)) return "AAA";
  if (c.ratio >= c.required) return "AA";
  return "FAIL";
};

export const GradientStatePreview = ({ gradient, compact }: Props) => {
  const samples = useMemo(() => sampleGradientColors(gradient), [gradient]);
  const css = useMemo(() => toCssGradient(gradient), [gradient]);
  const [surface, setSurface] = useState<"light" | "dark">("light");

  const base = surface === "light"
    ? { btn: { bg: "#FFFFFF", fg: "#0A0A0A", border: "#FFFFFF", ring: "#A1FBF9" }, link: "#A1FBF9", outlineFg: "#FFFFFF" }
    : { btn: { bg: "#0A0A0A", fg: "#FFFFFF", border: "#0A0A0A", ring: "#003FC7" }, link: "#0033A0", outlineFg: "#0A0A0A" };

  const primary  = deriveStates({ ...base.btn }, "solid");
  const outline  = deriveStates({ bg: "transparent", fg: base.outlineFg, border: base.outlineFg, ring: base.btn.ring }, "outline");
  const link     = deriveStates({ bg: "transparent", fg: base.link, ring: base.btn.ring }, "link");

  // Build checks for one rendered state
  const checksFor = (kind: "solid" | "outline" | "link", state: StateKey, s: StateStyle): Check[] => {
    const isDisabled = state === "disabled";
    const checks: Check[] = [];

    if (kind === "solid") {
      // text on button background
      const labelRatio = contrastRatio(parseColor(s.fg), parseColor(s.bg));
      checks.push({ label: "Label vs button bg", ratio: labelRatio, required: 4.5, kind: "text", exempt: isDisabled });
      // button background vs gradient
      const bgRatio = worstVs(samples, parseColor(s.bg));
      checks.push({ label: "Button bg vs gradient", ratio: bgRatio, required: 3, kind: "ui", exempt: isDisabled });
    } else if (kind === "outline") {
      const labelRatio = worstVs(samples, parseColor(s.fg));
      checks.push({ label: "Label vs gradient", ratio: labelRatio, required: 4.5, kind: "text", exempt: isDisabled });
      if (s.border) {
        const borderRatio = worstVs(samples, parseColor(s.border));
        checks.push({ label: "Border vs gradient", ratio: borderRatio, required: 3, kind: "ui", exempt: isDisabled });
      }
    } else {
      const linkRatio = worstVs(samples, parseColor(s.fg));
      checks.push({ label: "Link vs gradient", ratio: linkRatio, required: 4.5, kind: "text", exempt: isDisabled });
    }

    if (state === "focus" && s.ring) {
      const ringRatio = worstVs(samples, parseColor(s.ring));
      checks.push({ label: "Focus ring vs gradient", ratio: ringRatio, required: 3, kind: "ui" });
    }
    return checks;
  };

  const renderControl = (
    kind: "solid" | "outline" | "link",
    state: StateKey,
    s: StateStyle,
    label: string,
  ) => {
    const isFocus = state === "focus";
    const baseStyle: React.CSSProperties = {
      background: s.bg,
      color: s.fg,
      opacity: s.opacity ?? 1,
      borderColor: s.border ?? "transparent",
      cursor: state === "disabled" ? "not-allowed" : "pointer",
      textDecoration: kind === "link" && s.underline ? "underline" : "none",
      textUnderlineOffset: "2px",
    };
    const focusRing = isFocus
      ? { boxShadow: `0 0 0 2px ${s.bg === "transparent" ? "transparent" : s.bg}, 0 0 0 4px ${s.ring}` }
      : {};
    if (kind === "link") {
      return (
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-block text-sm font-medium"
          style={{ ...baseStyle, ...focusRing, padding: isFocus ? "2px 4px" : 0, borderRadius: 4 }}
        >
          {label}
        </a>
      );
    }
    return (
      <button
        type="button"
        disabled={state === "disabled"}
        className="px-3 py-1.5 rounded-md text-sm font-semibold border-2"
        style={{ ...baseStyle, ...focusRing }}
      >
        {label}
      </button>
    );
  };

  const KINDS: { key: "solid" | "outline" | "link"; label: string; states: Record<StateKey, StateStyle> }[] = [
    { key: "solid",   label: "Primary button", states: primary },
    { key: "outline", label: "Outline button", states: outline },
    { key: "link",    label: "Inline link",    states: link },
  ];

  return (
    <div className="space-y-3">
      {/* Surface toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Component surface theme:</span>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setSurface("light")}
            className={`px-3 h-7 text-xs ${surface === "light" ? "bg-secondary text-foreground" : "bg-card text-muted-foreground"}`}
          >
            Light
          </button>
          <button
            onClick={() => setSurface("dark")}
            className={`px-3 h-7 text-xs border-l border-border ${surface === "dark" ? "bg-secondary text-foreground" : "bg-card text-muted-foreground"}`}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[140px_repeat(5,1fr)] bg-card border-b border-border text-[11px] font-medium text-muted-foreground">
          <div className="px-3 py-2">Component</div>
          {STATES.map((s) => (
            <div key={s} className="px-3 py-2 capitalize border-l border-border">{s}</div>
          ))}
        </div>

        {/* Rows */}
        {KINDS.map(({ key, label, states }) => (
          <div
            key={key}
            className="grid grid-cols-[140px_repeat(5,1fr)] border-b border-border last:border-b-0"
          >
            <div className="px-3 py-3 text-xs font-medium text-foreground bg-card border-r border-border flex items-center">
              {label}
            </div>
            {STATES.map((state) => {
              const style = states[state];
              const checks = checksFor(key, state, style);
              const worst = checks.filter((c) => !c.exempt).reduce(
                (acc, c) => Math.min(acc, c.ratio / c.required),
                Infinity,
              );
              const allPass = worst >= 1;
              const overallTone =
                state === "disabled"
                  ? "bg-muted/30 text-muted-foreground border-border"
                  : allPass
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-destructive/15 text-destructive border-destructive/30";

              return (
                <div key={state} className="border-l border-border p-3 space-y-2" style={{ background: css }}>
                  <div className="flex items-center justify-center min-h-[40px]">
                    {renderControl(key, state, style, key === "link" ? "Learn more" : "Button")}
                  </div>
                  {!compact && (
                    <div className="bg-background/85 backdrop-blur-sm rounded p-1.5 space-y-1">
                      <Badge variant="outline" className={`text-[10px] w-full justify-center ${overallTone}`}>
                        {state === "disabled" ? "Exempt (disabled)" : allPass ? "WCAG Pass" : "WCAG Fail"}
                      </Badge>
                      {checks.map((c, i) => (
                        <CheckLine key={i} check={c} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!compact && (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            Hover/active darken the base color by 12 / 22%. Focus uses a 2px ring on the surface accent.
            Disabled controls are exempt from WCAG contrast (SC 1.4.3 / 1.4.11) but ratios are still shown for awareness.
          </span>
        </div>
      )}
    </div>
  );
};

const CheckLine = ({ check }: { check: Check }) => {
  const verdict = judge(check);
  const Icon = verdict === "AAA" || verdict === "AA" ? Check : verdict === "exempt" ? Info : verdict === "FAIL" ? X : AlertTriangle;
  const tone =
    verdict === "AAA" || verdict === "AA" ? "text-emerald-600 dark:text-emerald-400"
    : verdict === "exempt" ? "text-muted-foreground"
    : "text-destructive";
  const verdictTone =
    verdict === "AAA" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : verdict === "AA" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
    : verdict === "exempt" ? "bg-muted/40 text-muted-foreground border-border"
    : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <div className="flex items-center justify-between gap-1 text-[10px]">
      <div className="flex items-center gap-1 min-w-0">
        <Icon className={`h-2.5 w-2.5 shrink-0 ${tone}`} />
        <span className="text-foreground truncate">{check.label}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-muted-foreground">{check.ratio.toFixed(1)}</span>
        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${verdictTone}`}>{verdict}</Badge>
      </div>
    </div>
  );
};
