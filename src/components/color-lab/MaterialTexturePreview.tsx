/**
 * Material/Texture Preview — hyper-realistic surface simulations
 * with configurable light direction, SVG noise, and advanced lighting.
 */

import { useState, useId, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Layers, Sun } from 'lucide-react';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

type MaterialType = 'fabric' | 'metal' | 'glass' | 'paper' | 'wood' | 'plastic';

const MATERIALS: { type: MaterialType; label: string; emoji: string }[] = [
  { type: 'fabric', label: 'Fabric', emoji: '🧵' },
  { type: 'metal', label: 'Metal', emoji: '🔩' },
  { type: 'glass', label: 'Glass', emoji: '🔮' },
  { type: 'paper', label: 'Paper', emoji: '📄' },
  { type: 'wood', label: 'Wood', emoji: '🪵' },
  { type: 'plastic', label: 'Plastic', emoji: '💎' },
];

/** Light direction context — angle in degrees (0=top, 90=right, 180=bottom, 270=left) */
interface LightCtx {
  angle: number;        // degrees
  /** Highlight position as percentage (x%, y%) */
  hlX: number;
  hlY: number;
  /** CSS gradient angle that follows the light */
  gradAngle: number;
  /** Opposite gradient angle for shadows */
  shadowAngle: number;
}

function angleTo(angle: number): LightCtx {
  const rad = (angle * Math.PI) / 180;
  // highlight moves toward light source
  const hlX = 50 + Math.sin(rad) * 25;
  const hlY = 50 - Math.cos(rad) * 25;
  const gradAngle = angle + 180; // gradient flows away from light
  const shadowAngle = angle;
  return { angle, hlX, hlY, gradAngle, shadowAngle };
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getContrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a1a' : '#ffffff';
}

function lightenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, r + Math.round(amount * 255));
  const lg = Math.min(255, g + Math.round(amount * 255));
  const lb = Math.min(255, b + Math.round(amount * 255));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.max(0, r - Math.round(amount * 255));
  const dg = Math.max(0, g - Math.round(amount * 255));
  const db = Math.max(0, b - Math.round(amount * 255));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

function NoiseSvg({ id, baseFrequency = 0.65, numOctaves = 4, opacity = 0.08 }: {
  id: string; baseFrequency?: number; numOctaves?: number; opacity?: number;
}) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={baseFrequency} numOctaves={numOctaves} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function FabricSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const dark = darkenHex(hex, 0.12);
  const vdark = darkenHex(hex, 0.2);
  const light_ = lightenHex(hex, 0.08);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 1.5px, ${dark}33 1.5px, ${dark}33 2.5px),
          repeating-linear-gradient(90deg, transparent, transparent 1.5px, ${dark}22 1.5px, ${dark}22 2.5px)
        `,
        backgroundSize: '4px 4px',
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 3px, ${vdark}0a 3px, ${vdark}0a 4px),
          repeating-linear-gradient(-45deg, transparent, transparent 3px, ${vdark}08 3px, ${vdark}08 4px)
        `,
        backgroundSize: '6px 6px',
      }} />
      <NoiseSvg id={filterId} baseFrequency={1.2} numOctaves={5} opacity={0.12} />
      {/* Dynamic light fold */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(${light.gradAngle}deg, ${light_}45 0%, transparent 35%, transparent 65%, ${dark}35 100%)`,
      }} />
      {/* Directional soft highlight */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 70% 50% at ${light.hlX}% ${light.hlY}%, ${light_}25 0%, transparent 60%)`,
      }} />
    </div>
  );
}

function MetalSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const l1 = lightenHex(hex, 0.25);
  const vl = lightenHex(hex, 0.4);
  const dark = darkenHex(hex, 0.18);
  const vdark = darkenHex(hex, 0.3);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(${light.gradAngle}deg, ${vdark} 0%, ${dark} 15%, ${hex} 35%, ${vl} 48%, ${l1} 52%, ${hex} 65%, ${dark} 85%, ${vdark} 100%)`,
    }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(${light.angle + 88}deg, transparent, transparent 1px, ${vl}12 1px, ${vl}12 1.5px),
          repeating-linear-gradient(${light.angle + 92}deg, transparent, transparent 3px, ${dark}0c 3px, ${dark}0c 3.5px)
        `,
      }} />
      {/* Specular moves with light */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 55% 30% at ${light.hlX}% ${light.hlY}%, ${vl}60 0%, transparent 65%)`,
      }} />
      <NoiseSvg id={filterId} baseFrequency={2.5} numOctaves={3} opacity={0.06} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 1px 0 ${vl}60, inset 0 -2px 4px ${vdark}50, inset 2px 0 4px ${dark}20, inset -2px 0 4px ${dark}20`,
      }} />
    </div>
  );
}

function GlassSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const l1 = lightenHex(hex, 0.3);
  const vl = lightenHex(hex, 0.45);
  const dark = darkenHex(hex, 0.1);
  // Glare line position based on light
  const glareTop = Math.max(4, 50 - Math.cos((light.angle * Math.PI) / 180) * 40);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(${light.gradAngle}deg, ${hex}bb 0%, ${l1}88 35%, ${hex}99 50%, ${vl}55 75%, ${hex}aa 100%)`,
    }}>
      <div className="absolute inset-0" style={{
        background: `
          linear-gradient(${light.angle + 120}deg, transparent 20%, ${vl}30 35%, transparent 50%),
          linear-gradient(${light.angle + 200}deg, transparent 50%, ${vl}18 70%, transparent 85%)
        `,
      }} />
      {/* Specular highlight follows light */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 40% 25% at ${light.hlX}% ${light.hlY}%, ${vl}50 0%, transparent 55%)`,
      }} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `
          inset 0 1px 1px ${vl}90,
          inset 0 -1px 2px ${dark}40,
          inset 1px 0 1px ${vl}30,
          0 4px 20px ${hex}25,
          0 1px 3px ${dark}20
        `,
      }} />
      <NoiseSvg id={filterId} baseFrequency={0.9} numOctaves={4} opacity={0.04} />
      {/* Glare line */}
      <div className="absolute left-3 right-6 h-[1px] rounded-full" style={{
        top: `${glareTop}%`,
        background: `linear-gradient(90deg, transparent, ${vl}70 30%, ${vl}90 50%, ${vl}70 70%, transparent)`,
        transform: `rotate(${(light.angle - 135) * 0.15}deg)`,
      }} />
    </div>
  );
}

function PaperSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const dark = darkenHex(hex, 0.06);
  const vdark = darkenHex(hex, 0.12);
  const l1 = lightenHex(hex, 0.06);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(${vdark}0c 0.8px, transparent 0.8px),
          radial-gradient(${dark}08 0.6px, transparent 0.6px),
          radial-gradient(${vdark}06 1px, transparent 1px)
        `,
        backgroundSize: '5px 5px, 8px 8px, 13px 13px',
        backgroundPosition: '0 0, 3px 3px, 6px 1px',
      }} />
      <NoiseSvg id={filterId} baseFrequency={0.85} numOctaves={6} opacity={0.14} />
      {/* Light-responsive shading */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(${light.gradAngle}deg, ${l1}35 0%, transparent 30%, transparent 70%, ${dark}25 100%)`,
      }} />
      {/* Crease that shifts with light */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(${light.angle + 72}deg, transparent 40%, ${dark}0a 50%, transparent 60%)`,
      }} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 0 12px ${dark}15`,
      }} />
    </div>
  );
}

function WoodSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const dark = darkenHex(hex, 0.14);
  const vdark = darkenHex(hex, 0.25);
  const l1 = lightenHex(hex, 0.1);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(85deg, transparent, transparent 6px, ${dark}18 6px, ${dark}18 7px, transparent 7px, transparent 14px, ${vdark}10 14px, ${vdark}10 14.5px),
          repeating-linear-gradient(83deg, transparent, transparent 18px, ${dark}0e 18px, ${dark}0e 19px),
          repeating-linear-gradient(87deg, transparent, transparent 30px, ${dark}0a 30px, ${dark}0a 32px)
        `,
      }} />
      <div className="absolute" style={{
        width: '50px', height: '35px', top: '40%', left: '60%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${dark}18 0%, ${dark}0c 40%, transparent 70%)`,
        border: `1px solid ${dark}12`,
        transform: 'rotate(-12deg)',
      }} />
      <NoiseSvg id={filterId} baseFrequency={0.3} numOctaves={3} opacity={0.1} />
      {/* Lacquer sheen follows light */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(${light.gradAngle}deg, ${l1}28 0%, transparent 40%, transparent 60%, ${dark}1a 100%)`,
      }} />
      {/* Specular gloss */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 60% 35% at ${light.hlX}% ${light.hlY}%, ${l1}18 0%, transparent 55%)`,
      }} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 1px 0 ${l1}30, inset 0 -1px 3px ${vdark}20`,
        filter: 'saturate(0.9)',
      }} />
    </div>
  );
}

function PlasticSwatch({ hex, filterId, light }: { hex: string; filterId: string; light: LightCtx }) {
  const l1 = lightenHex(hex, 0.22);
  const vl = lightenHex(hex, 0.38);
  const dark = darkenHex(hex, 0.18);
  const vdark = darkenHex(hex, 0.28);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(${light.gradAngle}deg, ${l1} 0%, ${hex} 40%, ${dark} 100%)`,
    }}>
      {/* Primary specular — follows light */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 45% 35% at ${light.hlX}% ${light.hlY}%, ${vl}60 0%, transparent 55%)`,
      }} />
      {/* Secondary catch-light opposite */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 20% 15% at ${100 - light.hlX}% ${100 - light.hlY}%, ${l1}20 0%, transparent 50%)`,
      }} />
      <NoiseSvg id={filterId} baseFrequency={3.0} numOctaves={2} opacity={0.03} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `
          inset 0 1px 2px ${vl}70,
          inset 0 -2px 6px ${vdark}50,
          inset 2px 0 4px ${dark}15,
          inset -2px 0 4px ${dark}15,
          0 4px 12px ${dark}30
        `,
        filter: 'saturate(1.15) contrast(1.05)',
      }} />
    </div>
  );
}

