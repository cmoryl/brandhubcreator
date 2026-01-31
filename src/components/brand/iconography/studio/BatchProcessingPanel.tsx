/**
 * BatchProcessingPanel - Batch Process Icons in a Library
 * 
 * Allows users to apply optical sizing, states, and animations
 * to all icons in a library with a single click.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Zap,
  Layers,
  Palette,
  Sparkles,
  Play,
  Download,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  useIconBatchProcessor, 
  BatchProcessingOptions,
  BatchProcessingResult 
} from '@/hooks/useIconBatchProcessor';
import { BrandPersonality, EntranceAnimation, InteractionAnimation } from '@/hooks/useKineticBranding';
import { BrandIconography } from '@/types/brand';

interface BatchProcessingPanelProps {
  icons: BrandIconography[];
  libraryName: string;
  onComplete?: (result: BatchProcessingResult) => void;
}

export const BatchProcessingPanel: React.FC<BatchProcessingPanelProps> = ({
  icons,
  libraryName,
  onComplete,
}) => {
  const {
    isProcessing,
    progress,
    result,
    processBatch,
    exportBatchResults,
    reset,
    defaultOptions,
  } = useIconBatchProcessor();

  const [options, setOptions] = useState<BatchProcessingOptions>({
    ...defaultOptions,
  });

  const handleStartProcessing = async () => {
    if (icons.length === 0) {
      toast.error('No icons to process');
      return;
    }

    // Show initial toast
    const toastId = toast.loading(`Starting batch processing of ${icons.length} icons...`);

    try {
      const batchResult = await processBatch(icons, options);
      
      // Dismiss loading toast and show result
      toast.dismiss(toastId);
      
      if (batchResult.errors.length > 0) {
        toast.warning(`Processed with ${batchResult.errors.length} errors`, {
          description: `${batchResult.processedCount} icons processed successfully`,
        });
      } else {
        toast.success(`Successfully processed ${batchResult.processedCount} icons`, {
          description: `Generated ${batchResult.summary.opticalSizesGenerated} optical, ${batchResult.summary.statesGenerated} states, ${batchResult.summary.animationsGenerated} kinetic`,
        });
      }
      
      onComplete?.(batchResult);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Batch processing failed');
    }
  };

  const handleExport = () => {
    if (!result) return;
    
    const json = exportBatchResults(result, libraryName);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${libraryName}-batch-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Batch export downloaded');
  };

  const handleExportCSS = () => {
    if (!result?.css) return;
    
    const blob = new Blob([result.css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${libraryName}-animations.css`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSS file downloaded');
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Batch Process Library
        </CardTitle>
        <CardDescription className="text-xs">
          Apply optical sizing, states, and animations to all {icons.length} icons at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <Label className="text-sm">Optical Sizes</Label>
            </div>
            <Switch
              checked={options.applyOpticalSizes}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, applyOpticalSizes: checked }))
              }
              disabled={isProcessing}
            />
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Generate Micro (12px), Regular (24px), and Display (64px+) variants
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-green-500" />
              <Label className="text-sm">State Variants</Label>
            </div>
            <Switch
              checked={options.applyStates}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, applyStates: checked }))
              }
              disabled={isProcessing}
            />
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Create Hover, Active, Success, Error, Warning, Skeleton, Disabled states
          </p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <Label className="text-sm">Kinetic Animations</Label>
            </div>
            <Switch
              checked={options.applyAnimations}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, applyAnimations: checked }))
              }
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Animation Settings */}
        {options.applyAnimations && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Personality</Label>
                <Select
                  value={options.personality}
                  onValueChange={(v) => 
                    setOptions(prev => ({ ...prev, personality: v as BrandPersonality }))
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['professional', 'friendly', 'playful', 'luxury', 'tech'] as BrandPersonality[]).map((p) => (
                      <SelectItem key={p} value={p} className="capitalize text-xs">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entrance</Label>
                <Select
                  value={options.entranceAnimation}
                  onValueChange={(v) => 
                    setOptions(prev => ({ ...prev, entranceAnimation: v as EntranceAnimation }))
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['fade', 'pop', 'draw', 'bounce', 'slide', 'scale', 'none'] as EntranceAnimation[]).map((a) => (
                      <SelectItem key={a} value={a} className="capitalize text-xs">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Interaction</Label>
                <Select
                  value={options.interactionAnimation}
                  onValueChange={(v) => 
                    setOptions(prev => ({ ...prev, interactionAnimation: v as InteractionAnimation }))
                  }
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['wiggle', 'pulse', 'bounce', 'spin', 'shake', 'none'] as InteractionAnimation[]).map((a) => (
                      <SelectItem key={a} value={a} className="capitalize text-xs">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {isProcessing && progress && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Processing: {progress.currentIconName}
              </span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] capitalize">
                {progress.phase}
              </Badge>
              <span>{progress.current} / {progress.total} icons</span>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isProcessing && (
          <div className="space-y-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">Processing Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-background/50">
                <div className="text-lg font-bold text-blue-500">{result.summary.opticalSizesGenerated}</div>
                <div className="text-[10px] text-muted-foreground">Optical</div>
              </div>
              <div className="p-2 rounded bg-background/50">
                <div className="text-lg font-bold text-green-500">{result.summary.statesGenerated}</div>
                <div className="text-[10px] text-muted-foreground">States</div>
              </div>
              <div className="p-2 rounded bg-background/50">
                <div className="text-lg font-bold text-amber-500">{result.summary.animationsGenerated}</div>
                <div className="text-[10px] text-muted-foreground">Kinetic</div>
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {result.errors.length} icons had errors
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!result ? (
            <Button
              className="flex-1 gap-2"
              onClick={handleStartProcessing}
              disabled={isProcessing || icons.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Process {icons.length} Icons
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExportCSS}
              >
                <Download className="h-4 w-4" />
                Export CSS
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchProcessingPanel;
