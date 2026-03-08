/**
 * InspectorPanel - Right panel for editing selected object properties
 * Shows contextual properties for panels, furniture, and scene settings
 */
import { useState } from 'react';
import {
  Settings, Move, RotateCw, Maximize2, Palette, Image as ImageIcon,
  Monitor, Shirt, Trash2, Box, Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PlacedAsset, FurnitureAsset } from './boothFurnitureConfigs';
import { getFurnitureById } from './boothFurnitureConfigs';
import type { PanelConfig } from './boothConfigs';

interface InspectorPanelProps {
  selectedPanelId: string | null;
  selectedAssetId: string | null;
  panels: PanelConfig[];
  placedAssets: PlacedAsset[];
  assignments: Record<string, string>;
  onSelectPanel: (id: string) => void;
  onUpdateAsset: (instanceId: string, updates: Partial<PlacedAsset>) => void;
  onRemoveAsset: (instanceId: string) => void;
  onNudgeAsset: (instanceId: string, dx: number, dy: number, dz: number) => void;
  isAdmin: boolean;
  /** Open the image picker for the given asset, targeting a specific field */
  onOpenAssetImagePicker?: (instanceId: string, target: 'screen' | 'texture' | 'cover') => void;
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground font-medium w-16 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function PositionEditor({
  position,
  rotation,
  onNudge,
  instanceId,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  onNudge: (id: string, dx: number, dy: number, dz: number) => void;
  instanceId: string;
}) {
  const step = 0.1;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="text-center">
            <span className="text-[9px] text-muted-foreground font-mono">{axis}</span>
            <p className="text-[11px] font-mono font-medium">{position[i].toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 justify-center">
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, -step, 0, 0)}>←</Button>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, step, 0, 0)}>→</Button>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, 0, step, 0)}>↑</Button>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, 0, -step, 0)}>↓</Button>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, 0, 0, -step)}>▲</Button>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px]"
          onClick={() => onNudge(instanceId, 0, 0, step)}>▼</Button>
      </div>
      <p className="text-[9px] text-muted-foreground text-center">
        Rotation: {(rotation[1] * 180 / Math.PI).toFixed(0)}°
      </p>
    </div>
  );
}

export function InspectorPanel({
  selectedPanelId,
  selectedAssetId,
  panels,
  placedAssets,
  assignments,
  onSelectPanel,
  onUpdateAsset,
  onRemoveAsset,
  onNudgeAsset,
  isAdmin,
}: InspectorPanelProps) {
  // Selected asset info
  const selectedAsset = selectedAssetId ? placedAssets.find(a => a.instanceId === selectedAssetId) : null;
  const assetConfig = selectedAsset ? getFurnitureById(selectedAsset.assetId) : null;
  
  // Selected panel info
  const selectedPanel = selectedPanelId ? panels.find(p => p.id === selectedPanelId) : null;

  // No selection
  if (!selectedPanel && !selectedAsset) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Inspector</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <Box className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-xs text-muted-foreground font-medium">No Selection</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">Click a panel or asset in the viewport to inspect and edit its properties</p>
        </div>
      </div>
    );
  }

  // Panel selected
  if (selectedPanel) {
    const hasImage = !!assignments[selectedPanel.id];
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Panel Inspector</span>
          </div>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">{selectedPanel.label}</p>
            {selectedPanel.specLabel && (
              <Badge variant="secondary" className="text-[9px] mt-1">{selectedPanel.specLabel}</Badge>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dimensions</p>
            <PropertyRow label="Width">{(selectedPanel.size[0] / 0.3048).toFixed(1)} ft ({selectedPanel.size[0].toFixed(2)}m)</PropertyRow>
            <PropertyRow label="Height">{(selectedPanel.size[1] / 0.3048).toFixed(1)} ft ({selectedPanel.size[1].toFixed(2)}m)</PropertyRow>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Position</p>
            <div className="grid grid-cols-3 gap-1.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis} className="bg-muted/50 rounded px-2 py-1 text-center">
                  <span className="text-[9px] text-muted-foreground">{axis}</span>
                  <p className="text-[11px] font-mono">{selectedPanel.position[i].toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Content</p>
            {hasImage ? (
              <div className="space-y-2">
                <img src={assignments[selectedPanel.id]} alt="" className="w-full aspect-video object-cover rounded-md border" />
                <p className="text-[10px] text-muted-foreground">✓ Image assigned</p>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-md p-4 text-center">
                <ImageIcon className="h-5 w-5 mx-auto text-muted-foreground/50 mb-1" />
                <p className="text-[10px] text-muted-foreground">No image assigned</p>
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">Click panel in viewport to assign</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Asset selected
  if (selectedAsset && assetConfig) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Asset Inspector</span>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                onClick={() => onRemoveAsset(selectedAsset.instanceId)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">{assetConfig.name}</p>
            <p className="text-[10px] text-muted-foreground">{assetConfig.description}</p>
            <Badge variant="outline" className="text-[9px] mt-1 capitalize">{assetConfig.category}</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Maximize2 className="h-3 w-3" /> Size
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {['W', 'H', 'D'].map((label, i) => (
                <div key={label} className="bg-muted/50 rounded px-2 py-1 text-center">
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                  <p className="text-[11px] font-mono">{(assetConfig.size[i] / 0.3048).toFixed(1)}'</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Move className="h-3 w-3" /> Position
            </p>
            <PositionEditor
              position={selectedAsset.position}
              rotation={selectedAsset.rotation}
              onNudge={onNudgeAsset}
              instanceId={selectedAsset.instanceId}
            />
          </div>

          {assetConfig.hasScreen && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Monitor className="h-3 w-3" /> Screen Content
                </p>
                {selectedAsset.screenImageUrl ? (
                  <img src={selectedAsset.screenImageUrl} alt="" className="w-full aspect-video object-cover rounded-md border" />
                ) : (
                  <div className="bg-muted/50 rounded-md p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">No content assigned</p>
                  </div>
                )}
              </div>
            </>
          )}

          {assetConfig.hasTableCover && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Shirt className="h-3 w-3" /> Table Cover
                </p>
                {selectedAsset.tableCoverColor ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border" style={{ backgroundColor: selectedAsset.tableCoverColor }} />
                    <span className="text-[10px] font-mono">{selectedAsset.tableCoverColor}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{selectedAsset.tableCoverStyle || 'fitted'}</Badge>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">No cover applied</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