function MaterialSwatch({ material, hex, index, light }: { material: MaterialType; hex: string; index: number; light: LightCtx }) {
  const baseId = useId();
  const filterId = `noise-${baseId}-${index}`;
  const props = { hex, filterId, light };

  switch (material) {
    case 'fabric': return <FabricSwatch {...props} />;
    case 'metal': return <MetalSwatch {...props} />;
    case 'glass': return <GlassSwatch {...props} />;
    case 'paper': return <PaperSwatch {...props} />;
    case 'wood': return <WoodSwatch {...props} />;
    case 'plastic': return <PlasticSwatch {...props} />;
  }
}

/** Small visual dial showing light direction */
function LightDial({ angle }: { angle: number }) {
  const rad = (angle * Math.PI) / 180;
  const cx = 12, cy = 12, r = 9;
  const ex = cx + Math.sin(rad) * r;
  const ey = cy - Math.cos(rad) * r;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-muted-foreground/30" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="2" className="fill-muted-foreground/40" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="2.5" className="fill-primary" />
    </svg>
  );
}

export function MaterialTexturePreview({ colors }: { colors: LabColor[] }) {
  const [material, setMaterial] = useState<MaterialType>('metal');
  const [lightAngle, setLightAngle] = useState(135);
  const light = useMemo(() => angleTo(lightAngle), [lightAngle]);

  if (colors.length < 1) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add colors to preview on materials</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Material & Texture Preview
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Hyper-realistic surfaces with dynamic lighting, grain & texture
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Material selector */}
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS.map(m => (
            <Button
              key={m.type}
              variant={material === m.type ? 'default' : 'outline'}
              size="sm"
              className="text-[10px] h-7 px-2.5 gap-1"
              onClick={() => setMaterial(m.type)}
            >
              <span>{m.emoji}</span>
              {m.label}
            </Button>
          ))}
        </div>

        {/* Light direction control */}
        <div className="flex items-center gap-3 px-1">
          <Sun className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">Light</span>
          <Slider
            value={[lightAngle]}
            onValueChange={([v]) => setLightAngle(v)}
            min={0}
            max={360}
            step={5}
            className="flex-1"
          />
          <LightDial angle={lightAngle} />
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{lightAngle}°</span>
        </div>

        {/* Material swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {colors.map((c, i) => (
            <div key={c.id} className="space-y-1.5">
              <MaterialSwatch material={material} hex={c.hex} index={i} light={light} />
              <div className="flex items-center gap-1.5 px-1">
                <div className="w-3 h-3 rounded border shrink-0" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] font-medium truncate">{c.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Full-width product mockup */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">Product Surface Mockup</p>
          <div className="relative rounded-xl h-24 overflow-hidden">
            <MaterialSwatch material={material} hex={colors[0].hex} index={999} light={light} />
            <div className="absolute inset-0 flex items-end">
              <div className="w-full px-4 py-2.5 flex items-center justify-between" style={{
                background: `linear-gradient(to top, ${darkenHex(colors[0].hex, 0.35)}dd, ${darkenHex(colors[0].hex, 0.2)}88, transparent)`,
              }}>
                <span className="text-xs font-bold tracking-wide" style={{ color: getContrastText(darkenHex(colors[0].hex, 0.35)) }}>
                  {colors[0].name}
                </span>
                <span className="text-[9px] font-mono opacity-80" style={{ color: getContrastText(darkenHex(colors[0].hex, 0.35)) }}>
                  {MATERIALS.find(m => m.type === material)?.label} finish
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
