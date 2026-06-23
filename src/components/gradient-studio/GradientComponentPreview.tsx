import { useMemo } from "react";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
import {
  sampleGradientColors,
  contrastRatio,
  parseColor,
  rgbToHex,
  RGB,
} from "@/lib/gradientA11y";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";

interface Props {
  gradient: StudioGradient;
  /** Override text color; default tests both light and dark variants. */
  variant?: "light" | "dark" | "both";
  compact?: boolean;
}

/**
 * Renders example UI components on top of the gradient and reports
 * WCAG compliance against the worst-case background under each component.
 *
 * Thresholds (WCAG 2.1):
 *  - Normal text (<18pt or <14pt bold): AA 4.5, AAA 7
 *  - Large text (>=18pt or >=14pt bold): AA 3, AAA 4.5
 *  - UI / graphical (buttons, focus, icons): AA 3:1 (SC 1.4.11)
 */
export const GradientComponentPreview = ({ gradient, variant = "both", compact }: Props) => {
  const samples = useMemo(() => sampleGradientColors(gradient), [gradient]);
  const css = useMemo(() => toCssGradient(gradient), [gradient]);

  const worst = (text: RGB) => {
    let min = Infinity;
    for (const s of samples) min = Math.min(min, contrastRatio(s, text));
    return min;
  };

  const surfaces = variant === "both"
    ? ([
        { key: "light", textHex: "#FFFFFF", mutedHex: "#E5E7EB", linkHex: "#A1FBF9", btnBg: "#FFFFFF", btnFg: "#0A0A0A", label: "Light surface" },
        { key: "dark",  textHex: "#0A0A0A", mutedHex: "#374151", linkHex: "#0033A0", btnBg: "#0A0A0A", btnFg: "#FFFFFF", label: "Dark surface" },
      ] as const)
    : variant === "light"
      ? ([{ key: "light", textHex: "#FFFFFF", mutedHex: "#E5E7EB", linkHex: "#A1FBF9", btnBg: "#FFFFFF", btnFg: "#0A0A0A", label: "Light surface" }] as const)
      : ([{ key: "dark", textHex: "#0A0A0A", mutedHex: "#374151", linkHex: "#0033A0", btnBg: "#0A0A0A", btnFg: "#FFFFFF", label: "Dark surface" }] as const);

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${surfaces.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {surfaces.map((s) => {
          const text = parseColor(s.textHex);
          const muted = parseColor(s.mutedHex);
          const link = parseColor(s.linkHex);
          const btnBg = parseColor(s.btnBg);

          const headingRatio = worst(text);
          const bodyRatio = worst(text);
          const mutedRatio = worst(muted);
          const linkRatio = worst(link);
          // Solid button: contrast of button BG vs gradient (UI 3:1)
          const buttonUiRatio = worst(btnBg);

          // Heading & button label use "large text" thresholds.
          const checks = [
            { label: "Heading (24px / Bold)",  ratio: headingRatio, aa: 3,   aaa: 4.5, kind: "large" },
            { label: "Body text (16px)",        ratio: bodyRatio,    aa: 4.5, aaa: 7,   kind: "normal" },
            { label: "Muted text (14px)",       ratio: mutedRatio,   aa: 4.5, aaa: 7,   kind: "normal" },
            { label: "Link (16px)",             ratio: linkRatio,    aa: 4.5, aaa: 7,   kind: "normal" },
            { label: "Button vs background",    ratio: buttonUiRatio, aa: 3,  aaa: 4.5, kind: "ui" },
          ];

          return (
            <div key={s.key} className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
                <span className="text-xs font-medium text-foreground">{s.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{s.textHex}</span>
              </div>
              <div className="relative p-5 space-y-3" style={{ background: css, color: s.textHex }}>
                <h3 className="text-2xl font-bold leading-tight" style={{ color: s.textHex }}>
                  Brand Headline Goes Here
                </h3>
                <p className="text-base" style={{ color: s.textHex }}>
                  Body copy renders against your gradient. Run real components through the same contrast checks your typography uses in production.
                </p>
                <p className="text-sm" style={{ color: s.mutedHex }}>
                  Muted helper text — captions, metadata, secondary labels.
                </p>
                <a href="#" className="text-base underline underline-offset-2 inline-block" style={{ color: s.linkHex }}>
                  In-line link example
                </a>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md font-semibold text-sm shadow-sm"
                    style={{ background: s.btnBg, color: s.btnFg }}
                  >
                    Primary action
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md font-semibold text-sm border-2"
                    style={{ borderColor: s.textHex, color: s.textHex, background: "transparent" }}
                  >
                    Outline action
                  </button>
                </div>
              </div>

              {!compact && (
                <div className="bg-card border-t border-border px-3 py-2.5 space-y-1.5">
                  {checks.map((c) => (
                    <CheckRow key={c.label} {...c} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <p className="text-[11px] text-muted-foreground">
          Worst-case sampled across {samples.length} points on the gradient. Large text = 18pt+ or 14pt+ bold (AA 3:1); normal text AA 4.5:1; non-text UI AA 3:1 (WCAG 2.1 SC 1.4.3 / 1.4.11).
          {samples.length > 0 && (
            <> Sample colors:{" "}
              {samples.slice(0, 9).map((s) => rgbToHex(s)).join(" · ")}
            </>
          )}
        </p>
      )}
    </div>
  );
};

const CheckRow = ({
  label, ratio, aa, aaa, kind,
}: { label: string; ratio: number; aa: number; aaa: number; kind: string }) => {
  const passAAA = ratio >= aaa;
  const passAA = ratio >= aa;
  const Icon = passAAA ? Check : passAA ? AlertTriangle : X;
  const tone = passAAA
    ? "text-emerald-600 dark:text-emerald-400"
    : passAA
      ? "text-amber-600 dark:text-amber-400"
      : "text-destructive";
  const verdict = passAAA ? "AAA" : passAA ? "AA" : "FAIL";
  const verdictTone = passAAA
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : passAA
      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
      : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} aria-hidden />
        <span className="text-foreground truncate">{label}</span>
        <span className="text-[10px] text-muted-foreground">({kind})</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-mono text-muted-foreground">{ratio.toFixed(2)}:1</span>
        <Badge variant="outline" className={`text-[10px] ${verdictTone}`}>{verdict}</Badge>
      </div>
    </div>
  );
};
