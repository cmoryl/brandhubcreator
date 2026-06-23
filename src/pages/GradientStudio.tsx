import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import {
  StudioGradient,
  createStudioGradient,
  extractStudioGradient,
} from "@/lib/gradientStudio";
import { GradientPreview } from "@/components/gradient-studio/GradientPreview";
import { GradientStudioEditor } from "@/components/gradient-studio/GradientStudioEditor";
import { GradientExportPanel } from "@/components/gradient-studio/GradientExportPanel";
import { GradientCombinationMatrix } from "@/components/gradient-studio/GradientCombinationMatrix";
import { GradientComponentPreview } from "@/components/gradient-studio/GradientComponentPreview";
import { GradientStatePreview } from "@/components/gradient-studio/GradientStatePreview";
import { scoreGradient } from "@/lib/gradientA11y";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { BRAND_PRESETS, BRAND_PRESET_GROUPS, BrandPreset } from "@/lib/transperfectPresets";
import { toCssGradient, StudioGradient as _StudioGradient } from "@/lib/gradientStudio";



const GradientStudio = () => {
  useSEO({
    title: "Gradient Studio — design and export gradients",
    description: "Create linear, radial, conic, and mesh gradients with noise and animation. Export to CSS, Tailwind, SVG, PNG, and JPG.",
  });

  const [params] = useSearchParams();
  const [gradient, setGradient] = useState<StudioGradient>(() => {
    const seed = params.get("css");
    if (seed) {
      const parsed = extractStudioGradient(seed);
      if (parsed) return parsed;
    }
    return PRESETS[0].build();
  });

  // Brand palette (from URL ?palette=hex,hex,hex)
  const palette = useMemo(() => {
    const raw = params.get("palette");
    if (!raw) return undefined;
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [params]);

  // Inject keyframes for live preview
  useEffect(() => {
    const id = "gs-keyframes";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes gs-shift  { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }
      @keyframes gs-rotate { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
      @keyframes gs-pulse  { 0%{opacity:.85} 100%{opacity:1} }
    `;
    document.head.appendChild(el);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gradient Studio</h1>
          <p className="text-sm text-muted-foreground">
            Design linear, radial, conic & mesh gradients. Add noise and animation. Export to CSS, Tailwind, SVG and raster.
          </p>
        </header>

        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="combinations">Combinations &amp; A11y</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            {/* Presets */}
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setGradient(p.build())}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors"
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setGradient(createStudioGradient())}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:bg-secondary"
              >
                + Blank
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              {/* Preview + a11y + export */}
              <div className="space-y-4">
                <GradientPreview
                  gradient={gradient}
                  className="w-full rounded-2xl border border-border shadow-sm"
                  style={{ aspectRatio: "16 / 10" }}
                />
                <A11ySummary gradient={gradient} />
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Component preview &amp; a11y</h2>
                    <p className="text-xs text-muted-foreground">Live components rendered on the gradient with per-element WCAG checks.</p>
                  </div>
                  <GradientComponentPreview gradient={gradient} />
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Interactive states &amp; a11y</h2>
                    <p className="text-xs text-muted-foreground">Buttons and links rendered in default, hover, active, focus, and disabled states with WCAG checks for each.</p>
                  </div>
                  <GradientStatePreview gradient={gradient} />
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Export</h2>
                  <GradientExportPanel gradient={gradient} />
                </div>
              </div>

              {/* Editor sidebar */}
              <aside className="bg-card border border-border rounded-xl p-4 lg:sticky lg:top-6 h-fit">
                <GradientStudioEditor
                  gradient={gradient}
                  onChange={setGradient}
                  palette={palette}
                />
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="combinations">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Combination matrix</h2>
                <p className="text-xs text-muted-foreground">
                  Generates every 2-color gradient from your palette and grades each one against light &amp; dark text using WCAG contrast (worst-case ratio across the gradient).
                </p>
              </div>
              <GradientCombinationMatrix
                initialPalette={palette}
                onUseGradient={(g) => setGradient(g)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const A11ySummary = ({ gradient }: { gradient: StudioGradient }) => {
  const score = scoreGradient(gradient);
  const tone = (level: string) =>
    level === "AAA" || level === "AA" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : level === "AA-Large" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
    : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Accessibility (worst-case)</h2>
        <span className="text-[11px] text-muted-foreground">Recommended text: <strong className="text-foreground">{score.recommendedText}</strong></span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3 flex flex-col gap-1 bg-[#0a0a0a] text-white">
          <span className="text-xs opacity-80">Light text (#FFF)</span>
          <span className="text-lg font-semibold">{score.minRatioWhite.toFixed(2)} : 1</span>
          <Badge variant="outline" className={`text-[10px] w-fit ${tone(score.whiteLevel)}`}>{score.whiteLevel}</Badge>
        </div>
        <div className="rounded-md border border-border p-3 flex flex-col gap-1 bg-white text-[#111]">
          <span className="text-xs opacity-80">Dark text (#111)</span>
          <span className="text-lg font-semibold">{score.minRatioDark.toFixed(2)} : 1</span>
          <Badge variant="outline" className={`text-[10px] w-fit ${tone(score.darkLevel)}`}>{score.darkLevel}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {score.samples.map((hex, i) => (
          <span key={i} className="w-5 h-5 rounded border border-border" style={{ background: hex }} title={hex} />
        ))}
      </div>
    </div>
  );
};

export default GradientStudio;
