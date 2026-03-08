/**
 * MiniMapOverlay - Small top-down floor plan navigator
 * Shows booth layout, object placement, and camera position
 */
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PanelConfig } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';

interface MiniMapOverlayProps {
  panels: PanelConfig[];
  placedAssets: PlacedAsset[];
  boothFootprint: string;
  className?: string;
}

export function MiniMapOverlay({ panels, placedAssets, boothFootprint, className }: MiniMapOverlayProps) {
  // Parse footprint like "10'×10'" or "20'×20'"
  const { mapWidth, mapDepth, scale } = useMemo(() => {
    const match = boothFootprint.match(/(\d+)[''′]?\s*[×x]\s*(\d+)/);
    const w = match ? parseInt(match[1]) : 10;
    const d = match ? parseInt(match[2]) : 10;
    const maxDim = Math.max(w, d);
    const mapSize = 120; // px
    return { mapWidth: w, mapDepth: d, scale: mapSize / (maxDim * 0.3048 + 2) }; // +2m padding
  }, [boothFootprint]);

  // Convert world position to minimap pixel position
  const toMapPos = (worldX: number, worldZ: number) => ({
    x: 60 + worldX * scale,
    y: 60 + worldZ * scale,
  });

  return (
    <div className={cn(
      "absolute bottom-3 left-3 z-10 bg-background/85 backdrop-blur-sm rounded-lg border shadow-lg overflow-hidden",
      className
    )}>
      <div className="px-2 py-1 border-b">
        <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Mini Map</span>
      </div>
      <div className="relative" style={{ width: 120, height: 120 }}>
        {/* Background grid */}
        <svg width="120" height="120" className="absolute inset-0">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i}>
              <line x1={24 * i} y1={0} x2={24 * i} y2={120} stroke="currentColor" strokeOpacity={0.06} />
              <line x1={0} y1={24 * i} x2={120} y2={24 * i} stroke="currentColor" strokeOpacity={0.06} />
            </g>
          ))}
        </svg>

        {/* Booth boundary */}
        <div
          className="absolute border border-primary/40 bg-primary/5 rounded-sm"
          style={{
            left: 60 - (mapWidth * 0.3048 * scale) / 2,
            top: 60 - (mapDepth * 0.3048 * scale) / 2,
            width: mapWidth * 0.3048 * scale,
            height: mapDepth * 0.3048 * scale,
          }}
        />

        {/* Panels as lines */}
        {panels.map(panel => {
          const pos = toMapPos(panel.position[0], panel.position[2]);
          const isVertical = Math.abs(panel.rotation[1]) > 0.5;
          const len = panel.size[0] * scale;
          return (
            <div
              key={panel.id}
              className="absolute bg-primary/60 rounded-full"
              style={{
                left: pos.x - (isVertical ? 1 : len / 2),
                top: pos.y - (isVertical ? len / 2 : 1),
                width: isVertical ? 2 : len,
                height: isVertical ? len : 2,
              }}
            />
          );
        })}

        {/* Placed assets as dots */}
        {placedAssets.map(asset => {
          const pos = toMapPos(asset.position[0], asset.position[2]);
          return (
            <div
              key={asset.instanceId}
              className="absolute w-2 h-2 bg-accent rounded-full border border-background"
              style={{ left: pos.x - 4, top: pos.y - 4 }}
              title={asset.label || asset.assetId}
            />
          );
        })}

        {/* Center indicator */}
        <div className="absolute w-1.5 h-1.5 bg-foreground/30 rounded-full" style={{ left: 59.25, top: 59.25 }} />
      </div>
    </div>
  );
}
