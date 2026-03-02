/**
 * Palette Generator — generate harmonious palettes from a seed color
 * using OKLCH color space for perceptually uniform results.
 */

import { useState, useMemo } from 'react';
import { Palette, Plus, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { hexToOklch, oklchToHex, type OklchColor } from '@/lib/oklchAccessibility';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

const HARMONIES: { type: HarmonyType; label: string; description: string; offsets: number[] }[] = [
  { type: 'complementary', label: 'Complementary', description: 'Opposite hues for maximum contrast', offsets: [180] },
  { type: 'analogous', label: 'Analogous', description: 'Adjacent hues for harmony', offsets: [-30, 30] },
  { type: 'triadic', label: 'Triadic', description: 'Three evenly spaced hues', offsets: [120, 240] },
  { type: 'split-complementary', label: 'Split Comp.', description: 'Complement split into two', offsets: [150, 210] },
  { type: 'tetradic', label: 'Tetradic', description: 'Four evenly spaced hues', offsets: [90, 180, 270] },
];

const rotateHue = (oklch: OklchColor, degrees: number): string => {
  const newH = ((oklch.H + degrees) % 360 + 360) % 360;
  return oklchToHex({ L: oklch.L, C: oklch.C, H: newH });
};

const harmonyName = (type: HarmonyType, index: number): string => {
  const labels: Record<HarmonyType, string[]> = {
    complementary: ['Complement'],
    analogous: ['Warm Neighbor', 'Cool Neighbor'],
    triadic: ['Triad 2', 'Triad 3'],
    'split-complementary': ['Split Left', 'Split Right'],
    tetradic: ['Quarter', 'Opposite', 'Three-Quarter'],
  };
  return labels[type][index] || `Harmony ${index + 1}`;
};

export function PaletteGenerator({ onAddColors }: {
  onAddColors: (colors: LabColor[]) => void;
}) {
  const [seedHex, setSeedHex] = useState('#0066CC');
  const [activeHarmony, setActiveHarmony] = useState<HarmonyType>('complementary');

  const seedOklch = useMemo(() => hexToOklch(seedHex), [seedHex]);

  const generatedColors = useMemo(() => {
    const harmony = HARMONIES.find(h => h.type === activeHarmony)!;
    return harmony.offsets.map((offset, i) => ({
      hex: rotateHue(seedOklch, offset),
      name: harmonyName(activeHarmony, i),
    }));
  }, [seedOklch, activeHarmony]);

  const allColors = [
    { hex: seedHex, name: 'Seed' },
    ...generatedColors,
  ];

  const handleAddAll = () => {
    onAddColors(allColors.map(c => ({
      id: crypto.randomUUID(),
      hex: c.hex.toUpperCase(),
      name: c.name,
    })));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Palette Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seed color picker */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={seedHex}
              onChange={e => setSeedHex(e.target.value.toUpperCase())}
              className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
            />
            <div
              className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
              style={{ backgroundColor: seedHex }}
            />
          </div>
          <div>
            <p className="text-xs font-medium">Seed Color</p>
            <code className="text-[10px] font-mono text-muted-foreground">{seedHex}</code>
          </div>
        </div>

        {/* Harmony type selector */}
        <div className="flex flex-wrap gap-1.5">
          {HARMONIES.map(h => (
            <Tooltip key={h.type}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeHarmony === h.type ? 'default' : 'outline'}
                  size="sm"
                  className="text-[10px] h-7 px-2.5"
                  onClick={() => setActiveHarmony(h.type)}
                >
                  {h.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{h.description}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Preview strip */}
        <div className="rounded-xl overflow-hidden border h-12 flex">
          {allColors.map((c, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="flex-1 hover:flex-[2] transition-all cursor-pointer" style={{ backgroundColor: c.hex }} />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <p className="font-semibold">{c.name}</p>
                <p className="font-mono text-muted-foreground">{c.hex.toUpperCase()}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Color chips */}
        <div className="flex flex-wrap gap-2">
          {allColors.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} />
              <span className="text-[10px] font-medium">{c.name}</span>
              <code className="text-[9px] font-mono text-muted-foreground">{c.hex.toUpperCase()}</code>
            </div>
          ))}
        </div>

        <Button size="sm" onClick={handleAddAll} className="w-full gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add All to Palette
        </Button>
      </CardContent>
    </Card>
  );
}
