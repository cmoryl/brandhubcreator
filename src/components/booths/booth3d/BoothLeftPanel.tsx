/**
 * BoothLeftPanel - Tabbed left panel with Asset Library + Scene Layers
 */
import { useState } from 'react';
import { LayoutGrid, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { SceneLayersPanel, type SceneLayer } from './SceneLayersPanel';

interface BoothLeftPanelProps {
  isAdmin: boolean;
  onAddAsset: (assetId: string) => void;
  layers: SceneLayer[];
  onToggleLayer: (layerId: string) => void;
}

type LeftTab = 'assets' | 'layers';

export function BoothLeftPanel({ isAdmin, onAddAsset, layers, onToggleLayer }: BoothLeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('assets');

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b shrink-0">
        {([
          { id: 'assets' as LeftTab, icon: LayoutGrid, label: 'Assets' },
          { id: 'layers' as LeftTab, icon: Layers, label: 'Layers' },
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'assets' ? (
          <AssetLibraryPanel onAddAsset={onAddAsset} isAdmin={isAdmin} />
        ) : (
          <SceneLayersPanel layers={layers} onToggleLayer={onToggleLayer} />
        )}
      </div>
    </div>
  );
}
