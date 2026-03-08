import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, Plus, Trash2, MapPin, Eye, EyeOff, ZoomIn, ZoomOut,
  Move, Layers, Target, Building2, Users, Navigation, Coffee, DoorOpen,
  Shield, Flame, LayoutGrid, Download, Settings, MousePointer, Square,
  Circle, Loader2, ChevronDown, MapPinned, Route, Maximize2, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { BrandHubLogo } from '@/components/BrandHubLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useExpoFloorPlans, useBoothPlacements, type BoothPlacement, type FloorZone } from '@/hooks/useExpoFloorPlans';

// Zone type definitions
const ZONE_TYPES = [
  { id: 'high-traffic', label: 'High Traffic Aisle', color: '#ef4444', icon: Flame },
  { id: 'entrance', label: 'Entrance', color: '#22c55e', icon: DoorOpen },
  { id: 'food', label: 'Food Court / Catering', color: '#f59e0b', icon: Coffee },
  { id: 'session', label: 'Session Hall', color: '#8b5cf6', icon: Users },
  { id: 'registration', label: 'Registration', color: '#06b6d4', icon: MapPinned },
  { id: 'restroom', label: 'Restrooms', color: '#64748b', icon: Navigation },
  { id: 'low-traffic', label: 'Low Traffic Area', color: '#94a3b8', icon: Route },
  { id: 'competitor', label: 'Competitor Cluster', color: '#dc2626', icon: Shield },
];

const BOOTH_CATEGORIES = [
  { id: 'own', label: 'Your Booth', color: '#3b82f6' },
  { id: 'competitor', label: 'Competitor', color: '#ef4444' },
  { id: 'partner', label: 'Partner', color: '#22c55e' },
  { id: 'standard', label: 'Standard', color: '#94a3b8' },
  { id: 'sponsor', label: 'Sponsor', color: '#f59e0b' },
];

type Tool = 'select' | 'place-booth' | 'place-zone';

