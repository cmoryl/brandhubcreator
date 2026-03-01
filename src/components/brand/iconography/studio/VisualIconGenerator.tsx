/**
 * VisualIconGenerator - Image-first icon generation with AI
 * 
 * Pipeline: AI generates pixel-perfect icon IMAGE → traces to clean SVG
 * Supports style reference images for consistency across sets.
 */

import { useState, useCallback, useRef } from 'react';
import {
  ImageIcon,
  Wand2,
  Loader2,
  Check,
  Download,
  Copy,
  RefreshCw,
  Upload,
  X,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrandIconography } from '@/types/brand';
import DOMPurify from 'dompurify';

const VISUAL_STYLES = [
  { id: 'outlined', label: 'Outlined', desc: 'Clean stroke icons' },
  { id: 'filled', label: 'Filled', desc: 'Solid silhouettes' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Ultra-thin lines' },
  { id: 'brutalist', label: 'Brutalist', desc: 'Sharp geometric' },
  { id: 'duotone', label: 'Duotone', desc: 'Two-tone accent' },
  { id: 'glassmorphic', label: 'Glassmorphic', desc: 'Layered depth' },
  { id: 'thick', label: 'Thick', desc: 'Bold weight' },
  { id: 'soft', label: 'Soft', desc: 'Rounded friendly' },
];

interface VisualIconGeneratorProps {
  brandColors: Array<{ hex: string; name: string }>;
  onSaveIcon?: (icon: BrandIconography) => void;
}

interface GeneratedResult {
  imageUrl: string;
  svg?: string;
  prompt: string;
  phase: 'image' | 'full';
}

export const VisualIconGenerator = ({ brandColors, onSaveIcon }: VisualIconGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('outlined');
  const [strokeWidth, setStrokeWidth] = useState([2]);
  const [cornerStyle, setCornerStyle] = useState<'rounded' | 'sharp'>('rounded');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setReferenceFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const generate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Enter an icon description');
      return;
    }

    setIsGenerating(true);
    try {
      // Phase 1: Generate image only (fast, avoids timeout)
      const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-icon-visual', {
        body: {
          prompt: prompt.trim(),
          style,
          strokeWidth: strokeWidth[0],
          cornerStyle,
          brandColors,
          referenceImage,
          phase: 'image',
        },
      });

      if (imgError) throw new Error(imgError.message);
      if (!imgData?.imageUrl) throw new Error('No image returned');

      const imageUrl = imgData.imageUrl;

      // Phase 2: Trace to SVG separately (avoids single-request timeout)
      let svg: string | undefined;
      try {
        const { data: traceData, error: traceError } = await supabase.functions.invoke('generate-icon-visual', {
          body: {
            phase: 'trace',
            generatedImage: imageUrl,
            style,
            strokeWidth: strokeWidth[0],
            cornerStyle,
            brandColors,
          },
        });
        if (!traceError && traceData?.svg) {
          svg = traceData.svg;
        }
      } catch (traceErr) {
        console.warn('Auto-trace failed, image still available:', traceErr);
      }

      const result: GeneratedResult = {
        imageUrl,
        svg,
        prompt: prompt.trim(),
        phase: svg ? 'full' : 'image',
      };
      setResults(prev => [result, ...prev]);
      setSelectedResult(0);
      toast.success(svg ? 'Icon generated & traced to SVG!' : 'Icon image generated — click "Trace to SVG" to vectorize');
    } catch (err: any) {
      console.error('Visual generation error:', err);
      toast.error(err?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, strokeWidth, cornerStyle, brandColors, referenceImage]);

  const retrace = useCallback(async (index: number) => {
    const result = results[index];
    if (!result?.imageUrl) return;

    setIsTracing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-icon-visual', {
        body: {
          phase: 'trace',
          generatedImage: result.imageUrl,
          style,
          strokeWidth: strokeWidth[0],
          cornerStyle,
          brandColors,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.svg) {
        setResults(prev => prev.map((r, i) => i === index ? { ...r, svg: data.svg, phase: 'full' } : r));
        toast.success('SVG traced successfully!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Trace failed');
    } finally {
      setIsTracing(false);
    }
  }, [results, style, strokeWidth, cornerStyle, brandColors]);

  const handleAddToLibrary = useCallback((index: number) => {
    const result = results[index];
    if (!result?.svg || !onSaveIcon) return;

    const icon: BrandIconography = {
      id: `visual-${Date.now()}`,
      name: result.prompt.slice(0, 50).replace(/\b\w/g, l => l.toUpperCase()),
      svgPath: result.svg,
      category: 'AI Visual',
      fillMode: style === 'filled' ? 'fill' : 'stroke',
      viewBox: '0 0 24 24',
    };
    onSaveIcon(icon);
    toast.success('Icon added to library');
  }, [results, onSaveIcon, style]);

  const handleCopySvg = useCallback((svg: string) => {
    navigator.clipboard.writeText(svg);
    setCopied(true);
    toast.success('SVG copied');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const selected = selectedResult !== null ? results[selectedResult] : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">Visual Icon Generator</h4>
          <p className="text-xs text-muted-foreground">
            AI generates a pixel-perfect preview, then traces to clean SVG
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-[10px]">Image → SVG</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Icon Description</Label>
            <Textarea
              placeholder="e.g. A compass with a glowing north arrow, navigation theme..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Visual Style</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {VISUAL_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    'px-2 py-1.5 rounded-md border text-center transition-all text-[10px]',
                    style === s.id
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'border-border hover:bg-muted text-muted-foreground'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke & Corners */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Stroke Width</Label>
              <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={0.5} max={4} step={0.25} />
              <p className="text-[10px] text-muted-foreground text-center">{strokeWidth[0]}px</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Corners</Label>
              <Select value={cornerStyle} onValueChange={(v: 'rounded' | 'sharp') => setCornerStyle(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="sharp">Sharp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style Reference */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Style Reference (Optional)</Label>
            <p className="text-[10px] text-muted-foreground">Upload an existing icon to generate new ones in the same visual style</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
            {referenceImage ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                <img src={referenceImage} alt="Reference" className="w-10 h-10 rounded border object-contain bg-background" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{referenceFileName}</p>
                  <p className="text-[10px] text-muted-foreground">Style reference active</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setReferenceImage(null); setReferenceFileName(''); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                Upload Reference Icon
              </Button>
            )}
          </div>

          <Separator />

          {/* Generate */}
          <Button
            className="w-full gap-2"
            onClick={generate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating visual...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Visual Icon
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Image Preview */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-1 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">AI Preview</span>
                  </div>
                  <Badge variant={selected.phase === 'full' ? 'default' : 'secondary'} className="text-[9px]">
                    {selected.phase === 'full' ? '✓ SVG Ready' : 'Image Only'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 divide-x">
                  {/* Generated Image */}
                  <div className="p-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Generated Image</p>
                    <div className="w-24 h-24 rounded-lg border bg-white flex items-center justify-center p-2">
                      <img src={selected.imageUrl} alt="Generated icon" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                  {/* SVG Result */}
                  <div className="p-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Traced SVG</p>
                    <div className="w-24 h-24 rounded-lg border bg-card flex items-center justify-center p-2">
                      {selected.svg ? (
                        <div
                          className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(selected.svg, {
                              USE_PROFILES: { svg: true, svgFilters: true },
                              FORBID_TAGS: ['script', 'foreignObject'],
                            }),
                          }}
                        />
                      ) : (
                        <div className="text-center">
                          <ArrowRight className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground">Pending trace</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!selected.svg && (
                  <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={() => retrace(selectedResult!)} disabled={isTracing}>
                    {isTracing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Trace to SVG
                  </Button>
                )}
                {selected.svg && (
                  <>
                    <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={() => handleAddToLibrary(selectedResult!)}>
                      <Wand2 className="h-3.5 w-3.5" />
                      Add to Library
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleCopySvg(selected.svg!)}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy SVG
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => retrace(selectedResult!)} disabled={isTracing}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-trace
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-7 w-7 text-primary/50" />
              </div>
              <p className="text-sm text-muted-foreground">Generated icons will appear here</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                Visual mode creates an image first for better quality, then converts to SVG
              </p>
            </div>
          )}

          {/* History */}
          {results.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">History ({results.length})</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedResult(i)}
                    className={cn(
                      'shrink-0 w-14 h-14 rounded-lg border overflow-hidden bg-white transition-all',
                      selectedResult === i ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                    )}
                  >
                    <img src={r.imageUrl} alt={r.prompt} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
