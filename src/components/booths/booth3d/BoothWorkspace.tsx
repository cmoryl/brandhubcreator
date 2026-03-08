/**
 * BoothWorkspace - 3-panel IDE layout shell with 5 working modes
 * Wraps the 3D canvas with collapsible left (asset library/layers) and right (inspector) panels
 */
import { useState, useCallback, type ReactNode } from 'react';
import {
  Paintbrush, Image as ImageIcon, Activity, Wrench, Presentation,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type BoothMode = 'design' | 'graphics' | 'simulation' | 'production' | 'presentation';

interface ModeConfig {
  id: BoothMode;
  label: string;
  icon: ReactNode;
  description: string;
}

export const BOOTH_MODES: ModeConfig[] = [
  { id: 'design', label: 'Design', icon: <Paintbrush className="h-4 w-4" />, description: 'Build booth structure, place furniture, arrange lighting' },
  { id: 'graphics', label: 'Graphics', icon: <ImageIcon className="h-4 w-4" />, description: 'Manage panel artwork, assign assets, validate specs' },
  { id: 'simulation', label: 'Simulate', icon: <Activity className="h-4 w-4" />, description: 'Traffic simulation, heat maps, engagement zones' },
  { id: 'production', label: 'Production', icon: <Wrench className="h-4 w-4" />, description: 'Vendor packets, spec sheets, install guides' },
  { id: 'presentation', label: 'Present', icon: <Presentation className="h-4 w-4" />, description: 'Sales decks, hero renders, AR preview' },
];

interface BoothWorkspaceProps {
  activeMode: BoothMode;
  onModeChange: (mode: BoothMode) => void;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  canvas: ReactNode;
  toolbar?: ReactNode;
  bottomContent?: ReactNode;
  /** Whether left panel is available in current mode */
  hasLeftPanel?: boolean;
  /** Whether right panel is available in current mode */
  hasRightPanel?: boolean;
}

export function BoothWorkspace({
  activeMode,
  onModeChange,
  leftPanel,
  rightPanel,
  canvas,
  toolbar,
  bottomContent,
  hasLeftPanel = true,
  hasRightPanel = true,
}: BoothWorkspaceProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);

  return (
    <div className="flex flex-col gap-0 rounded-xl border bg-card overflow-hidden">
      {/* Mode Tab Bar */}
      <div className="flex items-center gap-0 border-b bg-muted/30 px-1">
        <TooltipProvider delayDuration={300}>
          {BOOTH_MODES.map((mode) => (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onModeChange(mode.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px",
                    activeMode === mode.id
                      ? "border-primary text-primary bg-background/80"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                >
                  {mode.icon}
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {mode.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        {/* Panel toggles */}
        <div className="ml-auto flex items-center gap-1 pr-1">
          {hasLeftPanel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setLeftOpen(v => !v)}
            >
              {leftOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            </Button>
          )}
          {hasRightPanel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setRightOpen(v => !v)}
            >
              {rightOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mode-specific toolbar */}
      {toolbar && (
        <div className="border-b bg-background/50 px-3 py-1.5">
          {toolbar}
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        {hasLeftPanel && leftOpen && leftPanel && (
          <div className="w-[240px] shrink-0 border-r bg-background/50 overflow-y-auto max-h-[620px]">
            {leftPanel}
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 min-w-0 relative">
          {canvas}
        </div>

        {/* Right Panel */}
        {hasRightPanel && rightOpen && rightPanel && (
          <div className="w-[260px] shrink-0 border-l bg-background/50 overflow-y-auto max-h-[620px]">
            {rightPanel}
          </div>
        )}
      </div>

      {/* Below-canvas content */}
      {bottomContent && (
        <div className="border-t p-3">
          {bottomContent}
        </div>
      )}
    </div>
  );
}
