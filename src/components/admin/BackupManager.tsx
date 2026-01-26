import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  History,
  Shield,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

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

interface BackupManagerProps {
  organizationId: string;
  organizationName?: string;
}

export const BackupManager = ({ organizationId, organizationName }: BackupManagerProps) => {
  const [backups, setBackups] = useState<BackupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupHistory | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreOptions, setRestoreOptions] = useState({
    brands: true,
    products: true,
    events: true,
    overwrite: false,
  });

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

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('You must be logged in to create backups');
        return;
      }

      const { data, error } = await supabase.functions.invoke('backup-brands', {
        body: { organizationId, backupType: 'manual' },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Backup created successfully');
        fetchBackups();
      } else {
        throw new Error(data.error || 'Backup failed');
      }
    } catch (err) {
      console.error('Backup error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('You must be logged in to restore backups');
        return;
      }

      const { data, error } = await supabase.functions.invoke('restore-brand-backup', {
        body: {
          backupPath: selectedBackup.backup_path,
          organizationId,
          restoreOptions,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || 'Backup restored successfully');
        setShowRestoreDialog(false);
        setSelectedBackup(null);
      } else {
        throw new Error(data.error || 'Restore failed');
      }
    } catch (err) {
      console.error('Restore error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backup: BackupHistory) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-backups')
        .remove([backup.backup_path]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from history
      const { error: historyError } = await supabase
        .from('backup_history')
        .delete()
        .eq('id', backup.id);

      if (historyError) throw historyError;

      toast.success('Backup deleted');
      fetchBackups();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete backup');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              {organizationName ? `Backups for ${organizationName}` : 'Automatic and manual backups'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackups}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={createBackup}
              disabled={isCreatingBackup}
              size="sm"
            >
              {isCreatingBackup ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No backups yet</p>
            <p className="text-sm mt-1">Create your first backup to protect your brand data</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                      {backup.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : backup.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(new Date(backup.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                        <Badge variant={backup.backup_type === 'scheduled' ? 'secondary' : 'outline'}>
                          {backup.backup_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {backup.brands_count} brands, {backup.products_count} products
                        </span>
                        <span>{formatFileSize(backup.file_size_bytes)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreDialog(true);
                      }}
                      disabled={backup.status !== 'completed'}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteBackup(backup)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Restore Dialog */}
        <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Backup</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedBackup && (
                  <span>
                    Restore backup from {format(new Date(selectedBackup.created_at), 'MMM d, yyyy HH:mm')}
                    <br />
                    Contains: {selectedBackup.brands_count} brands, {selectedBackup.products_count} products
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">What to restore:</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-brands"
                    checked={restoreOptions.brands}
                    onCheckedChange={(checked) =>
                      setRestoreOptions({ ...restoreOptions, brands: checked as boolean })
                    }
                  />
                  <Label htmlFor="restore-brands" className="text-sm">Brands</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-products"
                    checked={restoreOptions.products}
                    onCheckedChange={(checked) =>
                      setRestoreOptions({ ...restoreOptions, products: checked as boolean })
                    }
                  />
                  <Label htmlFor="restore-products" className="text-sm">Products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-events"
                    checked={restoreOptions.events}
                    onCheckedChange={(checked) =>
                      setRestoreOptions({ ...restoreOptions, events: checked as boolean })
                    }
                  />
                  <Label htmlFor="restore-events" className="text-sm">Events</Label>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={restoreOptions.overwrite}
                    onCheckedChange={(checked) =>
                      setRestoreOptions({ ...restoreOptions, overwrite: checked as boolean })
                    }
                  />
                  <Label htmlFor="overwrite" className="text-sm">
                    Overwrite existing items (otherwise skip duplicates)
                  </Label>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  restoreBackup();
                }}
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
                    Restore Backup
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
