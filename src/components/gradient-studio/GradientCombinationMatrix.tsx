import { useMemo, useState } from "react";
import { Plus, Trash2, Sparkles, X } from "lucide-react";
import {
  generateCombinations,
  DEFAULT_BRAND_PALETTE,
  PaletteCombo,
  WcagLevel,
} from "@/lib/gradientA11y";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

interface Props {
  initialPalette?: string[];
  onUseGradient?: (g: StudioGradient) => void;
}

type Filter = "all" | "white-aa" | "dark-aa" | "either-aa" | "both-aa" | "fail-both";

const levelColor = (l: WcagLevel) =>
  l === "AAA" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
  : l === "AA" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
  : l === "AA-Large" ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
  : "bg-destructive/15 text-destructive border-destructive/30";

export const GradientCombinationMatrix = ({ initialPalette, onUseGradient }: Props) => {
  const [palette, setPalette] = useState<string[]>(
    initialPalette && initialPalette.length ? initialPalette : DEFAULT_BRAND_PALETTE.map((p) => p.hex),
  );
  const [newColor, setNewColor] = useState("#003FC7");
  const [includeRadial, setIncludeRadial] = useState(false);
  const [angles, setAngles] = useState<string>("135");
  const [filter, setFilter] = useState<Filter>("all");
  const [textMode, setTextMode] = useState<"both" | "light" | "dark">("both");

  const angleList = useMemo(
    () => angles.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 360),
    [angles],
  );

  const combos = useMemo<PaletteCombo[]>(() => {
    const cleaned = palette.filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c));
    if (cleaned.length < 2) return [];
    return generateCombinations(cleaned, {
      includeRadial,
      angles: angleList.length ? angleList : [135],
    });
  }, [palette, includeRadial, angleList]);

  const filtered = useMemo(() => {
    return combos.filter((c) => {
      const wAA = c.score.minRatioWhite >= 4.5;
      const dAA = c.score.minRatioDark >= 4.5;
      switch (filter) {
        case "white-aa":  return wAA;
        case "dark-aa":   return dAA;
        case "either-aa": return wAA || dAA;
        case "both-aa":   return wAA && dAA;
        case "fail-both": return !wAA && !dAA;
        default: return true;
      }
    });
  }, [combos, filter]);

  const stats = useMemo(() => {
    const total = combos.length;
    const wAA = combos.filter((c) => c.score.minRatioWhite >= 4.5).length;
    const dAA = combos.filter((c) => c.score.minRatioDark >= 4.5).length;
    const both = combos.filter((c) => c.score.minRatioWhite >= 4.5 && c.score.minRatioDark >= 4.5).length;
    const failBoth = combos.filter((c) => c.score.minRatioWhite < 4.5 && c.score.minRatioDark < 4.5).length;
    return { total, wAA, dAA, both, failBoth };
  }, [combos]);

  const addColor = () => {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(newColor)) return;
    if (palette.includes(newColor)) return;
    setPalette([...palette, newColor]);
  };
  const removeColor = (hex: string) => setPalette(palette.filter((c) => c !== hex));

  return (
    <div className="space-y-5">
      {/* Palette editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Palette ({palette.length} colors)</Label>
          <Button
            size="sm" variant="ghost" className="h-7 text-xs gap-1"
            onClick={() => setPalette(DEFAULT_BRAND_PALETTE.map((p) => p.hex))}
          >
            <Sparkles className="h-3.5 w-3.5" /> Load TransPerfect palette
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {palette.map((hex) => (
            <div key={hex} className="group relative flex items-center gap-1 pl-1 pr-2 py-1 rounded-md border border-border bg-card">
              <span className="w-5 h-5 rounded border border-border" style={{ background: hex }} />
              <span className="text-[11px] font-mono">{hex}</span>
              <button
                onClick={() => removeColor(hex)}
                className="opacity-50 hover:opacity-100 hover:text-destructive ml-0.5"
                aria-label={`Remove ${hex}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-9 h-8 rounded border border-border cursor-pointer bg-transparent"
            aria-label="New color"
          />
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-8 w-32 font-mono text-xs"
            placeholder="#003FC7"
          />
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={addColor}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Generation controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-4">
        <div className="space-y-1">
          <Label className="text-xs">Angles (deg, comma-separated)</Label>
          <Input
            value={angles}
            onChange={(e) => setAngles(e.target.value)}
            placeholder="0, 45, 90, 135"
            className="h-8 text-xs font-mono"
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3">
          <Label htmlFor="radial-toggle" className="text-xs">Also include radial</Label>
          <Switch id="radial-toggle" checked={includeRadial} onCheckedChange={setIncludeRadial} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Filter</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All combinations</SelectItem>
              <SelectItem value="both-aa">Pass AA for both light + dark text</SelectItem>
              <SelectItem value="either-aa">Pass AA for either text</SelectItem>
              <SelectItem value="white-aa">Pass AA for light text</SelectItem>
              <SelectItem value="dark-aa">Pass AA for dark text</SelectItem>
              <SelectItem value="fail-both">Fail both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <Stat label="Total" value={stats.total} />
        <Stat label="Pass light AA" value={stats.wAA} tone="ok" />
        <Stat label="Pass dark AA" value={stats.dAA} tone="ok" />
        <Stat label="Pass both" value={stats.both} tone="ok" />
        <Stat label="Fail both" value={stats.failBoth} tone="bad" />
      </div>

      {/* Text preview toggle */}
      <div className="flex items-center gap-3">
        <Label className="text-xs">Preview text</Label>
        <Select value={textMode} onValueChange={(v) => setTextMode(v as "both" | "light" | "dark")}>
          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Light + Dark</SelectItem>
            <SelectItem value="light">Light only</SelectItem>
            <SelectItem value="dark">Dark only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground">
          Showing {filtered.length} / {combos.length}
        </span>
      </div>

      {/* Grid of swatches */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((c) => (
          <ComboCard key={c.id} combo={c} textMode={textMode} onUse={() => onUseGradient?.(c.gradient)} />
        ))}
        {!filtered.length && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            No combinations match this filter. Try adding more colors or relaxing the filter.
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "ok" | "bad" }) => (
  <div className={
    "rounded-md border px-2 py-2 " +
    (tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "bad" ? "border-destructive/30 bg-destructive/5"
      : "border-border bg-card")
  }>
    <div className="text-lg font-semibold text-foreground">{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const ComboCard = ({
  combo,
  textMode,
  onUse,
}: {
  combo: PaletteCombo;
  textMode: "both" | "light" | "dark";
  onUse: () => void;
}) => {
  const { gradient, score } = combo;
  const css = toCssGradient(gradient);
  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      <div
        className="relative aspect-[16/10] flex items-center justify-center"
        style={{ background: css }}
      >
        {(textMode === "both" || textMode === "light") && (
          <span className="absolute top-2 left-2 text-xs font-semibold text-white drop-shadow-sm">
            Aa Light
          </span>
        )}
        {(textMode === "both" || textMode === "dark") && (
          <span className="absolute bottom-2 right-2 text-xs font-semibold text-[#111]">
            Aa Dark
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-border" style={{ background: combo.from }} />
            <span className="text-[10px] font-mono text-muted-foreground">→</span>
            <span className="w-3 h-3 rounded-sm border border-border" style={{ background: combo.to }} />
            <span className="text-[10px] text-muted-foreground ml-1">
              {combo.type === "linear" ? `${combo.angle}°` : "radial"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-[10px] ${levelColor(score.whiteLevel)}`}>
            Light · {score.minRatioWhite.toFixed(2)} · {score.whiteLevel}
          </Badge>
          <Badge variant="outline" className={`text-[10px] ${levelColor(score.darkLevel)}`}>
            Dark · {score.minRatioDark.toFixed(2)} · {score.darkLevel}
          </Badge>
        </div>
        <Button
          size="sm" variant="ghost"
          className="w-full h-7 text-[11px] mt-1"
          onClick={onUse}
        >
          Open in editor
        </Button>
      </div>
    </div>
  );
};
