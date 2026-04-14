/**
 * ARPreviewPanel - Dedicated AR Preview tab for booth 3D mapper
 * Phase 1: GLB/USDZ export with content selection
 * Phase 2: model-viewer WebAR with QR code for phone viewing
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Dynamically load model-viewer script only when this panel is used
const MODEL_VIEWER_URL = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
let modelViewerLoaded = false;
let modelViewerPromise: Promise<void> | null = null;

function ensureModelViewer(): Promise<void> {
  if (modelViewerLoaded) return Promise.resolve();
  if (modelViewerPromise) return modelViewerPromise;
  modelViewerPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_URL;
    script.onload = () => { modelViewerLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return modelViewerPromise;
}

// Declare model-viewer as a custom element for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
      }, HTMLElement>;
    }
  }
}
import {
  Download, Smartphone, QrCode, Loader2, CheckSquare, Square,
  Box, Users, Armchair, Layers, Building2, Eye, Share2, Copy,
  ExternalLink, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  exportToGLB,
  exportToUSDZ,
  downloadBlob,
  blobToDataUrl,
  type ExportOptions,
} from './boothExporter';

interface ARPreviewPanelProps {
  /** Reference to the Three.js scene (from Canvas) */
  getScene: () => THREE.Scene | null;
  /** Booth layout name for file naming */
  layoutName?: string;
  /** Division name for display */
  divisionName?: string;
  /** Whether admin */
  isAdmin?: boolean;
}

