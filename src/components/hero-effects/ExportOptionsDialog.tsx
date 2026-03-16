import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Image, Video, Film, Sparkles, Play, RotateCcw, Settings2, Loader2, Eye, Pause } from 'lucide-react';
import { ExportOptions, DEFAULT_EXPORT_OPTIONS, VideoRecordingState, INTRO_ANIMATIONS, IntroAnimationType } from '@/lib/heroEffectExport';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  effectName: string;
  recordingState: VideoRecordingState;
  onExport: (options: ExportOptions) => void;
  previewContainerRef?: React.RefObject<HTMLElement | null>;
}

/** Miniature live preview that replays the chosen intro animation on a captured snapshot */
function LivePreviewPanel({
  options,
  containerRef,
}: {
  options: ExportOptions;
  containerRef?: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSnapshot, setHasSnapshot] = useState(false);

  // Capture a snapshot of the live effect once
  const captureSnapshot = useCallback(async () => {
    const container = containerRef?.current;
    if (!container) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const captured = await html2canvas(container, {
        backgroundColor: '#000000',
        scale: 0.5,
        useCORS: true,
        logging: false,
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
      snapshotRef.current = captured;
      setHasSnapshot(true);
    } catch {
      // silently fail
    }
  }, [containerRef]);

  useEffect(() => {
    captureSnapshot();
  }, [captureSnapshot]);

  // Easing functions (duplicated locally for preview isolation)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutElastic = (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  };

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const source = snapshotRef.current;
    if (!canvas || !source || !isPlaying) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const totalDur = options.introMode ? options.duration : 3;
    const introDur = options.introMode ? options.introDuration : 0;

    // Loop
    const loopedElapsed = elapsed % totalDur;
    const rawT = introDur > 0 ? Math.min(loopedElapsed / introDur, 1) : 1;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    if (!options.introMode || rawT >= 1) {
      // Normal playback
      ctx.drawImage(source, 0, 0, w, h);
    } else {
      // Apply animation
      ctx.save();
      const anim = options.introAnimation || 'fade';
      const t = easeOutCubic(rawT);

      switch (anim) {
        case 'fade':
          ctx.globalAlpha = t;
          ctx.drawImage(source, 0, 0, w, h);
          break;
        case 'scale-up': {
          const scale = 0.3 + 0.7 * t;
          ctx.globalAlpha = Math.min(1, rawT * 2);
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(source, 0, 0, w, h);
          break;
        }
        case 'scale-down': {
          const scale = 1.6 - 0.6 * t;
          ctx.globalAlpha = Math.min(1, rawT * 1.5);
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(source, 0, 0, w, h);
          break;
        }
        case 'slide-up':
          ctx.globalAlpha = Math.min(1, rawT * 2);
          ctx.drawImage(source, 0, h * (1 - t), w, h);
          break;
        case 'slide-down':
          ctx.globalAlpha = Math.min(1, rawT * 2);
          ctx.drawImage(source, 0, -h * (1 - t), w, h);
          break;
        case 'slide-left':
          ctx.globalAlpha = Math.min(1, rawT * 2);
          ctx.drawImage(source, w * (1 - t), 0, w, h);
          break;
        case 'blur-fade':
          ctx.globalAlpha = t;
          ctx.drawImage(source, 0, 0, w, h);
          break;
        case 'spiral-in': {
          const scale = 0.2 + 0.8 * t;
          const rot = (1 - t) * Math.PI * 1.5;
          ctx.globalAlpha = Math.min(1, rawT * 2);
          ctx.translate(w / 2, h / 2);
          ctx.rotate(rot);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(source, 0, 0, w, h);
          break;
        }
        case 'wipe-right': {
          const revealW = Math.round(w * t);
          if (revealW > 0) {
            ctx.beginPath();
            ctx.rect(0, 0, revealW, h);
            ctx.clip();
            ctx.drawImage(source, 0, 0, w, h);
          }
          break;
        }
        case 'wipe-down': {
          const revealH = Math.round(h * t);
          if (revealH > 0) {
            ctx.beginPath();
            ctx.rect(0, 0, w, revealH);
            ctx.clip();
            ctx.drawImage(source, 0, 0, w, h);
          }
          break;
        }
        case 'radial-reveal': {
          const maxR = Math.sqrt(w * w + h * h) / 2;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, maxR * t, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(source, 0, 0, w, h);
          break;
        }
        case 'bounce-in': {
          const bt = easeOutElastic(rawT);
          ctx.globalAlpha = Math.min(1, rawT * 3);
          ctx.translate(w / 2, h / 2);
          ctx.scale(Math.max(0.01, bt), Math.max(0.01, bt));
          ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(source, 0, 0, w, h);
          break;
        }
        default:
          ctx.globalAlpha = t;
          ctx.drawImage(source, 0, 0, w, h);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [isPlaying, options]);

  useEffect(() => {
    if (isPlaying && hasSnapshot) {
      startTimeRef.current = 0;
      animFrameRef.current = requestAnimationFrame(drawFrame);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, hasSnapshot, drawFrame]);

  const togglePlay = () => {
    if (!isPlaying) startTimeRef.current = 0;
    setIsPlaying(p => !p);
  };

  const replay = () => {
    startTimeRef.current = 0;
    if (!isPlaying) setIsPlaying(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Live Preview</Label>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={replay}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="relative rounded-lg border border-border overflow-hidden bg-black aspect-video">
        {!hasSnapshot && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Capturing preview…
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full"
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {options.introMode
          ? `${INTRO_ANIMATIONS.find(a => a.id === options.introAnimation)?.label || 'Fade'} · ${options.introDuration}s intro → ${Math.max(0, options.duration - options.introDuration).toFixed(1)}s loop`
          : 'Showing live effect capture · Enable Intro Mode for animation preview'
        }
      </p>
    </div>
  );
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

export function ExportOptionsDialog({ open, onOpenChange, effectName, recordingState, onExport, previewContainerRef }: ExportOptionsDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [showPreview, setShowPreview] = useState(true);

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
                        Animate elements into view for presentations or website intros
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={options.introMode}
                    onCheckedChange={(v) => updateOption('introMode', v)}
                  />
                </div>
                {options.introMode && (
                  <div className="space-y-4 pl-1 pt-1">
                    {/* Animation Style Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Animation Style</Label>
                      <ScrollArea className="h-[180px] rounded-md border bg-muted/20 p-1">
                        <div className="grid grid-cols-2 gap-1.5 p-1">
                          {INTRO_ANIMATIONS.map((anim) => {
                            const isSelected = options.introAnimation === anim.id;
                            return (
                              <button
                                key={anim.id}
                                onClick={() => updateOption('introAnimation', anim.id)}
                                className={cn(
                                  "flex items-start gap-2 p-2 rounded-md border text-left transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                    : "border-transparent hover:bg-muted/50"
                                )}
                              >
                                <span className="text-base leading-none mt-0.5">{anim.icon}</span>
                                <div className="min-w-0">
                                  <div className={cn(
                                    "text-xs font-medium truncate",
                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {anim.label}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                    {anim.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Intro Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Animation Duration</Label>
                        <span className="text-xs font-mono text-foreground">{options.introDuration}s</span>
                      </div>
                      <Slider
                        value={[options.introDuration]}
                        onValueChange={([v]) => updateOption('introDuration', v)}
                        min={0.5}
                        max={Math.min(options.duration - 0.5, 8)}
                        step={0.5}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Elements will animate in over {options.introDuration}s, then play normally for {Math.max(0, options.duration - options.introDuration).toFixed(1)}s
                      </p>
                    </div>
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
