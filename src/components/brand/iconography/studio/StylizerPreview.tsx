/**
 * StylizerPreview - A/B Comparison View for PNG-to-SVG Conversion
 * 
 * Features:
 * - Side-by-side original vs vectorized comparison
 * - IQS (Icon Quality Score) badge
 * - Real-time Complexity Slider with debouncing
 * - Optical masking for psychological comparison
 * - XSS-safe SVG rendering via DOMPurify
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Loader2,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { ConversionScore, ShadowCanvasResult } from '@/hooks/useStylizer';

interface StylizerPreviewProps {
  originalImage: string | null;
  vectorizedSvg: string | null;
  conversionScore: ConversionScore | null;
  shadowValidation: ShadowCanvasResult | null;
  isProcessing: boolean;
  currentStage: string;
  complexity: number;
  onComplexityChange: (value: number) => void;
  onDiscard: () => void;
  onAddToLibrary: () => void;
  onRetry: () => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const StylizerPreview: React.FC<StylizerPreviewProps> = ({
  originalImage,
  vectorizedSvg,
  conversionScore,
  shadowValidation,
  isProcessing,
  currentStage,
  complexity,
  onComplexityChange,
  onDiscard,
  onAddToLibrary,
  onRetry,
}) => {
  const [localComplexity, setLocalComplexity] = useState(complexity);
  const [showOriginalOverlay, setShowOriginalOverlay] = useState(false);
  const [zoom, setZoom] = useState(1);
  const debouncedComplexity = useDebounce(localComplexity, 300);
  const prevDebouncedRef = useRef(debouncedComplexity);

  // Trigger complexity change after debounce
  useEffect(() => {
    if (debouncedComplexity !== prevDebouncedRef.current) {
      prevDebouncedRef.current = debouncedComplexity;
      onComplexityChange(debouncedComplexity);
    }
  }, [debouncedComplexity, onComplexityChange]);

  // Sync local complexity with prop
  useEffect(() => {
    setLocalComplexity(complexity);
  }, [complexity]);

  // Get IQS badge styling
  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Sanitized SVG rendering
  const renderSanitizedSvg = useCallback((svg: string, size: number = 128) => {
    const sanitized = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
    });

    return (
      <div
        className="flex items-center justify-center transition-transform duration-200"
        style={{ 
          width: size * zoom, 
          height: size * zoom,
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
        }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }, [zoom]);

  // Checkerboard background for transparency
  const CheckerboardBg = () => (
    <div className="absolute inset-0 bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] rounded-lg opacity-50" />
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header with IQS Score */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">PNG to Style Conversion</span>
          </div>
          
          {conversionScore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={getScoreBadgeVariant(conversionScore.overall)}
                  className={cn(
                    'px-3 py-1 cursor-help font-bold',
                    conversionScore.overall >= 80 && 'bg-green-600 hover:bg-green-700',
                    conversionScore.overall >= 60 && conversionScore.overall < 80 && 'bg-amber-500 hover:bg-amber-600',
                    conversionScore.overall < 60 && 'bg-red-500 hover:bg-red-600'
                  )}
                >
                  IQS: {conversionScore.overall}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Icon Quality Score Breakdown</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Fidelity:</span>
                    <span className={getScoreColor(conversionScore.fidelityScore)}>{conversionScore.fidelityScore}</span>
                    <span className="text-muted-foreground">Node Count:</span>
                    <span className={getScoreColor(conversionScore.nodeScore)}>{conversionScore.nodeCount} pts</span>
                    <span className="text-muted-foreground">Grid Fit:</span>
                    <span className={getScoreColor(conversionScore.gridCompatibility)}>{conversionScore.gridCompatibility}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 border-t">
                    {conversionScore.status === 'excellent' && '✓ Production ready'}
                    {conversionScore.status === 'good' && '✓ Good quality'}
                    {conversionScore.status === 'acceptable' && '⚠ May need refinement'}
                    {conversionScore.status === 'needs-work' && '✗ Needs simplification'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* A/B Comparison View */}
        <div className="grid grid-cols-2 divide-x">
          {/* Left Pane: Original PNG with Optical Masking */}
          <div className="relative flex flex-col">
            <div className="px-3 py-2 bg-muted/20 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Original Asset
              </span>
            </div>
            <div className="relative flex-1 min-h-[200px] flex items-center justify-center p-6">
              <CheckerboardBg />
              {originalImage ? (
                <div className={cn(
                  'relative z-10 transition-all duration-300',
                  // Optical masking: grayscale + reduced opacity makes original feel "old/raw"
                  'grayscale opacity-50 hover:opacity-75 hover:grayscale-0'
                )}>
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-[128px] max-h-[128px] object-contain"
                    style={{ 
                      imageRendering: 'pixelated',
                      transform: `scale(${zoom})`,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No image</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Branded Vector */}
          <div className="relative flex flex-col">
            <div className="px-3 py-2 bg-muted/20 border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Branded Vector
              </span>
              {shadowValidation && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      'flex items-center gap-1 text-xs cursor-help',
                      shadowValidation.isValid ? 'text-green-600' : 'text-amber-600'
                    )}>
                      {shadowValidation.isValid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">
                        {shadowValidation.isValid ? 'Validated' : 'Issues'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {shadowValidation.isValid 
                      ? 'Passed Shadow Canvas validation'
                      : shadowValidation.issues.join(', ')
                    }
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="relative flex-1 min-h-[200px] flex items-center justify-center p-6">
              <CheckerboardBg />
              {isProcessing ? (
                <div className="relative z-10 text-center">
                  <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
                  <p className="text-sm font-medium text-primary">{currentStage || 'Processing...'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vectorizing & Snapping...</p>
                </div>
              ) : vectorizedSvg ? (
                <div className="relative z-10">
                  {renderSanitizedSvg(vectorizedSvg, 128)}
                  
                  {/* Overlay toggle for comparison */}
                  {showOriginalOverlay && originalImage && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                      <img
                        src={originalImage}
                        alt="Overlay"
                        className="max-w-[128px] max-h-[128px] object-contain"
                        style={{ transform: `scale(${zoom})` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative z-10 text-center text-muted-foreground">
                  <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Upload & process</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Footer */}
        <div className="px-4 py-4 border-t bg-muted/20 space-y-4">
          {/* Complexity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Path Complexity</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Lower = fewer anchor points (cleaner)
                    <br />
                    Higher = more detail preserved
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {localComplexity}%
              </span>
            </div>
            <Slider
              value={[localComplexity]}
              onValueChange={([val]) => setLocalComplexity(val)}
              max={100}
              min={10}
              step={5}
              disabled={isProcessing || !vectorizedSvg}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Clean</span>
              <span>Detailed</span>
            </div>
          </div>

          {/* Zoom & Overlay Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                disabled={zoom >= 2}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <div className="w-px h-4 bg-border mx-2" />
              <Button
                variant={showOriginalOverlay ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowOriginalOverlay(!showOriginalOverlay)}
                disabled={!vectorizedSvg || !originalImage}
              >
                {showOriginalOverlay ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                Overlay
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDiscard}
              disabled={isProcessing}
            >
              <X className="h-3 w-3 mr-1" />
              Discard
            </Button>
            {conversionScore && conversionScore.overall < 60 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isProcessing}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1"
              onClick={onAddToLibrary}
              disabled={isProcessing || !vectorizedSvg}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Brand Library
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StylizerPreview;
