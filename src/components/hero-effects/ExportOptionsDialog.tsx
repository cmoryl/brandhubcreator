import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Image, Video, Film, Sparkles, Play, RotateCcw, Settings2, Loader2 } from 'lucide-react';
import { ExportOptions, DEFAULT_EXPORT_OPTIONS, VideoRecordingState, INTRO_ANIMATIONS, IntroAnimationType } from '@/lib/heroEffectExport';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  effectName: string;
  recordingState: VideoRecordingState;
  onExport: (options: ExportOptions) => void;
}

const FORMAT_INFO = {
  png: { icon: Image, label: 'PNG Image', desc: 'Static high-res screenshot', badge: 'Instant' },
  webm: { icon: Video, label: 'WebM Video', desc: 'Animated video for presentations', badge: 'Modern' },
  gif: { icon: Film, label: 'Animated GIF', desc: 'Looping animation, universal support', badge: 'Universal' },
} as const;

const RESOLUTION_LABELS: Record<string, string> = {
  '720p': '1280×720 (HD)',
  '1080p': '1920×1080 (Full HD)',
  '1440p': '2560×1440 (2K)',
  '4k': '3840×2160 (4K)',
  'custom': 'Custom',
};

export function ExportOptionsDialog({ open, onOpenChange, effectName, recordingState, onExport }: ExportOptionsDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const isAnimated = options.format !== 'png';
  const estimatedFrames = isAnimated ? Math.ceil(options.duration * options.fps) : 1;
  const estimatedTime = isAnimated ? Math.ceil(estimatedFrames * 0.15) : 1; // ~150ms per frame capture

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Export "{effectName}"
          </DialogTitle>
          <DialogDescription>
            Configure export format, resolution, and animation settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMAT_INFO) as Array<keyof typeof FORMAT_INFO>).map(fmt => {
                const info = FORMAT_INFO[fmt];
                const Icon = info.icon;
                const isSelected = options.format === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => updateOption('format', fmt)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30 bg-muted/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                      {info.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {info.badge}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {FORMAT_INFO[options.format].desc}
            </p>
          </div>

          <Separator />

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Resolution</Label>
            <Select value={options.resolution} onValueChange={(v) => updateOption('resolution', v as ExportOptions['resolution'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESOLUTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {options.resolution === 'custom' && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    value={options.customWidth || 1920}
                    onChange={(e) => updateOption('customWidth', parseInt(e.target.value) || 1920)}
                    min={320}
                    max={3840}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <Input
                    type="number"
                    value={options.customHeight || 1080}
                    onChange={(e) => updateOption('customHeight', parseInt(e.target.value) || 1080)}
                    min={240}
                    max={2160}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quality</Label>
            <Select value={options.quality} onValueChange={(v) => updateOption('quality', v as ExportOptions['quality'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (fastest, smaller files)</SelectItem>
                <SelectItem value="standard">Standard (balanced)</SelectItem>
                <SelectItem value="high">High (best quality, larger files)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animation settings - only for video/gif */}
          {isAnimated && (
            <>
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Animation Settings</Label>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Duration</Label>
                    <span className="text-xs font-mono text-foreground">{options.duration}s</span>
                  </div>
                  <Slider
                    value={[options.duration]}
                    onValueChange={([v]) => updateOption('duration', v)}
                    min={1}
                    max={15}
                    step={0.5}
                  />
                </div>

                {/* FPS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Frame Rate</Label>
                    <span className="text-xs font-mono text-foreground">{options.fps} fps</span>
                  </div>
                  <Slider
                    value={[options.fps]}
                    onValueChange={([v]) => updateOption('fps', v)}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {options.fps <= 10 ? 'Smaller file, choppier' : options.fps <= 20 ? 'Good balance' : 'Smoothest, larger file'}
                  </p>
                </div>

                {/* Loop - GIF only */}
                {options.format === 'gif' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs">Loop Animation</Label>
                      </div>
                      <Switch
                        checked={options.loop}
                        onCheckedChange={(v) => updateOption('loop', v)}
                      />
                    </div>
                    {options.loop && (
                      <div className="space-y-2 pl-5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Loop Count</Label>
                          <span className="text-xs font-mono text-foreground">
                            {options.loopCount === 0 ? '∞ Infinite' : `${options.loopCount}×`}
                          </span>
                        </div>
                        <Slider
                          value={[options.loopCount]}
                          onValueChange={([v]) => updateOption('loopCount', v)}
                          min={0}
                          max={10}
                          step={1}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Intro Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <div>
                      <Label className="text-sm font-medium">Intro Background Mode</Label>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Fade-in animation for use as presentation/website intro
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={options.introMode}
                    onCheckedChange={(v) => updateOption('introMode', v)}
                  />
                </div>
                {options.introMode && (
                  <div className="space-y-2 pl-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Fade-in Duration</Label>
                      <span className="text-xs font-mono text-foreground">{options.introDuration}s</span>
                    </div>
                    <Slider
                      value={[options.introDuration]}
                      onValueChange={([v]) => updateOption('introDuration', v)}
                      min={0.5}
                      max={5}
                      step={0.5}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Estimate info */}
          <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total frames:</span>
              <span className="font-mono">{estimatedFrames}</span>
            </div>
            {isAnimated && (
              <div className="flex justify-between">
                <span>Est. render time:</span>
                <span className="font-mono">~{estimatedTime}s</span>
              </div>
            )}
            {options.format === 'gif' && (
              <p className="text-[10px] mt-1 text-accent">
                💡 GIFs over 10s or at high FPS can be large. Consider WebM for longer animations.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onExport(options)}
            disabled={recordingState.isRecording}
            className="gap-2"
          >
            {recordingState.isRecording ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {recordingState.progress}%
              </>
            ) : (
              <>
                {options.format === 'png' ? <Image className="h-4 w-4" /> :
                 options.format === 'gif' ? <Film className="h-4 w-4" /> :
                 <Video className="h-4 w-4" />}
                Export {options.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
