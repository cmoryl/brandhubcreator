import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Database, Trash2, RefreshCw, Loader2, HardDrive, Clock } from 'lucide-react';
import { getCacheStats, clearAllCaches, formatBytes, CacheStats } from '@/lib/cacheManager';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const CacheSettingsCard = () => {
  const queryClient = useQueryClient();
  const { refetch: refetchBrands } = useBrands();
  const { refetch: refetchEvents } = useEvents();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Load stats on mount and after operations
  const loadStats = () => {
    setStats(getCacheStats());
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const result = await clearAllCaches(queryClient);
      
      // Refetch data from backend
      await Promise.all([refetchBrands(), refetchEvents()]);

      // Reload stats
      loadStats();

      const clearedItems: string[] = [];
      if (result.localStorageCleared.brands) clearedItems.push('brands/products cache');
      if (result.localStorageCleared.events) clearedItems.push('events cache');
      if (result.portalCacheCleared > 0) clearedItems.push('portal cache');
      if (result.reactQueryInvalidated) clearedItems.push('query cache');

      toast.success('Cache cleared', {
        description: clearedItems.length > 0 
          ? `Cleared: ${clearedItems.join(', ')}. Fresh data loaded.`
          : 'All caches were already empty.',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache', {
        description: 'Please try again.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getMostRecentSync = (): Date | null => {
    if (!stats) return null;
    const dates = [
      stats.localStorageItems.brands.savedAt,
      stats.localStorageItems.events.savedAt,
    ].filter((d): d is Date => d !== null);
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };

  const totalItems = stats 
    ? stats.localStorageItems.brands.itemCount + stats.localStorageItems.events.itemCount
    : 0;

  const lastSync = getMostRecentSync();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache & Data
        </CardTitle>
        <CardDescription>
          Manage locally cached data for offline resilience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cache Statistics */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Storage Size */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage Used</p>
              <p className="font-medium">
                {stats ? formatBytes(stats.localStorageSize) : '—'}
              </p>
            </div>
          </div>

          {/* Cached Items */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cached Items</p>
              <p className="font-medium">{totalItems} items</p>
            </div>
          </div>

          {/* Last Sync */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Cached</p>
              <p className="font-medium">
                {lastSync 
                  ? formatDistanceToNow(lastSync, { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Cache Details */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Cache Layers</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              Brands & Products
              {stats?.localStorageItems.brands.exists && (
                <span className="text-xs opacity-70">
                  ({stats.localStorageItems.brands.itemCount})
                </span>
              )}
            </Badge>
            <Badge variant="outline" className="gap-1">
              Events
              {stats?.localStorageItems.events.exists && (
                <span className="text-xs opacity-70">
                  ({stats.localStorageItems.events.itemCount})
                </span>
              )}
            </Badge>
            <Badge variant="outline" className="gap-1">
              Portal Data
              {stats && stats.portalCacheItems > 0 && (
                <span className="text-xs opacity-70">
                  ({stats.portalCacheItems})
                </span>
              )}
            </Badge>
            <Badge variant="outline">Query Cache</Badge>
          </div>
        </div>

        {/* Clear Cache Button */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <p className="font-medium">Clear All Caches</p>
            <p className="text-sm text-muted-foreground">
              Purge cached data and fetch fresh from the server
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isClearing}>
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Clear Cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all cached data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all locally cached data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Offline brands and products cache</li>
                    <li>Offline events cache</li>
                    <li>Portal data cache</li>
                    <li>Query cache</li>
                  </ul>
                  <p className="mt-3">
                    Fresh data will be fetched from the server immediately.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCache} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Clear & Refresh
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
