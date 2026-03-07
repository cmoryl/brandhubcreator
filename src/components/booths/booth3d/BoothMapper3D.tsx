/**
 * BoothMapper3D - Full 3D booth visualization with panel image mapping
 * 
 * Features:
 * - 4 booth layouts (inline, L-shape, U-shape, island)
 * - Click panels to assign images
 * - Upload booth spec images/PDFs for AI mapping
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
  Loader2, Sparkles, Layout, Upload, Wand2, FolderOpen, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useImageLibrary } from '@/hooks/useImageLibrary';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [layout, setLayout] = useState<BoothLayout>('u-shape');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('expo-bright');
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [uploadedSpecs, setUploadedSpecs] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [pickerTab, setPickerTab] = useState<string>('sources');

  // Image library integration
  const { images: libraryImages, isLoading: libraryLoading, fetchImages, uploadImage } = useImageLibrary();

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

  // Upload booth spec image/PDF
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Please upload an image (JPG, PNG) or PDF file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `booth-3d-specs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setUploadedSpecs(prev => [...prev, { url: urlData.publicUrl, name: file.name }]);
        toast.success(`Uploaded: ${file.name}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // AI-powered spec mapping
  const handleAiMapping = useCallback(async (specUrl: string) => {
    setIsAiMapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('booth-3d-ai-mapper', {
        body: {
          imageUrl: specUrl,
          layout,
          panelIds: boothConfig.panels.map(p => p.id),
          panelLabels: boothConfig.panels.map(p => p.label),
        },
      });

      if (error) throw error;

      if (data?.assignments?.length) {
        const newAssignments: Record<string, string> = { ...assignments };
        let mapped = 0;
        for (const assignment of data.assignments) {
          if (assignment.useFullImage && assignment.panelId) {
            newAssignments[assignment.panelId] = specUrl;
            mapped++;
          }
        }
        setAssignments(newAssignments);
        onAssignmentsChange?.(
          Object.entries(newAssignments).map(([panelId, imageUrl]) => ({ panelId, imageUrl }))
        );

        const notes = [
          data.boothDescription && `📋 ${data.boothDescription}`,
          data.designNotes && `💡 ${data.designNotes}`,
          data.suggestedLayout && data.suggestedLayout !== layout && `🔄 AI suggests "${data.suggestedLayout}" layout for this spec`,
        ].filter(Boolean).join('\n');

        toast.success(`AI mapped spec to ${mapped} panel(s)`, { description: notes, duration: 6000 });
      } else {
        toast.info('AI could not identify specific panels. Try assigning manually.');
      }
    } catch (err) {
      console.error('AI mapping error:', err);
      toast.error(err instanceof Error ? err.message : 'AI mapping failed');
    } finally {
      setIsAiMapping(false);
    }
  }, [layout, boothConfig.panels, assignments, onAssignmentsChange]);

  const allImages = [
    ...uploadedSpecs.map((s) => ({ url: s.url, label: s.name, source: 'upload' as const })),
    ...variantImages.map((v) => ({ url: v.url, label: v.label, source: 'variant' as const })),
    ...galleryImages.map((url, i) => ({ url, label: `Gallery ${i + 1}`, source: 'gallery' as const })),
  ];

  const assignedCount = Object.keys(assignments).length;
  const totalPanels = boothConfig.panels.length;

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

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

        {/* Upload Spec */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-1.5"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload Spec
        </Button>

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
            {boothConfig.dimensions} · {boothConfig.footprint}
          </Badge>
          <Badge variant={assignedCount === totalPanels ? 'default' : 'secondary'} className="text-xs">
            {assignedCount}/{totalPanels} panels
          </Badge>
        </div>
      </div>

      {/* Uploaded Specs Row */}
      {uploadedSpecs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Uploaded Specs:</span>
          {uploadedSpecs.map((spec, i) => (
            <div key={spec.url} className="flex items-center gap-1.5 bg-background rounded-md border px-2 py-1">
              <img src={spec.url} alt={spec.name} className="h-8 w-12 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-xs truncate max-w-[120px]">{spec.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 gap-1 text-xs"
                onClick={() => handleAiMapping(spec.url)}
                disabled={isAiMapping}
              >
                {isAiMapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI Map
              </Button>
            </div>
          ))}
        </div>
      )}

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

          {/* AI Mapping overlay */}
          {isAiMapping && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 bg-background/90 rounded-xl px-6 py-4 border shadow-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">AI Analyzing Booth Spec</p>
                  <p className="text-xs text-muted-foreground mt-1">Identifying panels and mapping content...</p>
                </div>
              </div>
            </div>
          )}

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
                {panel.specLabel || ''} {assignments[panel.id] ? '· Assigned' : '· Empty'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Image Picker Dialog */}
      <Dialog open={imagePickerOpen} onOpenChange={(open) => { setImagePickerOpen(open); if (open) fetchImages(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Assign Image to {boothConfig.panels.find((p) => p.id === selectedPanelId)?.label}
            </DialogTitle>
            <DialogDescription>
              Select from your image library, uploaded specs, booth variants, or gallery.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={pickerTab} onValueChange={setPickerTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sources" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Booth Sources
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Image Library
              </TabsTrigger>
            </TabsList>

            {/* Booth Sources Tab */}
            <TabsContent value="sources" className="mt-3">
              {allImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No images available</p>
                  <p className="text-sm mt-1">Use the Image Library tab, upload a spec, or add booth variant images</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPickerTab('library')}>
                      <FolderOpen className="h-3.5 w-3.5" />
                      Browse Library
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setImagePickerOpen(false); fileInputRef.current?.click(); }}>
                      <Upload className="h-3.5 w-3.5" />
                      Upload Spec
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="max-h-[50vh]">
                  {uploadedSpecs.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        Uploaded Specs
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {uploadedSpecs.map((spec) => (
                          <button key={spec.url} onClick={() => handleAssignImage(spec.url)} className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors">
                            <img src={spec.url} alt={spec.name} className="w-full aspect-video object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <span className="text-xs text-white font-medium truncate block">{spec.name}</span>
                            </div>
                            <div className="absolute top-1 right-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Uploaded</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {variantImages.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Booth Variants</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {variantImages.map((img) => (
                          <button key={img.url} onClick={() => handleAssignImage(img.url)} className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors">
                            <img src={img.url} alt={img.label} className="w-full aspect-video object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <span className="text-xs text-white font-medium">{img.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {galleryImages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Gallery Photos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {galleryImages.map((url, i) => (
                          <button key={url} onClick={() => handleAssignImage(url)} className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors">
                            <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-video object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            {/* Image Library Tab */}
            <TabsContent value="library" className="mt-3">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search image library..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading library...</span>
                </div>
              ) : libraryImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Image library is empty</p>
                  <p className="text-sm mt-1">Upload images to your organization's library first</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[50vh]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {libraryImages
                      .filter((img) => {
                        if (!librarySearch) return true;
                        const s = librarySearch.toLowerCase();
                        return (img.file_name?.toLowerCase().includes(s)) || (img.alt_text?.toLowerCase().includes(s)) || (img.category?.toLowerCase().includes(s));
                      })
                      .map((img) => (
                        <button
                          key={img.id}
                          onClick={() => handleAssignImage(img.url)}
                          className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
                        >
                          <img src={img.url} alt={img.alt_text || img.file_name} className="w-full aspect-video object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="text-xs text-white font-medium truncate block">{img.file_name || img.alt_text || 'Image'}</span>
                          </div>
                          {img.category && (
                            <div className="absolute top-1 right-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{img.category}</Badge>
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-2 border-t">
            <div className="flex gap-2">
              {assignments[selectedPanelId || ''] && (
                <Button variant="destructive" size="sm" onClick={handleClearPanel}>
                  Remove Image
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setImagePickerOpen(false); fileInputRef.current?.click(); }}>
                <Upload className="h-3.5 w-3.5" />
                Upload New
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setImagePickerOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Assign Image to {boothConfig.panels.find((p) => p.id === selectedPanelId)?.label}
            </DialogTitle>
            <DialogDescription>
              Select an image from your uploaded specs, booth variants, or gallery to map onto this panel.
            </DialogDescription>
          </DialogHeader>

          {allImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No images available</p>
              <p className="text-sm mt-1">Upload a booth spec or add booth variant images first</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => { setImagePickerOpen(false); fileInputRef.current?.click(); }}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Spec Image
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              {/* Uploaded spec images */}
              {uploadedSpecs.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Uploaded Specs
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {uploadedSpecs.map((spec) => (
                      <button
                        key={spec.url}
                        onClick={() => handleAssignImage(spec.url)}
                        className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      >
                        <img src={spec.url} alt={spec.name} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <span className="text-xs text-white font-medium truncate block">{spec.name}</span>
                        </div>
                        <div className="absolute top-1 right-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Uploaded</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
            <div className="flex gap-2">
              {assignments[selectedPanelId || ''] && (
                <Button variant="destructive" size="sm" onClick={handleClearPanel}>
                  Remove Image
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => { setImagePickerOpen(false); fileInputRef.current?.click(); }}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload New
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setImagePickerOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
