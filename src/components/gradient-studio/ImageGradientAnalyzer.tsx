import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Loader2, Save, Wand2, X, Check } from "lucide-react";
import { gradientFromImage, ImageGradientResult } from "@/lib/gradientFromImage";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
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

export const ImageGradientAnalyzer = ({ onUseGradient }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImageGradientResult | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState<StudioGradient | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const base = file.name.replace(/\.[^.]+$/, "") || "Uploaded image";
      setSourceName(base);
      const res = await gradientFromImage(file, { name: base, paletteSize: 6 });
      setResult(res);
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

  const meshScore = result ? scoreGradient(result.meshGradient) : null;
  const linearScore = result ? scoreGradient(result.linearGradient) : null;

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
              Drop an image here, or click to upload
            </div>
            <div className="text-xs text-muted-foreground">
              We extract the dominant palette, rebuild it as a mesh &amp; linear gradient, and grade each for WCAG contrast.
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Source + palette */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 bg-card border border-border rounded-xl p-4">
            <div className="space-y-2">
              <img
                src={result.thumbnailDataUrl}
                alt={sourceName}
                className="w-full rounded-md border border-border"
              />
              <div className="text-[11px] text-muted-foreground truncate" title={sourceName}>
                {sourceName}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Extracted palette</span>
                <span className="text-[10px] text-muted-foreground">({result.palette.length} colors)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.palette.map((hex) => (
                  <div key={hex} className="flex items-center gap-1 rounded-full border border-border bg-card pl-1 pr-2 py-0.5">
                    <span className="w-4 h-4 rounded-full border border-border" style={{ background: hex }} />
                    <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mesh + Linear with a11y */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GradientResultCard
              title="Mesh rebuild"
              subtitle="Spatial layout: corners + center sampled from the image."
              gradient={result.meshGradient}
              score={meshScore!}
              onUse={() => onUseGradient(result.meshGradient)}
              onSave={() => { setSaveTarget(result.meshGradient); setSaveOpen(true); }}
            />
            <GradientResultCard
              title="Linear rebuild"
              subtitle="Top two dominant colors on a 135° axis."
              gradient={result.linearGradient}
              score={linearScore!}
              onUse={() => onUseGradient(result.linearGradient)}
              onSave={() => { setSaveTarget(result.linearGradient); setSaveOpen(true); }}
            />
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

const GradientResultCard = ({
  title, subtitle, gradient, score, onUse, onSave,
}: {
  title: string;
  subtitle: string;
  gradient: StudioGradient;
  score: ReturnType<typeof scoreGradient>;
  onUse: () => void;
  onSave: () => void;
}) => {
  const css = toCssGradient(gradient);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="aspect-[16/10] flex items-center justify-between px-4"
        style={{ background: css }}
      >
        <span className="text-lg font-semibold text-white drop-shadow">Aa</span>
        <span className="text-lg font-semibold text-[#111]">Aa</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground">{subtitle}</div>
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

  // Reset on open
  useState(() => {});
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
