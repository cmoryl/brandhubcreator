/**
 * ProductSuiteBackupManager Component
 * Admin panel for backing up and restoring full Product Suite configurations
 * Supports both creating backups and uploading JSON files to restore
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Trash2, 
  Download, 
  Upload,
  Star,
  Loader2,
  Package,
  Calendar,
  FileJson,
  Check,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ProductSuiteBackup {
  id: string;
  universe_type: string;
  universe_name: string;
  backup_name: string;
  backup_data: Record<string, unknown>;
  backup_type: string;
  product_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface SuiteMaster {
  id: string;
  name: string;
  slug: string;
  guide_data: Record<string, unknown>;
}

interface AdminOrgOption {
  id: string;
  name: string;
  slug: string;
}

export const ProductSuiteBackupManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const { organization } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [backups, setBackups] = useState<ProductSuiteBackup[]>([]);
  const [suiteMasters, setSuiteMasters] = useState<SuiteMaster[]>([]);
  const [adminOrgs, setAdminOrgs] = useState<AdminOrgOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [newBackupName, setNewBackupName] = useState('');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<ProductSuiteBackup | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<ProductSuiteBackup | null>(null);
  const [uploadedData, setUploadedData] = useState<Record<string, unknown> | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [targetSuiteForUpload, setTargetSuiteForUpload] = useState<string>('');

  const effectiveOrgId = organization?.id || selectedOrgId;

  // Fetch suite masters and backups
  useEffect(() => {
    // If context org exists, prefer it.
    // If not, allow admins to select an org (loaded below).
    if (!organization?.id && !selectedOrgId) return;
    fetchData();
  }, [organization?.id, selectedOrgId]);

  // Load organizations for global admins when no org is in context
  useEffect(() => {
    if (!isAdmin) return;
    if (organization?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .order('name');

        if (error) throw error;
        const orgs = (data as AdminOrgOption[]) || [];
        if (cancelled) return;
        setAdminOrgs(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        toast.error('Failed to load organizations');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, organization?.id, selectedOrgId]);

  const fetchData = async () => {
    if (!effectiveOrgId) return;
    
    setLoading(true);
    try {
      // Fetch suite masters
      const { data: suites, error: suitesError } = await supabase
        .from('products')
        .select('id, name, slug, guide_data')
        .eq('organization_id', effectiveOrgId)
        .eq('is_suite_master', true)
        .order('name');

      if (suitesError) throw suitesError;
      setSuiteMasters((suites as SuiteMaster[]) || []);
      
      if (suites && suites.length > 0 && !selectedSuiteId) {
        setSelectedSuiteId(suites[0].id);
      }

      // Fetch product suite backups
      const { data: backupData, error: backupsError } = await supabase
        .from('universe_backups')
        .select('*')
        .eq('organization_id', effectiveOrgId)
        .eq('backup_type', 'product_suite')
        .order('created_at', { ascending: false });

      if (backupsError) throw backupsError;
      setBackups((backupData as unknown as ProductSuiteBackup[]) || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Create a new backup from current suite data
  const createBackup = async () => {
    if (!effectiveOrgId || !newBackupName.trim() || !selectedSuiteId) {
      if (!effectiveOrgId) {
        toast.error('Please select an organization');
        return;
      }
      toast.error('Please select a suite and enter a backup name');
      return;
    }

    const suite = suiteMasters.find(s => s.id === selectedSuiteId);
    if (!suite) {
      toast.error('Suite not found');
      return;
    }

    setSaving(true);
    try {
      // Fetch the full current guide_data
      const { data: currentData, error: fetchError } = await supabase
        .from('products')
        .select('guide_data, name, slug, is_public, is_suite_master, hidden_sections, section_order')
        .eq('id', selectedSuiteId)
        .single();

      if (fetchError) throw fetchError;

      const backupPayload = {
        guide_data: currentData.guide_data,
        name: currentData.name,
        slug: currentData.slug,
        is_public: currentData.is_public,
        is_suite_master: currentData.is_suite_master,
        hidden_sections: currentData.hidden_sections,
        section_order: currentData.section_order,
        backed_up_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('universe_backups')
        .insert({
          universe_type: 'product_suite',
          universe_name: suite.name,
          backup_name: newBackupName.trim(),
          backup_data: backupPayload,
          backup_type: 'product_suite',
          product_id: selectedSuiteId,
          organization_id: effectiveOrgId,
          is_default: false,
        } as any);

      if (error) throw error;

      toast.success(`Backup "${newBackupName}" created for ${suite.name}`);
      setNewBackupName('');
      fetchData();
    } catch (err) {
      console.error('Error creating backup:', err);
      toast.error('Failed to create backup');
    } finally {
      setSaving(false);
    }
  };

  // Restore from backup
  const restoreBackup = async (backup: ProductSuiteBackup) => {
    if (!backup.product_id) {
      toast.error('No product associated with this backup');
      return;
    }

    setRestoring(backup.id);
    try {
      const backupData = backup.backup_data as any;
      
      const updatePayload: Record<string, unknown> = {
        guide_data: backupData.guide_data,
      };

      // Optionally restore other fields if they exist in backup
      if (backupData.name) updatePayload.name = backupData.name;
      if (backupData.hidden_sections) updatePayload.hidden_sections = backupData.hidden_sections;
      if (backupData.section_order) updatePayload.section_order = backupData.section_order;
      if (typeof backupData.is_public === 'boolean') updatePayload.is_public = backupData.is_public;

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', backup.product_id);

      if (error) throw error;

      toast.success(`Restored "${backup.backup_name}" to ${backup.universe_name}`);
      setRestoreConfirm(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      toast.error('Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Validate the structure
        if (!parsed.guide_data && !parsed.hero && !parsed.colors) {
          toast.error('Invalid backup file format - missing required data');
          setUploading(false);
          return;
        }

        // If it's a raw guide_data export, wrap it
        const normalizedData = parsed.guide_data ? parsed : { guide_data: parsed };
        
        setUploadedData(normalizedData);
        setUploadFileName(file.name);
        setShowUploadConfirm(true);
      } catch (err) {
        console.error('Error parsing file:', err);
        toast.error('Invalid JSON file');
      } finally {
        setUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file');
      setUploading(false);
    };

    reader.readAsText(file);
  };

  // Apply uploaded data to a suite
  const applyUploadedData = async () => {
    if (!uploadedData || !targetSuiteForUpload) {
      toast.error('Please select a target suite');
      return;
    }

    setUploading(true);
    try {
      const data = uploadedData as any;
      
      const updatePayload: Record<string, unknown> = {};
      
      // If guide_data exists, use it; otherwise treat the whole object as guide_data
      if (data.guide_data) {
        updatePayload.guide_data = data.guide_data;
      } else {
        updatePayload.guide_data = data;
      }

      // Apply other fields if present
      if (data.name) updatePayload.name = data.name;
      if (data.hidden_sections) updatePayload.hidden_sections = data.hidden_sections;
      if (data.section_order) updatePayload.section_order = data.section_order;
      if (typeof data.is_public === 'boolean') updatePayload.is_public = data.is_public;

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', targetSuiteForUpload);

      if (error) throw error;

      const targetSuite = suiteMasters.find(s => s.id === targetSuiteForUpload);
      toast.success(`Uploaded backup applied to ${targetSuite?.name || 'suite'}`);
      
      // Reset upload state
      setUploadedData(null);
      setUploadFileName('');
      setShowUploadConfirm(false);
      setTargetSuiteForUpload('');
    } catch (err) {
      console.error('Error applying upload:', err);
      toast.error('Failed to apply uploaded backup');
    } finally {
      setUploading(false);
    }
  };

  // Delete backup
  const deleteBackup = async (backup: ProductSuiteBackup) => {
    try {
      const { error } = await supabase
        .from('universe_backups')
        .delete()
        .eq('id', backup.id);

      if (error) throw error;

      toast.success(`Deleted "${backup.backup_name}"`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting backup:', err);
      toast.error('Failed to delete backup');
    }
  };

  // Export backup as JSON
  const exportBackup = (backup: ProductSuiteBackup) => {
    const blob = new Blob([JSON.stringify(backup.backup_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.universe_name.replace(/\s+/g, '-').toLowerCase()}-backup-${backup.backup_name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported');
  };

  // Group backups by product
  const backupsByProduct = suiteMasters.map(suite => ({
    suite,
    backups: backups.filter(b => b.product_id === suite.id),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Suite Backups</h2>
          <p className="text-muted-foreground mt-1">
            Create full backups of product suites and restore from saved files
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Package className="h-3 w-3" />
          Full Suite Data
        </Badge>
      </div>

      {/* Create New Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Backup</CardTitle>
          <CardDescription>
            Save a complete snapshot of a product suite including all guide data, colors, icons, and sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!organization?.id && isAdmin && (
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder={adminOrgs.length ? 'Select an organization...' : 'No organizations found'} />
                </SelectTrigger>
                <SelectContent>
                  {adminOrgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!effectiveOrgId && (
                <p className="text-sm text-muted-foreground">
                  Select an organization to load its product suites.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Product Suite</Label>
              <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a suite master..." />
                </SelectTrigger>
                <SelectContent>
                  {suiteMasters.map(suite => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suite-backup-name">Backup Name</Label>
              <Input
                id="suite-backup-name"
                placeholder="e.g., 'Before major update'"
                value={newBackupName}
                onChange={(e) => setNewBackupName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={createBackup}
              disabled={saving || !newBackupName.trim() || !selectedSuiteId || !effectiveOrgId}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload & Restore from File</CardTitle>
          <CardDescription>
            Upload a previously exported JSON backup file to restore a product suite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="backup-file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Select JSON File
            </Button>
            <p className="text-sm text-muted-foreground">
              Upload a .json backup file exported from this system
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saved Backups</CardTitle>
          <CardDescription>
            {backups.length} backup(s) across {suiteMasters.length} suite(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No backups yet. Create one above.
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-6">
                {backupsByProduct.map(({ suite, backups: suiteBackups }) => (
                  suiteBackups.length > 0 && (
                    <div key={suite.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-foreground">{suite.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {suiteBackups.length} backup(s)
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-6">
                        {suiteBackups.map(backup => (
                          <BackupCard
                            key={backup.id}
                            backup={backup}
                            restoring={restoring === backup.id}
                            onRestore={() => setRestoreConfirm(backup)}
                            onExport={() => exportBackup(backup)}
                            onDelete={() => setDeleteConfirm(backup)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.backup_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (deleteConfirm) {
                  await deleteBackup(deleteConfirm);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={(open) => !open && setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current {restoreConfirm?.universe_name} data with the backup "{restoreConfirm?.backup_name}". 
              Consider creating a new backup first if you want to preserve the current state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (restoreConfirm) {
                  await restoreBackup(restoreConfirm);
                }
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Confirmation */}
      <AlertDialog open={showUploadConfirm} onOpenChange={(open) => !open && setShowUploadConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              Apply Uploaded Backup
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  File: <span className="font-medium text-foreground">{uploadFileName}</span>
                </p>
                <div className="space-y-2">
                  <Label>Select target product suite to apply this backup to:</Label>
                  <Select value={targetSuiteForUpload} onValueChange={setTargetSuiteForUpload}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a suite master..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suiteMasters.map(suite => (
                        <SelectItem key={suite.id} value={suite.id}>
                          {suite.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    This will overwrite the current guide data. Consider creating a backup first.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setUploadedData(null);
              setUploadFileName('');
              setTargetSuiteForUpload('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await applyUploadedData();
              }}
              disabled={!targetSuiteForUpload || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Apply Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Individual backup card component
interface BackupCardProps {
  backup: ProductSuiteBackup;
  restoring: boolean;
  onRestore: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const BackupCard: React.FC<BackupCardProps> = ({
  backup,
  restoring,
  onRestore,
  onExport,
  onDelete,
}) => {
  const data = backup.backup_data as any;
  const guideData = data?.guide_data || data;
  const colorCount = Array.isArray(guideData?.colors) ? guideData.colors.length : 0;
  const linkedCount = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides.length : 0;

  return (
    <div className="p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-foreground truncate">
              {backup.backup_name}
            </p>
            {backup.is_default && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(backup.created_at), 'MMM d, yyyy h:mm a')}
            </span>
            {colorCount > 0 && <span>{colorCount} colors</span>}
            {linkedCount > 0 && <span>{linkedCount} linked</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRestore}
            disabled={restoring}
            title="Restore this backup"
          >
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExport}
            title="Export as JSON"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete backup"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductSuiteBackupManager;
