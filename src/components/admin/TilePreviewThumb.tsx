/**
 * TilePreviewThumb - Small static tile preview thumbnail for preset cards
 * Extracted to a separate file to avoid pulling in Leaflet dependency
 */

import React, { memo } from 'react';
import { MAP_TILE_CONFIGS } from '@/types/mapTheme';

export const TilePreviewThumb = memo(({ tileStyle, size = 80 }: { tileStyle: string; size?: number }) => {
  const config = MAP_TILE_CONFIGS[tileStyle as keyof typeof MAP_TILE_CONFIGS];
  if (!config) return null;

  // Use a static tile image from the tile server
  const tileUrl = config.url
    .replace('{s}', 'a')
    .replace('{z}', '3')
    .replace('{x}', '4')
    .replace('{y}', '2')
    .replace('{r}', '');

  return (
    <div
      className="rounded-md overflow-hidden border border-border/50"
      style={{ width: size, height: size * 0.6 }}
    >
      <img
        src={tileUrl}
        alt={config.label}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
});

TilePreviewThumb.displayName = 'TilePreviewThumb';
