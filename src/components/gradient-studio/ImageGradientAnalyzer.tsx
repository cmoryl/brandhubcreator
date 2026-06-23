import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, Image as ImageIcon, Loader2, Save, Wand2, X, Check,
  ArrowUp, ArrowDown, Trash2, Plus, RotateCcw,
} from "lucide-react";
import { gradientFromImage, ImageGradientResult } from "@/lib/gradientFromImage";
import {
  StudioGradient, MeshPoint, createStudioGradient, toCssGradient,
} from "@/lib/gradientStudio";
import { scoreGradient } from "@/lib/gradientA11y";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES = ["signature", "marketing", "product", "event", "ui", "experimental", "custom"] as const;

interface Props {
  onUseGradient: (g: StudioGradient) => void;
}

const toneClass = (level: string) =>
  level === "AAA" || level === "AA"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : level === "AA-Large"
    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
    : "bg-destructive/15 text-destructive border-destructive/30";

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const ImageGradientAnalyzer = ({ onUseGradient }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImageGradientResult | null>(null);
  const [sourceName, setSourceName] = useState<string>("");

  // Editable selections
  const [selectedStops, setSelectedStops] = useState<string[]>([]);   // ordered hex list
  const [angle, setAngle] = useState<number>(135);
  const [meshPoints, setMeshPoints] = useState<MeshPoint[]>([]);
  const [meshBlur, setMeshBlur] = useState<number>(90);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState<StudioGradient | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const base = file.name.replace(/\.[^.]+$/, "") || "Uploaded image";
      setSourceName(base);
      const res = await gradientFromImage(file, { name: base, paletteSize: 6 });
      setResult(res);
      // Seed editable state from result
      setSelectedStops(res.palette.slice(0, 2));
      setAngle(res.linearGradient.angle ?? 135);
      setMeshPoints(res.meshGradient.meshPoints.map((p) => ({ ...p })));
      setMeshBlur(res.meshGradient.meshBlur ?? 90);
    } catch (e) {
      toast.error("Could not analyze image");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  // Derived gradients
  const linearGradient = useMemo<StudioGradient | null>(() => {
    if (!result || selectedStops.length < 2) return null;
    const n = selectedStops.length;
    return createStudioGradient({
      name: `${sourceName || "Image"} (linear)`,
      type: "linear",
      angle,
      stops: selectedStops.map((color, i) => ({
        id: uid(),
        color,
        position: Math.round((i / (n - 1)) * 100),
      })),
    });
  }, [result, selectedStops, angle, sourceName]);

  const meshGradient = useMemo<StudioGradient | null>(() => {
    if (!result || meshPoints.length < 2) return null;
    return createStudioGradient({
      name: `${sourceName || "Image"} (mesh)`,
      type: "mesh",
      meshBlur,
      meshPoints: meshPoints.map((p) => ({ ...p })),
    });
  }, [result, meshPoints, meshBlur, sourceName]);

  const linearScore = linearGradient ? scoreGradient(linearGradient) : null;
  const meshScore = meshGradient ? scoreGradient(meshGradient) : null;

  // ---- Palette stop helpers ----
  const toggleStop = (hex: string) => {
    setSelectedStops((prev) =>
      prev.includes(hex) ? prev.filter((h) => h !== hex) : [...prev, hex],
    );
  };
  const moveStop = (hex: string, dir: -1 | 1) => {
    setSelectedStops((prev) => {
      const i = prev.indexOf(hex);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const reorderStop = (fromHex: string, toHex: string) => {
    if (fromHex === toHex) return;
    setSelectedStops((prev) => {
      const from = prev.indexOf(fromHex);
      const to = prev.indexOf(toHex);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const resetStops = () => {
    if (result) setSelectedStops(result.palette.slice(0, 2));
  };


  // ---- Mesh point helpers ----
  const updateMeshPoint = (id: string, patch: Partial<MeshPoint>) => {
    setMeshPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const moveMeshPoint = (id: string, dir: -1 | 1) => {
    setMeshPoints((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const removeMeshPoint = (id: string) => {
    setMeshPoints((prev) => (prev.length <= 2 ? prev : prev.filter((p) => p.id !== id)));
  };
  const addMeshPoint = (hex: string) => {
    setMeshPoints((prev) => [
      ...prev,
      { id: uid(), color: hex, x: 50, y: 50 },
    ]);
  };
  const resetMesh = () => {
    if (result) {
      setMeshPoints(result.meshGradient.meshPoints.map((p) => ({ ...p })));
      setMeshBlur(result.meshGradient.meshBlur ?? 90);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-secondary/30 transition p-8 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {busy ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing image…
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="text-sm font-medium text-foreground">
              {result ? "Replace image" : "Drop an image here, or click to upload"}
            </div>
            <div className="text-xs text-muted-foreground">
              We extract the dominant palette, rebuild it as a mesh &amp; linear gradient, and grade each for WCAG contrast.
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Source thumbnail */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
            <img
              src={result.thumbnailDataUrl}
              alt={sourceName}
              className="h-16 w-16 rounded-md border border-border object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate" title={sourceName}>{sourceName}</div>
              <div className="text-[11px] text-muted-foreground">
                {result.palette.length} colors extracted · {result.meshGradient.meshPoints.length} mesh samples
              </div>
            </div>
          </div>

          {/* ───────── Linear editor ───────── */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Linear gradient — pick stops</h3>
                <p className="text-[11px] text-muted-foreground">
                  Click palette colors to add or remove. Drag in the order chips below to reorder. Stops are evenly spaced.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={resetStops}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Extracted palette</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {result.palette.map((hex) => {
                  const idx = selectedStops.indexOf(hex);
                  const selected = idx >= 0;
                  return (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => toggleStop(hex)}
                      title={selected ? `Stop ${idx + 1} — click to remove` : "Click to add as stop"}
                      className={`flex items-center gap-1 rounded-full border pl-1 pr-2 py-0.5 transition ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/60"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-border" style={{ background: hex }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
                      {selected && (
                        <span className="ml-0.5 text-[9px] font-bold text-primary">#{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStops.length > 0 && (
              <div>
                <Label className="text-[11px] text-muted-foreground">Stop order</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedStops.map((hex, i) => (
                    <div
                      key={hex}
                      className="flex items-center gap-1 rounded-full border border-border bg-card pl-1 pr-1 py-0.5"
                    >
                      <span className="w-5 h-5 rounded-full border border-border" style={{ background: hex }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
                      <button
                        type="button"
                        onClick={() => moveStop(hex, -1)}
                        disabled={i === 0}
                        className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                        aria-label="Move left"
                      >
                        <ArrowUp className="h-3 w-3 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(hex, 1)}
                        disabled={i === selectedStops.length - 1}
                        className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                        aria-label="Move right"
                      >
                        <ArrowDown className="h-3 w-3 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStop(hex)}
                        className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        aria-label="Remove stop"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Label className="text-[11px] text-muted-foreground w-12">Angle</Label>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">{angle}°</span>
            </div>

            {linearGradient && linearScore ? (
              <GradientPreviewBlock
                gradient={linearGradient}
                score={linearScore}
                onUse={() => onUseGradient(linearGradient)}
                onSave={() => { setSaveTarget(linearGradient); setSaveOpen(true); }}
              />
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                Pick at least 2 palette colors to build a linear gradient.
              </div>
            )}
          </div>

          {/* ───────── Mesh editor ───────── */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Mesh gradient — edit points</h3>
                <p className="text-[11px] text-muted-foreground">
                  Reorder, remove, or recolor points. Add new points from the palette below.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={resetMesh}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>

            <div className="space-y-1.5">
              {meshPoints.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 rounded-md border border-border bg-background/40 p-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
                  <input
                    type="color"
                    value={p.color}
                    onChange={(e) => updateMeshPoint(p.id, { color: e.target.value })}
                    className="h-6 w-8 rounded cursor-pointer border border-border bg-transparent"
                    aria-label="Color"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground w-16 truncate">{p.color}</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Label className="text-[10px] text-muted-foreground">X</Label>
                    <Input
                      type="number" min={0} max={100} value={Math.round(p.x)}
                      onChange={(e) => updateMeshPoint(p.id, { x: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                    <Label className="text-[10px] text-muted-foreground ml-1">Y</Label>
                    <Input
                      type="number" min={0} max={100} value={Math.round(p.y)}
                      onChange={(e) => updateMeshPoint(p.id, { y: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => moveMeshPoint(p.id, -1)}
                      disabled={i === 0}
                      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMeshPoint(p.id, 1)}
                      disabled={i === meshPoints.length - 1}
                      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-secondary disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMeshPoint(p.id)}
                      disabled={meshPoints.length <= 2}
                      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      aria-label="Remove point"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Add point from palette</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {result.palette.map((hex) => (
                  <button
                    type="button"
                    key={hex}
                    onClick={() => addMeshPoint(hex)}
                    className="flex items-center gap-1 rounded-full border border-border bg-card pl-1 pr-2 py-0.5 hover:border-primary/60 transition"
                    title={`Add ${hex} as new mesh point`}
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    <span className="w-4 h-4 rounded-full border border-border" style={{ background: hex }} />
                    <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-[11px] text-muted-foreground w-12">Blur</Label>
              <input
                type="range"
                min={0}
                max={200}
                value={meshBlur}
                onChange={(e) => setMeshBlur(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">{meshBlur}px</span>
            </div>

            {meshGradient && meshScore ? (
              <GradientPreviewBlock
                gradient={meshGradient}
                score={meshScore}
                onUse={() => onUseGradient(meshGradient)}
                onSave={() => { setSaveTarget(meshGradient); setSaveOpen(true); }}
              />
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                Keep at least 2 mesh points to render a mesh gradient.
              </div>
            )}
          </div>
        </div>
      )}

      <SaveImageGradientDialog
        open={saveOpen}
        onOpenChange={(o) => { setSaveOpen(o); if (!o) setSaveTarget(null); }}
        gradient={saveTarget}
        defaultName={sourceName}
      />
    </div>
  );
};

const GradientPreviewBlock = ({
  gradient, score, onUse, onSave,
}: {
  gradient: StudioGradient;
  score: ReturnType<typeof scoreGradient>;
  onUse: () => void;
  onSave: () => void;
}) => {
  const css = toCssGradient(gradient);
  return (
    <div className="space-y-2">
      <div
        className="aspect-[16/6] rounded-md border border-border flex items-center justify-between px-4"
        style={{ background: css }}
      >
        <span className="text-lg font-semibold text-white drop-shadow">Aa</span>
        <span className="text-lg font-semibold text-[#111]">Aa</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border p-2 bg-[#0a0a0a] text-white">
          <div className="text-[10px] opacity-80">Light text</div>
          <div className="text-sm font-semibold">{score.minRatioWhite.toFixed(2)} : 1</div>
          <Badge variant="outline" className={`text-[9px] mt-1 ${toneClass(score.whiteLevel)}`}>{score.whiteLevel}</Badge>
        </div>
        <div className="rounded-md border border-border p-2 bg-white text-[#111]">
          <div className="text-[10px] opacity-80">Dark text</div>
          <div className="text-sm font-semibold">{score.minRatioDark.toFixed(2)} : 1</div>
          <Badge variant="outline" className={`text-[9px] mt-1 ${toneClass(score.darkLevel)}`}>{score.darkLevel}</Badge>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Recommended text color: <strong className="text-foreground">{score.recommendedText}</strong>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" className="flex-1 h-8 text-xs" onClick={onUse}>
          <Wand2 className="h-3.5 w-3.5 mr-1" /> Use in editor
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={onSave}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
};

const SaveImageGradientDialog = ({
  open, onOpenChange, gradient, defaultName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  gradient: StudioGradient | null;
  defaultName: string;
}) => {
  const { user, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("custom");
  const [tagsText, setTagsText] = useState("from-image");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setCategory("custom");
      setTagsText("from-image");
      setIsPublic(true);
    }
  }, [open]);

  if (!gradient) return null;
  const css = toCssGradient(gradient);

  const submit = async () => {
    if (!isAdmin) return toast.error("Only admins can save to the shared library");
    const finalName = (name || gradient.name || defaultName || "Image gradient").trim();
    if (!finalName) return toast.error("Name is required");
    setSaving(true);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from("saved_gradients").insert([{
      name: finalName,
      description: description.trim() || null,
      gradient: gradient as unknown as never,
      css,
      category,
      tags,
      is_public: isPublic,
      created_by: user?.id ?? null,
    }]);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved to library");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save image gradient</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="h-24 rounded-md border border-border" style={{ background: css }} />
          {!isAdmin && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              You're not an admin — only admins can save to the shared library. You can still load this into the editor.
            </p>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName || "Image gradient"}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="What is this gradient for?"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags</Label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="from-image, hero"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="img-visibility" className="text-xs">
              Visible to all signed-in users
            </Label>
            <Switch id="img-visibility" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !isAdmin}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving…" : "Save to library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
