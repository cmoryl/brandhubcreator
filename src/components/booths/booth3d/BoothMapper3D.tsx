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
import { useState, useCallback, useRef, useEffect, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Canvas } from '@react-three/fiber';
import {
  Camera, Download, Sun, Tag, Ruler, RotateCcw, Image as ImageIcon,
  Loader2, Sparkles, Layout, Upload, Wand2, FolderOpen, Search,
  Users, Route, Building2, BookTemplate, Lightbulb, ScanLine,
  Move, Plus, Trash2, Monitor, Table2, Armchair, Flag, Box,
  Palette, Shirt, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw,
  BarChart3, Smartphone, Presentation
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { BoothPresetPicker } from './BoothPresetPicker';
import { parseAllSpecs, generatePanelsFromSpecs, parseMonitorSpecs, type ParsedPanelSpec, type MonitorSpec } from './specParser';
import type { BoothDesignPreset } from './boothPresets';
import {
  FURNITURE_CATALOG,
  CATEGORY_LABELS,
  getFurnitureById,
  type PlacedAsset,
  type FurnitureCategory,
} from './boothFurnitureConfigs';
import {
  ENVIRONMENT_PRESETS,
  getEnvironmentConfig,
  type EnvironmentRealism,
} from './environmentPresets';
import type { WalkthroughMode } from './CameraAnimator';
import { useCharacterSprites } from './useCharacterSprites';
import { FLOORING_OPTIONS, FLOOR_COLOR_PRESETS, type FlooringConfig, type FlooringType } from './BoothFloorpad';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  type BoothLightingConfig, type PrintStyle, type ParCanColor, type ColorTemperature,
  getDefaultBoothLighting, PRINT_STYLE_OPTIONS, PAR_CAN_OPTIONS, TEMPERATURE_OPTIONS,
} from './boothLightingConfig';
import { CrowdSimulationPanel } from './CrowdSimulationPanel';
import type { CrowdSimulationData } from './crowdSimulationTypes';
import { ARPreviewPanel } from './ARPreviewPanel';
import { SalesDeckPanel } from './SalesDeckPanel';
import { BoothWorkspace, type BoothMode } from './BoothWorkspace';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { InspectorPanel } from './InspectorPanel';
import { SceneLayersPanel, type SceneLayer } from './SceneLayersPanel';
import { MiniMapOverlay } from './MiniMapOverlay';
import { BoothScorePanel, type BoothScoreData } from './BoothScorePanel';
import { BoothDesignToolbar } from './BoothDesignToolbar';
import { BoothLeftPanel } from './BoothLeftPanel';
import { EnvironmentPresetCards } from './EnvironmentPresetCards';
import { PanelDesigner } from './PanelDesigner';

interface BoothMapper3DProps {
  /** Available booth variant images to assign to panels */
  variantImages: { label: string; url: string }[];
  /** Gallery images that can be assigned */
  galleryImages?: string[];
  /** Division name for display */
  divisionName?: string;
  /** Division ID for persistence */
  divisionId?: string;
  /** Current booth variant label for per-variant 3D persistence */
  variantLabel?: string;
  /** Whether current user has admin edit permissions */
  isAdmin?: boolean;
  /** Callback when assignments change */
  onAssignmentsChange?: (assignments: PanelAssignment[]) => void;
}

/** Tiny bridge component to capture the Three.js scene reference from inside the Canvas */
function SceneBridge({ sceneRef }: { sceneRef: React.MutableRefObject<THREE.Scene | null> }) {
  const { scene } = useThree();
  sceneRef.current = scene;
  return null;
}

