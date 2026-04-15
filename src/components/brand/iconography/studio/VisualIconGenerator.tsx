/**
 * VisualIconGenerator - Image-first icon generation with AI
 * 
 * Pipeline: AI generates pixel-perfect icon IMAGE → traces to clean SVG
 * Supports style reference images for consistency across sets.
 * 
 * UX Features:
 * - Animated progress bar with ETA
 * - 3 style variations per prompt
 * - Auto-suggest prompts from brand identity
 * - Scale-in reveal animation for results
 * - Persistent history (saved to guide_data)
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Lightbulb,
  Clock,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrandIconography } from '@/types/brand';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const VISUAL_STYLES = [
  { id: 'outlined', label: 'Outlined', desc: 'Clean stroke icons', raster: false },
  { id: 'filled', label: 'Filled', desc: 'Solid silhouettes', raster: false },
  { id: 'minimalist', label: 'Minimalist', desc: 'Ultra-thin lines', raster: false },
  { id: 'brutalist', label: 'Brutalist', desc: 'Sharp geometric', raster: false },
  { id: 'duotone', label: 'Duotone', desc: 'Two-tone accent', raster: false },
  { id: 'glassmorphic', label: 'Glassmorphic', desc: 'Layered depth', raster: false },
  { id: 'thick', label: 'Thick', desc: 'Bold weight', raster: false },
  { id: 'soft', label: 'Soft', desc: 'Rounded friendly', raster: false },
];

const RASTER_STYLES = [
  { id: 'isometric-3d', label: 'Isometric 3D', desc: 'Airbnb-style isometric', raster: true, emoji: '🧊' },
  { id: 'flat-illustration', label: 'Flat Illustration', desc: 'Bold flat colors', raster: true, emoji: '🎨' },
  { id: 'realistic-3d', label: 'Realistic 3D', desc: 'Photorealistic render', raster: true, emoji: '💎' },
  { id: 'clay-3d', label: 'Clay / Soft 3D', desc: 'Puffy clay style', raster: true, emoji: '🫧' },
];

const ALL_STYLES = [...VISUAL_STYLES, ...RASTER_STYLES];

// Variation suffixes to generate 3 different takes on the same prompt
const VARIATION_SUFFIXES = [
  '', // original
  ', alternative perspective, slightly different proportions',
  ', simplified version with bolder shapes',
];

interface VisualIconGeneratorProps {
  brandColors: Array<{ hex: string; name: string }>;
  onSaveIcon?: (icon: BrandIconography) => void;
  brandIdentity?: {
    archetype?: string;
    services?: Array<{ name: string }>;
    values?: Array<{ text: string }>;
    industry?: string;
    missionStatement?: string;
  };
  savedResults?: GeneratedResult[];
  onResultsChange?: (results: GeneratedResult[]) => void;
}

interface GeneratedResult {
  id: string;
  imageUrl: string;
  svg?: string;
  prompt: string;
  phase: 'image' | 'full' | 'raster';
  isRaster?: boolean;
  variationIndex?: number;
  createdAt?: string;
}

// Smart prompt suggestions based on brand identity
function generatePromptSuggestions(identity?: VisualIconGeneratorProps['brandIdentity']): string[] {
  const suggestions: string[] = [
    'A compass with a glowing north arrow',
    'A shield with a checkmark inside',
    'A lightbulb with radiating lines',
    'A handshake forming a heart shape',
  ];

  if (!identity) return suggestions;

  const custom: string[] = [];

  // Archetype-based suggestions
  if (identity.archetype) {
    const archetypeIcons: Record<string, string[]> = {
      'The Hero': ['A rising phoenix with spread wings', 'A mountain peak with a flag'],
      'The Sage': ['An open book with floating pages', 'An owl perched on a branch'],
      'The Explorer': ['A compass rose with intricate details', 'A telescope pointed at stars'],
      'The Creator': ['A paintbrush leaving a trail of color', 'A gear with creative sparks'],
      'The Caregiver': ['A pair of hands cradling a heart', 'A protective umbrella'],
      'The Ruler': ['A crown with precise geometric lines', 'A pillar with classical design'],
      'The Magician': ['A wand with orbiting particles', 'A transformation butterfly'],
      'The Rebel': ['A lightning bolt breaking through', 'A raised fist with flames'],
      'The Lover': ['An intertwined infinity heart', 'A rose with flowing petals'],
      'The Jester': ['A smiling star with bounce', 'A playful spinning top'],
      'The Everyman': ['A welcoming open door', 'A community circle of people'],
      'The Innocent': ['A dove carrying an olive branch', 'A sunrise over gentle hills'],
    };
    const match = Object.entries(archetypeIcons).find(([k]) => 
      identity.archetype?.toLowerCase().includes(k.toLowerCase().replace('The ', ''))
    );
    if (match) custom.push(...match[1]);
  }

  // Service-based suggestions
  if (identity.services?.length) {
    const serviceNames = identity.services.slice(0, 3).map(s => s.name).filter(Boolean);
    serviceNames.forEach(name => {
      custom.push(`An icon representing ${name.toLowerCase()}`);
    });
  }

  // Values-based suggestions
  if (identity.values?.length) {
    const valueTexts = identity.values.slice(0, 2).map(v => v.text).filter(Boolean);
    valueTexts.forEach(val => {
      custom.push(`A symbol embodying ${val.toLowerCase()}`);
    });
  }

  // Industry-based
  if (identity.industry) {
    custom.push(`A modern ${identity.industry.toLowerCase()} industry icon`);
  }

  return custom.length > 0 ? custom.slice(0, 6) : suggestions;
}

// Progress simulation for generating phase
function useProgressSimulation(isActive: boolean, estimatedMs: number) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setEta(0);
      return;
    }

    startTimeRef.current = Date.now();
    setProgress(0);
    setEta(Math.ceil(estimatedMs / 1000));

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      // Ease-out curve: fast at start, slows near 90%
      const rawProgress = Math.min(elapsed / estimatedMs, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 2);
      const clamped = Math.min(easedProgress * 95, 95); // Never hit 100 until done
      setProgress(clamped);

      const remaining = Math.max(0, Math.ceil((estimatedMs - elapsed) / 1000));
      setEta(remaining);
    }, 200);

    return () => clearInterval(interval);
  }, [isActive, estimatedMs]);

  const complete = useCallback(() => {
    setProgress(100);
    setEta(0);
  }, []);

  return { progress, eta, complete };
}

export const VisualIconGenerator = ({ 
  brandColors, 
  onSaveIcon, 
  brandIdentity,
  savedResults: initialResults,
  onResultsChange,
}: VisualIconGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('isometric-3d');
  const [strokeWidth, setStrokeWidth] = useState([2]);
  const [cornerStyle, setCornerStyle] = useState<'rounded' | 'sharp'>('rounded');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isRasterStyle = RASTER_STYLES.some(s => s.id === style);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>(initialResults || []);
  const [selectedResult, setSelectedResult] = useState<number | null>(
    initialResults?.length ? 0 : null
  );
  const [copied, setCopied] = useState(false);
  const [newResultIds, setNewResultIds] = useState<Set<string>>(new Set());
  const [enlargedView, setEnlargedView] = useState<'image' | 'svg' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist results when they change
  useEffect(() => {
    if (onResultsChange && results.length > 0) {
      // Strip large base64 imageUrls for persistence - only keep storage URLs
      const persistable = results.map(r => ({
        ...r,
        imageUrl: r.imageUrl.startsWith('data:') ? '' : r.imageUrl,
      })).filter(r => r.imageUrl || r.svg);
      onResultsChange(persistable);
    }
  }, [results, onResultsChange]);

  const promptSuggestions = useMemo(
    () => generatePromptSuggestions(brandIdentity),
    [brandIdentity]
  );

  // Progress simulation
  const { progress: genProgress, eta: genEta, complete: completeProgress } = 
    useProgressSimulation(isGenerating, 25000); // ~25s estimated

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

  const withTimeout = useCallback(async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }, []);

  const traceImageToSvg = useCallback(async ({
    imageUrl,
    styleValue,
    strokeWidthValue,
    cornerStyleValue,
    brandColorsValue,
  }: {
    imageUrl: string;
    styleValue: string;
    strokeWidthValue: number;
    cornerStyleValue: 'rounded' | 'sharp';
    brandColorsValue: Array<{ hex: string; name: string }>;
  }) => {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('generate-icon-visual', {
        body: {
          phase: 'trace',
          generatedImage: imageUrl,
          style: styleValue,
          strokeWidth: strokeWidthValue,
          cornerStyle: cornerStyleValue,
          brandColors: brandColorsValue,
        },
      }),
      45000,
      'Tracing timed out. You can retry with "Trace to SVG".'
    );

    if (error) throw new Error(error.message);
    return data?.svg as string | undefined;
  }, [withTimeout]);

  const generate = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error('Enter an icon description');
      return;
    }

    const styleValue = style;
    const strokeWidthValue = strokeWidth[0];
    const cornerStyleValue = cornerStyle;
    const brandColorsValue = [...brandColors];

    setIsGenerating(true);
    const generatedIds: string[] = [];

    try {
      // Generate 3 variations in parallel
      const variationPromises = VARIATION_SUFFIXES.map(async (suffix, varIndex) => {
        const varPrompt = trimmedPrompt + suffix;
        
        const { data: imgData, error: imgError } = await withTimeout(
          supabase.functions.invoke('generate-icon-visual', {
            body: {
              prompt: varPrompt,
              style: styleValue,
              strokeWidth: strokeWidthValue,
              cornerStyle: cornerStyleValue,
              brandColors: brandColorsValue,
              referenceImage: varIndex === 0 ? referenceImage : undefined,
              phase: 'image',
            },
          }),
          90000,
          'Image generation timed out. Please try again.'
        );

        if (imgError) throw new Error(imgError.message);
        if (!imgData?.imageUrl) throw new Error('No image returned');

        return {
          imageUrl: imgData.imageUrl,
          varIndex,
        };
      });

      // Wait for all variations (at least the first one)
      const settledResults = await Promise.allSettled(variationPromises);
      const successfulResults = settledResults
        .filter((r): r is PromiseFulfilledResult<{ imageUrl: string; varIndex: number }> => 
          r.status === 'fulfilled'
        )
        .map(r => r.value);

      if (successfulResults.length === 0) {
        throw new Error('All variations failed to generate');
      }

      completeProgress();

      const newResults: GeneratedResult[] = successfulResults.map(sr => {
        const resultId = crypto.randomUUID();
        generatedIds.push(resultId);
        return {
          id: resultId,
          imageUrl: sr.imageUrl,
          prompt: trimmedPrompt,
          phase: 'image' as const,
          variationIndex: sr.varIndex,
          createdAt: new Date().toISOString(),
        };
      });

      setNewResultIds(new Set(newResults.map(r => r.id)));
      setResults(prev => [...newResults, ...prev]);
      setSelectedResult(0);

      const count = newResults.length;
      toast.success(`${count} variation${count > 1 ? 's' : ''} generated! Tracing to SVG...`);

      // Clear animation flags after animation completes
      setTimeout(() => setNewResultIds(new Set()), 800);

      // Phase 2: Auto-trace all in background
      void (async () => {
        setIsTracing(true);
        let tracedCount = 0;
        
        for (const nr of newResults) {
          try {
            const svg = await traceImageToSvg({
              imageUrl: nr.imageUrl,
              styleValue,
              strokeWidthValue,
              cornerStyleValue,
              brandColorsValue,
            });

            if (svg) {
              setResults(prev =>
                prev.map(r => (r.id === nr.id ? { ...r, svg, phase: 'full' } : r))
              );
              tracedCount++;
            }
          } catch (traceErr) {
            console.warn('Auto-trace skipped for variation:', traceErr);
          }
        }

        if (tracedCount > 0) {
          toast.success(`${tracedCount} SVG${tracedCount > 1 ? 's' : ''} traced successfully!`);
        } else {
          toast.info('Images ready — click "Trace to SVG" to vectorize.');
        }
        setIsTracing(false);
      })();
    } catch (err: any) {
      console.error('Visual generation error:', err);
      toast.error(err?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, strokeWidth, cornerStyle, brandColors, referenceImage, traceImageToSvg, withTimeout, completeProgress]);

  const retrace = useCallback(async (index: number) => {
    const result = results[index];
    if (!result?.imageUrl) return;

    setIsTracing(true);
    try {
      const svg = await traceImageToSvg({
        imageUrl: result.imageUrl,
        styleValue: style,
        strokeWidthValue: strokeWidth[0],
        cornerStyleValue: cornerStyle,
        brandColorsValue: brandColors,
      });

      if (!svg) throw new Error('No SVG returned from trace');

      setResults(prev => prev.map((r, i) => (i === index ? { ...r, svg, phase: 'full' } : r)));
      toast.success('SVG traced successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Trace failed');
    } finally {
      setIsTracing(false);
    }
  }, [results, style, strokeWidth, cornerStyle, brandColors, traceImageToSvg]);

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
            AI generates 3 variations, then traces each to clean SVG
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-[10px]">Image → SVG</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Icon Description</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-primary"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <Lightbulb className="h-3 w-3" />
                {showSuggestions ? 'Hide ideas' : 'Suggest ideas'}
              </Button>
            </div>

            {/* Smart Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 mb-2">
                    {promptSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setPrompt(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="text-[10px] px-2 py-1 rounded-full border border-primary/20 bg-background text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                    {brandIdentity?.archetype && (
                      <p className="w-full text-[9px] text-muted-foreground mt-1">
                        ✨ Tailored to your <span className="font-medium text-primary">{brandIdentity.archetype}</span> archetype
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
            <Label className="text-xs font-medium">3D / Raster Styles</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {RASTER_STYLES.map(s => (
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
                  <span className="block text-sm mb-0.5">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <Label className="text-xs font-medium mt-3">Vector Styles</Label>
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

          {/* Generate Button + Progress */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={generate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating 3 variations...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate 3 Variations
                </>
              )}
            </Button>

            {/* Animated Progress Bar */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <Progress value={genProgress} className="h-1.5" />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {genEta > 0 ? `~${genEta}s remaining` : 'Finishing up...'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round(genProgress)}%
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Image Preview with scale-in animation */}
              <motion.div
                key={selected.id}
                initial={newResultIds.has(selected.id) ? { scale: 0.85, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="p-1 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">AI Preview</span>
                    {selected.variationIndex !== undefined && (
                      <Badge variant="outline" className="text-[9px] ml-1">
                        Var {selected.variationIndex + 1}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={selected.phase === 'full' ? 'default' : 'secondary'} className="text-[9px]">
                    {selected.phase === 'full' ? '✓ SVG Ready' : isTracing ? 'Tracing SVG…' : 'Image Only'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 divide-x">
                  {/* Generated Image */}
                  <div className="p-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Generated Image</p>
                    <button
                      onClick={() => setEnlargedView('image')}
                      className="group relative w-24 h-24 rounded-lg border bg-white flex items-center justify-center p-2 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                    >
                      <img src={selected.imageUrl} alt="Generated icon" className="max-w-full max-h-full object-contain" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 rounded-lg transition-colors flex items-center justify-center">
                        <Maximize2 className="h-4 w-4 text-foreground/0 group-hover:text-foreground/60 transition-colors" />
                      </div>
                    </button>
                  </div>
                  {/* SVG Result */}
                  <div className="p-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-muted-foreground font-medium">Traced SVG</p>
                    <button
                      onClick={() => selected.svg && setEnlargedView('svg')}
                      className={cn(
                        "group relative w-24 h-24 rounded-lg border bg-card flex items-center justify-center p-2 transition-all",
                        selected.svg ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"
                      )}
                    >
                      {selected.svg ? (
                        <>
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(selected.svg, {
                                USE_PROFILES: { svg: true, svgFilters: true },
                                FORBID_TAGS: ['script', 'foreignObject'],
                              }),
                            }}
                          />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 rounded-lg transition-colors flex items-center justify-center">
                            <Maximize2 className="h-4 w-4 text-foreground/0 group-hover:text-foreground/60 transition-colors" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          {isTracing ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50 mx-auto mb-1" /> : <ArrowRight className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />}
                          <p className="text-[9px] text-muted-foreground">{isTracing ? 'Tracing in progress' : 'Pending trace'}</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enlarged Preview Dialog */}
                {enlargedView && (
                  <Dialog open={!!enlargedView} onOpenChange={() => setEnlargedView(null)}>
                    <DialogContent className="max-w-lg p-0 overflow-hidden">
                      <div className="p-3 border-b flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {enlargedView === 'image' ? 'Generated Image' : 'Traced SVG'} — {selected.prompt.slice(0, 40)}{selected.prompt.length > 40 ? '…' : ''}
                        </p>
                      </div>
                      <div className="p-6 flex items-center justify-center min-h-[300px] bg-muted/20">
                        {enlargedView === 'image' ? (
                          <img
                            src={selected.imageUrl}
                            alt="Generated icon enlarged"
                            className="max-w-full max-h-[60vh] object-contain rounded-lg"
                          />
                        ) : selected.svg ? (
                          <div
                            className="w-64 h-64 [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(selected.svg, {
                                USE_PROFILES: { svg: true, svgFilters: true },
                                FORBID_TAGS: ['script', 'foreignObject'],
                              }),
                            }}
                          />
                        ) : null}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </motion.div>

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
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[220px]">
                Visual mode creates 3 variations, then converts each to SVG
              </p>
              {promptSuggestions.length > 0 && !prompt && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-1.5 text-xs text-primary"
                  onClick={() => setShowSuggestions(true)}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Get prompt ideas
                </Button>
              )}
            </div>
          )}

          {/* History with variation grouping */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">History ({results.length})</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {results.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={newResultIds.has(r.id) ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: (r.variationIndex || 0) * 0.1 }}
                    onClick={() => setSelectedResult(i)}
                    className={cn(
                      'shrink-0 w-14 h-14 rounded-lg border overflow-hidden bg-white transition-all relative',
                      selectedResult === i ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                    )}
                  >
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.prompt} className="w-full h-full object-contain p-1" />
                    ) : r.svg ? (
                      <div
                        className="w-full h-full p-1 [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(r.svg, {
                            USE_PROFILES: { svg: true, svgFilters: true },
                            FORBID_TAGS: ['script', 'foreignObject'],
                          }),
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {r.phase === 'full' && (
                      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
