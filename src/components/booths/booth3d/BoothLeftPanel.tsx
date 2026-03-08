/**
 * BoothLeftPanel - Tabbed left panel with Asset Library + Scene Layers + Logistics
 */
import { useState } from 'react';
import { LayoutGrid, Layers, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { SceneLayersPanel, type SceneLayer } from './SceneLayersPanel';
import { LogisticsPanel } from './LogisticsPanel';
import type { LogisticsMarker } from './logisticsTypes';

interface BoothLeftPanelProps {
  isAdmin: boolean;
  onAddAsset: (assetId: string) => void;
  layers: SceneLayer[];
  onToggleLayer: (layerId: string) => void;
  // Logistics
  logisticsMarkers?: LogisticsMarker[];
  selectedLogisticsId?: string | null;
  onSelectLogistics?: (id: string | null) => void;
  onAddLogisticsMarker?: (marker: LogisticsMarker) => void;
  onUpdateLogisticsMarker?: (id: string, updates: Partial<LogisticsMarker>) => void;
  onRemoveLogisticsMarker?: (id: string) => void;
}

type LeftTab = 'assets' | 'layers' | 'logistics';

export function BoothLeftPanel({
  isAdmin, onAddAsset, layers, onToggleLayer,
  logisticsMarkers = [], selectedLogisticsId = null,
  onSelectLogistics, onAddLogisticsMarker, onUpdateLogisticsMarker, onRemoveLogisticsMarker,
}: BoothLeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('assets');

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b shrink-0">
        {([
          { id: 'assets' as LeftTab, icon: LayoutGrid, label: 'Assets' },
          { id: 'layers' as LeftTab, icon: Layers, label: 'Layers' },
          { id: 'logistics' as LeftTab, icon: ClipboardList, label: 'Ops' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary bg-background/80"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            {tab.id === 'logistics' && logisticsMarkers.length > 0 && (
              <span className="text-[8px] bg-primary/15 text-primary rounded-full px-1">{logisticsMarkers.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'assets' ? (
          <AssetLibraryPanel onAddAsset={onAddAsset} isAdmin={isAdmin} />
        ) : activeTab === 'layers' ? (
          <SceneLayersPanel layers={layers} onToggleLayer={onToggleLayer} />
        ) : (
          <LogisticsPanel
            markers={logisticsMarkers}
            selectedMarkerId={selectedLogisticsId}
            onSelectMarker={onSelectLogistics || (() => {})}
            onAddMarker={onAddLogisticsMarker || (() => {})}
            onUpdateMarker={onUpdateLogisticsMarker || (() => {})}
            onRemoveMarker={onRemoveLogisticsMarker || (() => {})}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
}
