import { useCallback, useRef, useState } from "react";
import { MeshPoint } from "@/lib/gradientStudio";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  points: MeshPoint[];
  onChange: (next: MeshPoint[]) => void;
  /** Background preview style for the canvas. */
  previewBackground?: string;
}

/**
 * Drag mesh points on a 2D canvas. Optional snap-to-grid (3×3 .. 12×12)
 * gives designers reproducible point placement.
 */
export const MeshGridEditor = ({ points, onChange, previewBackground }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [snap, setSnap] = useState(true);
  const [density, setDensity] = useState(6); // grid cells

  const snapVal = useCallback(
    (v: number) => {
      if (!snap) return Math.round(v);
      const step = 100 / density;
      return Math.round(Math.round(v / step) * step);
    },
    [snap, density],
  );

  const handleMove = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const cx = Math.max(0, Math.min(100, snapVal(x)));
    const cy = Math.max(0, Math.min(100, snapVal(y)));
    onChange(points.map((p) => (p.id === drag ? { ...p, x: cx, y: cy } : p)));
  };

  const gridLines = Array.from({ length: density - 1 }, (_, i) => ((i + 1) * 100) / density);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-xs">Mesh grid editor</Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="mesh-snap" className="text-[11px] text-muted-foreground">Snap</Label>
            <Switch id="mesh-snap" checked={snap} onCheckedChange={setSnap} />
          </div>
          <div className="flex items-center gap-2 w-40">
            <span className="text-[11px] text-muted-foreground">Grid</span>
            <Slider min={3} max={12} step={1} value={[density]} onValueChange={([v]) => setDensity(v)} />
            <span className="text-[11px] font-mono w-6 text-right">{density}</span>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
        className="relative w-full rounded-lg border border-border overflow-hidden cursor-crosshair select-none"
        style={{
          aspectRatio: "16 / 10",
          background: previewBackground ?? "linear-gradient(135deg, #1e293b, #0f172a)",
        }}
      >
        {/* grid overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {gridLines.map((g) => (
            <line key={`v${g}`} x1={g} y1={0} x2={g} y2={100} stroke="rgba(255,255,255,0.18)" strokeWidth={0.15} />
          ))}
          {gridLines.map((g) => (
            <line key={`h${g}`} x1={0} y1={g} x2={100} y2={g} stroke="rgba(255,255,255,0.18)" strokeWidth={0.15} />
          ))}
        </svg>
        {points.map((p) => (
          <button
            key={p.id}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setDrag(p.id); }}
            className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 ring-1 ring-black/40 hover:scale-110 transition-transform"
            style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color, touchAction: "none" }}
            aria-label={`Mesh point at ${Math.round(p.x)}% ${Math.round(p.y)}%`}
            title={`${p.color} · ${Math.round(p.x)}, ${Math.round(p.y)}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Drag points to reposition. Toggle snap to lock onto the grid.</p>
    </div>
  );
};
