/**
 * AppIconGenerator - Comprehensive app icon generator for all platforms
 * Supports Android Adaptive Icons, iOS App Icons, PWA favicons, and web manifests
 * Includes safe zone overlays and keyline grid previews
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
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
  RectangleHorizontal,
  Eye,
  EyeOff,
  Palette,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Platform icon specifications
const ANDROID_SIZES = [
  { name: 'mdpi', size: 48 },
  { name: 'hdpi', size: 72 },
  { name: 'xhdpi', size: 96 },
  { name: 'xxhdpi', size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

const IOS_SIZES = [
  { name: 'iPhone Notification 2x', size: 40 },
  { name: 'iPhone Notification 3x', size: 60 },
  { name: 'iPhone Settings 2x', size: 58 },
  { name: 'iPhone Settings 3x', size: 87 },
  { name: 'iPhone Spotlight 2x', size: 80 },
  { name: 'iPhone Spotlight 3x', size: 120 },
  { name: 'iPhone App 2x', size: 120 },
  { name: 'iPhone App 3x', size: 180 },
  { name: 'iPad Notifications 1x', size: 20 },
  { name: 'iPad Notifications 2x', size: 40 },
  { name: 'iPad Settings 1x', size: 29 },
  { name: 'iPad Settings 2x', size: 58 },
  { name: 'iPad Spotlight 1x', size: 40 },
  { name: 'iPad Spotlight 2x', size: 80 },
  { name: 'iPad App 1x', size: 76 },
  { name: 'iPad App 2x', size: 152 },
  { name: 'iPad Pro App 2x', size: 167 },
  { name: 'App Store', size: 1024 },
];

const PWA_SIZES = [
  { name: 'favicon-16', size: 16 },
  { name: 'favicon-32', size: 32 },
  { name: 'apple-touch-icon', size: 180 },
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
  { name: 'maskable-192', size: 192, maskable: true },
  { name: 'maskable-512', size: 512, maskable: true },
];

// Android mask shapes
const ANDROID_MASKS = [
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'squircle', name: 'Squircle', icon: RectangleHorizontal },
  { id: 'rounded-square', name: 'Rounded Square', icon: Square },
  { id: 'square', name: 'Square', icon: Square },
];

interface AppIconGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandColors?: Array<{ hex: string; name: string }>;
}

export const AppIconGenerator = ({
  open,
  onOpenChange,
  brandColors = [],
}: AppIconGeneratorProps) => {
  // Canvas refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  // State
  const [activeTab, setActiveTab] = useState('android');
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [useColorBackground, setUseColorBackground] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showKeylines, setShowKeylines] = useState(true);
  const [androidMask, setAndroidMask] = useState<'circle' | 'squircle' | 'rounded-square' | 'square'>('circle');
  const [foregroundScale, setForegroundScale] = useState(1);
  const [foregroundOffsetX, setForegroundOffsetX] = useState(0);
  const [foregroundOffsetY, setForegroundOffsetY] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // File input refs
  const foregroundInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
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
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Draw preview canvas
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
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
    // Draw foreground
    if (foregroundImage) {
      const fgImg = new Image();
      fgImg.onload = () => {
        const scaledSize = size * foregroundScale * 0.66; // 66% of canvas by default
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
    // Apply mask preview for Android
    if (activeTab === 'android') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#fff';
      
      const center = size / 2;
      const radius = size / 2;

      switch (androidMask) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'squircle':
          drawSquircle(ctx, 0, 0, size, size, 0.6);
          break;
        case 'rounded-square':
          ctx.beginPath();
          ctx.roundRect(0, 0, size, size, size * 0.2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(0, 0, size, size);
          break;
      }
      ctx.restore();
    }

    // Draw iOS corner radius preview
    if (activeTab === 'ios') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      // iOS uses ~22.37% corner radius
      ctx.roundRect(0, 0, size, size, size * 0.2237);
      ctx.fill();
      ctx.restore();
    }

    // Draw safe zone overlay
    if (showSafeZone) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);

      if (activeTab === 'android') {
        // Android safe zone is 66% of the icon (center 66%)
        const safeSize = size * 0.66;
        const safeOffset = (size - safeSize) / 2;
        
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, safeSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTab === 'ios') {
        // iOS safe zone accounts for corner radius
        const padding = size * 0.1;
        ctx.beginPath();
        ctx.roundRect(padding, padding, size - padding * 2, size - padding * 2, (size - padding * 2) * 0.15);
        ctx.stroke();
      } else {
        // PWA safe zone
        const padding = size * 0.1;
        ctx.strokeRect(padding, padding, size - padding * 2, size - padding * 2);
      }

      ctx.restore();
    }

    // Draw keyline grid
    if (showKeylines) {
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
      ctx.lineWidth = 1;

      const center = size / 2;

      // Center crosshairs
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, size);
      ctx.moveTo(0, center);
      ctx.lineTo(size, center);
      ctx.stroke();

      // Grid lines (quarters)
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

      // Circle guides for Android
      if (activeTab === 'android') {
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.4)';
        // Inner circle (icon area)
        ctx.beginPath();
        ctx.arc(center, center, size * 0.33, 0, Math.PI * 2);
        ctx.stroke();
        // Middle circle
        ctx.beginPath();
        ctx.arc(center, center, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  // Draw squircle (superellipse)
  const drawSquircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    n: number
  ) => {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;

    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const angle = (i * Math.PI) / 180;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const px = cx + Math.sign(cosA) * Math.pow(Math.abs(cosA), n) * rx;
      const py = cy + Math.sign(sinA) * Math.pow(Math.abs(sinA), n) * ry;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  };

  // Redraw preview when dependencies change
  useEffect(() => {
    if (open) {
      drawPreview();
    }
  }, [drawPreview, open]);

  // Generate and export icons
  const exportIcons = async () => {
    setIsExporting(true);
    toast.info('Generating icons...');

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Generate icons for each platform
      if (activeTab === 'android' || activeTab === 'all') {
        const androidFolder = zip.folder('android');
        
        // Foreground layer
        const fgFolder = androidFolder?.folder('foreground');
        // Background layer
        const bgFolder = androidFolder?.folder('background');
        
        for (const spec of ANDROID_SIZES) {
          // Generate foreground
          const fgBlob = await generateIcon(spec.size, 'foreground');
          fgFolder?.file(`ic_launcher_foreground_${spec.name}.png`, fgBlob);
          
          // Generate background
          const bgBlob = await generateIcon(spec.size, 'background');
          bgFolder?.file(`ic_launcher_background_${spec.name}.png`, bgBlob);
          
          // Generate combined preview
          const combinedBlob = await generateIcon(spec.size, 'combined');
          androidFolder?.file(`ic_launcher_${spec.name}.png`, combinedBlob);
        }
        
        // Add adaptive icon XML
        androidFolder?.file('ic_launcher.xml', generateAdaptiveIconXml());
      }

      if (activeTab === 'ios' || activeTab === 'all') {
        const iosFolder = zip.folder('ios');
        
        for (const spec of IOS_SIZES) {
          const blob = await generateIcon(spec.size, 'combined', 'ios');
          const safeName = spec.name.replace(/\s+/g, '_').toLowerCase();
          iosFolder?.file(`AppIcon_${safeName}_${spec.size}x${spec.size}.png`, blob);
        }
        
        // Add Contents.json for Xcode
        iosFolder?.file('Contents.json', generateIOSContentsJson());
      }

      if (activeTab === 'pwa' || activeTab === 'all') {
        const pwaFolder = zip.folder('pwa');
        
        for (const spec of PWA_SIZES) {
          const blob = await generateIcon(spec.size, 'combined', spec.maskable ? 'maskable' : 'pwa');
          pwaFolder?.file(`${spec.name}.png`, blob);
        }
        
        // Add manifest snippet
        pwaFolder?.file('manifest-icons.json', generatePWAManifest());
        
        // Add favicon.ico (16x16 and 32x32)
        // Note: ICO generation would require additional library
      }

      // Download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app-icons-${activeTab}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${activeTab} icons successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export icons');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate a single icon at specified size
  const generateIcon = (
    size: number,
    layer: 'foreground' | 'background' | 'combined',
    platform: 'android' | 'ios' | 'pwa' | 'maskable' = 'android'
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const drawLayers = () => {
        // For Android adaptive icons, foreground should be on transparent bg
        if (layer === 'foreground') {
          ctx.clearRect(0, 0, size, size);
          if (foregroundImage) {
            const fgImg = new Image();
            fgImg.onload = () => {
              const scaledSize = size * foregroundScale * 0.66;
              const x = (size - scaledSize) / 2 + (foregroundOffsetX * size / 512);
              const y = (size - scaledSize) / 2 + (foregroundOffsetY * size / 512);
              ctx.drawImage(fgImg, x, y, scaledSize, scaledSize);
              canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
            };
            fgImg.src = foregroundImage;
          } else {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
          }
          return;
        }

        // Background layer
        if (layer === 'background') {
          if (useColorBackground) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
          } else if (backgroundImage) {
            const bgImg = new Image();
            bgImg.onload = () => {
              ctx.drawImage(bgImg, 0, 0, size, size);
              canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
            };
            bgImg.src = backgroundImage;
          } else {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
          }
          return;
        }

        // Combined layer
        // Draw background
        if (useColorBackground) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, size, size);
          drawForeground();
        } else if (backgroundImage) {
          const bgImg = new Image();
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, size, size);
            drawForeground();
          };
          bgImg.src = backgroundImage;
        } else {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, size, size);
          drawForeground();
        }

        function drawForeground() {
          if (foregroundImage) {
            const fgImg = new Image();
            fgImg.onload = () => {
              const scaledSize = size * foregroundScale * 0.66;
              const x = (size - scaledSize) / 2 + (foregroundOffsetX * size / 512);
              const y = (size - scaledSize) / 2 + (foregroundOffsetY * size / 512);
              ctx.drawImage(fgImg, x, y, scaledSize, scaledSize);
              applyMask();
            };
            fgImg.src = foregroundImage;
          } else {
            applyMask();
          }
        }

        function applyMask() {
          // Apply platform-specific masking
          if (platform === 'ios') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, size * 0.2237);
            ctx.fill();
            ctx.restore();
          } else if (platform === 'maskable') {
            // Maskable icons need safe zone padding
            // The icon content should be in the center 80%
          }
          
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
        }
      };

      drawLayers();
    });
  };

  // Generate Android adaptive-icon XML
  const generateAdaptiveIconXml = () => {
    return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;
  };

  // Generate iOS Contents.json
  const generateIOSContentsJson = () => {
    const images = IOS_SIZES.map(spec => ({
      size: `${spec.size}x${spec.size}`,
      idiom: spec.name.includes('iPad') ? 'ipad' : spec.name === 'App Store' ? 'ios-marketing' : 'iphone',
      filename: `AppIcon_${spec.name.replace(/\s+/g, '_').toLowerCase()}_${spec.size}x${spec.size}.png`,
      scale: spec.name.includes('3x') ? '3x' : spec.name.includes('2x') ? '2x' : '1x',
    }));

    return JSON.stringify({
      images,
      info: {
        version: 1,
        author: 'App Icon Generator',
      },
    }, null, 2);
  };

  // Generate PWA manifest icons snippet
  const generatePWAManifest = () => {
    const icons = PWA_SIZES.map(spec => ({
      src: `/${spec.name}.png`,
      sizes: `${spec.size}x${spec.size}`,
      type: 'image/png',
      purpose: spec.maskable ? 'maskable' : 'any',
    }));

    return JSON.stringify({ icons }, null, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            App Icon Generator
          </DialogTitle>
          <DialogDescription>
            Generate adaptive icons for Android, iOS, and PWA with safe zone guides
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
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

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Left Panel - Controls */}
            <ScrollArea className="pr-4">
              <div className="space-y-6">
                {/* Layer Uploads */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Icon Layers
                  </Label>

                  {/* Foreground Layer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Foreground (Logo)</span>
                      {foregroundImage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setForegroundImage(null)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div
                      className={cn(
                        'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                        'hover:border-primary hover:bg-primary/5',
                        foregroundImage ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      )}
                      onClick={() => foregroundInputRef.current?.click()}
                    >
                      {foregroundImage ? (
                        <img
                          src={foregroundImage}
                          alt="Foreground"
                          className="w-16 h-16 mx-auto object-contain"
                        />
                      ) : (
                        <div className="py-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Upload logo/icon image
                          </p>
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

                  {/* Foreground Scale & Position */}
                  {foregroundImage && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <ZoomIn className="h-3 w-3" />
                            Scale
                          </span>
                          <span className="text-muted-foreground">{(foregroundScale * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                          value={[foregroundScale]}
                          onValueChange={([v]) => setForegroundScale(v)}
                          min={0.5}
                          max={1.5}
                          step={0.05}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Offset X</Label>
                          <Slider
                            value={[foregroundOffsetX]}
                            onValueChange={([v]) => setForegroundOffsetX(v)}
                            min={-50}
                            max={50}
                            step={1}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Offset Y</Label>
                          <Slider
                            value={[foregroundOffsetY]}
                            onValueChange={([v]) => setForegroundOffsetY(v)}
                            min={-50}
                            max={50}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Background Layer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Use color</span>
                        <Switch
                          checked={useColorBackground}
                          onCheckedChange={setUseColorBackground}
                        />
                      </div>
                    </div>

                    {useColorBackground ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#6366f1"
                            className="flex-1"
                          />
                        </div>
                        {brandColors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {brandColors.slice(0, 8).map((color, i) => (
                              <button
                                key={i}
                                className="w-6 h-6 rounded border-2 border-transparent hover:border-foreground transition-colors"
                                style={{ backgroundColor: color.hex }}
                                onClick={() => setBackgroundColor(color.hex)}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                          'hover:border-primary hover:bg-primary/5',
                          backgroundImage ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        )}
                        onClick={() => backgroundInputRef.current?.click()}
                      >
                        {backgroundImage ? (
                          <img
                            src={backgroundImage}
                            alt="Background"
                            className="w-16 h-16 mx-auto object-cover"
                          />
                        ) : (
                          <div className="py-2">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Upload background image
                            </p>
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
                  </div>
                </div>

                {/* Android Mask Shape */}
                {activeTab === 'android' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Preview Mask Shape</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {ANDROID_MASKS.map((mask) => {
                        const Icon = mask.icon;
                        return (
                          <button
                            key={mask.id}
                            onClick={() => setAndroidMask(mask.id as typeof androidMask)}
                            className={cn(
                              'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                              androidMask === mask.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card hover:bg-accent border-border'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px]">{mask.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Android applies different masks per device. Test with multiple shapes.
                    </p>
                  </div>
                )}

                {/* Overlay Controls */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Overlay Guides
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {showSafeZone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="text-sm">Safe Zone</span>
                      </div>
                      <Switch checked={showSafeZone} onCheckedChange={setShowSafeZone} />
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Red dashed line shows the guaranteed visible area
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {showKeylines ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="text-sm">Keyline Grid</span>
                      </div>
                      <Switch checked={showKeylines} onCheckedChange={setShowKeylines} />
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Blue grid helps center and align your icon
                    </p>
                  </div>
                </div>

                {/* Size Specifications */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Export Sizes</Label>
                  <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto p-2 rounded bg-muted/50">
                    {(activeTab === 'android' ? ANDROID_SIZES : activeTab === 'ios' ? IOS_SIZES : PWA_SIZES).map((spec, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{spec.name}</span>
                        <Badge variant="outline" className="text-[10px]">{spec.size}px</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right Panel - Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <canvas
                  ref={previewCanvasRef}
                  className="border rounded-lg shadow-lg"
                  style={{ width: 300, height: 300 }}
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="text-xs">
                    512×512 Preview
                  </Badge>
                </div>
              </div>

              {/* Platform-specific info */}
              <TabsContent value="android" className="mt-0 w-full">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                  <p className="font-medium text-green-600 dark:text-green-400">Android Adaptive Icons</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Exports separate foreground and background layers. The OS applies masks and parallax effects.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="ios" className="mt-0 w-full">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                  <p className="font-medium text-blue-600 dark:text-blue-400">iOS App Icons</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Exports all required sizes for App Store submission with proper corner radius applied.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="pwa" className="mt-0 w-full">
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
                  <p className="font-medium text-purple-600 dark:text-purple-400">PWA Icons</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Includes maskable icons for Android home screen and standard icons for other platforms.
                  </p>
                </div>
              </TabsContent>

              {/* Export Button */}
              <Button
                onClick={exportIcons}
                disabled={isExporting || !foregroundImage}
                className="w-full gap-2"
                size="lg"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Generating...' : `Export ${activeTab.toUpperCase()} Icons`}
              </Button>

              {!foregroundImage && (
                <p className="text-xs text-muted-foreground text-center">
                  Upload a foreground image to enable export
                </p>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
