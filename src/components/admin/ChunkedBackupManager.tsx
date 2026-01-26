import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  HardDrive,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pause,
  Play,
  FileJson,
  Package,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { useChunkedBackup, BackupItem, BackupProgress } from '@/hooks/useChunkedBackup';
import { cn } from '@/lib/utils';

interface BackupHistory {
  id: string;
  organization_id: string;
  backup_type: string;
  backup_path: string;
  brands_count: number;
  products_count: number;
  file_size_bytes: number | null;
  created_at: string;
  status: string;
  error_message: string | null;
}

interface ChunkedBackupManagerProps {
  organizationId: string;
  organizationName?: string;
}

export const ChunkedBackupManager = ({ organizationId, organizationName }: ChunkedBackupManagerProps) => {
  const [backups, setBackups] = useState<BackupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<BackupHistory | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [expandedItems, setExpandedItems] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    brands: true,
    products: true,
    events: true,
  });
  const [restoreOptions, setRestoreOptions] = useState({
    brands: true,
    products: true,
    events: true,
    overwrite: false,
  });

  const { progress, createChunkedBackup, cancelBackup, resetProgress } = useChunkedBackup();

  useEffect(() => {
    fetchBackups();
  }, [organizationId]);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackups((data as BackupHistory[]) || []);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
      toast.error('Failed to load backup history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    resetProgress();
    await createChunkedBackup({
      organizationId,
      includeBrands: backupOptions.brands,
      includeProducts: backupOptions.products,
      includeEvents: backupOptions.events,
    });
    fetchBackups();
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to restore backups');
        return;
      }

      // First try to download the manifest
      const { data: manifestData, error: manifestError } = await supabase.storage
        .from('brand-backups')
        .download(selectedBackup.backup_path);

      if (manifestError) {
        throw new Error(`Failed to download manifest: ${manifestError.message}`);
      }

      const manifestText = await manifestData.text();
      const manifest = JSON.parse(manifestText);

      // Check if this is a chunked backup or legacy format
      const isChunked = manifest.type === 'chunked-manifest' || manifest.version === '2.1';
      const basePath = selectedBackup.backup_path.replace('/manifest.json', '');

      let restoredBrands = 0;
      let restoredProducts = 0;
      let restoredEvents = 0;

      if (isChunked) {
        // Chunked backup - download and restore each item individually
        if (restoreOptions.brands && manifest.manifest?.brands) {
          for (const brand of manifest.manifest.brands) {
            try {
              const brandPath = `${basePath}/brands/${brand.id}.json`;
              const { data: brandData, error: brandError } = await supabase.storage
                .from('brand-backups')
                .download(brandPath);

              if (brandError) {
                console.warn(`Failed to download brand ${brand.id}:`, brandError);
                continue;
              }

              const brandJson = JSON.parse(await brandData.text());
              
              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('brands')
                  .upsert({
                    ...brandJson,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredBrands++;
              } else {
                const { data: existing } = await supabase
                  .from('brands')
                  .select('id')
                  .eq('id', brandJson.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('brands')
                    .insert({
                      ...brandJson,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredBrands++;
                }
              }
            } catch (e) {
              console.error('Error restoring brand:', e);
            }
          }
        }

        // Similar for products
        if (restoreOptions.products && manifest.manifest?.products) {
          for (const product of manifest.manifest.products) {
            try {
              const productPath = `${basePath}/products/${product.id}.json`;
              const { data: productData, error: productError } = await supabase.storage
                .from('brand-backups')
                .download(productPath);

              if (productError) continue;

              const productJson = JSON.parse(await productData.text());

              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('products')
                  .upsert({
                    ...productJson,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredProducts++;
              } else {
                const { data: existing } = await supabase
                  .from('products')
                  .select('id')
                  .eq('id', productJson.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('products')
                    .insert({
                      ...productJson,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredProducts++;
                }
              }
            } catch (e) {
              console.error('Error restoring product:', e);
            }
          }
        }

        // Similar for events
        if (restoreOptions.events && manifest.manifest?.events) {
          for (const event of manifest.manifest.events) {
            try {
              const eventPath = `${basePath}/events/${event.id}.json`;
              const { data: eventData, error: eventError } = await supabase.storage
                .from('brand-backups')
                .download(eventPath);

              if (eventError) continue;

              const eventJson = JSON.parse(await eventData.text());

              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('events')
                  .upsert({
                    ...eventJson,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredEvents++;
              } else {
                const { data: existing } = await supabase
                  .from('events')
                  .select('id')
                  .eq('id', eventJson.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('events')
                    .insert({
                      ...eventJson,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredEvents++;
                }
              }
            } catch (e) {
              console.error('Error restoring event:', e);
            }
          }
        }
      } else {
        // Legacy backup format - handle old backups
        const backupPath = selectedBackup.backup_path.endsWith('manifest.json')
          ? selectedBackup.backup_path.replace('manifest.json', 'backup.json')
          : selectedBackup.backup_path;

        const { data: legacyData, error: legacyError } = await supabase.storage
          .from('brand-backups')
          .download(backupPath);

        if (legacyError) {
          throw new Error(`Failed to download legacy backup: ${legacyError.message}`);
        }

        const legacyBackup = JSON.parse(await legacyData.text());

        // Restore from legacy format
        if (restoreOptions.brands && legacyBackup.data?.brands) {
          for (const brand of legacyBackup.data.brands) {
            try {
              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('brands')
                  .upsert({
                    ...brand,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredBrands++;
              } else {
                const { data: existing } = await supabase
                  .from('brands')
                  .select('id')
                  .eq('id', brand.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('brands')
                    .insert({
                      ...brand,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredBrands++;
                }
              }
            } catch (e) {
              console.error('Error restoring brand:', e);
            }
          }
        }

        if (restoreOptions.products && legacyBackup.data?.products) {
          for (const product of legacyBackup.data.products) {
            try {
              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('products')
                  .upsert({
                    ...product,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredProducts++;
              } else {
                const { data: existing } = await supabase
                  .from('products')
                  .select('id')
                  .eq('id', product.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('products')
                    .insert({
                      ...product,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredProducts++;
                }
              }
            } catch (e) {
              console.error('Error restoring product:', e);
            }
          }
        }

        if (restoreOptions.events && legacyBackup.data?.events) {
          for (const event of legacyBackup.data.events) {
            try {
              if (restoreOptions.overwrite) {
                const { error } = await supabase
                  .from('events')
                  .upsert({
                    ...event,
                    organization_id: organizationId,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!error) restoredEvents++;
              } else {
                const { data: existing } = await supabase
                  .from('events')
                  .select('id')
                  .eq('id', event.id)
                  .single();

                if (!existing) {
                  const { error } = await supabase
                    .from('events')
                    .insert({
                      ...event,
                      organization_id: organizationId,
                      user_id: user.id,
                    });

                  if (!error) restoredEvents++;
                }
              }
            } catch (e) {
              console.error('Error restoring event:', e);
            }
          }
        }
      }

      toast.success(`Restored ${restoredBrands} brands, ${restoredProducts} products, ${restoredEvents} events`);
      setShowRestoreDialog(false);
      setSelectedBackup(null);
    } catch (err) {
      console.error('Restore error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      // For chunked backups, we need to delete the folder
      const basePath = selectedBackup.backup_path.replace('/manifest.json', '');

      // List all files in the backup folder
      const { data: files, error: listError } = await supabase.storage
        .from('brand-backups')
        .list(basePath);

      if (!listError && files && files.length > 0) {
        // Delete subfolders and files
        const filePaths = files.map(f => `${basePath}/${f.name}`);

        // Check for subfolders (brands, products, events)
        for (const subfolder of ['brands', 'products', 'events']) {
          const { data: subFiles } = await supabase.storage
            .from('brand-backups')
            .list(`${basePath}/${subfolder}`);

          if (subFiles && subFiles.length > 0) {
            const subFilePaths = subFiles.map(f => `${basePath}/${subfolder}/${f.name}`);
            await supabase.storage.from('brand-backups').remove(subFilePaths);
          }
        }

        await supabase.storage.from('brand-backups').remove(filePaths);
      }

      // Delete from history
      const { error: historyError } = await supabase
        .from('backup_history')
        .delete()
        .eq('id', selectedBackup.id);

      if (historyError) throw historyError;

      toast.success('Backup deleted');
      setShowDeleteDialog(false);
      setSelectedBackup(null);
      fetchBackups();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete backup');
    }
  };

  const downloadBackupLocal = async (backup: BackupHistory) => {
    try {
      const { data, error } = await supabase.storage
        .from('brand-backups')
        .download(backup.backup_path);

      if (error) throw error;

      const blob = new Blob([await data.text()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${format(new Date(backup.created_at), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download backup');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getItemStatusIcon = (status: BackupItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'skipped':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const isBackupInProgress = progress.phase !== 'idle' && progress.phase !== 'complete' && progress.phase !== 'error';
  const progressPercent = progress.totalItems > 0
    ? Math.round((progress.processedItems / progress.totalItems) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backup Manager
            </CardTitle>
            <CardDescription>
              {organizationName ? `Backups for ${organizationName}` : 'Segmented, chunked backups for reliable data protection'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackups}
              disabled={isLoading || isBackupInProgress}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            {isBackupInProgress ? (
              <Button variant="destructive" size="sm" onClick={cancelBackup}>
                <Pause className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <Button onClick={handleCreateBackup} size="sm" disabled={isBackupInProgress}>
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Backup Options */}
        {!isBackupInProgress && (
          <div className="flex items-center gap-6 p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Include:</span>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={backupOptions.brands}
                  onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, brands: !!checked }))}
                />
                <span className="text-sm">Brands</span>
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={backupOptions.products}
                  onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, products: !!checked }))}
                />
                <span className="text-sm">Products</span>
              </Label>
              <Label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={backupOptions.events}
                  onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, events: !!checked }))}
                />
                <span className="text-sm">Events</span>
              </Label>
            </div>
          </div>
        )}

        {/* Backup Progress */}
        {(isBackupInProgress || progress.phase === 'complete' || progress.phase === 'error') && (
          <div className="space-y-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {progress.phase === 'complete' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : progress.phase === 'error' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                <span className="font-medium">
                  {progress.phase === 'estimating' && 'Analyzing data...'}
                  {progress.phase === 'backing-up' && `Backing up: ${progress.currentItem || '...'}`}
                  {progress.phase === 'uploading' && 'Finalizing backup...'}
                  {progress.phase === 'complete' && 'Backup complete!'}
                  {progress.phase === 'error' && 'Backup failed'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.processedItems}/{progress.totalItems} items
              </span>
            </div>

            <Progress value={progressPercent} className="h-2" />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatFileSize(progress.processedBytes)} processed</span>
              <span>{progressPercent}%</span>
            </div>

            {/* Item Details Collapsible */}
            {progress.items.length > 0 && (
              <Collapsible open={expandedItems} onOpenChange={setExpandedItems}>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  {expandedItems ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  View item details
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-[200px] mt-2">
                    <div className="space-y-1">
                      {progress.items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded text-sm",
                            item.status === 'error' && "bg-destructive/10",
                            item.status === 'completed' && "bg-green-500/10",
                            item.status === 'processing' && "bg-primary/10"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getItemStatusIcon(item.status)}
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="truncate max-w-[200px]">{item.name}</span>
                          </div>
                          {item.size && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(item.size)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Errors */}
            {progress.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{progress.errors.length} error(s)</span>
                </div>
                <ul className="text-sm space-y-1 text-destructive/80">
                  {progress.errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {progress.errors.length > 5 && (
                    <li className="text-muted-foreground">...and {progress.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {(progress.phase === 'complete' || progress.phase === 'error') && (
              <Button variant="outline" size="sm" onClick={resetProgress}>
                Dismiss
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Backup History */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Backup History
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No backups yet</p>
              <p className="text-sm">Create your first backup to protect your data</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(backup.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {format(new Date(backup.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {backup.backup_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {backup.brands_count} brands
                          </span>
                          <span className="flex items-center gap-1">
                            <FileJson className="h-3 w-3" />
                            {backup.products_count} products
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(backup.file_size_bytes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadBackupLocal(backup)}
                        title="Download locally"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreDialog(true);
                        }}
                        title="Restore"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBackup && (
                <span>
                  Restore from backup created{' '}
                  {formatDistanceToNow(new Date(selectedBackup.created_at), { addSuffix: true })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>What to restore:</Label>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={restoreOptions.brands}
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({ ...prev, brands: !!checked }))
                    }
                  />
                  <span>Brands ({selectedBackup?.brands_count || 0})</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={restoreOptions.products}
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({ ...prev, products: !!checked }))
                    }
                  />
                  <span>Products ({selectedBackup?.products_count || 0})</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={restoreOptions.events}
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({ ...prev, events: !!checked }))
                    }
                  />
                  <span>Events</span>
                </Label>
              </div>
            </div>

            <Separator />

            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={restoreOptions.overwrite}
                onCheckedChange={(checked) =>
                  setRestoreOptions((prev) => ({ ...prev, overwrite: !!checked }))
                }
              />
              <div>
                <span className="font-medium">Overwrite existing items</span>
                <p className="text-xs text-muted-foreground">
                  If unchecked, only missing items will be restored
                </p>
              </div>
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              disabled={isRestoring || (!restoreOptions.brands && !restoreOptions.products && !restoreOptions.events)}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
              {selectedBackup && (
                <span className="block mt-2 font-medium">
                  Created {formatDistanceToNow(new Date(selectedBackup.created_at), { addSuffix: true })} •{' '}
                  {formatFileSize(selectedBackup.file_size_bytes)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBackup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
