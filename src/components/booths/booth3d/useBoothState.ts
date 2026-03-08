/**
 * useBoothState — Extracts all persistent booth state, DB load/save,
 * and core handlers from BoothMapper3D to reduce component complexity.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getBoothPanels,
  type BoothLayout,
  type LightingPreset,
  type PanelConfig,
  type PanelAssignment,
} from './boothConfigs';
import {
  getFurnitureById,
  type PlacedAsset,
} from './boothFurnitureConfigs';
import { type FlooringConfig } from './BoothFloorpad';
import {
  type BoothLightingConfig,
  getDefaultBoothLighting,
} from './boothLightingConfig';
import { type LogisticsMarker } from './logisticsTypes';
import { parseAllSpecs, generatePanelsFromSpecs, parseMonitorSpecs, type ParsedPanelSpec, type MonitorSpec } from './specParser';
import type { BoothDesignPreset } from './boothPresets';
import type { AIBoothResult } from './AIBoothGenerator';

interface UseBoothStateOptions {
  divisionId?: string;
  variantLabel: string;
  isAdmin: boolean;
  galleryImages: string[];
  variantImages: { label: string; url: string }[];
  onAssignmentsChange?: (assignments: PanelAssignment[]) => void;
}

export function useBoothState({
  divisionId,
  variantLabel,
  isAdmin,
  galleryImages,
  variantImages,
  onAssignmentsChange,
}: UseBoothStateOptions) {
  // === Core booth configuration ===
  const [layout, setLayout] = useState<BoothLayout>('u-shape');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('expo-bright');
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === Panel assignments ===
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [backAssignments, setBackAssignments] = useState<Record<string, string>>({});
  const [uploadedSpecs, setUploadedSpecs] = useState<{ url: string; name: string }[]>([]);
  const [panelPositionOverrides, setPanelPositionOverrides] = useState<Record<string, [number, number, number]>>({});

  // === Furniture & assets ===
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);

  // === Environment ===
  const [flooringConfig, setFlooringConfig] = useState<FlooringConfig>({
    type: 'carpet-plush',
    color: '#1a1a2e',
    showBorder: true,
    showDimensions: true,
  });
  const [boothLighting, setBoothLighting] = useState<BoothLightingConfig>(getDefaultBoothLighting());

  // === Logistics ===
  const [logisticsMarkers, setLogisticsMarkers] = useState<LogisticsMarker[]>([]);
  const [selectedLogisticsId, setSelectedLogisticsId] = useState<string | null>(null);
  const [showLogistics, setShowLogistics] = useState(true);

  // === Production specs ===
  const [prodSpecs, setProdSpecs] = useState<ParsedPanelSpec[]>([]);
  const [monitorSpecs, setMonitorSpecs] = useState<MonitorSpec[]>([]);
  const [specConfigType, setSpecConfigType] = useState<string>('');
  const [useProductionSpecs, setUseProductionSpecs] = useState(false);
  const [allProdSpecs, setAllProdSpecs] = useState<{ title: string; content: string; category: string }[]>([]);

  // === Gallery ===
  const [boothGalleryUrls, setBoothGalleryUrls] = useState<string[]>([]);

  // Fetch booth gallery photos
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

  const mergedGalleryImages = useMemo(() => {
    const set = new Set([...galleryImages, ...boothGalleryUrls]);
    return Array.from(set);
  }, [galleryImages, boothGalleryUrls]);

  // === DB Load ===
  useEffect(() => {
    if (!divisionId) { setIsLoaded(true); return; }
    setIsLoaded(false);
    setLayout('inline');
    setAssignments({});
    setBackAssignments({});
    setUploadedSpecs([]);
    setPlacedAssets([]);
    setPanelPositionOverrides({});
    setLogisticsMarkers([]);
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
          const saved = data.assignments as any;
          if (saved?.__placedAssets) setPlacedAssets(saved.__placedAssets as PlacedAsset[]);
          if (saved?.__panelPositions) setPanelPositionOverrides(saved.__panelPositions as Record<string, [number, number, number]>);
          if (saved?.__backAssignments) setBackAssignments(saved.__backAssignments as Record<string, string>);
          if (saved?.__logisticsMarkers) setLogisticsMarkers(saved.__logisticsMarkers as LogisticsMarker[]);
          if (saved?.__flooringConfig) setFlooringConfig(saved.__flooringConfig as FlooringConfig);
          if (saved?.__boothLighting) setBoothLighting(saved.__boothLighting as BoothLightingConfig);
        }
      } catch (e) {
        console.error('Failed to load 3D mapping:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [divisionId, variantLabel]);

  // === Fetch production specs ===
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
        const filtered = data.filter(s =>
          s.variant_label === null || s.variant_label === (variantLabel || null)
        );
        setAllProdSpecs(filtered);
        const contentSizing = filtered.filter(s => s.category === 'content-sizing');
        const layouts = parseAllSpecs(contentSizing);
        if (layouts.length > 0) {
          const allParsed = layouts.flatMap(l => l.panels);
          setProdSpecs(allParsed);
          setSpecConfigType(layouts[0].configType);
          setUseProductionSpecs(true);
        }
        const monitors = parseMonitorSpecs(filtered);
        setMonitorSpecs(monitors);
      } catch (e) {
        console.error('Failed to load production specs:', e);
      }
    };
    fetchProdSpecs();
  }, [divisionId, variantLabel]);

  // === DB Save (debounced) ===
  const saveMapping = useCallback(() => {
    if (!divisionId || !isLoaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const enrichedAssignments = {
          ...assignments,
          __placedAssets: placedAssets,
          __panelPositions: panelPositionOverrides,
          __backAssignments: backAssignments,
          __logisticsMarkers: logisticsMarkers,
          __flooringConfig: flooringConfig,
          __boothLighting: boothLighting,
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
  }, [divisionId, variantLabel, layout, lightingPreset, assignments, uploadedSpecs, showLabels, showDimensions, isLoaded, placedAssets, panelPositionOverrides, backAssignments, logisticsMarkers, flooringConfig, boothLighting]);

  useEffect(() => {
    if (isLoaded) saveMapping();
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [saveMapping, isLoaded]);

  // === Booth config computation ===
  const availableSpecTypes = useMemo(() => {
    const types = new Set(prodSpecs.map(s => s.configType).filter(Boolean));
    return Array.from(types);
  }, [prodSpecs]);

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

  const panels: PanelConfig[] = boothConfig.panels.map((p) => ({
    ...p,
    imageUrl: assignments[p.id],
    backImageUrl: backAssignments[p.id],
    position: panelPositionOverrides[p.id] || p.position,
  }));

  const assignedCount = Object.keys(assignments).length;
  const totalPanels = boothConfig.panels.length;

  // === Panel handlers ===
  const handlePanelPositionChange = useCallback((panelId: string, position: [number, number, number]) => {
    setPanelPositionOverrides(prev => ({ ...prev, [panelId]: position }));
  }, []);

  // === Asset handlers ===
  const handleSelectAsset = useCallback((instanceId: string) => {
    setSelectedAssetId(instanceId);
  }, []);

  const handleAssetPositionChange = useCallback((instanceId: string, position: [number, number, number]) => {
    setPlacedAssets(prev => prev.map(a => a.instanceId === instanceId ? { ...a, position } : a));
  }, []);

  const handleAddAsset = useCallback((assetId: string) => {
    const config = getFurnitureById(assetId);
    if (!config) return;
    const defaultY = config.wallMountable ? 1.5 : 0;
    const newAsset: PlacedAsset = {
      instanceId: `${assetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetId,
      position: [0, defaultY, 2],
      rotation: [0, 0, 0],
      label: config.name,
    };
    setPlacedAssets(prev => [...prev, newAsset]);
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

  // === Logistics handlers ===
  const handleAddLogisticsMarker = useCallback((marker: LogisticsMarker) => {
    setLogisticsMarkers(prev => [...prev, marker]);
  }, []);

  const handleUpdateLogisticsMarker = useCallback((id: string, updates: Partial<LogisticsMarker>) => {
    setLogisticsMarkers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const handleRemoveLogisticsMarker = useCallback((id: string) => {
    setLogisticsMarkers(prev => prev.filter(m => m.id !== id));
    if (selectedLogisticsId === id) setSelectedLogisticsId(null);
  }, [selectedLogisticsId]);

  // === Assignment handlers ===
  const handleAssignImage = useCallback((imageUrl: string, selectedPanelId: string | null, assigningSide: 'front' | 'back') => {
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
  }, [onAssignmentsChange]);

  const handleClearPanel = useCallback((selectedPanelId: string | null, assigningSide: 'front' | 'back') => {
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
  }, [onAssignmentsChange]);

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

  const handleResetView = useCallback(() => {
    setAssignments({});
    setBackAssignments({});
    onAssignmentsChange?.([]);
    toast.success('All panels cleared');
  }, [onAssignmentsChange]);

  // === Preset / AI apply ===
  const handleApplyPreset = useCallback((preset: BoothDesignPreset) => {
    setLayout(preset.layout);
    setLightingPreset(preset.lighting);
    setPanelPositionOverrides({});
    setAssignments({});
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
    if (preset.flooringConfig) {
      setFlooringConfig({ ...preset.flooringConfig });
    }
    return preset; // return for caller to set showEnvironment/showPeople etc.
  }, []);

  const handleAIGenerate = useCallback((result: AIBoothResult) => {
    setLayout(result.layout);
    setLightingPreset(result.lighting);
    setPanelPositionOverrides({});
    setAssignments({});
    if (result.flooring) {
      setFlooringConfig(prev => ({
        ...prev,
        type: result.flooring.type as any,
        color: result.flooring.color,
      }));
    }
    if (result.furniture && result.furniture.length > 0) {
      const placed: PlacedAsset[] = result.furniture.map((f, i) => ({
        instanceId: `ai-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        assetId: f.assetId,
        position: f.position as [number, number, number],
        rotation: f.rotation as [number, number, number],
        label: f.label,
      }));
      setPlacedAssets(placed);
      setIsDragMode(true);
    }
  }, []);

  return {
    // Core config
    layout, setLayout,
    lightingPreset, setLightingPreset,
    showLabels, setShowLabels,
    showDimensions, setShowDimensions,
    isLoaded,

    // Panels
    assignments, setAssignments,
    backAssignments, setBackAssignments,
    uploadedSpecs, setUploadedSpecs,
    panelPositionOverrides, setPanelPositionOverrides,
    panels,
    boothConfig,
    specPanels,
    assignedCount,
    totalPanels,

    // Furniture
    placedAssets, setPlacedAssets,
    selectedAssetId, setSelectedAssetId,
    isDragMode, setIsDragMode,

    // Environment
    flooringConfig, setFlooringConfig,
    boothLighting, setBoothLighting,

    // Logistics
    logisticsMarkers, setLogisticsMarkers,
    selectedLogisticsId, setSelectedLogisticsId,
    showLogistics, setShowLogistics,

    // Production specs
    prodSpecs,
    monitorSpecs,
    specConfigType, setSpecConfigType,
    useProductionSpecs, setUseProductionSpecs,
    availableSpecTypes,

    // Gallery
    mergedGalleryImages,

    // Handlers
    handlePanelPositionChange,
    handleSelectAsset,
    handleAssetPositionChange,
    handleAddAsset,
    handleRemoveAsset,
    handleUpdateAsset,
    onAssetNudge,
    handleAddLogisticsMarker,
    handleUpdateLogisticsMarker,
    handleRemoveLogisticsMarker,
    handleAssignImage,
    handleClearPanel,
    handleAutoFill,
    handleResetView,
    handleApplyPreset,
    handleAIGenerate,
  };
}
