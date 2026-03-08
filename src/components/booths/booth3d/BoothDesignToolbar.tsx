/**
 * BoothDesignToolbar - Grouped toolbar for design mode
 * Condensed from the original dense toolbar into logical sections
 */
import { type ReactNode } from 'react';
import {
  Layout, Sun, Tag, Ruler, ScanLine, Building2, Users, Route,
  BarChart3, Move, Plus, Box, Lightbulb, BookTemplate, Camera,
  Upload, Sparkles, RotateCcw, Smartphone, Presentation, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  LAYOUT_OPTIONS,
  LIGHTING_PRESETS,
  type BoothLayout,
  type LightingPreset,
} from './boothConfigs';
import {
  ENVIRONMENT_PRESETS,
  type EnvironmentRealism,
} from './environmentPresets';
import type { BoothMode } from './BoothWorkspace';

function ToolGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hidden lg:inline mr-0.5">{label}</span>
      {children}
    </div>
  );
}

function ToolSep() {
  return <div className="h-5 w-px bg-border mx-0.5" />;
}

interface BoothDesignToolbarProps {
  mode: BoothMode;
  isAdmin: boolean;
  layout: BoothLayout;
  onLayoutChange: (v: BoothLayout) => void;
  lightingPreset: LightingPreset;
  onLightingChange: (v: LightingPreset) => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
  showDimensions: boolean;
  onShowDimensionsChange: (v: boolean) => void;
  showSafeZones: boolean;
  onShowSafeZonesChange: (v: boolean) => void;
  showEnvironment: boolean;
  onShowEnvironmentChange: (v: boolean) => void;
  showPeople: boolean;
  onShowPeopleChange: (v: boolean) => void;
  showTrafficFlow: boolean;
  onShowTrafficFlowChange: (v: boolean) => void;
  showHeatMap: boolean;
  onShowHeatMapChange: (v: boolean) => void;
  environmentRealism: EnvironmentRealism;
  onEnvironmentRealismChange: (v: EnvironmentRealism) => void;
  isDragMode: boolean;
  onDragModeChange: (v: boolean) => void;
  onAddAsset: () => void;
  onUploadSpec: () => void;
  onAutoFill: () => void;
  onPresets: () => void;
  onScreenshot: () => void;
  onReset: () => void;
  onToggleAR: () => void;
  onToggleSalesDeck: () => void;
  showARPanel: boolean;
  showSalesDeck: boolean;
  isUploading: boolean;
  hasVariantImages: boolean;
  assignedCount: number;
  totalPanels: number;
  boothDimensions: string;
  boothFootprint: string;
  /** Spec config type controls */
  availableSpecTypes: string[];
  specConfigType: string;
  useProductionSpecs: boolean;
  onSpecConfigChange: (type: string) => void;
  /** Optional brand switcher element rendered in the toolbar */
  brandSwitcher?: ReactNode;
}

