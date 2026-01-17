import { useMemo } from 'react';
import { WifiOff, RefreshCw, CloudOff, Cloud, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useBrands } from '@/contexts/BrandContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const SyncStatusIndicator = () => {
  const { syncStatus, lastSyncedAt, isOnline, lastSyncError, refetch } = useBrands();

  const label = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing…';
    if (syncStatus === 'error') return 'Sync error';
    if (lastSyncedAt) return `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`;
    return 'Not synced';
  }, [isOnline, syncStatus, lastSyncedAt]);

  const Icon = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return WifiOff;
    if (syncStatus === 'syncing') return Cloud;
    if (syncStatus === 'error') return AlertTriangle;
    return CloudOff;
  }, [isOnline, syncStatus]);

  const variant = useMemo(() => {
    if (!isOnline || syncStatus === 'offline') return 'secondary' as const;
    if (syncStatus === 'error') return 'destructive' as const;
    return 'outline' as const;
  }, [isOnline, syncStatus]);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1.5 select-none">
            <Icon className="h-3.5 w-3.5" />
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
              <p className="mt-1 text-xs text-muted-foreground">Changes will keep locally and sync when you’re back online.</p>
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
