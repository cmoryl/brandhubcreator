/**
 * Material/Texture Preview — shows colors applied to realistic
 * surface simulations using CSS effects.
 */

import { useState } from 'react';
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

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a1a' : '#ffffff';
}

function lightenHex(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(amount * 255));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(amount * 255));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(amount * 255));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(amount * 255));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(amount * 255));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(amount * 255));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getMaterialStyle(material: MaterialType, hex: string): React.CSSProperties {
  const light = lightenHex(hex, 0.2);
  const dark = darkenHex(hex, 0.15);
  const veryLight = lightenHex(hex, 0.35);

  switch (material) {
    case 'fabric':
      return {
        backgroundColor: hex,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, ${dark}22 2px, ${dark}22 3px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, ${dark}22 2px, ${dark}22 3px)
        `,
        filter: 'contrast(0.95)',
      };
    case 'metal':
      return {
        background: `linear-gradient(135deg, ${dark} 0%, ${hex} 25%, ${veryLight} 50%, ${hex} 75%, ${dark} 100%)`,
        filter: 'contrast(1.1) saturate(0.8)',
      };
    case 'glass':
      return {
        background: `linear-gradient(135deg, ${hex}cc 0%, ${light}99 40%, ${hex}bb 60%, ${veryLight}66 100%)`,
        backdropFilter: 'blur(8px)',
        boxShadow: `inset 0 1px 2px ${veryLight}80, inset 0 -1px 2px ${dark}40, 0 4px 16px ${hex}30`,
      };
    case 'paper':
      return {
        backgroundColor: hex,
        backgroundImage: `
          radial-gradient(${dark}08 1px, transparent 1px),
          radial-gradient(${dark}05 1px, transparent 1px)
        `,
        backgroundSize: '4px 4px, 7px 7px',
        backgroundPosition: '0 0, 3px 3px',
        filter: 'contrast(0.92) brightness(1.05)',
      };
    case 'wood':
      return {
        backgroundColor: hex,
        backgroundImage: `
          repeating-linear-gradient(
            82deg,
            transparent,
            transparent 8px,
            ${dark}18 8px,
            ${dark}18 9px
          ),
          repeating-linear-gradient(
            85deg,
            transparent,
            transparent 15px,
            ${dark}10 15px,
            ${dark}10 16px
          )
        `,
        filter: 'saturate(0.85) contrast(0.95)',
      };
    case 'plastic':
      return {
        background: `linear-gradient(145deg, ${light} 0%, ${hex} 50%, ${dark} 100%)`,
        filter: 'saturate(1.2) contrast(1.05)',
        boxShadow: `inset 0 2px 4px ${veryLight}60, inset 0 -2px 4px ${dark}40`,
      };
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
          See how your colors look on physical surfaces
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
          {colors.map(c => (
            <div key={c.id} className="space-y-1.5">
              <div
                className="rounded-xl h-28 transition-all duration-300"
                style={getMaterialStyle(material, c.hex)}
              />
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
          <div
            className="rounded-xl h-20 flex items-end overflow-hidden"
            style={{
              ...getMaterialStyle(material, colors[0].hex),
            }}
          >
            <div className="w-full px-4 py-2 flex items-center justify-between" style={{
              background: `linear-gradient(to top, ${darkenHex(colors[0].hex, 0.3)}cc, transparent)`,
            }}>
              <span className="text-xs font-bold" style={{ color: getContrastText(darkenHex(colors[0].hex, 0.3)) }}>
                {colors[0].name}
              </span>
              <span className="text-[9px] font-mono" style={{ color: getContrastText(darkenHex(colors[0].hex, 0.3)) }}>
                {MATERIALS.find(m => m.type === material)?.label} finish
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
