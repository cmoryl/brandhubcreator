/**
 * BoothMapper3D - Full 3D booth visualization with panel image mapping
 * 
 * Features:
 * - 4 booth layouts (inline, L-shape, U-shape, island)
 * - Click panels to assign images
 * - Orbit & zoom controls
 * - Panel labels & dimensions
 * - Lighting presets
 * - Screenshot export
 * - Auto-fill from variant images
 */
import { useState, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Camera, Download, Sun, Tag, Ruler, RotateCcw, Image as ImageIcon,
  Loader2, Sparkles, Layout, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BoothScene3D } from './BoothScene3D';
import {
  getBoothPanels,
  LAYOUT_OPTIONS,
  LIGHTING_PRESETS,
  type BoothLayout,
  type LightingPreset,
  type PanelConfig,
  type PanelAssignment,
} from './boothConfigs';

interface BoothMapper3DProps {
  /** Available booth variant images to assign to panels */
  variantImages: { label: string; url: string }[];
  /** Gallery images that can be assigned */
  galleryImages?: string[];
  /** Division name for display */
  divisionName?: string;
  /** Callback when assignments change */
  onAssignmentsChange?: (assignments: PanelAssignment[]) => void;
}

export function BoothMapper3D({
  variantImages,
  galleryImages = [],
  divisionName,
  onAssignmentsChange,
}: BoothMapper3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<BoothLayout>('u-shape');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('expo-bright');
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const boothConfig = getBoothPanels(layout);

  // Apply assignments to panels
  const panels: PanelConfig[] = boothConfig.panels.map((p) => ({
    ...p,
    imageUrl: assignments[p.id],
  }));

  const handleSelectPanel = useCallback((panelId: string) => {
    setSelectedPanelId(panelId);
    setImagePickerOpen(true);
  }, []);

  const handleAssignImage = useCallback((imageUrl: string) => {
    if (!selectedPanelId) return;
    setAssignments((prev) => {
      const next = { ...prev, [selectedPanelId]: imageUrl };
      onAssignmentsChange?.(
        Object.entries(next).map(([panelId, url]) => ({ panelId, imageUrl: url }))
      );
      return next;
    });
    setImagePickerOpen(false);
    setSelectedPanelId(null);
    toast.success('Panel image assigned');
  }, [selectedPanelId, onAssignmentsChange]);

  const handleClearPanel = useCallback(() => {
    if (!selectedPanelId) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[selectedPanelId];
      onAssignmentsChange?.(
        Object.entries(next).map(([panelId, url]) => ({ panelId, imageUrl: url }))
      );
      return next;
    });
    setImagePickerOpen(false);
    setSelectedPanelId(null);
  }, [selectedPanelId, onAssignmentsChange]);

  const handleAutoFill = useCallback(() => {
    const newAssignments: Record<string, string> = {};
    boothConfig.panels.forEach((panel, i) => {
      if (variantImages[i]) {
        newAssignments[panel.id] = variantImages[i].url;
      }
    });
    setAssignments(newAssignments);
    onAssignmentsChange?.(
      Object.entries(newAssignments).map(([panelId, imageUrl]) => ({ panelId, imageUrl }))
    );
    toast.success(`Auto-filled ${Object.keys(newAssignments).length} panels`);
  }, [boothConfig.panels, variantImages, onAssignmentsChange]);

  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `booth-3d-${layout}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Screenshot saved');
    } catch {
      toast.error('Failed to capture screenshot');
    }
  }, [layout]);

  const handleResetView = useCallback(() => {
    setAssignments({});
    onAssignmentsChange?.([]);
    toast.success('All panels cleared');
  }, [onAssignmentsChange]);

  const allImages = [
    ...variantImages.map((v) => ({ url: v.url, label: v.label, source: 'variant' as const })),
    ...galleryImages.map((url, i) => ({ url, label: `Gallery ${i + 1}`, source: 'gallery' as const })),
  ];

  const assignedCount = Object.keys(assignments).length;
  const totalPanels = boothConfig.panels.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Layout picker */}
        <Select value={layout} onValueChange={(v) => { setLayout(v as BoothLayout); setAssignments({}); }}>
          <SelectTrigger className="w-[160px] h-9">
            <Layout className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LAYOUT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-muted-foreground ml-1.5 text-xs">· {opt.desc}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Lighting */}
        <Select value={lightingPreset} onValueChange={(v) => setLightingPreset(v as LightingPreset)}>
          <SelectTrigger className="w-[150px] h-9">
            <Sun className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIGHTING_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-border" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showLabels} onPressedChange={setShowLabels} size="sm" aria-label="Toggle labels">
                <Tag className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Panel Labels</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showDimensions} onPressedChange={setShowDimensions} size="sm" aria-label="Toggle dimensions">
                <Ruler className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Dimensions</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-6 w-px bg-border" />

        {variantImages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleAutoFill} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Auto-fill
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={handleScreenshot} className="gap-1.5">
          <Camera className="h-3.5 w-3.5" />
          Screenshot
        </Button>

        <Button variant="ghost" size="sm" onClick={handleResetView} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {boothConfig.dimensions}
          </Badge>
          <Badge variant={assignedCount === totalPanels ? 'default' : 'secondary'} className="text-xs">
            {assignedCount}/{totalPanels} panels
          </Badge>
        </div>
      </div>

      {/* 3D Canvas */}
      <Card className="overflow-hidden border">
        <div className="relative h-[500px] md:h-[600px]">
          <Canvas
            ref={canvasRef}
            shadows
            camera={{ position: [6, 4, 6], fov: 45 }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <BoothScene3D
                panels={panels}
                selectedPanelId={selectedPanelId}
                onSelectPanel={handleSelectPanel}
                lightingPreset={lightingPreset}
                showLabels={showLabels}
                showDimensions={showDimensions}
              />
            </Suspense>
          </Canvas>

          {/* Loading overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Suspense fallback={
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading 3D scene...</span>
              </div>
            }>
              <></>
            </Suspense>
          </div>

          {/* Orbit hint */}
          <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/60 bg-background/50 backdrop-blur-sm rounded px-2 py-1">
            Drag to orbit · Scroll to zoom · Click panel to assign image
          </div>
        </div>
      </Card>

      {/* Panel summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {boothConfig.panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => handleSelectPanel(panel.id)}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors text-left",
              assignments[panel.id]
                ? "border-primary/30 bg-primary/5"
                : "border-dashed border-muted-foreground/30 hover:border-primary/50"
            )}
          >
            {assignments[panel.id] ? (
              <img src={assignments[panel.id]} alt={panel.label} className="h-10 w-14 object-cover rounded" />
            ) : (
              <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{panel.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {assignments[panel.id] ? 'Assigned' : 'Empty'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Image Picker Dialog */}
      <Dialog open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Assign Image to {boothConfig.panels.find((p) => p.id === selectedPanelId)?.label}
            </DialogTitle>
          </DialogHeader>

          {allImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No images available</p>
              <p className="text-sm mt-1">Upload booth variant images first</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              {/* Variant images */}
              {variantImages.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Booth Variants</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {variantImages.map((img) => (
                      <button
                        key={img.url}
                        onClick={() => handleAssignImage(img.url)}
                        className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      >
                        <img src={img.url} alt={img.label} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <span className="text-xs text-white font-medium">{img.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery images */}
              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Gallery Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => handleAssignImage(url)}
                        className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      >
                        <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-video object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          )}

          <div className="flex justify-between pt-2 border-t">
            {assignments[selectedPanelId || ''] && (
              <Button variant="destructive" size="sm" onClick={handleClearPanel}>
                Remove Image
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setImagePickerOpen(false)} className="ml-auto">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
