import { useRef, useState } from "react";
import { Sparkles, Upload, Loader2, Wand2, Image as ImageIcon } from "lucide-react";
import {
  StudioGradient,
  createStudioGradient,
  GradientStop,
  MeshPoint,
} from "@/lib/gradientStudio";
import { gradientFromImage } from "@/lib/gradientFromImage";
import { scoreGradient } from "@/lib/gradientA11y";
import { TP } from "@/lib/transperfectPresets";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GradientPreview } from "./GradientPreview";
import { toast } from "sonner";

interface Props {
  onUseGradient: (g: StudioGradient) => void;
  brandPalette?: string[];
}

const DEFAULT_BRAND = [
  TP.blue500, TP.blue800, TP.aqua, TP.lavender,
  TP.yellow, TP.green, TP.peach, TP.pink, TP.red,
];

/** Coerce AI-returned JSON into a safe StudioGradient. */
function normalizeAi(raw: Record<string, unknown> | undefined, fallbackName = "AI Gradient"): StudioGradient {
  const r = raw ?? {};
  const type = (["linear", "radial", "conic", "mesh"].includes(r.type as string) ? r.type : "linear") as StudioGradient["type"];
  const safeHex = (c: unknown) =>
    typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : "#888888";

  const stopsArr = Array.isArray(r.stops) ? r.stops : [];
  const stops: GradientStop[] = stopsArr.slice(0, 6).map((s, i, all) => ({
    id: crypto.randomUUID(),
    color: safeHex((s as { color?: string })?.color),
    position: Number((s as { position?: number })?.position ?? (i * (100 / Math.max(1, all.length - 1)))),
  }));
  const meshArr = Array.isArray(r.meshPoints) ? r.meshPoints : [];
  const meshPoints: MeshPoint[] = meshArr.slice(0, 6).map((p) => ({
    id: crypto.randomUUID(),
    color: safeHex((p as { color?: string })?.color),
    x: Math.max(0, Math.min(100, Number((p as { x?: number })?.x ?? 50))),
    y: Math.max(0, Math.min(100, Number((p as { y?: number })?.y ?? 50))),
  }));

  const pos = r.position as { x?: number; y?: number } | undefined;

  return createStudioGradient({
    name: (r.name as string) || fallbackName,
    type,
    angle: Number(r.angle ?? 135),
    shape: (r.shape === "circle" ? "circle" : "ellipse"),
    size: ((["farthest-corner", "closest-side", "closest-corner", "farthest-side"].includes(r.size as string)
      ? r.size : "farthest-corner") as StudioGradient["size"]),
    position: { x: Number(pos?.x ?? 50), y: Number(pos?.y ?? 50) },
    stops: type === "mesh" ? createStudioGradient().stops : (stops.length >= 2 ? stops : createStudioGradient().stops),
    meshPoints: type === "mesh" && meshPoints.length >= 2 ? meshPoints : createStudioGradient().meshPoints,
  });
}

