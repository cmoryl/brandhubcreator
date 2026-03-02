/**
 * Palette Animation Preview — see how colors transition and animate together
 * with configurable easing, duration, and animation patterns.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, RotateCcw, Zap } from 'lucide-react';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

type AnimationPattern = 'wave' | 'pulse' | 'cascade' | 'morph' | 'breathe';

const PATTERNS: { type: AnimationPattern; label: string; description: string }[] = [
  { type: 'wave', label: 'Wave', description: 'Colors ripple in sequence' },
  { type: 'pulse', label: 'Pulse', description: 'Scale up and down rhythmically' },
  { type: 'cascade', label: 'Cascade', description: 'Staggered fade-in reveal' },
  { type: 'morph', label: 'Morph', description: 'Colors blend into each other' },
  { type: 'breathe', label: 'Breathe', description: 'Gentle opacity breathing' },
];

const EASINGS = [
  { label: 'Ease Out', value: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  { label: 'Spring', value: [0.68, -0.55, 0.27, 1.55] as [number, number, number, number] },
  { label: 'Linear', value: [0, 0, 1, 1] as [number, number, number, number] },
  { label: 'Bounce', value: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
];

function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a1a' : '#ffffff';
}

export function PaletteAnimationPreview({ colors }: { colors: LabColor[] }) {
  const [pattern, setPattern] = useState<AnimationPattern>('wave');
  const [duration, setDuration] = useState(1.2);
  const [easingIdx, setEasingIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [key, setKey] = useState(0);

  const easing = EASINGS[easingIdx].value;

  const replay = () => {
    setKey(k => k + 1);
    setPlaying(true);
  };

  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors to preview animations</p>
      </div>
    );
  }

  const getVariants = (i: number) => {
    const delay = i * 0.12;
    switch (pattern) {
      case 'wave':
        return {
          initial: { y: 0, scaleY: 1 },
          animate: {
            y: [0, -20, 0],
            scaleY: [1, 1.15, 1],
            transition: { duration, delay, ease: easing, repeat: Infinity, repeatDelay: 0.5 },
          },
        };
      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: {
            scale: [1, 1.2, 1],
            transition: { duration, delay, ease: easing, repeat: Infinity, repeatDelay: 0.3 },
          },
        };
      case 'cascade':
        return {
          initial: { opacity: 0, y: 40 },
          animate: {
            opacity: 1,
            y: 0,
            transition: { duration, delay: delay * 2, ease: easing },
          },
        };
      case 'morph':
        return {
          initial: { borderRadius: '8px', rotate: 0 },
          animate: {
            borderRadius: ['8px', '50%', '8px'],
            rotate: [0, 180, 360],
            transition: { duration: duration * 2, delay, ease: easing, repeat: Infinity },
          },
        };
      case 'breathe':
        return {
          initial: { opacity: 0.4 },
          animate: {
            opacity: [0.4, 1, 0.4],
            transition: { duration: duration * 1.5, delay, ease: easing, repeat: Infinity },
          },
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Palette Animation Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-1.5">
          {PATTERNS.map(p => (
            <Button
              key={p.type}
              variant={pattern === p.type ? 'default' : 'outline'}
              size="sm"
              className="text-[10px] h-7 px-2.5"
              onClick={() => { setPattern(p.type); replay(); }}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Duration</span>
            <Slider
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              min={0.3}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8">{duration.toFixed(1)}s</span>
          </div>
          <div className="flex gap-1">
            {EASINGS.map((e, idx) => (
              <Button
                key={e.label}
                variant={easingIdx === idx ? 'default' : 'outline'}
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={() => { setEasingIdx(idx); replay(); }}
              >
                {e.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={replay}>
            <RotateCcw className="h-3 w-3" />
            <span className="text-[10px]">Replay</span>
          </Button>
        </div>

        {/* Animation stage */}
        <div className="rounded-xl border bg-muted/30 p-6 flex items-center justify-center min-h-[180px] gap-3 flex-wrap" key={key}>
          {colors.map((c, i) => (
            <motion.div
              key={c.id}
              {...getVariants(i)}
              className="w-16 h-20 rounded-lg flex flex-col items-center justify-end p-1.5 shadow-lg cursor-pointer"
              style={{ backgroundColor: c.hex }}
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-[8px] font-semibold truncate w-full text-center" style={{ color: getContrastText(c.hex) }}>
                {c.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Gradient transition bar */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium">Gradient Flow</p>
          <motion.div
            key={`grad-${key}`}
            className="h-8 rounded-lg overflow-hidden"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: duration * 2, ease: easing }}
            style={{
              background: `linear-gradient(90deg, ${colors.map((c, i) => `${c.hex} ${(i / (colors.length - 1)) * 100}%`).join(', ')})`,
            }}
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          {PATTERNS.find(p => p.type === pattern)?.description} · {EASINGS[easingIdx].label} easing · {duration.toFixed(1)}s
        </p>
      </CardContent>
    </Card>
  );
}
