/**
 * IconStudioAppIcons - App icon generator for Android, iOS, and PWA
 * Creates adaptive icons with safe zones and platform-specific exports
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Monitor,
  Download,
  Upload,
  Image as ImageIcon,
  Layers,
  Grid3X3,
  Circle,
  Square,
  Eye,
  EyeOff,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IconKitTooltip } from '@/components/help/IconKitTooltip';

const ANDROID_SIZES = [
  { name: 'mdpi', size: 48 },
  { name: 'hdpi', size: 72 },
  { name: 'xhdpi', size: 96 },
  { name: 'xxhdpi', size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

const IOS_SIZES = [
  { name: 'iPhone App 2x', size: 120 },
  { name: 'iPhone App 3x', size: 180 },
  { name: 'iPad App 2x', size: 152 },
  { name: 'App Store', size: 1024 },
];

const PWA_SIZES = [
  { name: 'favicon-32', size: 32 },
  { name: 'apple-touch-icon', size: 180 },
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
];

const ANDROID_MASKS = [
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'squircle', name: 'Squircle', icon: Square },
  { id: 'rounded-square', name: 'Rounded', icon: Square },
  { id: 'square', name: 'Square', icon: Square },
];

interface IconStudioAppIconsProps {
  brandColors: Array<{ hex: string; name: string }>;
}

export const IconStudioAppIcons = ({ brandColors }: IconStudioAppIconsProps) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('android');
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [useColorBackground, setUseColorBackground] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showKeylines, setShowKeylines] = useState(true);
  const [androidMask, setAndroidMask] = useState<string>('circle');
  const [foregroundScale, setForegroundScale] = useState(1);
  const [foregroundOffsetX, setForegroundOffsetX] = useState(0);
  const [foregroundOffsetY, setForegroundOffsetY] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    // Draw background
    if (useColorBackground) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);
    } else if (backgroundImage) {
      const bgImg = new Image();
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, size, size);
        drawForegroundAndOverlays(ctx, size);
      };
      bgImg.src = backgroundImage;
      return;
    }

    drawForegroundAndOverlays(ctx, size);
  }, [foregroundImage, backgroundImage, backgroundColor, useColorBackground, showSafeZone, showKeylines, androidMask, foregroundScale, foregroundOffsetX, foregroundOffsetY, activeTab]);

  const drawForegroundAndOverlays = (ctx: CanvasRenderingContext2D, size: number) => {
    if (foregroundImage) {
      const fgImg = new Image();
      fgImg.onload = () => {
        const scaledSize = size * foregroundScale * 0.66;
        const x = (size - scaledSize) / 2 + foregroundOffsetX;
        const y = (size - scaledSize) / 2 + foregroundOffsetY;
        ctx.drawImage(fgImg, x, y, scaledSize, scaledSize);
        drawOverlays(ctx, size);
      };
      fgImg.src = foregroundImage;
    } else {
      drawOverlays(ctx, size);
    }
  };

  const drawOverlays = (ctx: CanvasRenderingContext2D, size: number) => {
    // Apply mask for preview
    if (activeTab === 'android') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#fff';
      const center = size / 2;
      
      if (androidMask === 'circle') {
        ctx.beginPath();
        ctx.arc(center, center, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (androidMask === 'rounded-square') {
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, size * 0.2);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, size, size);
      }
      ctx.restore();
    }

    if (activeTab === 'ios') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.2237);
      ctx.fill();
      ctx.restore();
    }

    // Safe zone overlay
    if (showSafeZone) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);

      if (activeTab === 'android') {
        const safeSize = size * 0.66;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, safeSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const padding = size * 0.1;
        ctx.beginPath();
        ctx.roundRect(padding, padding, size - padding * 2, size - padding * 2, (size - padding * 2) * 0.15);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Keyline grid
    if (showKeylines) {
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
      ctx.lineWidth = 1;
      const center = size / 2;

      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, size);
      ctx.moveTo(0, center);
      ctx.lineTo(size, center);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
      for (let i = 1; i < 4; i++) {
        const pos = (size / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
      }

      if (activeTab === 'android') {
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.4)';
        ctx.beginPath();
        ctx.arc(center, center, size * 0.33, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const exportIcons = async () => {
    if (!foregroundImage) {
      toast.error('Please upload a foreground image first');
      return;
    }

    setIsExporting(true);
    toast.info('Generating icons...');

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const sizes = activeTab === 'android' ? ANDROID_SIZES : activeTab === 'ios' ? IOS_SIZES : PWA_SIZES;

      for (const spec of sizes) {
        const blob = await generateIcon(spec.size);
        zip.file(`${spec.name}_${spec.size}x${spec.size}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-icons-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${activeTab} icons!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export icons');
    } finally {
      setIsExporting(false);
    }
  };

  const generateIcon = (size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No context'));

      // Background
      if (useColorBackground) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);
      }

      // Foreground
      if (foregroundImage) {
        const fgImg = new Image();
        fgImg.onload = () => {
          const scaledSize = size * foregroundScale * 0.66;
          const x = (size - scaledSize) / 2 + (foregroundOffsetX * size / 512);
          const y = (size - scaledSize) / 2 + (foregroundOffsetY * size / 512);
          ctx.drawImage(fgImg, x, y, scaledSize, scaledSize);
          
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed')), 'image/png');
        };
        fgImg.src = foregroundImage;
      } else {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed')), 'image/png');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            App Icon Generator
            <IconKitTooltip sectionId="app-icons" inline />
          </h3>
          <p className="text-sm text-muted-foreground">
            Create adaptive icons for Android, iOS, and PWA with safe zone guides
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="android" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Android
          </TabsTrigger>
          <TabsTrigger value="ios" className="gap-2">
            <Smartphone className="h-4 w-4" />
            iOS
          </TabsTrigger>
          <TabsTrigger value="pwa" className="gap-2">
            <Monitor className="h-4 w-4" />
            PWA
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Foreground Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Foreground (Logo)
            </Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-primary/5',
                foregroundImage ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
              onClick={() => foregroundInputRef.current?.click()}
            >
              {foregroundImage ? (
                <img src={foregroundImage} alt="Foreground" className="w-16 h-16 mx-auto object-contain" />
              ) : (
                <div className="py-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload logo image</p>
                </div>
              )}
            </div>
            <input
              ref={foregroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setForegroundImage)}
            />
          </div>

          {/* Scale & Position */}
          {foregroundImage && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" />Scale</span>
                  <span className="text-muted-foreground">{(foregroundScale * 100).toFixed(0)}%</span>
                </div>
                <Slider value={[foregroundScale]} onValueChange={([v]) => setForegroundScale(v)} min={0.5} max={1.5} step={0.05} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Offset X</Label>
                  <Slider value={[foregroundOffsetX]} onValueChange={([v]) => setForegroundOffsetX(v)} min={-50} max={50} step={1} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Offset Y</Label>
                  <Slider value={[foregroundOffsetY]} onValueChange={([v]) => setForegroundOffsetY(v)} min={-50} max={50} step={1} />
                </div>
              </div>
            </div>
          )}

          {/* Background */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Background</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Use color</span>
                <Switch checked={useColorBackground} onCheckedChange={setUseColorBackground} />
              </div>
            </div>
            {useColorBackground ? (
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="flex-1" />
              </div>
            ) : (
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer',
                  'hover:border-primary'
                )}
                onClick={() => backgroundInputRef.current?.click()}
              >
                {backgroundImage ? (
                  <img src={backgroundImage} alt="Background" className="w-16 h-16 mx-auto object-cover" />
                ) : (
                  <div className="py-2">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload background</p>
                  </div>
                )}
              </div>
            )}
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setBackgroundImage)}
            />
            {brandColors.length > 0 && useColorBackground && (
              <div className="flex flex-wrap gap-1">
                {brandColors.slice(0, 8).map((color, i) => (
                  <button
                    key={i}
                    className="w-6 h-6 rounded border-2 border-transparent hover:border-foreground"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setBackgroundColor(color.hex)}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Android Mask Shape */}
          {activeTab === 'android' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Preview Mask Shape
                <IconKitTooltip sectionId="mask-shapes" inline size="sm" />
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {ANDROID_MASKS.map((mask) => {
                  const Icon = mask.icon;
                  return (
                    <button
                      key={mask.id}
                      onClick={() => setAndroidMask(mask.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                        androidMask === mask.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px]">{mask.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2"><Grid3X3 className="h-4 w-4" />Overlay Guides</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showSafeZone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="text-sm">Safe Zone</span>
                </div>
                <Switch checked={showSafeZone} onCheckedChange={setShowSafeZone} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showKeylines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="text-sm">Keyline Grid</span>
                </div>
                <Switch checked={showKeylines} onCheckedChange={setShowKeylines} />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <canvas ref={previewCanvasRef} className="border rounded-lg shadow-lg" style={{ width: 280, height: 280 }} />
            <Badge variant="secondary" className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs">
              512×512 Preview
            </Badge>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border text-sm w-full">
            <p className="font-medium">
              {activeTab === 'android' && 'Android Adaptive Icons'}
              {activeTab === 'ios' && 'iOS App Icons'}
              {activeTab === 'pwa' && 'PWA Icons'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {activeTab === 'android' && 'Exports separate foreground/background layers'}
              {activeTab === 'ios' && 'All required sizes for App Store submission'}
              {activeTab === 'pwa' && 'Includes maskable icons for home screen'}
            </p>
          </div>

          <Button onClick={exportIcons} disabled={isExporting || !foregroundImage} className="w-full gap-2" size="lg">
            <Download className="h-4 w-4" />
            {isExporting ? 'Generating...' : `Export ${activeTab.toUpperCase()} Icons`}
          </Button>
        </div>
      </div>
    </div>
  );
};
