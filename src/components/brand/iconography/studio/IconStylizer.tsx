/**
 * IconStylizer - Upload & Convert: Image to Brand-Ready SVG Icon
 * 
 * Supports:
 * - Single & batch image upload (PNG, JPG, WebP) with AI conversion to SVG
 * - Direct SVG file upload (single or batch) — added to library immediately
 * - Drag-and-drop for all supported file types
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Loader2,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Copy,
  ChevronLeft,
  X,
  FileUp,
  Files,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sanitizeSvg, extractViewBox, detectFillMode, cleanSvg, validateSvg } from '@/lib/svgUtils';
import { useStylizer, StylizerOptions } from '@/hooks/useStylizer';
import { BrandIconography } from '@/types/brand';
import DOMPurify from 'dompurify';

interface IconStylizerProps {
  brandColors: string[];
  onIconCreated: (icon: BrandIconography) => void;
}

type StylizerStage = 'upload' | 'adjust' | 'review';

export const IconStylizer = ({
  brandColors,
  onIconCreated,
}: IconStylizerProps) => {
  const [stage, setStage] = useState<StylizerStage>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastImportedSvgs, setLastImportedSvgs] = useState<BrandIconography[]>([]);
  const pendingImportsRef = useRef<BrandIconography[]>([]);

  // Batch raster queue
  const [rasterQueue, setRasterQueue] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchResults, setBatchResults] = useState<BrandIconography[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<StylizerOptions>({
    removeBackground: true,
    edgeSharpening: 0.7,
    simplifyThreshold: 0.5,
    maxAnchorPoints: 50,
    snapToGrid: true,
    strokeWidth: 2,
    cornerRadius: 4,
    fillMode: 'auto',
    preserveHoles: true,
  });

  const {
    isProcessing,
    progress,
    currentStage,
    result,
    error,
    processImage,
    triggerSimplification,
    reset,
  } = useStylizer(brandColors);

  // ── File Classification ──
  const isSvgFile = (file: File) =>
    file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

  const isRasterFile = (file: File) =>
    file.type.startsWith('image/') && !isSvgFile(file);

  // ── Direct SVG Import ──
  const importSvgFiles = useCallback(async (files: File[]) => {
    const icons: BrandIconography[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const sanitized = sanitizeSvg(text);
        if (sanitized.includes('<svg') || sanitized.includes('<path')) {
          const cleaned = cleanSvg(sanitized, file.name.replace(/\.svg$/i, '').replace(/[-_]/g, ' '));
          const viewBox = extractViewBox(cleaned);
          const fillMode = detectFillMode(cleaned);
          icons.push({
            id: `svg-upload-${Date.now()}-${icons.length}`,
            name: file.name.replace(/\.svg$/i, '').replace(/[-_]/g, ' '),
            svgPath: cleaned,
            category: 'Custom / Uploaded',
            viewBox,
            fillMode: fillMode === 'auto' ? 'fill' : fillMode,
          });
        }
      } catch {
        console.warn('Failed to read SVG file:', file.name);
      }
    }
    if (icons.length > 0) {
      // Store pending imports — don't call onIconCreated yet to avoid parent re-render resetting our state
      pendingImportsRef.current = icons;
      setLastImportedSvgs(icons);
      setStage('upload');
      toast.success(`Added ${icons.length} SVG icon${icons.length > 1 ? 's' : ''} to library`);
    } else {
      toast.error('No valid SVG files found');
    }
  }, []);

  // ── Handle Files (mixed SVG + raster) ──
  const handleFiles = useCallback(async (files: File[]) => {
    const svgFiles = files.filter(isSvgFile);
    const rasterFiles = files.filter(isRasterFile);

    // Import SVGs directly
    if (svgFiles.length > 0) {
      await importSvgFiles(svgFiles);
    }

    // Queue raster files for conversion
    if (rasterFiles.length === 1 && svgFiles.length === 0) {
      // Single raster → existing flow
      const file = rasterFiles[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRasterQueue([]);
      reset();
      setStage('adjust');
    } else if (rasterFiles.length > 1) {
      // Batch raster → queue mode
      const queue = rasterFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setRasterQueue(queue);
      setCurrentBatchIndex(0);
      setBatchResults([]);
      // Start with the first one
      setSelectedFile(queue[0].file);
      setPreviewUrl(queue[0].previewUrl);
      reset();
      setStage('adjust');
      toast.info(`${rasterFiles.length} images queued for conversion`);
    } else if (svgFiles.length === 0 && rasterFiles.length === 0) {
      toast.error('No supported image files found (PNG, JPG, WebP, SVG)');
    }
  }, [importSvgFiles, reset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.svg'));
    if (files.length > 0) {
      handleFiles(files);
    } else {
      toast.error('Please drop valid image files (PNG, JPG, WebP, SVG)');
    }
  }, [handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    await processImage(selectedFile, options);
    setStage('review');
  };

  const handleSaveIcon = () => {
    if (!result?.svg || !selectedFile) return;
    const icon: BrandIconography = {
      id: `stylized-${Date.now()}`,
      name: selectedFile.name.replace(/\.[^/.]+$/, ''),
      svgPath: result.svg,
      category: 'Custom / Stylized',
      viewBox: '0 0 24 24',
      fillMode: options.fillMode === 'fill' ? 'fill' : 'stroke',
    };
    onIconCreated(icon);
    toast.success('Icon added to library');

    // If batch, advance to next
    if (rasterQueue.length > 1) {
      const nextIndex = currentBatchIndex + 1;
      if (nextIndex < rasterQueue.length) {
        setBatchResults(prev => [...prev, icon]);
        setCurrentBatchIndex(nextIndex);
        setSelectedFile(rasterQueue[nextIndex].file);
        setPreviewUrl(rasterQueue[nextIndex].previewUrl);
        reset();
        setStage('adjust');
        toast.info(`Processing ${nextIndex + 1} of ${rasterQueue.length}`);
      } else {
        // Batch complete
        setBatchResults(prev => [...prev, icon]);
        toast.success(`Batch complete! ${nextIndex + 1} icons added.`);
        handleStartOver();
      }
    }
  };

  const handleCopySvg = () => {
    if (result?.svg) {
      navigator.clipboard.writeText(result.svg);
      toast.success('SVG copied to clipboard');
    }
  };

  const handleStartOver = () => {
    setStage('upload');
    setPreviewUrl(null);
    setSelectedFile(null);
    setRasterQueue([]);
    setCurrentBatchIndex(0);
    setBatchResults([]);
    reset();
  };

  const renderSvg = (svg: string, size: number = 64) => {
    const sanitized = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
    });
    return (
      <div
        className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Mini stepper for substages
  const stages: { id: StylizerStage; label: string; num: number }[] = [
    { id: 'upload', label: 'Upload', num: 1 },
    { id: 'adjust', label: 'Convert', num: 2 },
    { id: 'review', label: 'Review', num: 3 },
  ];

  const stageIndex = stages.findIndex(s => s.id === stage);
  const isBatchMode = rasterQueue.length > 1;

  return (
    <div className="space-y-6">
      {/* Header with mini-stepper */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Upload & Convert
          </h3>
          <p className="text-sm text-muted-foreground">
            Turn any image into a brand-ready SVG icon — or upload SVGs directly
          </p>
        </div>

        {/* Mini sub-stepper */}
        <div className="flex items-center gap-1 shrink-0">
          {isBatchMode && (
            <Badge variant="secondary" className="mr-2 text-[10px]">
              <Files className="h-3 w-3 mr-1" />
              {currentBatchIndex + 1}/{rasterQueue.length}
            </Badge>
          )}
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  i < stageIndex && 'bg-primary text-primary-foreground',
                  i === stageIndex && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  i > stageIndex && 'bg-muted text-muted-foreground'
                )}
              >
                {i < stageIndex ? <Check className="h-3 w-3" /> : s.num}
              </div>
              {i < stages.length - 1 && (
                <div className={cn('w-6 h-0.5 rounded-full', i < stageIndex ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ──────── Stage 1: Upload ──────── */}
      {stage === 'upload' && lastImportedSvgs.length > 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-medium">
                {lastImportedSvgs.length} SVG{lastImportedSvgs.length > 1 ? 's' : ''} added to library
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your icons have been imported and are ready to use.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-md mx-auto">
              {lastImportedSvgs.slice(0, 12).map((icon, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-lg border bg-muted/30 flex items-center justify-center p-1.5"
                >
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: icon.svgPath }}
                  />
                </div>
              ))}
              {lastImportedSvgs.length > 12 && (
                <Badge variant="secondary" className="text-xs">+{lastImportedSvgs.length - 12} more</Badge>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setLastImportedSvgs([])}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload More
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : stage === 'upload' && (
        <Card className="border-dashed border-2">
          <CardContent className="p-0">
            <div
              className={cn(
                'p-12 transition-all cursor-pointer text-center',
                dragOver && 'bg-primary/5 border-primary'
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-medium">Drop your images here</p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, WebP, or SVG — select multiple files for batch upload
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  Browse files
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileUp className="h-3 w-3" />
                  SVGs added directly
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Rasters converted to SVG
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────── Stage 2: Adjust & Convert ──────── */}
      {stage === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Source preview (left) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Source Image</Label>
                {previewUrl && (
                  <div className="rounded-lg border bg-muted/30 flex items-center justify-center p-4 min-h-[180px]">
                    <img src={previewUrl} alt="Source" className="max-w-full max-h-40 object-contain rounded" />
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground truncate">{selectedFile?.name}</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleStartOver}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Batch queue preview */}
            {isBatchMode && (
              <Card>
                <CardContent className="p-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Batch Queue ({currentBatchIndex + 1} of {rasterQueue.length})
                  </Label>
                  <div className="flex gap-1.5 flex-wrap max-h-[100px] overflow-y-auto">
                    {rasterQueue.map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-10 h-10 rounded border overflow-hidden flex-shrink-0',
                          idx === currentBatchIndex && 'ring-2 ring-primary',
                          idx < currentBatchIndex && 'opacity-40'
                        )}
                      >
                        <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Settings */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="text-xs font-medium">Conversion Settings</Label>

                {/* Complexity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Detail Level</span>
                    <span className="text-muted-foreground">
                      {options.simplifyThreshold < 0.3 ? 'High detail' : options.simplifyThreshold < 0.7 ? 'Balanced' : 'Simplified'}
                    </span>
                  </div>
                  <Slider
                    value={[options.simplifyThreshold]}
                    onValueChange={([v]) => setOptions(o => ({ ...o, simplifyThreshold: v }))}
                    min={0} max={1} step={0.1}
                    disabled={isProcessing}
                  />
                </div>

                {/* Stroke Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Stroke Width</span>
                    <span className="text-muted-foreground">{options.strokeWidth}px</span>
                  </div>
                  <Slider
                    value={[options.strokeWidth]}
                    onValueChange={([v]) => setOptions(o => ({ ...o, strokeWidth: v }))}
                    min={1} max={4} step={0.25}
                    disabled={isProcessing}
                  />
                </div>

                {/* Fill Mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Style</Label>
                  <Tabs
                    value={options.fillMode}
                    onValueChange={(v) => setOptions(o => ({ ...o, fillMode: v as 'stroke' | 'fill' | 'auto' }))}
                  >
                    <TabsList className="h-8 w-full">
                      <TabsTrigger value="auto" className="flex-1 text-xs">Auto</TabsTrigger>
                      <TabsTrigger value="stroke" className="flex-1 text-xs">Outline</TabsTrigger>
                      <TabsTrigger value="fill" className="flex-1 text-xs">Solid</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Convert action + result preview (right) */}
          <div className="lg:col-span-3 space-y-4">
            {!result && !isProcessing && (
              <Card className="min-h-[300px] flex flex-col items-center justify-center">
                <CardContent className="text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-medium mb-1">Ready to convert</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Adjust settings on the left, then convert your image to a clean SVG icon.
                  </p>
                  <Button onClick={handleProcess} size="lg" className="gap-2 px-8">
                    <Sparkles className="h-4 w-4" />
                    Convert to SVG
                  </Button>
                </CardContent>
              </Card>
            )}

            {isProcessing && (
              <Card className="min-h-[300px] flex flex-col items-center justify-center">
                <CardContent className="text-center p-8 w-full max-w-xs">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="font-medium mb-2">Converting...</p>
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{currentStage}</p>
                </CardContent>
              </Card>
            )}

            {result && !isProcessing && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* SVG Preview */}
                  <div className="rounded-lg border bg-muted/30 flex items-center justify-center p-6 min-h-[200px] relative">
                    <div className="absolute inset-0 bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg opacity-50" />
                    <div className="relative">{renderSvg(result.svg, 120)}</div>
                  </div>

                  {/* Multi-size preview */}
                  <div className="flex items-center justify-center gap-4 py-2">
                    {[16, 24, 32, 48, 64].map(size => (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <div className="border rounded p-1 bg-background">
                          {renderSvg(result.svg, size)}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{size}px</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleProcess}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Re-convert
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => setStage('review')}>
                      Review & Save <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────── Stage 3: Review & Save ──────── */}
      {stage === 'review' && result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Final preview */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[350px]">
              <div className="rounded-xl border-2 border-dashed border-border p-8 bg-muted/20 relative mb-4">
                <div className="absolute inset-0 bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-xl opacity-40" />
                <div className="relative">{renderSvg(result.svg, 128)}</div>
              </div>
              <p className="text-sm font-medium">{selectedFile?.name?.replace(/\.[^/.]+$/, '')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Processed in {(result.processingTime / 1000).toFixed(1)}s
              </p>
            </CardContent>
          </Card>

          {/* Score + actions */}
          <div className="space-y-4">
            {/* Conversion Score */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quality Score</span>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-sm font-bold',
                    getScoreBg(result.conversionScore.overall),
                    getScoreColor(result.conversionScore.overall)
                  )}>
                    {result.conversionScore.overall}/100
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <div className="text-muted-foreground mb-0.5">Fidelity</div>
                    <div className={cn('font-medium', getScoreColor(result.conversionScore.fidelityScore))}>
                      {result.conversionScore.fidelityScore}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <div className="text-muted-foreground mb-0.5">Nodes</div>
                    <div className={cn('font-medium', getScoreColor(result.conversionScore.nodeScore))}>
                      {result.conversionScore.nodeCount}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <div className="text-muted-foreground mb-0.5">Grid Fit</div>
                    <div className={cn('font-medium', getScoreColor(result.conversionScore.gridCompatibility))}>
                      {result.conversionScore.gridCompatibility}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <Badge
                    variant={result.conversionScore.status === 'excellent' || result.conversionScore.status === 'good' ? 'default' : 'secondary'}
                    className={cn(
                      result.conversionScore.status === 'excellent' && 'bg-green-600',
                      result.conversionScore.status === 'good' && 'bg-blue-600',
                      result.conversionScore.status === 'acceptable' && 'bg-amber-500',
                      result.conversionScore.status === 'needs-work' && 'bg-red-500'
                    )}
                  >
                    {result.conversionScore.status === 'excellent' && <Check className="h-3 w-3 mr-1" />}
                    {result.conversionScore.status === 'needs-work' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {result.conversionScore.status.charAt(0).toUpperCase() + result.conversionScore.status.slice(1).replace('-', ' ')}
                  </Badge>
                </div>

                {/* Validation */}
                {result.shadowValidation && (
                  <div className={cn(
                    'p-2.5 rounded-lg text-xs',
                    result.shadowValidation.isValid
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                  )}>
                    <div className="flex items-center gap-2">
                      {result.shadowValidation.isValid ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      <span className="font-medium">
                        {result.shadowValidation.isValid
                          ? result.shadowValidation.autoFixed
                            ? `Auto-fixed in ${result.shadowValidation.simplificationPasses} pass(es)`
                            : 'Passed validation'
                          : 'Needs attention'}
                      </span>
                    </div>
                    {result.shadowValidation.issues.length > 0 && (
                      <ul className="mt-1 pl-5 list-disc space-y-0.5 opacity-80">
                        {result.shadowValidation.issues.slice(0, 3).map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                    {!result.shadowValidation.isValid && result.shadowValidation.simplificationPasses < 3 && (
                      <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs w-full" onClick={triggerSimplification} disabled={isProcessing}>
                        <RotateCcw className={cn("h-3 w-3 mr-1", isProcessing && "animate-spin")} />
                        Run Simplification Pass
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStage('adjust')} className="gap-1">
                <ChevronLeft className="h-3 w-3" /> Back
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopySvg}>
                <Copy className="h-3 w-3 mr-1" /> Copy SVG
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSaveIcon}>
                <Check className="h-3 w-3 mr-1" />
                {isBatchMode
                  ? currentBatchIndex < rasterQueue.length - 1
                    ? `Save & Next (${currentBatchIndex + 2}/${rasterQueue.length})`
                    : 'Save & Finish'
                  : 'Add to Library'}
              </Button>
            </div>

            {/* Convert another */}
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleStartOver}>
              {isBatchMode ? 'Cancel batch & start over' : 'Convert another image'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconStylizer;
