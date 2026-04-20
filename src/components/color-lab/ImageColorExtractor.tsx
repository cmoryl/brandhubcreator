import { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, Loader2, Plus, Sparkles, X, Pipette, Layers, Replace, Thermometer, Leaf, Wand2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { extractColorsFromImage, getImageInfo } from '@/lib/imageColorExtraction';
import {
  paletteTemperature, paletteMood, paletteSeason, detectHarmony,
  generateComplementary, generateTriadic, generateAnalogous,
  generateSplitComplementary, generateTetradic,
  generateShades, generateTints, generateTones,
  pickPixelColor,
} from '@/lib/smartColorIntelligence';
import { cn } from '@/lib/utils';

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  name: string;
  sourceImageId?: string;
}

interface ImageEntry {
  id: string;
  file: File;
  url: string;
  colors: ExtractedColor[];
  info: { width: number; height: number; aspectRatio: string; fileSize: string } | null;
}

interface Props {
  onAddColors: (colors: Array<{ hex: string; name: string }>) => void;
  onReplaceColors?: (colors: Array<{ hex: string; name: string }>) => void;
}

export function ImageColorExtractor({ onAddColors, onReplaceColors }: Props) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [numColors, setNumColors] = useState(6);
  const [pickerActive, setPickerActive] = useState<string | null>(null); // image id
  const [pickedColors, setPickedColors] = useState<Array<{ hex: string; name: string }>>([]);
  const [pendingIntegration, setPendingIntegration] = useState<Array<{ hex: string; name: string }> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRefs = useRef<Record<string, HTMLImageElement | null>>({});

  // Merged palette across all images (dedup near-identical, sort by total %)
  const mergedColors = useMemo<ExtractedColor[]>(() => {
    const bucket = new Map<string, ExtractedColor>();
    images.forEach(img => {
      img.colors.forEach(c => {
        // Quantize hex to 5-bit per channel for dedup grouping
        const rgb = c.rgb;
        const key = `${rgb.r >> 4}-${rgb.g >> 4}-${rgb.b >> 4}`;
        const existing = bucket.get(key);
        if (existing) {
          existing.percentage += c.percentage;
        } else {
          bucket.set(key, { ...c });
        }
      });
    });
    const total = Array.from(bucket.values()).reduce((s, c) => s + c.percentage, 0) || 1;
    return Array.from(bucket.values())
      .map(c => ({ ...c, percentage: Math.round((c.percentage / total) * 100) }))
      .filter(c => c.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 12);
  }, [images]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 20 * 1024 * 1024);
    if (fileArr.length === 0) {
      toast.error('Please upload image files under 20MB');
      return;
    }
    setLoading(true);
    try {
      const entries = await Promise.all(
        fileArr.map(async (file) => {
          const id = crypto.randomUUID();
          const [colors, info] = await Promise.all([
            extractColorsFromImage(file, numColors),
            getImageInfo(file),
          ]);
          return {
            id,
            file,
            url: URL.createObjectURL(file),
            colors: colors.map(c => ({ ...c, sourceImageId: id })),
            info,
          } as ImageEntry;
        })
      );
      setImages(prev => [...prev, ...entries]);
      toast.success(`Processed ${entries.length} image${entries.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Failed to extract colors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [numColors]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
    if (pickerActive === id) setPickerActive(null);
  };

  const clearAll = () => {
    images.forEach(i => URL.revokeObjectURL(i.url));
    setImages([]);
    setPickedColors([]);
    setPickerActive(null);
  };

  const requestIntegration = (colors: Array<{ hex: string; name: string }>) => {
    if (!colors.length) return;
    if (onReplaceColors) {
      setPendingIntegration(colors);
    } else {
      onAddColors(colors);
      toast.success(`Added ${colors.length} color${colors.length > 1 ? 's' : ''}`);
    }
  };

  const confirmIntegration = (mode: 'append' | 'replace') => {
    if (!pendingIntegration) return;
    if (mode === 'replace' && onReplaceColors) {
      onReplaceColors(pendingIntegration);
      toast.success(`Replaced palette with ${pendingIntegration.length} colors`);
    } else {
      onAddColors(pendingIntegration);
      toast.success(`Added ${pendingIntegration.length} colors`);
    }
    setPendingIntegration(null);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, imgId: string) => {
    if (pickerActive !== imgId) return;
    const img = imgRefs.current[imgId];
    if (!img) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const hex = pickPixelColor(img, nx, ny);
    if (hex) {
      setPickedColors(prev => [...prev, { hex, name: `Picked ${prev.length + 1}` }]);
      toast.success(`Sampled ${hex}`);
    }
  };

  const hexes = mergedColors.map(c => c.hex);
  const temperature = useMemo(() => paletteTemperature(hexes), [hexes]);
  const mood = useMemo(() => paletteMood(hexes), [hexes]);
  const season = useMemo(() => paletteSeason(hexes), [hexes]);
  const harmony = useMemo(() => detectHarmony(hexes), [hexes]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Extracting colors...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">Drop images or click to upload</p>
            <p className="text-xs text-muted-foreground">Multiple images supported · PNG, JPG, WEBP up to 20MB each</p>
          </div>
        )}
      </div>

      {/* Color count slider */}
      <div className="flex items-center gap-4">
        <Label className="text-xs whitespace-nowrap">Colors per image:</Label>
        <Slider min={3} max={12} step={1} value={[numColors]} onValueChange={([v]) => setNumColors(v)} className="flex-1" />
        <span className="text-xs font-mono w-4 text-center">{numColors}</span>
      </div>

      {images.length > 0 && (
        <Tabs defaultValue="merged" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="merged" className="text-xs gap-1"><Layers className="h-3 w-3" />Merged</TabsTrigger>
            <TabsTrigger value="per-image" className="text-xs gap-1"><Palette className="h-3 w-3" />Per image</TabsTrigger>
            <TabsTrigger value="intelligence" className="text-xs gap-1"><Sparkles className="h-3 w-3" />Intelligence</TabsTrigger>
            <TabsTrigger value="harmonies" className="text-xs gap-1"><Wand2 className="h-3 w-3" />Harmonies</TabsTrigger>
          </TabsList>

          {/* MERGED TAB */}
          <TabsContent value="merged" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{images.length} image{images.length > 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="text-xs">{mergedColors.length} unique colors</Badge>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={clearAll} className="gap-1 h-7 text-xs">
                  <X className="h-3 w-3" />Clear
                </Button>
                <Button size="sm" onClick={() => requestIntegration(mergedColors.map(c => ({ hex: c.hex, name: c.name })))} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" />Add all
                </Button>
              </div>
            </div>

            {/* Merged palette strip */}
            <div className="flex rounded-lg overflow-hidden h-14 border">
              {mergedColors.map((c, i) => (
                <div
                  key={i}
                  className="relative group cursor-pointer transition-all hover:flex-[3]"
                  style={{ backgroundColor: c.hex, flex: c.percentage / 100 }}
                  onClick={() => requestIntegration([{ hex: c.hex, name: c.name }])}
                  title={`${c.name} · ${c.hex} · ${c.percentage}%`}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Plus className="h-4 w-4 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <AnimatePresence>
                {mergedColors.map((color, i) => (
                  <motion.div key={color.hex + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => requestIntegration([{ hex: color.hex, name: color.name }])}>
                      <div className="h-14 rounded-t-lg" style={{ backgroundColor: color.hex }} />
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate">{color.name}</p>
                        <div className="flex items-center justify-between">
                          <code className="text-[10px] font-mono text-muted-foreground">{color.hex}</code>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">{color.percentage}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* PER-IMAGE TAB */}
          <TabsContent value="per-image" className="space-y-4 mt-3">
            {images.map(img => (
              <div key={img.id} className="border rounded-lg p-3 space-y-2 bg-muted/10">
                <div className="flex gap-3 items-start">
                  <div className="relative">
                    <img
                      ref={el => { imgRefs.current[img.id] = el; }}
                      src={img.url}
                      alt={img.file.name}
                      className={cn(
                        'w-28 h-28 object-cover rounded-md border',
                        pickerActive === img.id && 'cursor-crosshair ring-2 ring-primary'
                      )}
                      onClick={(e) => handleImageClick(e, img.id)}
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-medium truncate">{img.file.name}</p>
                    {img.info && (
                      <p className="text-[10px] text-muted-foreground">
                        {img.info.width}×{img.info.height} · {img.info.aspectRatio} · {img.info.fileSize}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Button size="sm" variant={pickerActive === img.id ? 'default' : 'outline'} className="h-6 text-[10px] gap-1 px-2" onClick={() => setPickerActive(pickerActive === img.id ? null : img.id)}>
                        <Pipette className="h-3 w-3" />{pickerActive === img.id ? 'Picking...' : 'Pick color'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={() => requestIntegration(img.colors.map(c => ({ hex: c.hex, name: c.name })))}>
                        <Plus className="h-3 w-3" />Add all
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2 text-destructive" onClick={() => removeImage(img.id)}>
                        <X className="h-3 w-3" />Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex rounded overflow-hidden h-8 border">
                  {img.colors.map((c, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer hover:flex-[2] transition-all"
                      style={{ backgroundColor: c.hex, flex: c.percentage / 100 }}
                      onClick={() => requestIntegration([{ hex: c.hex, name: c.name }])}
                      title={`${c.name} · ${c.hex} · ${c.percentage}%`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20">
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Picked colors */}
            {pickedColors.length > 0 && (
              <div className="border rounded-lg p-3 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium flex items-center gap-1.5"><Pipette className="h-3 w-3" />Eyedropper samples ({pickedColors.length})</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setPickedColors([])}>Clear</Button>
                    <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => { requestIntegration(pickedColors); setPickedColors([]); }}>
                      <Plus className="h-3 w-3" />Add all
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pickedColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 border rounded px-2 py-1 bg-background">
                      <div className="w-4 h-4 rounded-sm border" style={{ backgroundColor: c.hex }} />
                      <code className="text-[10px] font-mono">{c.hex}</code>
                      <button onClick={() => setPickedColors(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* INTELLIGENCE TAB */}
          <TabsContent value="intelligence" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <IntelCard icon={<Thermometer className="h-4 w-4" />} title="Temperature" value={temperature.label.toUpperCase()} detail={`${temperature.score}% ${temperature.label} dominance`} />
              <IntelCard icon={<Leaf className="h-4 w-4" />} title="Season" value={season.season.toUpperCase()} detail={season.reason} />
              <IntelCard icon={<Sparkles className="h-4 w-4" />} title="Mood" value={mood.tags.slice(0, 2).join(' · ') || '—'} detail={mood.description} />
              <IntelCard icon={<Wand2 className="h-4 w-4" />} title="Harmony" value={harmony.type.replace('-', ' ').toUpperCase()} detail={harmony.description} />
            </div>
          </TabsContent>

          {/* HARMONIES TAB */}
          <TabsContent value="harmonies" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Pick a base color from your extracted palette to generate harmonies and variants:</p>
            {mergedColors.slice(0, 6).map((base) => (
              <HarmonyGenerator key={base.hex} base={base} onAdd={requestIntegration} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Integration modal */}
      {pendingIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setPendingIntegration(null)}>
          <Card className="max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Add to palette</h3>
                <p className="text-xs text-muted-foreground mt-1">How should {pendingIntegration.length} color{pendingIntegration.length > 1 ? 's' : ''} be added?</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {pendingIntegration.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded border" style={{ backgroundColor: c.hex }} title={c.hex} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1" onClick={() => confirmIntegration('append')}>
                  <Plus className="h-3 w-3" />Append
                </Button>
                <Button className="flex-1 gap-1" onClick={() => confirmIntegration('replace')}>
                  <Replace className="h-3 w-3" />Replace
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setPendingIntegration(null)}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function IntelCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase tracking-wide font-medium">{title}</span>
        </div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{detail}</p>
      </CardContent>
    </Card>
  );
}

function HarmonyGenerator({ base, onAdd }: { base: { hex: string; name: string }; onAdd: (colors: Array<{ hex: string; name: string }>) => void }) {
  const [expanded, setExpanded] = useState(false);

  const harmonies = useMemo(() => ({
    complementary: [generateComplementary(base.hex)],
    triadic: generateTriadic(base.hex),
    analogous: generateAnalogous(base.hex),
    splitComp: generateSplitComplementary(base.hex),
    tetradic: generateTetradic(base.hex),
    shades: generateShades(base.hex, 4),
    tints: generateTints(base.hex, 4),
    tones: generateTones(base.hex, 4),
  }), [base.hex]);

  const row = (label: string, hexes: string[], prefix: string) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex gap-0.5 flex-1 min-w-0">
        {[base.hex, ...hexes].map((h, i) => (
          <div
            key={i}
            className="flex-1 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform relative group"
            style={{ backgroundColor: h }}
            onClick={() => onAdd([{ hex: h, name: `${base.name} ${prefix} ${i}` }])}
            title={h}
          >
            {i === 0 && <div className="absolute inset-0 ring-1 ring-inset ring-foreground/20 rounded-sm pointer-events-none" />}
          </div>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => onAdd(hexes.map((h, i) => ({ hex: h, name: `${base.name} ${prefix} ${i + 1}` })))}>
        +All
      </Button>
    </div>
  );

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/10">
      <button className="flex items-center gap-2 w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded border shrink-0" style={{ backgroundColor: base.hex }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{base.name}</p>
          <code className="text-[10px] font-mono text-muted-foreground">{base.hex}</code>
        </div>
        <span className="text-[10px] text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="space-y-1.5 pt-2 border-t">
          {row('Complement', harmonies.complementary, 'comp')}
          {row('Analogous', harmonies.analogous, 'analog')}
          {row('Triadic', harmonies.triadic, 'triad')}
          {row('Split comp', harmonies.splitComp, 'split')}
          {row('Tetradic', harmonies.tetradic, 'tetra')}
          {row('Shades', harmonies.shades, 'shade')}
          {row('Tints', harmonies.tints, 'tint')}
          {row('Tones', harmonies.tones, 'tone')}
        </div>
      )}
    </div>
  );
}