interface ContentLayer {
  key: keyof ExportOptions;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

const CONTENT_LAYERS: ContentLayer[] = [
  { key: 'includePanels', label: 'Booth Panels', description: 'Walls with branded graphics', icon: <Layers className="h-4 w-4" />, defaultEnabled: true },
  { key: 'includeFurniture', label: 'Furniture', description: 'Tables, chairs, monitors, props', icon: <Armchair className="h-4 w-4" />, defaultEnabled: true },
  { key: 'includeFloor', label: 'Floor', description: 'Booth floorpad and carpet', icon: <Box className="h-4 w-4" />, defaultEnabled: true },
  { key: 'includePeople', label: 'People', description: 'Character sprites for scale', icon: <Users className="h-4 w-4" />, defaultEnabled: false },
  { key: 'includeEnvironment', label: 'Expo Hall', description: 'Full exhibition environment', icon: <Building2 className="h-4 w-4" />, defaultEnabled: false },
];

export function ARPreviewPanel({
  getScene,
  layoutName = 'booth',
  divisionName,
  isAdmin = false,
}: ARPreviewPanelProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>(() => ({
    includePanels: true,
    includeFurniture: true,
    includePeople: false,
    includeFloor: true,
    includeEnvironment: false,
  }));
  const [isExporting, setIsExporting] = useState<'glb' | 'usdz' | null>(null);
  const [glbPreviewUrl, setGlbPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('export');
  const [modelViewerReady, setModelViewerReady] = useState(modelViewerLoaded);

  // Load model-viewer script dynamically when a GLB preview is generated
  useEffect(() => {
    if (glbPreviewUrl && !modelViewerReady) {
      ensureModelViewer().then(() => setModelViewerReady(true)).catch(() => {});
    }
  }, [glbPreviewUrl, modelViewerReady]);

  const filePrefix = useMemo(() => {
    const parts = ['booth-3d'];
    if (divisionName) parts.push(divisionName.toLowerCase().replace(/\s+/g, '-'));
    if (layoutName) parts.push(layoutName);
    return parts.join('-');
  }, [divisionName, layoutName]);

  const toggleLayer = useCallback((key: keyof ExportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const enabledLayerCount = useMemo(() =>
    CONTENT_LAYERS.filter(l => exportOptions[l.key]).length,
    [exportOptions]
  );

  const handleExportGLB = useCallback(async () => {
    const scene = getScene();
    if (!scene) {
      toast.error('Scene not ready. Please wait for 3D view to load.');
      return;
    }
    setIsExporting('glb');
    try {
      const blob = await exportToGLB(scene, exportOptions);
      downloadBlob(blob, `${filePrefix}-${Date.now()}.glb`);
      toast.success('GLB exported successfully', {
        description: `${(blob.size / 1024 / 1024).toFixed(1)}MB — open in any 3D viewer or AR app`,
      });
    } catch (err) {
      console.error('GLB export error:', err);
      toast.error('Failed to export GLB');
    } finally {
      setIsExporting(null);
    }
  }, [getScene, exportOptions, filePrefix]);

  const handleExportUSDZ = useCallback(async () => {
    const scene = getScene();
    if (!scene) {
      toast.error('Scene not ready. Please wait for 3D view to load.');
      return;
    }
    setIsExporting('usdz');
    try {
      const blob = await exportToUSDZ(scene, exportOptions);
      downloadBlob(blob, `${filePrefix}-${Date.now()}.usdz`);
      toast.success('USDZ exported for Apple AR', {
        description: `${(blob.size / 1024 / 1024).toFixed(1)}MB — open on iPhone/iPad for AR Quick Look`,
      });
    } catch (err) {
      console.error('USDZ export error:', err);
      toast.error('Failed to export USDZ');
    } finally {
      setIsExporting(null);
    }
  }, [getScene, exportOptions, filePrefix]);

  const handleGeneratePreview = useCallback(async () => {
    const scene = getScene();
    if (!scene) {
      toast.error('Scene not ready');
      return;
    }
    setIsGeneratingPreview(true);
    try {
      const blob = await exportToGLB(scene, exportOptions);
      const url = await blobToDataUrl(blob);
      setGlbPreviewUrl(url);
      toast.success('AR preview ready');
    } catch (err) {
      console.error('Preview generation error:', err);
      toast.error('Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [getScene, exportOptions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AR Preview</h3>
            <p className="text-[10px] text-muted-foreground">Export & view booth in augmented reality</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          <Sparkles className="h-3 w-3 mr-1" />
          Phase 1
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="export" className="text-xs h-7">
            <Download className="h-3 w-3 mr-1" />
            Export
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs h-7">
            <Eye className="h-3 w-3 mr-1" />
            WebAR
          </TabsTrigger>
          <TabsTrigger value="share" className="text-xs h-7">
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </TabsTrigger>
        </TabsList>

        {/* ── Export Tab ── */}
        <TabsContent value="export" className="space-y-4 mt-3">
          {/* Content Selection */}
          <Card className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">Content Layers</h4>
              <Badge variant="secondary" className="text-[10px]">
                {enabledLayerCount}/{CONTENT_LAYERS.length} active
              </Badge>
            </div>
            <div className="space-y-2">
              {CONTENT_LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left",
                    exportOptions[layer.key]
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "shrink-0",
                    exportOptions[layer.key] ? "text-primary" : "text-muted-foreground"
                  )}>
                    {exportOptions[layer.key]
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />
                    }
                  </div>
                  <div className={cn(
                    "shrink-0",
                    exportOptions[layer.key] ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {layer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium", exportOptions[layer.key] ? "text-foreground" : "text-muted-foreground")}>
                      {layer.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{layer.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-500">GL</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">GLB</p>
                  <p className="text-[9px] text-muted-foreground">Universal 3D</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Works with Android AR, Blender, Unity, web viewers, and most 3D apps.
              </p>
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={handleExportGLB}
                disabled={isExporting !== null || enabledLayerCount === 0}
              >
                {isExporting === 'glb' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export .glb
              </Button>
            </Card>

            <Card className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-orange-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-500">AR</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">USDZ</p>
                  <p className="text-[9px] text-muted-foreground">Apple AR</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Native AR Quick Look on iPhone & iPad. Tap to place booth in real space.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1.5"
                onClick={handleExportUSDZ}
                disabled={isExporting !== null || enabledLayerCount === 0}
              >
                {isExporting === 'usdz' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export .usdz
              </Button>
            </Card>
          </div>

          {/* Tips */}
          <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 bg-muted/30">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">💡 Tips:</span> GLB works on Android phones with Scene Viewer and in most 3D apps. 
              USDZ files open natively on iPhones — recipients can tap the file to see your booth in AR. 
              For lighter files, disable Expo Hall and People layers.
            </p>
          </div>
        </TabsContent>

        {/* ── WebAR Tab ── */}
        <TabsContent value="preview" className="space-y-4 mt-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground">WebAR Preview</h4>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Generate a 3D model preview that can be viewed in AR directly from a phone browser. 
              Uses Google's model-viewer for cross-platform AR support.
            </p>

            <Button
              size="sm"
              className="w-full h-9 text-xs gap-1.5"
              onClick={handleGeneratePreview}
              disabled={isGeneratingPreview || enabledLayerCount === 0}
            >
              {isGeneratingPreview ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {glbPreviewUrl ? 'Regenerate Preview' : 'Generate AR Preview'}
            </Button>

            {glbPreviewUrl && (
              <div className="space-y-3">
                <Separator />
                {/* Inline model-viewer preview */}
                <div className="rounded-lg border bg-muted/50 overflow-hidden aspect-video relative">
                  {/* @ts-ignore - model-viewer is a web component */}
                  <model-viewer
                    src={glbPreviewUrl}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    shadow-intensity="1"
                    style={{ width: '100%', height: '100%' }}
                  >
                    <button slot="ar-button" className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                      📱 View in AR
                    </button>
                  </model-viewer>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  On mobile? Tap "View in AR" to place the booth in your real space.
                </p>
              </div>
            )}
          </Card>

          {/* model-viewer script notice */}
          <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 bg-muted/30">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">ℹ️ WebAR Support:</span>{' '}
              AR viewing requires a compatible device — iPhone (AR Quick Look via USDZ), Android (Scene Viewer via GLB), 
              or Chrome on Android (WebXR). Desktop browsers show a 3D preview only.
            </p>
          </div>
        </TabsContent>

        {/* ── Share Tab ── */}
        <TabsContent value="share" className="space-y-4 mt-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold text-foreground">Share AR Experience</h4>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Share your booth's AR model with clients and stakeholders. Export the 3D file and send it directly — 
              they can open it on their phone to see the booth in real scale.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-blue-500">GLB</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-foreground">Send .glb to Android users</p>
                  <p className="text-[9px] text-muted-foreground">Opens in Scene Viewer automatically</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0" onClick={handleExportGLB} disabled={isExporting !== null}>
                  <Download className="h-3 w-3" />
                  GLB
                </Button>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 rounded bg-orange-500/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-orange-500">AR</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-foreground">Send .usdz to iPhone users</p>
                  <p className="text-[9px] text-muted-foreground">Tap to open in AR Quick Look</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0" onClick={handleExportUSDZ} disabled={isExporting !== null}>
                  <Download className="h-3 w-3" />
                  USDZ
                </Button>
              </div>
            </div>

            <Separator />

            {/* Future: WebAR link generation */}
            <div className="rounded-lg border border-dashed border-primary/20 p-3 bg-primary/5">
              <div className="flex items-center gap-2 mb-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-semibold text-foreground">WebAR Link</p>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0">Coming Soon</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Generate a shareable URL that opens AR directly in any phone browser — no app download needed. 
                Includes QR code for easy scanning at presentations.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
