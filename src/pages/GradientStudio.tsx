import { useCallback, useEffect, useMemo, useState } from "react";
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
import { StudioToolbar } from "@/components/gradient-studio/StudioToolbar";
import { GradientVariations } from "@/components/gradient-studio/GradientVariations";
import { StopAccessibilityPanel } from "@/components/gradient-studio/StopAccessibilityPanel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGradientHistory } from "@/hooks/useGradientHistory";
import { scoreGradient, parseColor, contrastRatio } from "@/lib/gradientA11y";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, Sliders, Sparkles, Image as ImageIcon, Grid3x3, Bookmark } from "lucide-react";

import { BRAND_PRESETS, BRAND_PRESET_GROUPS, BrandPreset } from "@/lib/transperfectPresets";
import { toCssGradient } from "@/lib/gradientStudio";



const GradientStudio = () => {
  useSEO({
    title: "Gradient Studio — design and export gradients",
    description: "Create linear, radial, conic, and mesh gradients with noise and animation. Export to CSS, Tailwind, SVG, PNG, and JPG.",
  });

  const [params] = useSearchParams();
  const [tab, setTab] = useState<string>("editor");
  const initialGradient = useMemo<StudioGradient>(() => {
    const seed = params.get("css");
    if (seed) {
      const parsed = extractStudioGradient(seed);
      if (parsed) return parsed;
    }
    return BRAND_PRESETS[0].build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { gradient, setGradient, undo, redo, canUndo, canRedo } = useGradientHistory(initialGradient);

  const randomize = useCallback(() => {
    // Pick a random preset and apply a random rotation so users always get something fresh.
    const preset = BRAND_PRESETS[Math.floor(Math.random() * BRAND_PRESETS.length)];
    const base = preset.build();
    setGradient({ ...base, id: crypto.randomUUID(), angle: Math.floor(Math.random() * 360) });
  }, [setGradient]);

  const renameGradient = useCallback((name: string) => {
    setGradient((g) => ({ ...g, name }));
  }, [setGradient]);

  // Which stop chip is selected for inline accessibility inspection.
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const updateStopColor = useCallback((stopId: string, newHex: string) => {
    setGradient((g) => {
      if (g.type === "mesh") {
        return { ...g, meshPoints: g.meshPoints.map((p) => p.id === stopId ? { ...p, color: newHex } : p) };
      }
      return { ...g, stops: g.stops.map((s) => s.id === stopId ? { ...s, color: newHex } : s) };
    });
  }, [setGradient]);

  // Resolve the currently selected stop's hex (mesh + stops both supported).
  const selectedStop = useMemo(() => {
    if (!selectedStopId) return null;
    const pool = gradient.type === "mesh" ? gradient.meshPoints : gradient.stops;
    return pool.find((s) => s.id === selectedStopId) ?? null;
  }, [selectedStopId, gradient]);

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
      <StudioToolbar
        gradient={gradient}
        onRename={renameGradient}
        onRandomize={randomize}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <StudioHero gradient={gradient} />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="bg-secondary/50 p-1 h-auto rounded-xl border border-border/60">
            <TabsTrigger value="editor" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Sliders className="w-3.5 h-3.5" /> Editor
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> AI Designer
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <ImageIcon className="w-3.5 h-3.5" /> From Image
            </TabsTrigger>
            <TabsTrigger value="combinations" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Grid3x3 className="w-3.5 h-3.5" /> Combinations
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Bookmark className="w-3.5 h-3.5" /> Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            {/* Brand presets — TransPerfect Master Brand palette, WCAG-tuned */}
            <BrandPresetShelf onPick={setGradient} />


            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              {/* Preview + a11y + export */}
              <div className="space-y-4">
                <div className="relative group">
                  {/* Soft ambient glow that reflects the current gradient */}
                  <div
                    aria-hidden
                    className="absolute -inset-4 rounded-3xl opacity-50 blur-3xl pointer-events-none transition-opacity group-hover:opacity-75"
                    style={{ background: toCssGradient(gradient) }}
                  />
                  <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                    <GradientPreview
                      gradient={gradient}
                      className="w-full"
                      style={{ aspectRatio: "16 / 10" }}
                    />
                    {/* Inner ring for definition over light gradients */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
                    <PreviewA11yBadge gradient={gradient} />
                    <PreviewStopChips
                      gradient={gradient}
                      selectedStopId={selectedStopId}
                      onSelect={(id) => setSelectedStopId((cur) => (cur === id ? null : id))}
                    />
                  </div>
                </div>
                {selectedStop && (
                  <StopAccessibilityPanel
                    hex={selectedStop.color}
                    onApply={(newHex) => updateStopColor(selectedStop.id, newHex)}
                    onClose={() => setSelectedStopId(null)}
                  />
                )}
                <GradientVariations gradient={gradient} onPick={setGradient} />
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


const StudioHero = ({ gradient }: { gradient: StudioGradient }) => {
  const typeLabel = gradient.type[0].toUpperCase() + gradient.type.slice(1);
  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Live gradient backdrop, dimmed */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{ background: toCssGradient(gradient) }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40"
      />
      <div className="relative px-5 sm:px-7 py-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Gradient Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Design gradients that pass <span className="text-primary">a11y</span>.
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Linear, radial, conic & mesh — with live WCAG scoring, smart variations, and exports to CSS, Tailwind, SVG, PNG & JPG.
          </p>
        </div>
        <dl className="flex items-center gap-2 text-[10px] font-mono">
          <Stat label="Type" value={typeLabel} />
          <Stat label="Stops" value={String(gradient.stops.length)} />
          <Stat label="Angle" value={`${Math.round(gradient.angle)}°`} />
        </dl>
      </div>
    </header>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="px-2.5 py-1.5 rounded-md bg-background/70 backdrop-blur border border-border/60">
    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{label}</div>
    <div className="text-xs font-semibold text-foreground tabular-nums">{value}</div>
  </div>
);

const PreviewStopChips = ({ gradient }: { gradient: StudioGradient }) => {
  const stops = gradient.type === "mesh" ? gradient.meshPoints : gradient.stops;
  if (!stops.length) return null;
  const sample = stops.slice(0, 5);
  const WHITE = { r: 255, g: 255, b: 255 };
  const BLACK = { r: 17, g: 17, b: 17 };

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
      toast.success(`Copied ${hex.toUpperCase()}`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 flex-wrap">
      {sample.map((s) => {
        const rgb = parseColor(s.color);
        const cW = contrastRatio(rgb, WHITE);
        const cB = contrastRatio(rgb, BLACK);
        const best = Math.max(cW, cB);
        const fg = cW >= cB ? "#fff" : "#111";
        const level = best >= 7 ? "AAA" : best >= 4.5 ? "AA" : best >= 3 ? "AA Lg" : "Fail";
        const dot =
          best >= 4.5 ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
          : best >= 3 ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
          : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => copy(s.color)}
            title={`${s.color.toUpperCase()} · best text ${best.toFixed(2)}:1 ${level} — click to copy`}
            className="group/chip inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[10px] font-mono font-semibold ring-1 ring-black/10 dark:ring-white/15 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-white/60 active:scale-95 cursor-pointer"
            style={{
              background: `${s.color}E6`,
              color: fg,
            }}
          >
            <span
              className="w-4 h-4 rounded-full ring-1 ring-black/20 dark:ring-white/30 shadow-inner shrink-0"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="tracking-tight">{s.color.toUpperCase()}</span>
            <span className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-current/20 opacity-90">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
              <span className="tabular-nums text-[9px] opacity-80">{best.toFixed(1)}</span>
            </span>
          </button>
        );
      })}
      {stops.length > sample.length && (
        <span className="text-[10px] font-mono font-medium text-white/85 bg-black/45 backdrop-blur-md px-2 py-1 rounded-full ring-1 ring-white/15">
          +{stops.length - sample.length}
        </span>
      )}
    </div>
  );
};




const PreviewA11yBadge = ({ gradient }: { gradient: StudioGradient }) => {
  const score = scoreGradient(gradient);
  const light = score.minRatioWhite;
  const dark = score.minRatioDark;
  const pill = (label: string, ratio: number, level: string, fg: string, bg: string) => {
    const ok = level === "AAA" || level === "AA";
    const mid = level === "AA-Large";
    const ring = ok ? "ring-emerald-400/60" : mid ? "ring-amber-400/60" : "ring-destructive/60";
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-semibold ring-1 ${ring} shadow-sm`} style={{ background: bg, color: fg }}>
        <span className="opacity-70">{label}</span>
        <span>{ratio.toFixed(2)}:1</span>
        <span className="px-1 rounded bg-black/20 dark:bg-white/15">{level === "AA-Large" ? "AA Lg" : level}</span>
      </div>
    );
  };
  return (
    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
      {pill("Aa", light, score.whiteLevel, "#fff", "rgba(15,15,15,0.55)")}
      {pill("Aa", dark, score.darkLevel, "#111", "rgba(255,255,255,0.7)")}
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

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [shelfOpen, setShelfOpen] = useState(true);
  const toggleGroup = (g: string) =>
    setCollapsed((prev) => ({ ...prev, [g]: !prev[g] }));
  const allCollapsed = BRAND_PRESET_GROUPS.every((g) => collapsed[g]);
  const collapseAll = () => {
    if (allCollapsed) {
      setCollapsed({});
    } else {
      const next: Record<string, boolean> = {};
      BRAND_PRESET_GROUPS.forEach((g) => { next[g] = true; });
      setCollapsed(next);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShelfOpen((o) => !o)}
          className="min-w-0 flex items-start gap-2 text-left group"
          aria-expanded={shelfOpen}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 mt-0.5 text-muted-foreground transition-transform ${shelfOpen ? "" : "-rotate-90"}`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                TransPerfect Brand Presets
              </span>
              <span className="text-[10px] text-muted-foreground/70">{BRAND_PRESETS.length}</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Master Brand palette · tuned for WCAG AA on recommended text.
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {shelfOpen && (
            <button
              type="button"
              onClick={collapseAll}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary transition-colors"
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onPick(createStudioGradient({ name: "Untitled" }))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Blank canvas
          </button>
        </div>
      </div>

      {/* Groups */}
      {shelfOpen && (
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
          {BRAND_PRESET_GROUPS.map((group) => {
            const items = scored.filter((s) => s.preset.group === group);
            if (!items.length) return null;
            const isCollapsed = !!collapsed[group];
            return (
              <section key={group} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between gap-2 px-1 py-1 rounded hover:bg-secondary/60 transition-colors group/hdr"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground/70 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                    <h3 className="text-[10px] font-bold text-muted-foreground/70 group-hover/hdr:text-foreground uppercase tracking-wider truncate">
                      {group}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">
                    {items.length}
                  </span>
                </button>
                {!isCollapsed && (
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
                )}
              </section>
            );
          })}
        </div>
      )}
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