export default function ExpoFloorPlanner() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const { floorPlans, loading, createFloorPlan, deleteFloorPlan } = useExpoFloorPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = floorPlans.find(p => p.id === selectedPlanId);
  const { placements, zones, addPlacement, updatePlacement, deletePlacement, addZone, deleteZone } = useBoothPlacements(selectedPlanId);

  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [draggingBooth, setDraggingBooth] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showOverlays, setShowOverlays] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBoothCategory, setNewBoothCategory] = useState('standard');
  const [newZoneType, setNewZoneType] = useState('high-traffic');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
      if (user) {
        const { data: orgs } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
        if (orgs?.[0]) setOrgId(orgs[0].organization_id);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (floorPlans.length > 0 && !selectedPlanId) setSelectedPlanId(floorPlans[0].id);
  }, [floorPlans, selectedPlanId]);

  // Upload floor plan
  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `expo-floors/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('organization-assets').upload(path, file);
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('organization-assets').getPublicUrl(path);
    const plan = await createFloorPlan({
      name: file.name.replace(/\.[^.]+$/, ''),
      file_url: urlData.publicUrl,
      file_type: ext === 'pdf' ? 'pdf' : ext === 'svg' ? 'svg' : 'image',
      organization_id: orgId || undefined,
    } as any);
    if (plan) { setSelectedPlanId(plan.id); toast.success('Floor plan uploaded!'); }
    setUploading(false);
  };

  // Canvas mouse handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select' && !selectedBooth) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
    if (activeTool === 'place-booth') {
      const coords = getCanvasCoords(e);
      const cat = BOOTH_CATEGORIES.find(c => c.id === newBoothCategory);
      addPlacement({
        label: cat?.label || 'Booth',
        booth_size: '10x10',
        x_position: coords.x - 50,
        y_position: coords.y - 35,
        width: 100,
        height: 70,
        color: cat?.color || '#94a3b8',
        is_own_booth: newBoothCategory === 'own',
        is_competitor: newBoothCategory === 'competitor',
        category: newBoothCategory,
      });
    }
    if (activeTool === 'place-zone') {
      const coords = getCanvasCoords(e);
      const zt = ZONE_TYPES.find(z => z.id === newZoneType);
      addZone({
        zone_type: newZoneType,
        label: zt?.label || 'Zone',
        points: [
          { x: coords.x - 80, y: coords.y - 40 },
          { x: coords.x + 80, y: coords.y - 40 },
          { x: coords.x + 80, y: coords.y + 40 },
          { x: coords.x - 80, y: coords.y + 40 },
        ],
        color: zt?.color || '#f59e0b',
        opacity: 0.25,
        intensity: 'medium',
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    if (draggingBooth) {
      const coords = getCanvasCoords(e);
      updatePlacement(draggingBooth, {
        x_position: coords.x - dragOffset.x,
        y_position: coords.y - dragOffset.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggingBooth(null);
  };

  const handleBoothMouseDown = (e: React.MouseEvent, booth: BoothPlacement) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedBooth(booth.id);
    const coords = getCanvasCoords(e);
    setDraggingBooth(booth.id);
    setDragOffset({ x: coords.x - booth.x_position, y: coords.y - booth.y_position });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.2, Math.min(5, prev + delta)));
  };

  const selectedBoothData = placements.find(p => p.id === selectedBooth);

  // Overlay insights summary
  const ownBooths = placements.filter(p => p.is_own_booth);
  const competitors = placements.filter(p => p.is_competitor);
  const highTrafficZones = zones.filter(z => z.zone_type === 'high-traffic');
  const entrances = zones.filter(z => z.zone_type === 'entrance');

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Bar */}
        <div className="h-12 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-40">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/booths')} className="gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Booths
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-bold text-foreground font-heading">Expo Floor Planner</h1>
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Floor plan selector */}
            {floorPlans.length > 0 && (
              <Select value={selectedPlanId || ''} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue placeholder="Select floor plan" />
                </SelectTrigger>
                <SelectContent>
                  {floorPlans.map(fp => (
                    <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload Plan
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.svg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            <ThemeToggle />
            <div className="cursor-pointer" onClick={() => navigate('/org/transperfect')}>
              <BrandHubLogo size="sm" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tools & Overlays */}
          <AnimatePresence initial={false}>
            {leftPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r border-border bg-background overflow-y-auto shrink-0"
              >
                <div className="p-3 space-y-4">
                  {/* Tools */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tools</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'select' as Tool, icon: MousePointer, label: 'Select' },
                        { id: 'place-booth' as Tool, icon: Square, label: 'Booth' },
                        { id: 'place-zone' as Tool, icon: Circle, label: 'Zone' },
                      ].map(tool => (
                        <Tooltip key={tool.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setActiveTool(tool.id)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                                activeTool === tool.id
                                  ? 'bg-primary/10 text-primary border border-primary/30'
                                  : 'hover:bg-muted text-muted-foreground border border-transparent'
                              }`}
                            >
                              <tool.icon className="h-4 w-4" />
                              <span className="text-[10px]">{tool.label}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">{tool.label} Tool</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Booth Category (when placing) */}
                  {activeTool === 'place-booth' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Booth Type</p>
                      <div className="space-y-1">
                        {BOOTH_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setNewBoothCategory(cat.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              newBoothCategory === cat.id ? 'bg-muted border border-border' : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Click on the floor plan to place</p>
                    </div>
                  )}

                  {/* Zone Type (when placing) */}
                  {activeTool === 'place-zone' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zone Type</p>
                      <div className="space-y-1">
                        {ZONE_TYPES.map(zt => (
                          <button
                            key={zt.id}
                            onClick={() => setNewZoneType(zt.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              newZoneType === zt.id ? 'bg-muted border border-border' : 'hover:bg-muted/50'
                            }`}
                          >
                            <zt.icon className="h-3.5 w-3.5" style={{ color: zt.color }} />
                            {zt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overlays */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Overlays</p>
                    <div className="space-y-1">
                      {[
                        { label: 'Zone Overlays', active: showOverlays, toggle: () => setShowOverlays(!showOverlays) },
                        { label: 'Grid', active: showGrid, toggle: () => setShowGrid(!showGrid) },
                        { label: 'Labels', active: showLabels, toggle: () => setShowLabels(!showLabels) },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.toggle}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-muted-foreground">{item.label}</span>
                          {item.active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Placement Summary */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Summary</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Your Booths</span>
                        <Badge variant="secondary" className="text-[10px] h-4">{ownBooths.length}</Badge>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Competitors</span>
                        <Badge variant="destructive" className="text-[10px] h-4">{competitors.length}</Badge>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>High Traffic</span>
                        <Badge variant="outline" className="text-[10px] h-4">{highTrafficZones.length}</Badge>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Entrances</span>
                        <Badge variant="outline" className="text-[10px] h-4">{entrances.length}</Badge>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Booths</span>
                        <Badge variant="outline" className="text-[10px] h-4">{placements.length}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden bg-muted/30">
            {/* Toggle panels */}
            <div className="absolute top-3 left-3 z-20 flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={() => setLeftPanelOpen(!leftPanelOpen)}>
                <Layers className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="absolute top-3 right-3 z-20 flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-3 left-3 z-20 flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={() => setZoom(z => Math.min(5, z + 0.2))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <div className="h-7 px-2 flex items-center rounded-md bg-background/80 backdrop-blur-sm border border-border text-[10px] text-muted-foreground">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {!selectedPlan ? (
              /* Empty state */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground font-heading">Upload a Floor Plan</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload your expo hall floor plan (PDF, SVG, or image) to start mapping booth locations, traffic patterns, and competitor positions.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Floor Plan
                  </Button>
                </div>
              </div>
            ) : (
              /* Interactive canvas */
              <div
                ref={canvasRef}
                className="absolute inset-0 cursor-crosshair select-none"
                style={{ cursor: activeTool === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleWheel}
              >
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    position: 'absolute',
                    inset: 0,
                  }}
                >
                  {/* Floor plan image */}
                  <img
                    src={selectedPlan.file_url}
                    alt={selectedPlan.name}
                    className="max-w-none pointer-events-none"
                    style={{ display: 'block' }}
                    draggable={false}
                  />

                  {/* Grid overlay */}
                  {showGrid && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
                      <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  )}

                  {/* Zone overlays */}
                  {showOverlays && zones.map(zone => {
                    const pts = Array.isArray(zone.points) ? zone.points : [];
                    if (pts.length < 3) return null;
                    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                    return (
                      <svg key={zone.id} className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                        <path d={pathD} fill={zone.color} fillOpacity={zone.opacity} stroke={zone.color} strokeWidth="2" strokeOpacity={0.5} />
                        {showLabels && (
                          <text
                            x={pts.reduce((a, p) => a + p.x, 0) / pts.length}
                            y={pts.reduce((a, p) => a + p.y, 0) / pts.length}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={zone.color}
                            fontSize="11"
                            fontWeight="600"
                            className="select-none"
                          >
                            {zone.label}
                          </text>
                        )}
                      </svg>
                    );
                  })}

                  {/* Booth placements */}
                  {placements.map(booth => (
                    <div
                      key={booth.id}
                      className={`absolute border-2 rounded-md flex items-center justify-center transition-shadow ${
                        selectedBooth === booth.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                      }`}
                      style={{
                        left: booth.x_position,
                        top: booth.y_position,
                        width: booth.width,
                        height: booth.height,
                        backgroundColor: booth.color + '30',
                        borderColor: booth.color,
                        transform: `rotate(${booth.rotation || 0}deg)`,
                        cursor: activeTool === 'select' ? 'move' : 'default',
                      }}
                      onMouseDown={(e) => handleBoothMouseDown(e, booth)}
                      onClick={(e) => { e.stopPropagation(); setSelectedBooth(booth.id); }}
                    >
                      {showLabels && (
                        <div className="text-center pointer-events-none">
                          <p className="text-[9px] font-bold leading-tight" style={{ color: booth.color }}>
                            {booth.label}
                          </p>
                          {booth.booth_number && (
                            <p className="text-[8px] opacity-70" style={{ color: booth.color }}>
                              #{booth.booth_number}
                            </p>
                          )}
                          <p className="text-[7px] opacity-50" style={{ color: booth.color }}>
                            {booth.booth_size}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Inspector */}
          <AnimatePresence initial={false}>
            {rightPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-border bg-background overflow-y-auto shrink-0"
              >
                <div className="p-3 space-y-4">
                  {selectedBoothData ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Booth Properties</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedBooth(null)}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-[10px]">Label</Label>
                          <Input
                            value={selectedBoothData.label}
                            onChange={e => updatePlacement(selectedBoothData.id, { label: e.target.value })}
                            className="h-7 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Booth Number</Label>
                          <Input
                            value={selectedBoothData.booth_number || ''}
                            onChange={e => updatePlacement(selectedBoothData.id, { booth_number: e.target.value })}
                            className="h-7 text-xs mt-1"
                            placeholder="#1423"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Width</Label>
                            <Input
                              type="number"
                              value={selectedBoothData.width}
                              onChange={e => updatePlacement(selectedBoothData.id, { width: Number(e.target.value) })}
                              className="h-7 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Height</Label>
                            <Input
                              type="number"
                              value={selectedBoothData.height}
                              onChange={e => updatePlacement(selectedBoothData.id, { height: Number(e.target.value) })}
                              className="h-7 text-xs mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px]">Booth Size</Label>
                          <Select value={selectedBoothData.booth_size} onValueChange={v => updatePlacement(selectedBoothData.id, { booth_size: v })}>
                            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['10x10', '10x20', '20x20', '20x30', '30x30', '30x40', '40x40'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Category</Label>
                          <Select value={selectedBoothData.category} onValueChange={v => {
                            const cat = BOOTH_CATEGORIES.find(c => c.id === v);
                            updatePlacement(selectedBoothData.id, {
                              category: v,
                              color: cat?.color || selectedBoothData.color,
                              is_own_booth: v === 'own',
                              is_competitor: v === 'competitor',
                            });
                          }}>
                            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BOOTH_CATEGORIES.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Notes</Label>
                          <Input
                            value={selectedBoothData.notes || ''}
                            onChange={e => updatePlacement(selectedBoothData.id, { notes: e.target.value })}
                            className="h-7 text-xs mt-1"
                            placeholder="Add notes..."
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full text-xs gap-1"
                          onClick={() => { deletePlacement(selectedBoothData.id); setSelectedBooth(null); }}
                        >
                          <Trash2 className="h-3 w-3" /> Remove Booth
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Floor Plan Info */}
                      {selectedPlan && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Floor Plan</p>
                          <div className="space-y-2 text-xs">
                            <div>
                              <Label className="text-[10px]">Name</Label>
                              <p className="text-foreground font-medium">{selectedPlan.name}</p>
                            </div>
                            {selectedPlan.venue_name && (
                              <div>
                                <Label className="text-[10px]">Venue</Label>
                                <p className="text-muted-foreground">{selectedPlan.venue_name}</p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full text-xs gap-1"
                            onClick={() => { deleteFloorPlan(selectedPlan.id); setSelectedPlanId(null); }}
                          >
                            <Trash2 className="h-3 w-3" /> Delete Floor Plan
                          </Button>
                        </div>
                      )}

                      {/* Insights */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" /> Floor Insights
                        </p>
                        {placements.length === 0 && zones.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            Place booths and zones to see strategic insights about your expo floor layout.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ownBooths.length > 0 && highTrafficZones.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                <p className="text-[11px] font-medium text-green-700 dark:text-green-400">
                                  ✓ {ownBooths.length} booth{ownBooths.length > 1 ? 's' : ''} near {highTrafficZones.length} high-traffic zone{highTrafficZones.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            )}
                            {competitors.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-[11px] font-medium text-red-700 dark:text-red-400">
                                  ⚠ {competitors.length} competitor{competitors.length > 1 ? 's' : ''} mapped
                                </p>
                              </div>
                            )}
                            {entrances.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                                  {entrances.length} entrance{entrances.length > 1 ? 's' : ''} identified
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Booth List */}
                      {placements.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Booths ({placements.length})</p>
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {placements.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setSelectedBooth(p.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                                <span className="truncate text-foreground">{p.label}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto">{p.booth_size}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Zone List */}
                      {zones.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Zones ({zones.length})</p>
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {zones.map(z => {
                              const zt = ZONE_TYPES.find(t => t.id === z.zone_type);
                              return (
                                <div key={z.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs group">
                                  {zt && <zt.icon className="h-3 w-3 shrink-0" style={{ color: z.color }} />}
                                  <span className="truncate text-foreground">{z.label}</span>
                                  <button
                                    onClick={() => deleteZone(z.id)}
                                    className="ml-auto opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
