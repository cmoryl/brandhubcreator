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

const PRESETS: { name: string; build: () => StudioGradient }[] = [
  {
    name: "Sunset",
    build: () =>
      createStudioGradient({
        name: "Sunset",
        type: "linear",
        angle: 135,
        stops: [
          { id: crypto.randomUUID(), color: "#ff9a9e", position: 0 },
          { id: crypto.randomUUID(), color: "#fad0c4", position: 50 },
          { id: crypto.randomUUID(), color: "#fbc2eb", position: 100 },
        ],
      }),
  },
  {
    name: "Aurora Mesh",
    build: () => createStudioGradient({ name: "Aurora Mesh", type: "mesh" }),
  },
  {
    name: "Conic Prism",
    build: () =>
      createStudioGradient({
        name: "Conic Prism",
        type: "conic",
        angle: 0,
        stops: [
          { id: crypto.randomUUID(), color: "#ff006e", position: 0 },
          { id: crypto.randomUUID(), color: "#8338ec", position: 33 },
          { id: crypto.randomUUID(), color: "#3a86ff", position: 66 },
          { id: crypto.randomUUID(), color: "#ff006e", position: 100 },
        ],
      }),
  },
  {
    name: "Grain Field",
    build: () =>
      createStudioGradient({
        name: "Grain Field",
        type: "radial",
        stops: [
          { id: crypto.randomUUID(), color: "#1e3a8a", position: 0 },
          { id: crypto.randomUUID(), color: "#0f172a", position: 100 },
        ],
        noise: { enabled: true, opacity: 0.22, scale: 1.1 },
      }),
  },
];

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
          {/* Preview + export */}
          <div className="space-y-4">
            <GradientPreview
              gradient={gradient}
              className="w-full rounded-2xl border border-border shadow-sm"
              style={{ aspectRatio: "16 / 10" }}
            />
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
      </div>
    </div>
  );
};

export default GradientStudio;