export function BoothMapper3D({
  variantImages,
  galleryImages = [],
  divisionName,
  divisionId,
  variantLabel = 'default',
  isAdmin = false,
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
  const [backAssignments, setBackAssignments] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [assigningSide, setAssigningSide] = useState<'front' | 'back'>('front');
  const [uploadedSpecs, setUploadedSpecs] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [pickerTab, setPickerTab] = useState<string>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [environmentRealism, setEnvironmentRealism] = useState<EnvironmentRealism>('standard');
  const [showPeople, setShowPeople] = useState(false);
  const [showTrafficFlow, setShowTrafficFlow] = useState(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<string | null>(null);
  const [cameraVersion, setCameraVersion] = useState(0);
  const [walkthroughMode, setWalkthroughMode] = useState<WalkthroughMode>('none');
  const [cameraPanelOpen, setCameraPanelOpen] = useState(true);
  const characterSprites = useCharacterSprites();
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<BoothDesignPreset | null>(null);
  const [prodSpecs, setProdSpecs] = useState<ParsedPanelSpec[]>([]);
  const [monitorSpecs, setMonitorSpecs] = useState<MonitorSpec[]>([]);
  const [specConfigType, setSpecConfigType] = useState<string>('');
  const [useProductionSpecs, setUseProductionSpecs] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag mode & furniture state
  const [isDragMode, setIsDragMode] = useState(false);
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  // Flooring state
  const [flooringConfig, setFlooringConfig] = useState<FlooringConfig>({
    type: 'carpet-plush',
    color: '#1a1a2e',
    showBorder: true,
    showDimensions: true,
  });
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  // Booth lighting & print material
  const [boothLighting, setBoothLighting] = useState<BoothLightingConfig>(getDefaultBoothLighting());
  const [printStyle, setPrintStyle] = useState<PrintStyle>('fabric-matte');
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetFilterCategory, setAssetFilterCategory] = useState<string>('all');
  const [panelPositionOverrides, setPanelPositionOverrides] = useState<Record<string, [number, number, number]>>({});
  const [coverImagePickerOpen, setCoverImagePickerOpen] = useState(false);
  const [coverImageTargetAssetId, setCoverImageTargetAssetId] = useState<string | null>(null);
  // Crowd simulation state
  const [crowdSimulation, setCrowdSimulation] = useState<CrowdSimulationData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showSimPanel, setShowSimPanel] = useState(false);
  // AR Preview state
  const [showARPanel, setShowARPanel] = useState(false);
  const [showSalesDeck, setShowSalesDeck] = useState(false);
  const [activeMode, setActiveMode] = useState<BoothMode>('design');
  const [boothScore, setBoothScore] = useState<BoothScoreData | null>(null);
  const [isScoringBooth, setIsScoringBooth] = useState(false);
  const [panelDesignerOpen, setPanelDesignerOpen] = useState(false);
  const [panelDesignerTarget, setPanelDesignerTarget] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  // Organization context for image library
  const { organization } = useOrganization();

  // Image library integration
  const { images: libraryImages, isLoading: libraryLoading, fetchImages, uploadImage } = useImageLibrary();

  // Fetch booth gallery photos for this division+variant
  const [boothGalleryUrls, setBoothGalleryUrls] = useState<string[]>([]);
  useEffect(() => {
    if (!divisionId) return;
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('booth_gallery_photos')
        .select('image_url, variant_label')
        .eq('division_id', divisionId)
        .order('display_order');
      if (data) {
        const filtered = data.filter(p =>
          p.variant_label === null || p.variant_label === variantLabel
        );
        setBoothGalleryUrls(filtered.map(p => p.image_url));
      }
    };
    fetchGallery();
  }, [divisionId, variantLabel]);

  // Merge passed galleryImages with fetched booth gallery photos
  const mergedGalleryImages = useMemo(() => {
    const set = new Set([...galleryImages, ...boothGalleryUrls]);
    return Array.from(set);
  }, [galleryImages, boothGalleryUrls]);

  // Eagerly fetch images when organization is available
  useEffect(() => {
    if (organization?.id) {
      fetchImages(organization.id);
    }
  }, [organization?.id, fetchImages]);

  // Filtered library images based on search + category
  const filteredLibraryImages = useMemo(() => {
    return libraryImages.filter((img) => {
      if (selectedCategory && img.category !== selectedCategory) return false;
      if (librarySearch) {
        const s = librarySearch.toLowerCase();
        return (img.name?.toLowerCase().includes(s)) || (img.category?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [libraryImages, librarySearch, selectedCategory]);

  // Load saved mapping from database on mount or variant change
  useEffect(() => {
    if (!divisionId) { setIsLoaded(true); return; }
    // Reset state when variant changes
    setIsLoaded(false);
    setLayout('inline');
    setAssignments({});
    setUploadedSpecs([]);
    setPlacedAssets([]);
    setPanelPositionOverrides({});
    const load = async () => {
      try {
        const { data } = await supabase
          .from('booth_3d_mappings')
          .select('*')
          .eq('division_id', divisionId)
          .eq('variant_label', variantLabel)
          .maybeSingle();
        if (data) {
          setLayout((data.layout as BoothLayout) || 'u-shape');
          setLightingPreset((data.lighting_preset as LightingPreset) || 'expo-bright');
          setAssignments((data.assignments as Record<string, string>) || {});
          setUploadedSpecs((data.uploaded_specs as { url: string; name: string }[]) || []);
          setShowLabels(data.show_labels ?? true);
          setShowDimensions(data.show_dimensions ?? true);
          // Load furniture assets and panel overrides from assignments JSONB
          const saved = data.assignments as any;
          if (saved?.__placedAssets) {
            setPlacedAssets(saved.__placedAssets as PlacedAsset[]);
          }
          if (saved?.__panelPositions) {
            setPanelPositionOverrides(saved.__panelPositions as Record<string, [number, number, number]>);
          }
        }
      } catch (e) {
        console.error('Failed to load 3D mapping:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [divisionId, variantLabel]);

  // Fetch production specs for this division (all categories, variant-aware)
  const [allProdSpecs, setAllProdSpecs] = useState<{ title: string; content: string; category: string }[]>([]);
  useEffect(() => {
    if (!divisionId) return;
    const fetchProdSpecs = async () => {
      try {
        const { data, error } = await supabase
          .from('booth_production_specs')
          .select('title, content, category, variant_label')
          .eq('division_id', divisionId)
          .order('display_order', { ascending: true });

        if (error || !data || data.length === 0) return;

        // Filter by variant: include specs with matching variant_label or null (shared)
        const filtered = data.filter(s =>
          s.variant_label === null || s.variant_label === (variantLabel || null)
        );

        setAllProdSpecs(filtered);

        // Parse content-sizing specs for panel generation
        const contentSizing = filtered.filter(s => s.category === 'content-sizing');
        const layouts = parseAllSpecs(contentSizing);
        if (layouts.length > 0) {
          const allParsed = layouts.flatMap(l => l.panels);
          setProdSpecs(allParsed);
          setSpecConfigType(layouts[0].configType);
          setUseProductionSpecs(true);
        }

        // Parse monitor specs from general category
        const monitors = parseMonitorSpecs(filtered);
        setMonitorSpecs(monitors);
      } catch (e) {
        console.error('Failed to load production specs:', e);
      }
    };
    fetchProdSpecs();
  }, [divisionId, variantLabel]);

  // Debounced save to database
  const saveMapping = useCallback(() => {
    if (!divisionId || !isLoaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Store placed assets and panel position overrides alongside assignments
        const enrichedAssignments = {
          ...assignments,
          __placedAssets: placedAssets,
          __panelPositions: panelPositionOverrides,
        } as unknown as Record<string, unknown>;
        await supabase.from('booth_3d_mappings').upsert({
          division_id: divisionId,
          variant_label: variantLabel,
          layout,
          lighting_preset: lightingPreset,
          assignments: enrichedAssignments as any,
          uploaded_specs: uploadedSpecs,
          show_labels: showLabels,
          show_dimensions: showDimensions,
          created_by: user.id,
        }, { onConflict: 'division_id,variant_label' });
      } catch (e) {
        console.error('Failed to save 3D mapping:', e);
      }
    }, 1000);
  }, [divisionId, variantLabel, layout, lightingPreset, assignments, uploadedSpecs, showLabels, showDimensions, isLoaded, placedAssets, panelPositionOverrides]);

  // Auto-save when state changes
  useEffect(() => {
    if (isLoaded) saveMapping();
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [saveMapping, isLoaded]);


  // Available spec config types for the dropdown
  const availableSpecTypes = useMemo(() => {
    const types = new Set(prodSpecs.map(s => s.configType).filter(Boolean));
    return Array.from(types);
  }, [prodSpecs]);

  // Generate panels: use production specs when available, fallback to generic layout
  const { boothConfig, specPanels } = useMemo(() => {
    const genericConfig = getBoothPanels(layout);
    
    if (useProductionSpecs && specConfigType && prodSpecs.length > 0) {
      const generated = generatePanelsFromSpecs(prodSpecs, specConfigType);
      if (generated.panels.length > 0) {
        return {
          boothConfig: {
            layout,
            dimensions: generated.dimensions,
            footprint: generated.footprint,
            panels: generated.panels.map(p => ({
              id: p.id,
              label: p.label,
              specLabel: p.specLabel,
              position: p.position,
              rotation: p.rotation,
              size: p.size,
              zones: p.zones,
            })),
          },
          specPanels: generated.panels,
        };
      }
    }

    return { boothConfig: genericConfig, specPanels: null };
  }, [layout, useProductionSpecs, specConfigType, prodSpecs]);

  // Apply assignments and position overrides to panels
  const panels: PanelConfig[] = boothConfig.panels.map((p) => ({
    ...p,
    imageUrl: assignments[p.id],
    backImageUrl: backAssignments[p.id],
    position: panelPositionOverrides[p.id] || p.position,
  }));

  // Panel position change handler (drag mode)
  const handlePanelPositionChange = useCallback((panelId: string, position: [number, number, number]) => {
    setPanelPositionOverrides(prev => ({ ...prev, [panelId]: position }));
  }, []);

  // Asset handlers
  const handleSelectAsset = useCallback((instanceId: string) => {
    setSelectedAssetId(instanceId);
  }, []);

  const handleAssetPositionChange = useCallback((instanceId: string, position: [number, number, number]) => {
    setPlacedAssets(prev => prev.map(a => a.instanceId === instanceId ? { ...a, position } : a));
  }, []);

  const handleAddAsset = useCallback((assetId: string) => {
    const config = getFurnitureById(assetId);
    if (!config) return;
    const defaultY = config.wallMountable ? 1.5 : 0; // Wall items start at ~eye level
    const newAsset: PlacedAsset = {
      instanceId: `${assetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetId,
      position: [0, defaultY, 2],
      rotation: [0, 0, 0],
      label: config.name,
    };
    setPlacedAssets(prev => [...prev, newAsset]);
    setAssetPickerOpen(false);
    setIsDragMode(true);
    setSelectedAssetId(newAsset.instanceId);
    toast.success(`Added ${config.name} — drag to position`);
  }, []);

  const handleRemoveAsset = useCallback((instanceId: string) => {
    setPlacedAssets(prev => prev.filter(a => a.instanceId !== instanceId));
    setSelectedAssetId(null);
    toast.success('Asset removed');
  }, []);

  const handleUpdateAsset = useCallback((instanceId: string, updates: Partial<PlacedAsset>) => {
    setPlacedAssets(prev => prev.map(a => a.instanceId === instanceId ? { ...a, ...updates } : a));
  }, []);

  const onAssetNudge = useCallback((instanceId: string, dx: number, dy: number, dz: number) => {
    setPlacedAssets(prev => prev.map(a => {
      if (a.instanceId !== instanceId) return a;
      return {
        ...a,
        position: [
          Math.round((a.position[0] + dx) * 10) / 10,
          Math.max(0, Math.round((a.position[1] + dy) * 10) / 10),
          Math.round((a.position[2] + dz) * 10) / 10,
        ] as [number, number, number],
      };
    }));
  }, []);

  // Keyboard shortcuts: Delete/Backspace removes, Arrow keys nudge selected asset
  useEffect(() => {
    if (!isAdmin || !selectedAssetId) return;
    const step = 0.1;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleRemoveAsset(selectedAssetId);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onAssetNudge(selectedAssetId, -step, 0, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onAssetNudge(selectedAssetId, step, 0, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            onAssetNudge(selectedAssetId, 0, step, 0);
          } else {
            onAssetNudge(selectedAssetId, 0, 0, -step);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            onAssetNudge(selectedAssetId, 0, -step, 0);
          } else {
            onAssetNudge(selectedAssetId, 0, 0, step);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin, selectedAssetId, handleRemoveAsset, onAssetNudge]);

  const handleOpenCoverImagePicker = useCallback((instanceId: string) => {
    setCoverImageTargetAssetId(instanceId);
    setCoverImagePickerOpen(true);
    if (organization?.id) fetchImages(organization.id);
  }, [organization?.id, fetchImages]);

  const handleAssignCoverImage = useCallback((imageUrl: string) => {
    if (!coverImageTargetAssetId) return;
    handleUpdateAsset(coverImageTargetAssetId, { tableCoverImageUrl: imageUrl });
    setCoverImagePickerOpen(false);
    setCoverImageTargetAssetId(null);
    toast.success('Cover image assigned');
  }, [coverImageTargetAssetId, handleUpdateAsset]);

  const handleSelectPanel = useCallback((panelId: string) => {
    if (isDragMode) return;
    if (!isAdmin) return;
    setSelectedPanelId(panelId);
    setAssigningSide('front');
    setImagePickerOpen(true);
  }, [isAdmin, isDragMode]);

  const handleAssignImage = useCallback((imageUrl: string) => {
    if (!selectedPanelId) return;
    if (assigningSide === 'back') {
      setBackAssignments((prev) => ({ ...prev, [selectedPanelId]: imageUrl }));
      toast.success('Back image assigned');
    } else {
      setAssignments((prev) => {
        const next = { ...prev, [selectedPanelId]: imageUrl };
        onAssignmentsChange?.(
          Object.entries(next).map(([panelId, url]) => ({ panelId, imageUrl: url }))
        );
        return next;
      });
      toast.success('Panel image assigned');
    }
    setImagePickerOpen(false);
    setSelectedPanelId(null);
  }, [selectedPanelId, assigningSide, onAssignmentsChange]);

  const handleClearPanel = useCallback(() => {
    if (!selectedPanelId) return;
    if (assigningSide === 'back') {
      setBackAssignments((prev) => {
        const next = { ...prev };
        delete next[selectedPanelId];
        return next;
      });
    } else {
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[selectedPanelId];
        onAssignmentsChange?.(
          Object.entries(next).map(([panelId, url]) => ({ panelId, imageUrl: url }))
        );
        return next;
      });
    }
    setImagePickerOpen(false);
    setSelectedPanelId(null);
  }, [selectedPanelId, assigningSide, onAssignmentsChange]);

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

  // Crowd simulation handler
  const handleRunSimulation = useCallback(async () => {
    setIsSimulating(true);
    setShowSimPanel(true);
    try {
      const { data, error } = await supabase.functions.invoke('booth-crowd-simulation', {
        body: {
          boothLayout: layout,
          panels: boothConfig.panels.map(p => ({
            label: p.label,
            position: p.position,
            size: p.size,
            specLabel: p.specLabel,
            imageUrl: assignments[p.id] || null,
          })),
          placedAssets: placedAssets.map(a => ({
            assetId: a.assetId,
            label: a.label,
            position: a.position,
          })),
          boothSize: boothConfig.footprint,
          divisionName,
        },
      });
      if (error) throw error;
      setCrowdSimulation(data);
      setShowHeatMap(true);
      toast.success(`Booth Visibility Score: ${data.visibilityScore}/100`);
    } catch (e: any) {
      console.error('Simulation error:', e);
      if (e?.status === 429) toast.error('Rate limit exceeded. Try again shortly.');
      else if (e?.status === 402) toast.error('AI credits exhausted. Please add credits.');
      else toast.error('Simulation failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSimulating(false);
    }
  }, [layout, boothConfig, assignments, placedAssets, divisionName]);

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
    setBackAssignments({});
    onAssignmentsChange?.([]);
    toast.success('All panels cleared');
  }, [onAssignmentsChange]);

  // Apply a design preset
  const handleApplyPreset = useCallback((preset: BoothDesignPreset) => {
    setLayout(preset.layout);
    setLightingPreset(preset.lighting);
    setActivePreset(preset);
    setShowEnvironment(true);
    setShowPeople(true);
    setPanelPositionOverrides({});
    setAssignments({});

    // Apply pre-placed furniture assets (deep-clone with fresh instance IDs)
    if (preset.placedAssets && preset.placedAssets.length > 0) {
      const cloned: PlacedAsset[] = preset.placedAssets.map((a) => ({
        ...a,
        instanceId: `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        position: [...a.position] as [number, number, number],
        rotation: [...a.rotation] as [number, number, number],
      }));
      setPlacedAssets(cloned);
      setIsDragMode(true);
    }

    // Apply flooring config
    if (preset.flooringConfig) {
      setFlooringConfig({ ...preset.flooringConfig });
    }

    const assetCount = preset.placedAssets?.length || 0;
    toast.success(`Applied "${preset.name}" preset — ${preset.industry}`, {
      description: `${preset.panelGuides.length} panels, ${assetCount} furniture pieces, ${preset.layout} layout`,
    });
  }, []);

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
    ...mergedGalleryImages.map((url, i) => ({ url, label: `Gallery ${i + 1}`, source: 'gallery' as const })),
  ];

  const assignedCount = Object.keys(assignments).length;
  const totalPanels = boothConfig.panels.length;

  // Scene layers for toggling visibility
  const sceneLayers: SceneLayer[] = [
    { id: 'structure', label: 'Structure', icon: <Box className="h-3.5 w-3.5" />, visible: true, count: panels.length },
    { id: 'graphics', label: 'Graphics', icon: <ImageIcon className="h-3.5 w-3.5" />, visible: true, count: assignedCount },
    { id: 'screens', label: 'Screens', icon: <Monitor className="h-3.5 w-3.5" />, visible: true, count: placedAssets.filter(a => getFurnitureById(a.assetId)?.hasScreen).length },
    { id: 'furniture', label: 'Furniture', icon: <Armchair className="h-3.5 w-3.5" />, visible: true, count: placedAssets.length },
    { id: 'lighting', label: 'Lighting', icon: <Lightbulb className="h-3.5 w-3.5" />, visible: showEnvironment },
    { id: 'people', label: 'People', icon: <Users className="h-3.5 w-3.5" />, visible: showPeople },
  ];

  const handleToggleLayer = useCallback((layerId: string) => {
    switch (layerId) {
      case 'lighting': setShowEnvironment(v => !v); break;
      case 'people': setShowPeople(v => !v); break;
    }
  }, []);

  // Panel graphic thumbnail grid for bottom content
  const panelThumbnails = (
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
  );

  // 3D Canvas element
  const canvasElement = (
    <div className="relative h-full min-h-[500px]">
      <Canvas
        ref={canvasRef}
        shadows={environmentRealism === 'hyper' ? 'soft' : true}
        camera={{ position: [6, 4, 6], fov: 45 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: 4,
          toneMappingExposure: 1.0,
          outputColorSpace: 'srgb',
          shadowMap: { enabled: true, type: environmentRealism === 'hyper' ? 2 : 1 },
        } as any}
        dpr={[1, environmentRealism === 'hyper' ? 2 : 1.5]}
        flat={false}
      >
        <Suspense fallback={null}>
          <SceneBridge sceneRef={sceneRef} />
          <BoothScene3D
            panels={panels}
            selectedPanelId={selectedPanelId}
            onSelectPanel={handleSelectPanel}
            lightingPreset={lightingPreset}
            showLabels={showLabels}
            showDimensions={showDimensions}
            showSafeZones={showSafeZones}
            showEnvironment={showEnvironment}
            showPeople={showPeople}
            showTrafficFlow={showTrafficFlow}
            layout={layout}
            isDragMode={isDragMode}
            onPanelPositionChange={handlePanelPositionChange}
            placedAssets={placedAssets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={handleSelectAsset}
            onAssetPositionChange={handleAssetPositionChange}
            environmentRealism={environmentRealism}
            activeCameraPreset={
              activeCameraPreset
                ? getEnvironmentConfig(environmentRealism).cameraPresets.find(p => p.id === activeCameraPreset) ?? null
                : null
            }
            cameraVersion={cameraVersion}
            walkthroughMode={walkthroughMode}
            allCameraPresets={getEnvironmentConfig(environmentRealism).cameraPresets}
            onWalkthroughEnd={() => setWalkthroughMode('none')}
            onTourStep={(id) => setActiveCameraPreset(id)}
            spriteUrls={characterSprites.sprites}
            useBillboards={characterSprites.count > 0}
            monitorSpecs={monitorSpecs}
            activeSpecConfig={useProductionSpecs ? specConfigType : ''}
            flooringConfig={flooringConfig}
            footprint={boothConfig.footprint}
            boothLighting={boothLighting}
            showHeatMap={showHeatMap}
            crowdSimulation={crowdSimulation}
            printStyle={printStyle}
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

      {/* Orbit hint */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/60 bg-background/50 backdrop-blur-sm rounded px-2 py-1 z-10">
        {walkthroughMode === 'fps'
          ? 'WASD to move · Mouse to look · Shift to sprint · Esc to exit'
          : isDragMode
            ? '⊞ Drag Mode — click & drag to reposition'
            : 'Drag to orbit · Scroll to zoom · Click panel to assign'}
      </div>
      {isDragMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-accent/90 text-accent-foreground text-xs font-medium shadow-lg animate-pulse z-10">
          <Move className="h-3 w-3 inline mr-1.5" />
          Drag Mode
        </div>
      )}

      {/* FPS Mode HUD */}
      {walkthroughMode === 'fps' && (
        <>
          {/* Crosshair */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative h-6 w-6">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/40" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-primary/80" />
            </div>
          </div>
          {/* Controls HUD */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg px-4 py-2 flex items-center gap-4">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex gap-0.5">
                  <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border">W</kbd>
                </div>
                <div className="flex gap-0.5">
                  <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border">A</kbd>
                  <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border">S</kbd>
                  <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border">D</kbd>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                <p className="font-semibold text-foreground">First Person Mode</p>
                <p>Mouse to look · Shift to sprint</p>
              </div>
              <button
                onClick={() => setWalkthroughMode('none')}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-medium px-2 py-1 rounded transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </>
      )}

      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10 max-w-[160px]">
        <div className="bg-background/85 backdrop-blur-sm rounded-lg border shadow-lg overflow-hidden">
          <button
            onClick={() => setCameraPanelOpen(v => !v)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
          >
            <span>📷 Camera</span>
            <span className="text-[10px]">{cameraPanelOpen ? '▲' : '▼'}</span>
          </button>
          {cameraPanelOpen && (
            <div className="p-2 pt-0 space-y-1.5">
              {getEnvironmentConfig(environmentRealism).cameraPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    if (walkthroughMode !== 'none') setWalkthroughMode('none');
                    setActiveCameraPreset(preset.id);
                    setCameraVersion(v => v + 1);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-[10px] transition-colors",
                    activeCameraPreset === preset.id && walkthroughMode === 'none'
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
              <div className="border-t border-border pt-1.5 mt-1 space-y-1">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-1">🎬 Walkthrough</p>
                <button
                  onClick={() => setWalkthroughMode(walkthroughMode === 'fps' ? 'none' : 'fps')}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    walkthroughMode === 'fps' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  )}
                >
                  {walkthroughMode === 'fps' ? '⏹ Exit FPS' : '🎮 WASD Walk'}
                </button>
                <button
                  onClick={() => setWalkthroughMode(walkthroughMode === 'walkthrough' ? 'none' : 'walkthrough')}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-[10px] transition-colors",
                    walkthroughMode === 'walkthrough' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  )}
                >
                  {walkthroughMode === 'walkthrough' ? '⏹ Stop Walk' : '🚶 Auto Walk'}
                </button>
                <button
                  onClick={() => setWalkthroughMode(walkthroughMode === 'tour' ? 'none' : 'tour')}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-[10px] transition-colors",
                    walkthroughMode === 'tour' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  )}
                >
                  {walkthroughMode === 'tour' ? '⏹ Stop Tour' : '🎥 Auto Tour'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini map */}
      <MiniMapOverlay
        panels={panels}
        placedAssets={placedAssets}
        boothFootprint={boothConfig.footprint}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Hidden file input (admin only) */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      )}

      {/* BoothWorkspace IDE Layout */}
      <BoothWorkspace
        activeMode={activeMode}
        onModeChange={setActiveMode}
        hasLeftPanel={activeMode === 'design' || activeMode === 'graphics'}
        hasRightPanel={true}
        toolbar={
          <BoothDesignToolbar
            mode={activeMode}
            isAdmin={isAdmin}
            layout={layout}
            onLayoutChange={(v) => { setLayout(v); setAssignments({}); setPanelPositionOverrides({}); setPlacedAssets([]); }}
            lightingPreset={lightingPreset}
            onLightingChange={setLightingPreset}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
            showDimensions={showDimensions}
            onShowDimensionsChange={setShowDimensions}
            showSafeZones={showSafeZones}
            onShowSafeZonesChange={setShowSafeZones}
            showEnvironment={showEnvironment}
            onShowEnvironmentChange={setShowEnvironment}
            showPeople={showPeople}
            onShowPeopleChange={setShowPeople}
            showTrafficFlow={showTrafficFlow}
            onShowTrafficFlowChange={setShowTrafficFlow}
            showHeatMap={showHeatMap}
            onShowHeatMapChange={(v) => {
              setShowHeatMap(v);
              if (v && !crowdSimulation) setShowSimPanel(true);
            }}
            environmentRealism={environmentRealism}
            onEnvironmentRealismChange={(v) => {
              setEnvironmentRealism(v);
              setActiveCameraPreset(null);
              if (v === 'cinematic' || v === 'ultra') {
                setShowPeople(true);
                setShowTrafficFlow(true);
              }
            }}
            isDragMode={isDragMode}
            onDragModeChange={setIsDragMode}
            onAddAsset={() => setAssetPickerOpen(true)}
            onUploadSpec={() => fileInputRef.current?.click()}
            onAutoFill={handleAutoFill}
            onPresets={() => setPresetPickerOpen(true)}
            onScreenshot={handleScreenshot}
            onReset={handleResetView}
            onToggleAR={() => setShowARPanel(v => !v)}
            onToggleSalesDeck={() => setShowSalesDeck(v => !v)}
            showARPanel={showARPanel}
            showSalesDeck={showSalesDeck}
            isUploading={isUploading}
            hasVariantImages={variantImages.length > 0}
            assignedCount={assignedCount}
            totalPanels={totalPanels}
            boothDimensions={boothConfig.dimensions}
            boothFootprint={boothConfig.footprint}
            availableSpecTypes={availableSpecTypes}
            specConfigType={specConfigType}
            useProductionSpecs={useProductionSpecs}
            onSpecConfigChange={(v) => {
              if (v === '__generic') setUseProductionSpecs(false);
              else { setSpecConfigType(v); setUseProductionSpecs(true); }
            }}
          />
        }
        leftPanel={
          <BoothLeftPanel
            isAdmin={isAdmin}
            onAddAsset={handleAddAsset}
            layers={sceneLayers}
            onToggleLayer={handleToggleLayer}
          />
        }
        rightPanel={
          <InspectorPanel
            selectedPanelId={selectedPanelId}
            selectedAssetId={selectedAssetId}
            panels={panels}
            placedAssets={placedAssets}
            assignments={assignments}
            onSelectPanel={handleSelectPanel}
            onUpdateAsset={handleUpdateAsset}
            onRemoveAsset={handleRemoveAsset}
            onNudgeAsset={onAssetNudge}
            isAdmin={isAdmin}
          />
        }
        canvas={canvasElement}
        bottomContent={activeMode === 'graphics' ? panelThumbnails : undefined}
      />

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

      {/* Placed Assets Row */}
      {placedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Placed Assets ({placedAssets.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {placedAssets.map((asset) => {
              const config = getFurnitureById(asset.assetId);
              const showCoverControls = config?.hasTableCover && isAdmin;
              return (
                <div
                  key={asset.instanceId}
                  className={cn(
                    "rounded-lg border transition-colors",
                    selectedAssetId === asset.instanceId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 p-2">
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center shrink-0">
                      {config?.category === 'displays' ? <Monitor className="h-4 w-4 text-muted-foreground" /> :
                       config?.category === 'tables' ? <Table2 className="h-4 w-4 text-muted-foreground" /> :
                       config?.category === 'seating' ? <Armchair className="h-4 w-4 text-muted-foreground" /> :
                       config?.category === 'signage' ? <Flag className="h-4 w-4 text-muted-foreground" /> :
                       <Box className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{asset.label || config?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {config?.description?.split('(')[0]?.trim()}
                        {asset.tableCoverColor && ' · Cover applied'}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAsset(asset.instanceId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Table Cover Customization */}
                  {showCoverControls && (
                    <div className="border-t border-border/50 px-2 py-2 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Shirt className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Table Cover</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Fabric color picker */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <label className="text-[10px] text-muted-foreground shrink-0">Fabric</label>
                          <div className="flex gap-1">
                            {['#1e3a5f', '#1a1a1a', '#7c2d12', '#166534', '#581c87', '#b91c1c', '#c2410c', '#0f766e', '#e2e8f0'].map((c) => (
                              <button
                                key={c}
                                className={cn(
                                  "h-5 w-5 rounded-full border-2 transition-all",
                                  asset.tableCoverColor === c ? "border-primary scale-110 ring-1 ring-primary/30" : "border-border/50 hover:scale-105"
                                )}
                                style={{ backgroundColor: c }}
                                onClick={() => handleUpdateAsset(asset.instanceId, { tableCoverColor: c })}
                                title={c}
                              />
                            ))}
                            <input
                              type="color"
                              value={asset.tableCoverColor || '#1e3a5f'}
                              onChange={(e) => handleUpdateAsset(asset.instanceId, { tableCoverColor: e.target.value })}
                              className="h-5 w-5 rounded-full cursor-pointer border border-border/50"
                              title="Custom color"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Cover style */}
                        <label className="text-[10px] text-muted-foreground shrink-0">Style</label>
                        <div className="flex gap-1">
                          {(['fitted', 'draped', 'throw'] as const).map((style) => (
                            <button
                              key={style}
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded border transition-colors capitalize",
                                (asset.tableCoverStyle || 'fitted') === style
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
                              )}
                              onClick={() => handleUpdateAsset(asset.instanceId, { tableCoverStyle: style })}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Cover image */}
                        <label className="text-[10px] text-muted-foreground shrink-0">Print</label>
                        {asset.tableCoverImageUrl ? (
                          <div className="flex items-center gap-1.5">
                            <img src={asset.tableCoverImageUrl} alt="Cover" className="h-8 w-12 object-cover rounded border" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-1.5"
                              onClick={() => handleOpenCoverImagePicker(asset.instanceId)}
                            >
                              Change
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-destructive"
                              onClick={() => handleUpdateAsset(asset.instanceId, { tableCoverImageUrl: undefined })}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={() => handleOpenCoverImagePicker(asset.instanceId)}
                          >
                            <ImageIcon className="h-3 w-3" />
                            Add Logo / Print
                          </Button>
                        )}
                      </div>

                      {/* Quick-apply: enable cover if not set */}
                      {!asset.tableCoverColor && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-[10px] gap-1.5"
                          onClick={() => handleUpdateAsset(asset.instanceId, {
                            tableCoverColor: '#1e3a5f',
                            tableCoverStyle: 'fitted',
                          })}
                        >
                          <Palette className="h-3 w-3" />
                          Add Table Cover
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AR Preview Panel */}
      {showARPanel && (
        <Card className="p-4 border-primary/20">
          <ARPreviewPanel
            getScene={() => sceneRef.current}
            layoutName={layout}
            divisionName={divisionName}
            isAdmin={isAdmin}
          />
        </Card>
      )}

      {/* Sales Deck Panel */}
      {showSalesDeck && (
        <Card className="p-4 border-primary/20">
          <SalesDeckPanel
            divisionName={divisionName}
            layoutName={layout}
            boothSize={boothConfig.footprint}
            panelLabels={boothConfig.panels.map(p => p.label)}
            furnitureList={placedAssets.map(a => a.label)}
            hasMonitors={placedAssets.some(a => a.assetId.includes('monitor') || a.assetId.includes('tv'))}
            crowdScore={crowdSimulation?.visibilityScore}
            variantLabel={variantLabel}
            isAdmin={isAdmin}
          />
        </Card>
      )}

      {/* Asset Picker Dialog */}
      <Dialog open={assetPickerOpen} onOpenChange={setAssetPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Add Furniture / Asset
            </DialogTitle>
            <DialogDescription>
              Select from predefined booth furniture with exact production sizes.
            </DialogDescription>
          </DialogHeader>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                assetFilterCategory === 'all'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              )}
              onClick={() => setAssetFilterCategory('all')}
            >
              All
            </button>
            {(Object.entries(CATEGORY_LABELS) as [FurnitureCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                  assetFilterCategory === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
                onClick={() => setAssetFilterCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1 min-h-0 h-[50vh]">
            <div className="grid grid-cols-1 gap-2 pr-2">
              {FURNITURE_CATALOG
                .filter(f => assetFilterCategory === 'all' || f.category === assetFilterCategory)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddAsset(item.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      {item.category === 'displays' ? <Monitor className="h-5 w-5 text-muted-foreground" /> :
                       item.category === 'tables' ? <Table2 className="h-5 w-5 text-muted-foreground" /> :
                       item.category === 'seating' ? <Armchair className="h-5 w-5 text-muted-foreground" /> :
                       item.category === 'signage' ? <Flag className="h-5 w-5 text-muted-foreground" /> :
                       <Box className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    </div>
                    {item.hasScreen && (
                      <Badge variant="secondary" className="text-[9px] shrink-0">Screen</Badge>
                    )}
                  </button>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Picker Dialog */}
      <Dialog open={imagePickerOpen} onOpenChange={(open) => { setImagePickerOpen(open); if (open) fetchImages(organization?.id); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Assign {assigningSide === 'back' ? 'Back' : 'Front'} Image to {boothConfig.panels.find((p) => p.id === selectedPanelId)?.label}
            </DialogTitle>
            <DialogDescription>
              Select from your image library, uploaded specs, booth variants, or gallery — or design directly.
            </DialogDescription>
            {/* Design Panel button */}
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-primary/30 hover:bg-primary/10"
                onClick={() => {
                  setImagePickerOpen(false);
                  setPanelDesignerTarget(selectedPanelId);
                  setPanelDesignerOpen(true);
                }}
              >
                <Palette className="h-3.5 w-3.5 text-primary" />
                Design Panel Graphic
              </Button>
              <span className="text-[10px] text-muted-foreground">Compose text, logos & graphics directly</span>
            </div>
            {/* Front / Back toggle */}
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => setAssigningSide('front')}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors border",
                  assigningSide === 'front'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Front
              </button>
              <button
                onClick={() => setAssigningSide('back')}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors border",
                  assigningSide === 'back'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Back
              </button>
              {assigningSide === 'back' && backAssignments[selectedPanelId || ''] && (
                <span className="text-[10px] text-green-500 ml-2">✓ Back image set</span>
              )}
              {assigningSide === 'front' && assignments[selectedPanelId || ''] && (
                <span className="text-[10px] text-green-500 ml-2">✓ Front image set</span>
              )}
            </div>
          </DialogHeader>

          <Tabs value={pickerTab} onValueChange={setPickerTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library" className="gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Image Library {libraryImages.length > 0 && `(${libraryImages.length})`}
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Booth Sources
              </TabsTrigger>
            </TabsList>

            {/* Image Library Tab - Primary */}
            <TabsContent value="library" className="mt-3 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, category, or file type..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              {/* Category filter chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['All', 'Logos', 'Backgrounds', 'Product Images', 'Icons', 'General'].map((cat) => {
                  const count = cat === 'All' ? libraryImages.length : libraryImages.filter(i => i.category === cat).length;
                  const isActive = cat === 'All' ? !selectedCategory : selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      )}
                      onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                    >
                      {cat} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
                    </button>
                  );
                })}
              </div>
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Scanning image library...</span>
                </div>
              ) : filteredLibraryImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">{libraryImages.length === 0 ? 'Image library is empty' : 'No images match your filters'}</p>
                  <p className="text-sm mt-1">
                    {libraryImages.length === 0
                      ? 'Upload images to your organization\'s library first'
                      : 'Try adjusting your search or category filter'}
                  </p>
                  {(librarySearch || selectedCategory) && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setLibrarySearch(''); setSelectedCategory(''); }}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="flex-1 min-h-0 max-h-[45vh]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredLibraryImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handleAssignImage(img.public_url)}
                        className="group relative rounded-lg overflow-hidden border hover:border-primary hover:shadow-md transition-all"
                      >
                        <img src={img.public_url} alt={img.name} className="w-full aspect-video object-cover" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                          <span className="text-[10px] text-white font-medium truncate block">{img.name || 'Image'}</span>
                        </div>
                        {img.category && img.category !== 'General' && (
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-[9px] px-1 py-0">{img.category}</Badge>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {filteredLibraryImages.length < libraryImages.length && (
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                      Showing {filteredLibraryImages.length} of {libraryImages.length} images
                    </p>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            {/* Booth Sources Tab */}
            <TabsContent value="sources" className="mt-3 flex-1 min-h-0 overflow-hidden">
              {allImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No booth-specific images</p>
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
                <ScrollArea className="h-[45vh]">
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

      {/* Preset Picker Dialog */}
      <BoothPresetPicker
        open={presetPickerOpen}
        onOpenChange={setPresetPickerOpen}
        onApplyPreset={handleApplyPreset}
      />

      {/* Active Preset Info Banner */}
      {activePreset && (
        <Card className="p-3 border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full" style={{ background: activePreset.primaryColor }} />
                <span className="text-sm font-semibold text-foreground">{activePreset.name}</span>
                <Badge variant="secondary" className="text-[10px]">{activePreset.industry}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {activePreset.panelGuides.map((guide) => (
                  <div key={guide.panelId} className="rounded border bg-background p-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{guide.panelId}</Badge>
                      <span className="text-xs font-medium text-foreground truncate">{guide.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{guide.description}</p>
                    {guide.colorTreatment && (
                      <p className="text-[9px] text-primary mt-0.5 italic">🎨 {guide.colorTreatment}</p>
                    )}
                  </div>
                ))}
              </div>
              {activePreset.designTips.length > 0 && (
                <div className="mt-2 flex items-start gap-1.5">
                  <Lightbulb className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground italic">{activePreset.designTips[0]}</p>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => setActivePreset(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Cover Image Picker Dialog */}
      <Dialog open={coverImagePickerOpen} onOpenChange={(open) => { setCoverImagePickerOpen(open); if (!open) setCoverImageTargetAssetId(null); }}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              Select Cover Print / Logo
            </DialogTitle>
            <DialogDescription>
              Choose an image from your library to print on the table cover front panel.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
            {libraryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLibraryImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pr-2">
                {filteredLibraryImages.map((img, i) => (
                  <button
                    key={`cover-${img.public_url}-${i}`}
                    onClick={() => handleAssignCoverImage(img.public_url)}
                    className="group relative rounded-lg overflow-hidden border hover:border-primary hover:shadow-md transition-all"
                  >
                    <img src={img.public_url} alt={img.name} className="w-full aspect-video object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                      <span className="text-[10px] text-white font-medium truncate block">{img.name || 'Image'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Panel Designer */}
      <PanelDesigner
        open={panelDesignerOpen}
        onClose={() => { setPanelDesignerOpen(false); setPanelDesignerTarget(null); }}
        panelId={panelDesignerTarget || ''}
        panelLabel={boothConfig.panels.find(p => p.id === panelDesignerTarget)?.label || 'Panel'}
        panelSizeFt={(() => {
          const panel = boothConfig.panels.find(p => p.id === panelDesignerTarget);
          if (!panel) return [10, 8] as [number, number];
          return [Math.round(panel.size[0] / 0.3048), Math.round(panel.size[1] / 0.3048)] as [number, number];
        })()}
        brandColors={['hsl(221, 83%, 53%)', 'hsl(0, 0%, 100%)', 'hsl(0, 0%, 0%)', 'hsl(0, 0%, 20%)', 'hsl(48, 96%, 53%)']}
        imageLibrary={libraryImages.map(i => i.public_url).filter(Boolean)}
        onApply={(dataUrl) => {
          if (!panelDesignerTarget) return;
          setAssignments(prev => {
            const next = { ...prev, [panelDesignerTarget]: dataUrl };
            onAssignmentsChange?.(
              Object.entries(next).map(([panelId, url]) => ({ panelId, imageUrl: url }))
            );
            return next;
          });
        }}
      />
    </div>
  );
}

