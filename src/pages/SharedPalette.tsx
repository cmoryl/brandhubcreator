/**
 * SharedPalette — public read-only view of a shared Color Lab palette.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Copy, Check, Printer, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { analyzeColor, type FullColorAnalysis } from '@/lib/colorConversions';
import { hexToOklch, formatOklch, contrastRatio, wcagLevel, wcagLevelColor, wcagBadgeBg } from '@/lib/oklchAccessibility';

interface PaletteColor {
  hex: string;
  name: string;
}

const ColorCodeRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between py-1 group">
      <span className="text-xs text-muted-foreground w-14 shrink-0">{label}</span>
      <code className="text-xs font-mono flex-1 truncate">{value}</code>
      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={copy}>
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
};

export default function SharedPalette() {
  const { token } = useParams<{ token: string }>();
  const [palette, setPalette] = useState<{ title: string; colors: PaletteColor[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase
      .from('color_lab_reports')
      .select('title, colors')
      .eq('share_token', token)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPalette({ title: data.title, colors: (data.colors as unknown as PaletteColor[]) || [] });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [token]);

  const analyses = useMemo(() => {
    if (!palette) return new Map<number, FullColorAnalysis>();
    const map = new Map<number, FullColorAnalysis>();
    palette.colors.forEach((c, i) => map.set(i, analyzeColor(c.hex)));
    return map;
  }, [palette]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <Droplets className="h-10 w-10 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading palette…</p>
        </div>
      </div>
    );
  }

  if (notFound || !palette) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Droplets className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
          <p className="text-sm font-medium">Palette not found</p>
          <p className="text-xs text-muted-foreground">This link may have expired or been removed.</p>
          <Link to="/color-lab">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Go to Color Lab
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link to="/color-lab" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10">
              <Droplets className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">{palette.title}</h1>
              <p className="text-[10px] text-muted-foreground">Shared Palette · {palette.colors.length} colors</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Strip */}
        <div className="rounded-xl overflow-hidden border h-16 flex">
          {palette.colors.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>

        {/* Color cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {palette.colors.map((color, i) => {
            const a = analyses.get(i);
            if (!a) return null;
            const oklch = hexToOklch(color.hex);
            return (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color.hex }} />
                    <div>
                      <CardTitle className="text-sm">{color.name}</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.hex}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-0">
                  <ColorCodeRow label="HEX" value={a.hex} />
                  <ColorCodeRow label="RGB" value={`rgb(${a.rgb.r}, ${a.rgb.g}, ${a.rgb.b})`} />
                  <ColorCodeRow label="HSL" value={`hsl(${a.hsl.h}, ${a.hsl.s}%, ${a.hsl.l}%)`} />
                  <ColorCodeRow label="CMYK" value={`C${a.cmyk.c} M${a.cmyk.m} Y${a.cmyk.y} K${a.cmyk.k}`} />
                  <ColorCodeRow label="OKLCH" value={formatOklch(oklch)} />
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-[10px] text-muted-foreground w-14">Pantone</span>
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: a.pantone.hex }} />
                    <span className="text-xs font-medium">{a.pantone.name}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contrast pairs */}
        {palette.colors.length >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contrast Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {palette.colors.flatMap((fg, fi) =>
                  palette.colors.map((bg, bi) => {
                    if (fi >= bi) return null;
                    const ratio = contrastRatio(fg.hex, bg.hex);
                    const level = wcagLevel(ratio);
                    return (
                      <div key={`${fi}-${bi}`} className="flex items-center gap-2 rounded-lg border p-2">
                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: fg.hex }} />
                        <span className="text-[10px] text-muted-foreground">on</span>
                        <div className="w-5 h-5 rounded border" style={{ backgroundColor: bg.hex }} />
                        <span className="text-xs flex-1 truncate">{ratio.toFixed(1)}:1</span>
                        <Badge variant="outline" className={cn("text-[9px] border", wcagBadgeBg(level))}>
                          <span className={wcagLevelColor(level)}>{level}</span>
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
