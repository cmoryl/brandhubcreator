import { useMemo, useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CloudOff, Cloud, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useBrands } from '@/contexts/BrandContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  /** Compact mode for editor headers - just shows Saving.../Saved */
  compact?: boolean;
}

export const SyncStatusIndicator = ({ compact = false }: SyncStatusIndicatorProps) => {
  const { syncStatus, lastSyncedAt, isOnline, lastSyncError, refetch, hasPendingChanges, isLoading } = useBrands();
  
  // Track if we have pending changes (poll every 200ms for responsiveness)
  const [isPending, setIsPending] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  useEffect(() => {
    const checkPending = () => {
      const pending = hasPendingChanges();
      
      // If we were pending and now we're not, show "Saved" briefly
      if (isPending && !pending) {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }
      
      setIsPending(pending);
    };
    
    checkPending();
    const interval = setInterval(checkPending, 200);
    return () => clearInterval(interval);
  }, [hasPendingChanges, isPending]);

  // Don't show "Saving..." during initial data load - that's just fetching, not saving
  // Only show syncing status when there are actual pending changes being saved
  const isActuallySaving = (isPending || syncStatus === 'syncing') && !isLoading;

  // Compact mode for editor headers
  if (compact) {
    if (!isOnline) {
      return (
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </Badge>
      );
    }
    
    if (isActuallySaving) {
      return (
        <Badge variant="outline" className="gap-1.5 text-xs bg-primary/5 border-primary/20 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </Badge>
      );
    }
    
    if (syncStatus === 'error') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1.5 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Save failed</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{lastSyncError || 'Failed to save changes'}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    if (showSaved) {
      return (
        <Badge variant="outline" className="gap-1.5 text-xs bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400">
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </Badge>
      );
    }
    
    // Idle state - show nothing or subtle indicator
    return null;
  }

  // Full mode (original behavior)
  const label = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return 'Offline';
    if (isActuallySaving) return 'Saving…';
    if (syncStatus === 'error') return 'Sync error';
    if (showSaved) return 'Saved';
    if (lastSyncedAt) return `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`;
    return 'All changes saved';
  }, [isOnline, syncStatus, lastSyncedAt, isActuallySaving, showSaved]);

  const Icon = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return WifiOff;
    if (isActuallySaving) return Loader2;
    if (syncStatus === 'error') return AlertTriangle;
    if (showSaved) return Check;
    return Cloud;
  }, [isOnline, syncStatus, isActuallySaving, showSaved]);

  const variant = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return 'secondary' as const;
    if (syncStatus === 'error') return 'destructive' as const;
    if (showSaved) return 'outline' as const;
    return 'outline' as const;
  }, [isOnline, syncStatus, showSaved]);

  const iconClass = useMemo(() => {
    if (isActuallySaving) return 'h-3.5 w-3.5 animate-spin';
    if (showSaved) return 'h-3.5 w-3.5 text-green-600 dark:text-green-400';
    return 'h-3.5 w-3.5';
  }, [isActuallySaving, showSaved]);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant} 
            className={`gap-1.5 select-none transition-colors ${showSaved ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : ''}`}
          >
            <Icon className={iconClass} />
            <span className="hidden sm:inline">{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{label}</p>
            {lastSyncError && syncStatus === 'error' && (
              <p className="mt-1 text-xs text-muted-foreground break-words">{lastSyncError}</p>
            )}
            {!isOnline && (
              <p className="mt-1 text-xs text-muted-foreground">Changes will keep locally and sync when you're back online.</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => refetch()}
        aria-label="Refresh data"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};