export const AIGradientDesigner = ({ onUseGradient, brandPalette }: Props) => {
  const palette = brandPalette?.length ? brandPalette : DEFAULT_BRAND;
  const [prompt, setPrompt] = useState("Soft periwinkle hero gradient blending sky blue, royal blue, and lavender — calm, modern, light-text friendly");
  const [preferType, setPreferType] = useState<"any" | "linear" | "radial" | "mesh" | "conic">("mesh");
  const [textMode, setTextMode] = useState<"any" | "light" | "dark">("any");
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<StudioGradient[]>([]);

  // Image-based
  const fileInput = useRef<HTMLInputElement>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgResult, setImgResult] = useState<{
    palette: string[];
    mesh: StudioGradient;
    linear: StudioGradient;
    thumb: string;
  } | null>(null);

  const generatePrompt = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gradient-ai-designer", {
        body: { prompt, palette, preferType, recommendedText: textMode },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") {
        toast.error("AI is busy — please retry in a few seconds.");
        return;
      }
      if (data?.error === "payment_required") {
        toast.error("AI credits exhausted. Add credits in Cloud settings.");
        return;
      }
      if (data?.error) {
        toast.error(`AI error: ${data.error}`);
        return;
      }
      const g = normalizeAi(data?.gradient, "AI " + prompt.slice(0, 24));
      setPreviews((cur) => [g, ...cur].slice(0, 6));
      toast.success("Generated! Click 'Use' to load into the editor.");
    } catch (e) {
      toast.error(`Could not generate gradient: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setImgLoading(true);
    try {
      const result = await gradientFromImage(file, { name: file.name.replace(/\.[^.]+$/, "") });
      setImgResult({
        palette: result.palette,
        mesh: result.meshGradient,
        linear: result.linearGradient,
        thumb: result.thumbnailDataUrl,
      });
      toast.success("Extracted palette and built gradient from image.");
    } catch (e) {
      toast.error(`Image processing failed: ${String(e)}`);
    } finally {
      setImgLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="prompt">
        <TabsList>
          <TabsTrigger value="prompt" className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> From prompt
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> From image
          </TabsTrigger>
        </TabsList>

        {/* PROMPT MODE */}
        <TabsContent value="prompt" className="space-y-3 pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt" className="text-xs">Describe the gradient</Label>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Calm sunrise of soft yellow into peach into pink, mesh, dark text friendly"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={preferType} onValueChange={(v) => setPreferType(v as typeof preferType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="conic">Conic</SelectItem>
                  <SelectItem value="mesh">Mesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Optimised for text</Label>
              <Select value={textMode} onValueChange={(v) => setTextMode(v as typeof textMode)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">No preference</SelectItem>
                  <SelectItem value="light">Light text (dark gradient)</SelectItem>
                  <SelectItem value="dark">Dark text (light gradient)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generatePrompt} disabled={loading} className="w-full h-8 gap-1.5">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {palette.slice(0, 12).map((c) => (
              <span key={c} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">
                <span className="w-3 h-3 rounded-sm" style={{ background: c }} />{c}
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground self-center">
              AI will prefer these palette colors
            </span>
          </div>

          {previews.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs">Generated gradients</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {previews.map((g, i) => (
                  <ResultCard key={i} gradient={g} onUse={() => onUseGradient(g)} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* IMAGE MODE */}
        <TabsContent value="image" className="space-y-3 pt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileInput.current?.click()}
              disabled={imgLoading}
              variant="outline"
              className="gap-1.5 h-8"
            >
              {imgLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload reference image
            </Button>
            <span className="text-[11px] text-muted-foreground">
              We&apos;ll extract a palette and build mesh + linear gradients that match.
            </span>
          </div>

          {imgResult && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex gap-3 items-start">
                <img
                  src={imgResult.thumb}
                  alt="Reference"
                  className="rounded-md border border-border w-32 h-20 object-cover"
                />
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs">Extracted palette</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {imgResult.palette.map((c) => (
                      <span key={c} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">
                        <span className="w-3 h-3 rounded-sm" style={{ background: c }} />{c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResultCard gradient={imgResult.mesh} label="Mesh approximation" onUse={() => onUseGradient(imgResult.mesh)} />
                <ResultCard gradient={imgResult.linear} label="Linear (top 2 colors)" onUse={() => onUseGradient(imgResult.linear)} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ResultCard = ({
  gradient, onUse, label,
}: { gradient: StudioGradient; onUse: () => void; label?: string }) => {
  const score = scoreGradient(gradient);
  const recLight = score.recommendedText === "light";
  const ratio = recLight ? score.minRatioWhite : score.minRatioDark;
  const level = recLight ? score.whiteLevel : score.darkLevel;
  const tone =
    level === "AAA" || level === "AA" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : level === "AA-Large" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
    : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <GradientPreview gradient={gradient} className="w-full" style={{ aspectRatio: "16 / 9" }} />
      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-foreground truncate">{label ?? gradient.name}</span>
          <Badge variant="outline" className={`text-[10px] ${tone}`}>{ratio.toFixed(1)} · {level}</Badge>
        </div>
        <Button size="sm" variant="ghost" className="w-full h-7 text-[11px]" onClick={onUse}>
          Use in editor
        </Button>
      </div>
    </div>
  );
};
