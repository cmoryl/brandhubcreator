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
import { AIGradientDesigner } from "@/components/gradient-studio/AIGradientDesigner";
import { SavedGradients } from "@/components/gradient-studio/SavedGradients";
import { ImageGradientAnalyzer } from "@/components/gradient-studio/ImageGradientAnalyzer";
import { scoreGradient } from "@/lib/gradientA11y";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

import { BRAND_PRESETS, BRAND_PRESET_GROUPS, BrandPreset } from "@/lib/transperfectPresets";
import { toCssGradient } from "@/lib/gradientStudio";



const GradientStudio = () => {
  useSEO({
    title: "Gradient Studio — design and export gradients",
    description: "Create linear, radial, conic, and mesh gradients with noise and animation. Export to CSS, Tailwind, SVG, PNG, and JPG.",
  });

  const [params] = useSearchParams();
  const [tab, setTab] = useState<string>("editor");
  const [gradient, setGradient] = useState<StudioGradient>(() => {
    const seed = params.get("css");
    if (seed) {
      const parsed = extractStudioGradient(seed);
      if (parsed) return parsed;
    }
    return BRAND_PRESETS[0].build();
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

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="ai">AI Designer</TabsTrigger>
            <TabsTrigger value="image">From Image</TabsTrigger>
            <TabsTrigger value="combinations">Combinations &amp; A11y</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            {/* Brand presets — TransPerfect Master Brand palette, WCAG-tuned */}
            <BrandPresetShelf onPick={setGradient} />


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

          <TabsContent value="ai">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">AI Gradient Designer</h2>
                <p className="text-xs text-muted-foreground">
                  Describe what you want and the AI builds it from the TransPerfect palette, or upload a reference image to extract its palette and rebuild it as a mesh / linear gradient.
                </p>
              </div>
              <AIGradientDesigner
                brandPalette={palette}
                onUseGradient={(g) => { setGradient(g); setTab("editor"); }}
              />
            </div>
          </TabsContent>

          <TabsContent value="image">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Analyze a gradient image</h2>
                <p className="text-xs text-muted-foreground">
                  Upload a gradient screenshot or photo. We extract its palette, rebuild it as mesh &amp; linear gradients, grade each for WCAG contrast, and let admins save the result to the shared library.
                </p>
              </div>
              <ImageGradientAnalyzer
                onUseGradient={(g) => { setGradient(g); setTab("editor"); }}
              />
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
                onUseGradient={(g) => { setGradient(g); setTab("editor"); }}
              />
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Saved gradients</h2>
                <p className="text-xs text-muted-foreground">
                  Admin-curated library of reusable gradients. Admins can save the current editor gradient; everyone can browse and load them into the editor.
                </p>
              </div>
              <SavedGradients
                currentGradient={gradient}
                onUseGradient={(g) => { setGradient(g); setTab("editor"); }}
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

const BrandPresetShelf = ({ onPick }: { onPick: (g: StudioGradient) => void }) => {
  // Score each preset once to surface live AA / AAA badges.
  const scored = useMemo(
    () => BRAND_PRESETS.map((p) => {
      const g = p.build();
      return { preset: p, gradient: g, score: scoreGradient(g) };
    }),
    [],
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              TransPerfect Brand Presets
            </span>
            <span className="text-[10px] text-muted-foreground/70">{BRAND_PRESETS.length}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            Master Brand palette · tuned for WCAG AA on recommended text.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPick(createStudioGradient({ name: "Untitled" }))}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          Blank canvas
        </button>
      </div>

      {/* Groups */}
      <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
        {BRAND_PRESET_GROUPS.map((group) => {
          const items = scored.filter((s) => s.preset.group === group);
          if (!items.length) return null;
          return (
            <section key={group} className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-1">
                {group}
              </h3>
              <div className="flex flex-col gap-1">
                {items.map(({ preset, gradient, score }) => (
                  <PresetTile
                    key={preset.name}
                    preset={preset}
                    gradient={gradient}
                    score={score}
                    onPick={onPick}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const PresetTile = ({
  preset, gradient, score, onPick,
}: {
  preset: BrandPreset;
  gradient: StudioGradient;
  score: ReturnType<typeof scoreGradient>;
  onPick: (g: StudioGradient) => void;
}) => {
  const recommended = preset.recommendedText;
  const ratio = recommended === "light" ? score.minRatioWhite : score.minRatioDark;
  const level = recommended === "light" ? score.whiteLevel : score.darkLevel;
  const badgeTone =
    level === "AAA" || level === "AA"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : level === "AA-Large"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <button
      type="button"
      onClick={() => onPick(preset.build())}
      title={`${preset.name} — ${preset.description} · ${ratio.toFixed(2)}:1 ${level}`}
      className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/60 hover:bg-secondary hover:border-border transition-all group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-7 h-7 rounded-md border border-border/80 shadow-inner shrink-0"
          style={{ background: toCssGradient(gradient) }}
        />
        <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground truncate">
          {preset.name}
        </span>
      </div>
      <span
        className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter ${badgeTone}`}
      >
        {level === "AA-Large" ? "AA Lg" : level}
      </span>
    </button>
  );
};


export default GradientStudio;