export function BoothDesignToolbar(props: BoothDesignToolbarProps) {
  const { mode, isAdmin } = props;

  // Design mode toolbar
  if (mode === 'design') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {/* BRAND SWITCHER */}
        {props.brandSwitcher}
        {props.brandSwitcher && <ToolSep />}
        {/* SCENE */}
        <ToolGroup label="Scene">
          {isAdmin ? (
            <Select value={props.layout} onValueChange={(v) => props.onLayoutChange(v as BoothLayout)}>
              <SelectTrigger className="w-[140px] h-7 text-[11px]">
                <Layout className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {['Inline', 'Corner', 'Peninsula', 'Island'].map((cat) => {
                  const items = LAYOUT_OPTIONS.filter(o => o.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat}>
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">{cat}</div>
                      {items.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground ml-1 text-[10px]">· {opt.desc}</span>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="h-7 px-2 text-[11px] gap-1">
              <Layout className="h-3 w-3" />
              {LAYOUT_OPTIONS.find(o => o.value === props.layout)?.label || props.layout}
            </Badge>
          )}
          {isAdmin ? (
            <Select value={props.lightingPreset} onValueChange={(v) => props.onLightingChange(v as LightingPreset)}>
              <SelectTrigger className="w-[140px] h-7 text-[11px]">
                <Sun className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground text-[9px] block">{p.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="h-7 px-2 text-[11px] gap-1">
              <Sun className="h-3 w-3" />
              {LIGHTING_PRESETS.find(p => p.value === props.lightingPreset)?.label}
            </Badge>
          )}
        </ToolGroup>

        <ToolSep />

        {/* OBJECT */}
        {isAdmin && (
          <ToolGroup label="Object">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle pressed={props.isDragMode} onPressedChange={props.onDragModeChange} size="sm" className={cn("h-7 w-7", props.isDragMode && "bg-accent text-accent-foreground")}>
                    <Move className="h-3.5 w-3.5" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Drag Mode</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={props.onAddAsset}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Furniture</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ToolGroup>
        )}

        {isAdmin && <ToolSep />}

        {/* VIEW */}
        <ToolGroup label="View">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showLabels} onPressedChange={props.onShowLabelsChange} size="sm" className="h-7 w-7"><Tag className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>Labels</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showDimensions} onPressedChange={props.onShowDimensionsChange} size="sm" className="h-7 w-7"><Ruler className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>Dimensions</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showSafeZones} onPressedChange={props.onShowSafeZonesChange} size="sm" className="h-7 w-7"><ScanLine className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>Safe Zones</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ToolGroup>

        <ToolSep />

        {/* ENVIRONMENT */}
        <ToolGroup label="Env">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showEnvironment} onPressedChange={props.onShowEnvironmentChange} size="sm" className="h-7 w-7"><Building2 className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>Expo Hall</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showPeople} onPressedChange={props.onShowPeopleChange} size="sm" className="h-7 w-7"><Users className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>People</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={props.showTrafficFlow} onPressedChange={props.onShowTrafficFlowChange} size="sm" className="h-7 w-7"><Route className="h-3.5 w-3.5" /></Toggle>
              </TooltipTrigger>
              <TooltipContent>Traffic Flow</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {props.showEnvironment && (
            <Select value={props.environmentRealism} onValueChange={(v) => props.onEnvironmentRealismChange(v as EnvironmentRealism)}>
              <SelectTrigger className="h-7 w-[100px] text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(ENVIRONMENT_PRESETS) as [EnvironmentRealism, typeof ENVIRONMENT_PRESETS[EnvironmentRealism]][]).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1">{preset.icon} {preset.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </ToolGroup>

        <div className="ml-auto flex items-center gap-1.5">
          {props.availableSpecTypes.length > 0 && (
            <Select value={props.useProductionSpecs ? props.specConfigType : '__generic'} onValueChange={props.onSpecConfigChange}>
              <SelectTrigger className="w-[110px] h-7 text-[11px]">
                <Ruler className="h-3 w-3 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__generic">Generic</SelectItem>
                {props.availableSpecTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Badge variant="outline" className="text-[10px] h-6 px-1.5">{props.boothDimensions} · {props.boothFootprint}</Badge>
          <Badge variant={props.assignedCount === props.totalPanels ? 'default' : 'secondary'} className="text-[10px] h-6 px-1.5">
            {props.assignedCount}/{props.totalPanels}
          </Badge>
        </div>
      </div>
    );
  }

  // Graphics mode
  if (mode === 'graphics') {
    return (
      <div className="flex items-center gap-2">
        {props.brandSwitcher}
        {isAdmin && (
          <>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onUploadSpec} disabled={props.isUploading}>
              {props.isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload Spec
            </Button>
            {props.hasVariantImages && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onAutoFill}>
                <Sparkles className="h-3 w-3" /> Auto-fill
              </Button>
            )}
          </>
        )}
        <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onPresets}>
          <BookTemplate className="h-3 w-3" /> Presets
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-muted-foreground" onClick={props.onReset}>
            <RotateCcw className="h-3 w-3" /> Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] h-6 px-1.5">{props.assignedCount}/{props.totalPanels} panels</Badge>
        </div>
      </div>
    );
  }

  // Simulation mode
  if (mode === 'simulation') {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={props.showHeatMap} onPressedChange={props.onShowHeatMapChange} size="sm" className="h-7 gap-1 text-[11px]">
                <BarChart3 className="h-3 w-3" /> Heat Map
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Crowd Heat Map</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={props.showPeople} onPressedChange={props.onShowPeopleChange} size="sm" className="h-7 gap-1 text-[11px]">
                <Users className="h-3 w-3" /> People
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Show People</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={props.showTrafficFlow} onPressedChange={props.onShowTrafficFlowChange} size="sm" className="h-7 gap-1 text-[11px]">
                <Route className="h-3 w-3" /> Traffic
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Traffic Flow Lines</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Production mode
  if (mode === 'production') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] h-6 px-1.5">{props.boothDimensions} · {props.boothFootprint}</Badge>
        <Badge variant="outline" className="text-[10px] h-6 px-1.5">{props.totalPanels} panels · {props.assignedCount} assigned</Badge>
      </div>
    );
  }

  // Presentation mode
  if (mode === 'presentation') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onScreenshot}>
          <Camera className="h-3 w-3" /> Screenshot
        </Button>
        <Button variant={props.showARPanel ? 'default' : 'outline'} size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onToggleAR}>
          <Smartphone className="h-3 w-3" /> AR
        </Button>
        <Button variant={props.showSalesDeck ? 'default' : 'outline'} size="sm" className="h-7 gap-1 text-[11px]" onClick={props.onToggleSalesDeck}>
          <Presentation className="h-3 w-3" /> Deck
        </Button>
      </div>
    );
  }

  return null;
}
