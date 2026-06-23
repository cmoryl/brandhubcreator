import { useCallback } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import {
  StudioGradient,
  GradientStop,
  MeshPoint,
  GradientType,
  DEFAULT_MESH,
} from "@/lib/gradientStudio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ColorChip } from "./ColorChip";

interface Props {
  gradient: StudioGradient;
  onChange: (g: StudioGradient) => void;
  palette?: string[];
}

export const GradientStudioEditor = ({ gradient, onChange, palette }: Props) => {
  const patch = useCallback(
    (p: Partial<StudioGradient>) => onChange({ ...gradient, ...p }),
    [gradient, onChange],
  );

  const updateStop = (id: string, p: Partial<GradientStop>) =>
    patch({ stops: gradient.stops.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const addStop = () =>
    patch({
      stops: [...gradient.stops, { id: crypto.randomUUID(), color: "#ffffff", position: 50 }],
    });
  const removeStop = (id: string) => {
    if (gradient.stops.length <= 2) return;
    patch({ stops: gradient.stops.filter((s) => s.id !== id) });
  };

  const updateMesh = (id: string, p: Partial<MeshPoint>) =>
    patch({ meshPoints: gradient.meshPoints.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const addMesh = () =>
    patch({
      meshPoints: [
        ...gradient.meshPoints,
        { id: crypto.randomUUID(), color: "#ffffff", x: 50, y: 50 },
      ],
    });
  const removeMesh = (id: string) => {
    if (gradient.meshPoints.length <= 2) return;
    patch({ meshPoints: gradient.meshPoints.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-5">
      {/* Name + type */}
      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={gradient.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="h-8"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Type</Label>
        <ToggleGroup
          type="single"
          value={gradient.type}
          onValueChange={(v) => v && patch({ type: v as GradientType })}
          className="justify-start"
        >
          <ToggleGroupItem value="linear" className="text-xs">Linear</ToggleGroupItem>
          <ToggleGroupItem value="radial" className="text-xs">Radial</ToggleGroupItem>
          <ToggleGroupItem value="conic"  className="text-xs">Conic</ToggleGroupItem>
          <ToggleGroupItem value="mesh"   className="text-xs">Mesh</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Geometry */}
      {(gradient.type === "linear" || gradient.type === "conic") && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <Label className="text-xs">Angle</Label>
            <span className="font-mono text-muted-foreground">{gradient.angle}°</span>
          </div>
          <Slider
            min={0} max={360} step={1}
            value={[gradient.angle]}
            onValueChange={([v]) => patch({ angle: v })}
          />
        </div>
      )}

      {gradient.type === "radial" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Shape</Label>
            <Select value={gradient.shape} onValueChange={(v) => patch({ shape: v as "ellipse" | "circle" })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ellipse">Ellipse</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Size</Label>
            <Select value={gradient.size} onValueChange={(v) => patch({ size: v as StudioGradient["size"] })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="farthest-corner">Farthest corner</SelectItem>
                <SelectItem value="farthest-side">Farthest side</SelectItem>
                <SelectItem value="closest-corner">Closest corner</SelectItem>
                <SelectItem value="closest-side">Closest side</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(gradient.type === "radial" || gradient.type === "conic") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs">
              <Label className="text-xs">Center X</Label>
              <span className="font-mono text-muted-foreground">{gradient.position.x}%</span>
            </div>
            <Slider
              min={0} max={100} step={1}
              value={[gradient.position.x]}
              onValueChange={([v]) => patch({ position: { ...gradient.position, x: v } })}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <Label className="text-xs">Center Y</Label>
              <span className="font-mono text-muted-foreground">{gradient.position.y}%</span>
            </div>
            <Slider
              min={0} max={100} step={1}
              value={[gradient.position.y]}
              onValueChange={([v]) => patch({ position: { ...gradient.position, y: v } })}
            />
          </div>
        </div>
      )}

      {/* Stops or mesh points */}
      {gradient.type !== "mesh" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Color Stops</Label>
            <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={addStop}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="space-y-1.5">
            {gradient.stops.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <ColorChip value={s.color} onChange={(c) => updateStop(s.id, { color: c })} palette={palette} />
                <Slider
                  min={0} max={100} step={1}
                  value={[s.position]}
                  onValueChange={([v]) => updateStop(s.id, { position: v })}
                  className="flex-1"
                />
                <span className="text-[11px] font-mono text-muted-foreground w-9 text-right">
                  {Math.round(s.position)}%
                </span>
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeStop(s.id)}
                  disabled={gradient.stops.length <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mesh Points</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => patch({ meshPoints: DEFAULT_MESH() })}>
                <RefreshCw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={addMesh}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            {gradient.meshPoints.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <ColorChip value={m.color} onChange={(c) => updateMesh(m.id, { color: c })} palette={palette} />
                <span className="text-[10px] text-muted-foreground w-3">X</span>
                <Slider min={0} max={100} step={1} value={[m.x]} onValueChange={([v]) => updateMesh(m.id, { x: v })} className="flex-1" />
                <span className="text-[10px] text-muted-foreground w-3">Y</span>
                <Slider min={0} max={100} step={1} value={[m.y]} onValueChange={([v]) => updateMesh(m.id, { y: v })} className="flex-1" />
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMesh(m.id)}
                  disabled={gradient.meshPoints.length <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-xs">
              <Label className="text-xs">Blend (blur)</Label>
              <span className="font-mono text-muted-foreground">{gradient.meshBlur}px</span>
            </div>
            <Slider min={10} max={200} step={1} value={[gradient.meshBlur]} onValueChange={([v]) => patch({ meshBlur: v })} />
          </div>
        </div>
      )}

      {/* Noise */}
      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Noise / grain overlay</Label>
          <Switch
            checked={gradient.noise.enabled}
            onCheckedChange={(b) => patch({ noise: { ...gradient.noise, enabled: b } })}
          />
        </div>
        {gradient.noise.enabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px]">
                <Label className="text-[11px]">Opacity</Label>
                <span className="font-mono text-muted-foreground">{gradient.noise.opacity.toFixed(2)}</span>
              </div>
              <Slider min={0} max={1} step={0.01} value={[gradient.noise.opacity]} onValueChange={([v]) => patch({ noise: { ...gradient.noise, opacity: v } })} />
            </div>
            <div>
              <div className="flex justify-between text-[11px]">
                <Label className="text-[11px]">Scale</Label>
                <span className="font-mono text-muted-foreground">{gradient.noise.scale.toFixed(2)}</span>
              </div>
              <Slider min={0.2} max={2.5} step={0.05} value={[gradient.noise.scale]} onValueChange={([v]) => patch({ noise: { ...gradient.noise, scale: v } })} />
            </div>
          </div>
        )}
      </div>

      {/* Animation */}
      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Animate</Label>
          <Switch
            checked={gradient.animation.enabled}
            onCheckedChange={(b) => patch({ animation: { ...gradient.animation, enabled: b } })}
          />
        </div>
        {gradient.animation.enabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px]">Mode</Label>
              <Select
                value={gradient.animation.mode}
                onValueChange={(v) => patch({ animation: { ...gradient.animation, mode: v as "shift" | "rotate" | "pulse" } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shift">Shift</SelectItem>
                  <SelectItem value="rotate">Hue rotate</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between text-[11px]">
                <Label className="text-[11px]">Duration</Label>
                <span className="font-mono text-muted-foreground">{(gradient.animation.durationMs / 1000).toFixed(1)}s</span>
              </div>
              <Slider
                min={1000} max={20000} step={250}
                value={[gradient.animation.durationMs]}
                onValueChange={([v]) => patch({ animation: { ...gradient.animation, durationMs: v } })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
