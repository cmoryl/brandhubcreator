/**
 * SceneLayersPanel - Layer visibility toggles for complex booth scenes
 */
import {
  Eye, EyeOff, Box, Image as ImageIcon, Monitor, Lightbulb,
  Armchair, Users, MessageSquare, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SceneLayer {
  id: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  count?: number;
}

interface SceneLayersPanelProps {
  layers: SceneLayer[];
  onToggleLayer: (layerId: string) => void;
}

const DEFAULT_LAYER_ICONS: Record<string, React.ReactNode> = {
  structure: <Box className="h-3.5 w-3.5" />,
  graphics: <ImageIcon className="h-3.5 w-3.5" />,
  screens: <Monitor className="h-3.5 w-3.5" />,
  lighting: <Lightbulb className="h-3.5 w-3.5" />,
  furniture: <Armchair className="h-3.5 w-3.5" />,
  people: <Users className="h-3.5 w-3.5" />,
  annotations: <MessageSquare className="h-3.5 w-3.5" />,
};

export function SceneLayersPanel({ layers, onToggleLayer }: SceneLayersPanelProps) {
  const visibleCount = layers.filter(l => l.visible).length;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layers</span>
        <span className="text-[9px] text-muted-foreground ml-auto">{visibleCount}/{layers.length}</span>
      </div>
      <div className="space-y-0.5">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onToggleLayer(layer.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
              layer.visible
                ? "text-foreground hover:bg-muted/50"
                : "text-muted-foreground/50 hover:bg-muted/30"
            )}
          >
            {layer.visible
              ? <Eye className="h-3 w-3 text-primary shrink-0" />
              : <EyeOff className="h-3 w-3 shrink-0" />}
            {layer.icon || DEFAULT_LAYER_ICONS[layer.id]}
            <span className="flex-1 text-left font-medium">{layer.label}</span>
            {layer.count !== undefined && (
              <span className="text-[9px] text-muted-foreground">{layer.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
