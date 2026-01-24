/**
 * RealtimeIndicator Component
 * Shows real-time connection status with subtle visual feedback
 */

import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: string;
  className?: string;
}

export const RealtimeIndicator = ({ 
  isConnected, 
  lastUpdate,
  className 
}: RealtimeIndicatorProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors",
              isConnected 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-muted text-muted-foreground",
              className
            )}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <Wifi className="h-3 w-3" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <WifiOff className="h-3 w-3" />
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {isConnected ? 'Live updates enabled' : 'Offline - changes may not sync'}
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
