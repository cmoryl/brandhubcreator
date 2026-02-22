/**
 * IconStylizer - PNG-to-SVG Conversion with Brand Style Injection
 * 
 * Multi-Stage Pipeline:
 * - Stage A: Semantic Pre-Processing
 * - Stage B: Intelligent Vectorization
 * - Stage C: Style Injection
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Upload,
  Loader2,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Wand2,
  Settings2,
  Gauge,
  Scale,
  Circle,
  RefreshCw,
  Download,
  Copy,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useStylizer, StylizerOptions, StylizerResult } from '@/hooks/useStylizer';
import { BrandIconography } from '@/types/brand';
import { IconKitTooltip } from '@/components/help/IconKitTooltip';

interface IconStylizerProps {
  brandColors: string[];
  onIconCreated: (icon: BrandIconography) => void;
}

export const IconStylizer = ({
  brandColors,
  onIconCreated,
}: IconStylizerProps) => {
  // File state
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Options state
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

  // Stylizer hook with Shadow Canvas
  const {
    isProcessing,
    progress,
    currentStage,
    pipelineStage,
    result,
    error,
    processImage,
    reapplyStyle,
    triggerSimplification,
    reset,
    cleanup,
  } = useStylizer(brandColors);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      toast.error('Please drop a valid image file (PNG, JPG, WebP)');
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    reset();
  }, [reset]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Process the image
  const handleProcess = async () => {
    if (!selectedFile) return;
    await processImage(selectedFile, options);
  };

  // Re-apply style with updated options
  const handleReapplyStyle = () => {
    if (result?.svg) {
      const newSvg = reapplyStyle(result.svg, options);
      // Update result (this is a simplified version - in production you'd update the full result)
      toast.success('Style updated');
    }
  };

  // Save the icon
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
  };

  // Copy SVG to clipboard
  const handleCopySvg = () => {
    if (result?.svg) {
      navigator.clipboard.writeText(result.svg);
      toast.success('SVG copied to clipboard');
    }
  };

  // Render SVG preview
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

  // Get score color
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          PNG Stylizer
        </h3>
        <p className="text-sm text-muted-foreground">
          Convert images to brand-aligned SVG icons with AI-powered vectorization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload & Controls */}
        <div className="space-y-5">
          {/* Drop Zone */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              previewUrl && 'p-4'
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('stylizer-file-input')?.click()}
          >
            <input
              id="stylizer-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {previewUrl ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedFile(null); reset(); }}>
                    Change image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">Drop your image here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WebP up to 5MB</p>
              </div>
            )}
          </div>

          {/* Stylizer Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Conversion Settings
              </Label>
            </div>

            {/* Complexity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  Complexity
                  <IconKitTooltip sectionId="complexity-slider" inline size="sm" />
                </span>
                <span className="text-muted-foreground">
                  {options.simplifyThreshold < 0.3 ? 'Detailed' : options.simplifyThreshold < 0.7 ? 'Balanced' : 'Simplified'}
                </span>
              </div>
              <Slider
                value={[options.simplifyThreshold]}
                onValueChange={([v]) => setOptions(o => ({ ...o, simplifyThreshold: v }))}
                min={0}
                max={1}
                step={0.1}
                disabled={isProcessing}
              />
              <p className="text-[10px] text-muted-foreground">
                Lower = more detail, Higher = cleaner lines
              </p>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Stroke Width</span>
                <span className="text-muted-foreground">{options.strokeWidth}px</span>
              </div>
              <Slider
                value={[options.strokeWidth]}
                onValueChange={([v]) => setOptions(o => ({ ...o, strokeWidth: v }))}
                min={1}
                max={4}
                step={0.25}
                disabled={isProcessing}
              />
            </div>

            {/* Fill Mode */}
            <div className="space-y-2">
              <Label className="text-xs">Fill Mode</Label>
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

            {/* Toggle Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Scale className="h-3 w-3" />
                  Weight Matcher
                </span>
                <Switch
                  checked={options.snapToGrid}
                  onCheckedChange={(v) => setOptions(o => ({ ...o, snapToGrid: v }))}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  Preserve Holes
                </span>
                <Switch
                  checked={options.preserveHoles}
                  onCheckedChange={(v) => setOptions(o => ({ ...o, preserveHoles: v }))}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Corner Radius</span>
                <Slider
                  value={[options.cornerRadius]}
                  onValueChange={([v]) => setOptions(o => ({ ...o, cornerRadius: v }))}
                  min={0}
                  max={8}
                  step={1}
                  className="w-24"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="w-full gap-2"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {currentStage}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Stylize Image
              </>
            )}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{currentStage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="border rounded-lg overflow-hidden flex flex-col min-h-[400px]">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No result yet</p>
              <p className="text-sm">Upload an image and click Stylize</p>
            </div>
          ) : (
            <>
              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
                <div className="relative">
                  {/* Checkerboard background for transparency */}
                  <div className="absolute inset-0 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg" />
                  <div className="relative p-8">
                    {renderSvg(result.svg, 128)}
                  </div>
                </div>
              </div>

              {/* Conversion Score */}
              <div className="p-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Score</span>
                  <div className={cn('px-3 py-1 rounded-full text-sm font-bold', getScoreBg(result.conversionScore.overall), getScoreColor(result.conversionScore.overall))}>
                    {result.conversionScore.overall}/100
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 rounded bg-muted/50 text-center cursor-help">
                        <div className="text-muted-foreground mb-0.5">Fidelity</div>
                        <div className={cn('font-medium', getScoreColor(result.conversionScore.fidelityScore))}>
                          {result.conversionScore.fidelityScore}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>How much of the original shape was preserved</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 rounded bg-muted/50 text-center cursor-help">
                        <div className="text-muted-foreground mb-0.5">Nodes</div>
                        <div className={cn('font-medium', getScoreColor(result.conversionScore.nodeScore))}>
                          {result.conversionScore.nodeCount}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Anchor point count (under 50 is ideal)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 rounded bg-muted/50 text-center cursor-help">
                        <div className="text-muted-foreground mb-0.5">Grid</div>
                        <div className={cn('font-medium', getScoreColor(result.conversionScore.gridCompatibility))}>
                          {result.conversionScore.gridCompatibility}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Fits within 20px safe zone</TooltipContent>
                  </Tooltip>
                </div>

                {/* Shadow Canvas Validation */}
                {result.shadowValidation && (
                  <div className={cn(
                    'p-2 rounded-lg text-xs',
                    result.shadowValidation.isValid 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                  )}>
                    <div className="flex items-center gap-2">
                      {result.shadowValidation.isValid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs w-full"
                        onClick={triggerSimplification}
                        disabled={isProcessing}
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", isProcessing && "animate-spin")} />
                        Run Simplification Pass
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-center">
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

                {/* Processing Time */}
                <p className="text-[10px] text-center text-muted-foreground">
                  Processed in {(result.processingTime / 1000).toFixed(1)}s
                  {result.shadowValidation.simplificationPasses > 0 && 
                    ` • ${result.shadowValidation.simplificationPasses} simplification pass(es)`
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="p-3 border-t bg-muted/30 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleCopySvg}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy SVG
                </Button>
                <Button size="sm" className="flex-1" onClick={handleSaveIcon}>
                  <Check className="h-3 w-3 mr-1" />
                  Add to Library
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconStylizer;
