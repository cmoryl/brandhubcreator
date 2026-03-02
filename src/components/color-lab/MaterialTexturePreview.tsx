/**
 * Material/Texture Preview — hyper-realistic surface simulations
 * using multi-layered CSS effects, SVG noise filters, and advanced lighting.
 */

import { useState, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

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

/** SVG noise filter rendered inline for texture realism */
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

function FabricSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const dark = darkenHex(hex, 0.12);
  const vdark = darkenHex(hex, 0.2);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      {/* Warp threads */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 1.5px, ${dark}33 1.5px, ${dark}33 2.5px),
          repeating-linear-gradient(90deg, transparent, transparent 1.5px, ${dark}22 1.5px, ${dark}22 2.5px)
        `,
        backgroundSize: '4px 4px',
      }} />
      {/* Weave cross-hatch */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 3px, ${vdark}0a 3px, ${vdark}0a 4px),
          repeating-linear-gradient(-45deg, transparent, transparent 3px, ${vdark}08 3px, ${vdark}08 4px)
        `,
        backgroundSize: '6px 6px',
      }} />
      {/* Fabric fuzz noise */}
      <NoiseSvg id={filterId} baseFrequency={1.2} numOctaves={5} opacity={0.12} />
      {/* Soft highlight fold */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${lightenHex(hex, 0.08)}40 0%, transparent 30%, transparent 70%, ${darkenHex(hex, 0.06)}30 100%)`,
      }} />
    </div>
  );
}

function MetalSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const light = lightenHex(hex, 0.25);
  const vlight = lightenHex(hex, 0.4);
  const dark = darkenHex(hex, 0.18);
  const vdark = darkenHex(hex, 0.3);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(155deg, ${dark} 0%, ${hex} 20%, ${vlight} 42%, ${light} 48%, ${hex} 55%, ${dark} 75%, ${vdark} 100%)`,
    }}>
      {/* Brushed streaks */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(88deg, transparent, transparent 1px, ${vlight}12 1px, ${vlight}12 1.5px),
          repeating-linear-gradient(92deg, transparent, transparent 3px, ${dark}0c 3px, ${dark}0c 3.5px)
        `,
      }} />
      {/* Specular highlight */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 60% 30% at 55% 35%, ${vlight}50 0%, transparent 70%)`,
      }} />
      {/* Fine grain */}
      <NoiseSvg id={filterId} baseFrequency={2.5} numOctaves={3} opacity={0.06} />
      {/* Edge shadow */}
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 1px 0 ${vlight}60, inset 0 -2px 4px ${vdark}50, inset 2px 0 4px ${dark}20, inset -2px 0 4px ${dark}20`,
      }} />
    </div>
  );
}

function GlassSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const light = lightenHex(hex, 0.3);
  const vlight = lightenHex(hex, 0.45);
  const dark = darkenHex(hex, 0.1);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(145deg, ${hex}bb 0%, ${light}88 35%, ${hex}99 50%, ${vlight}55 75%, ${hex}aa 100%)`,
    }}>
      {/* Refraction band */}
      <div className="absolute inset-0" style={{
        background: `
          linear-gradient(120deg, transparent 20%, ${vlight}30 35%, transparent 50%),
          linear-gradient(200deg, transparent 50%, ${vlight}18 70%, transparent 85%)
        `,
      }} />
      {/* Glass edge caustics */}
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `
          inset 0 1px 1px ${vlight}90,
          inset 0 -1px 2px ${dark}40,
          inset 1px 0 1px ${vlight}30,
          0 4px 20px ${hex}25,
          0 1px 3px ${dark}20
        `,
      }} />
      {/* Frosted noise */}
      <NoiseSvg id={filterId} baseFrequency={0.9} numOctaves={4} opacity={0.04} />
      {/* Top glare line */}
      <div className="absolute top-2 left-3 right-6 h-[1px] rounded-full" style={{
        background: `linear-gradient(90deg, transparent, ${vlight}70 30%, ${vlight}90 50%, ${vlight}70 70%, transparent)`,
      }} />
    </div>
  );
}

function PaperSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const dark = darkenHex(hex, 0.06);
  const vdark = darkenHex(hex, 0.12);
  const light = lightenHex(hex, 0.06);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      {/* Fiber texture dots */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(${vdark}0c 0.8px, transparent 0.8px),
          radial-gradient(${dark}08 0.6px, transparent 0.6px),
          radial-gradient(${vdark}06 1px, transparent 1px)
        `,
        backgroundSize: '5px 5px, 8px 8px, 13px 13px',
        backgroundPosition: '0 0, 3px 3px, 6px 1px',
      }} />
      {/* Heavy grain noise */}
      <NoiseSvg id={filterId} baseFrequency={0.85} numOctaves={6} opacity={0.14} />
      {/* Subtle crease shadows */}
      <div className="absolute inset-0" style={{
        background: `
          linear-gradient(168deg, ${light}30 0%, transparent 25%, transparent 75%, ${dark}20 100%),
          linear-gradient(72deg, transparent 40%, ${dark}08 50%, transparent 60%)
        `,
      }} />
      {/* Soft edge vignette */}
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 0 12px ${dark}15`,
      }} />
    </div>
  );
}

function WoodSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const dark = darkenHex(hex, 0.14);
  const vdark = darkenHex(hex, 0.25);
  const light = lightenHex(hex, 0.1);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{ backgroundColor: hex }}>
      {/* Wide grain lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          repeating-linear-gradient(85deg, transparent, transparent 6px, ${dark}18 6px, ${dark}18 7px, transparent 7px, transparent 14px, ${vdark}10 14px, ${vdark}10 14.5px),
          repeating-linear-gradient(83deg, transparent, transparent 18px, ${dark}0e 18px, ${dark}0e 19px),
          repeating-linear-gradient(87deg, transparent, transparent 30px, ${dark}0a 30px, ${dark}0a 32px)
        `,
      }} />
      {/* Knot / ring simulation */}
      <div className="absolute" style={{
        width: '50px', height: '35px', top: '40%', left: '60%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${dark}18 0%, ${dark}0c 40%, transparent 70%)`,
        border: `1px solid ${dark}12`,
        transform: 'rotate(-12deg)',
      }} />
      {/* Wood grain noise */}
      <NoiseSvg id={filterId} baseFrequency={0.3} numOctaves={3} opacity={0.1} />
      {/* Lacquer sheen */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${light}20 0%, transparent 35%, transparent 65%, ${dark}15 100%)`,
      }} />
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `inset 0 1px 0 ${light}30, inset 0 -1px 3px ${vdark}20`,
        filter: 'saturate(0.9)',
      }} />
    </div>
  );
}

function PlasticSwatch({ hex, filterId }: { hex: string; filterId: string }) {
  const light = lightenHex(hex, 0.22);
  const vlight = lightenHex(hex, 0.38);
  const dark = darkenHex(hex, 0.18);
  const vdark = darkenHex(hex, 0.28);
  return (
    <div className="relative rounded-xl h-32 overflow-hidden" style={{
      background: `linear-gradient(150deg, ${light} 0%, ${hex} 40%, ${dark} 100%)`,
    }}>
      {/* Glossy specular */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 50% 40% at 40% 30%, ${vlight}55 0%, transparent 60%)`,
      }} />
      {/* Secondary catch-light */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 20% 15% at 70% 70%, ${light}20 0%, transparent 50%)`,
      }} />
      {/* Micro-texture */}
      <NoiseSvg id={filterId} baseFrequency={3.0} numOctaves={2} opacity={0.03} />
      {/* Rim lighting */}
      <div className="absolute inset-0 rounded-xl" style={{
        boxShadow: `
          inset 0 1px 2px ${vlight}70,
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

function MaterialSwatch({ material, hex, index }: { material: MaterialType; hex: string; index: number }) {
  const baseId = useId();
  const filterId = `noise-${baseId}-${index}`;

  switch (material) {
    case 'fabric': return <FabricSwatch hex={hex} filterId={filterId} />;
    case 'metal': return <MetalSwatch hex={hex} filterId={filterId} />;
    case 'glass': return <GlassSwatch hex={hex} filterId={filterId} />;
    case 'paper': return <PaperSwatch hex={hex} filterId={filterId} />;
    case 'wood': return <WoodSwatch hex={hex} filterId={filterId} />;
    case 'plastic': return <PlasticSwatch hex={hex} filterId={filterId} />;
  }
}

export function MaterialTexturePreview({ colors }: { colors: LabColor[] }) {
  const [material, setMaterial] = useState<MaterialType>('metal');

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
          Hyper-realistic surface simulations with lighting, grain & texture
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

        {/* Material swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {colors.map((c, i) => (
            <div key={c.id} className="space-y-1.5">
              <MaterialSwatch material={material} hex={c.hex} index={i} />
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
            <MaterialSwatch material={material} hex={colors[0].hex} index={999} />
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
