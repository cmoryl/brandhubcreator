/**
 * UniverseBackupManager Component
 * Admin panel for backing up and restoring Product Universe configurations
 * Supports both GlobalLink and TransPerfect universes
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Trash2, 
  Download, 
  Star,
  Loader2,
  Globe,
  Layers,
  Calendar,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface UniverseBackup {
  id: string;
  universe_type: 'globallink' | 'transperfect' | 'custom';
  universe_name: string;
  backup_name: string;
  backup_data: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface UniverseData {
  linkedGuides?: Array<{
    id: string;
    name?: string;
    slug?: string;
    type?: string;
  }>;
  productCount?: number;
  brandCount?: number;
  eventCount?: number;
}

const UNIVERSE_CONFIGS = [
  {
    type: 'globallink' as const,
    name: 'GlobalLink Universe',
    description: 'Product suite hierarchy with 12 interconnected sub-products',
    icon: Layers,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    type: 'transperfect' as const,
    name: 'TransPerfect Universe',
    description: 'Organization portal with brands, products, and events orbit',
    icon: Globe,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

export const UniverseBackupManager: React.FC = () => {
  const { organization } = useOrganization();
  const [backups, setBackups] = useState<UniverseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [newBackupName, setNewBackupName] = useState('');
  const [selectedType, setSelectedType] = useState<'globallink' | 'transperfect'>('globallink');
  const [deleteConfirm, setDeleteConfirm] = useState<UniverseBackup | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<UniverseBackup | null>(null);

  // Fetch existing backups
  useEffect(() => {
    if (!organization?.id) return;
    fetchBackups();
  }, [organization?.id]);

  const fetchBackups = async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('universe_backups')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups((data as unknown as UniverseBackup[]) || []);
    } catch (err) {
      console.error('Error fetching backups:', err);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current universe data
  const fetchUniverseData = async (type: 'globallink' | 'transperfect'): Promise<UniverseData> => {
    if (type === 'globallink') {
      // Fetch GlobalLink product's linkedGuides
      const { data, error } = await supabase
        .from('products')
        .select('guide_data')
        .eq('slug', 'globallink')
        .single();

      if (error) throw error;
      
      const guideData = data?.guide_data as Record<string, unknown> | null;
      const linkedGuides = Array.isArray(guideData?.linkedGuides) 
        ? guideData.linkedGuides 
        : [];

      return { linkedGuides, productCount: linkedGuides.length };
    } else {
      // Fetch TransPerfect portal data (brands, products, events counts and relationships)
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase
          .from('brands')
          .select('id, name, slug, guide_data')
          .eq('organization_id', organization?.id || '')
          .eq('is_public', true),
        supabase
          .from('products')
          .select('id, name, slug, guide_data, is_suite_master')
          .eq('organization_id', organization?.id || '')
          .eq('is_public', true),
        supabase
          .from('events')
          .select('id, name, slug, guide_data')
          .eq('organization_id', organization?.id || '')
          .eq('is_public', true),
      ]);

      return {
        brandCount: brandsRes.data?.length || 0,
        productCount: productsRes.data?.length || 0,
        eventCount: eventsRes.data?.length || 0,
        linkedGuides: productsRes.data?.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug || undefined,
          type: 'product',
        })) || [],
      };
    }
  };

  // Create a new backup
  const createBackup = async () => {
    if (!organization?.id || !newBackupName.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    setSaving(true);
    try {
      const universeData = await fetchUniverseData(selectedType);
      const config = UNIVERSE_CONFIGS.find(c => c.type === selectedType);

      const { error } = await supabase
        .from('universe_backups')
        .insert({
          universe_type: selectedType,
          universe_name: config?.name || selectedType,
          backup_name: newBackupName.trim(),
          backup_data: universeData,
          organization_id: organization.id,
          is_default: false,
        } as any);

      if (error) throw error;

      toast.success(`${config?.name} backup created successfully`);
      setNewBackupName('');
      fetchBackups();
    } catch (err) {
      console.error('Error creating backup:', err);
      toast.error('Failed to create backup');
    } finally {
      setSaving(false);
    }
  };

  // Restore from backup
  const restoreBackup = async (backup: UniverseBackup) => {
    setRestoring(backup.id);
    try {
      const backupData = backup.backup_data as UniverseData;

      if (backup.universe_type === 'globallink') {
        // Fetch current guide_data first
        const { data: currentData } = await supabase
          .from('products')
          .select('guide_data')
          .eq('slug', 'globallink')
          .single();

        const currentGuideData = (currentData?.guide_data as Record<string, unknown>) || {};
        
        // Merge linkedGuides into existing guide_data
        const updatedGuideData = {
          ...currentGuideData,
          linkedGuides: backupData.linkedGuides || [],
        };

        const { error } = await supabase
          .from('products')
          .update({ guide_data: updatedGuideData })
          .eq('slug', 'globallink');

        if (error) throw error;
      }

      toast.success(`Restored from "${backup.backup_name}"`);
      setRestoreConfirm(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      toast.error('Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  // Set as default backup
  const setAsDefault = async (backup: UniverseBackup) => {
    try {
      // Clear existing defaults for this type
      await supabase
        .from('universe_backups')
        .update({ is_default: false })
        .eq('organization_id', organization?.id || '')
        .eq('universe_type', backup.universe_type);

      // Set new default
      const { error } = await supabase
        .from('universe_backups')
        .update({ is_default: true })
        .eq('id', backup.id);

      if (error) throw error;

      toast.success(`"${backup.backup_name}" set as default`);
      fetchBackups();
    } catch (err) {
      console.error('Error setting default:', err);
      toast.error('Failed to set default');
    }
  };

  // Delete backup
  const deleteBackup = async (backup: UniverseBackup) => {
    try {
      const { error } = await supabase
        .from('universe_backups')
        .delete()
        .eq('id', backup.id);

      if (error) throw error;

      toast.success(`Deleted "${backup.backup_name}"`);
      setDeleteConfirm(null);
      fetchBackups();
    } catch (err) {
      console.error('Error deleting backup:', err);
      toast.error('Failed to delete backup');
    }
  };

  // Export backup as JSON
  const exportBackup = (backup: UniverseBackup) => {
    const blob = new Blob([JSON.stringify(backup.backup_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.universe_type}-backup-${backup.backup_name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported');
  };

  const globalLinkBackups = backups.filter(b => b.universe_type === 'globallink');
  const transperfectBackups = backups.filter(b => b.universe_type === 'transperfect');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Universe Backup Manager</h2>
          <p className="text-muted-foreground mt-1">
            Create, restore, and manage backups for Product Universe configurations
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin Only
        </Badge>
      </div>

      {/* Create New Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Backup</CardTitle>
          <CardDescription>
            Save the current state of a Product Universe for later restoration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UNIVERSE_CONFIGS.map((config) => (
              <button
                key={config.type}
                onClick={() => setSelectedType(config.type)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === config.type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{config.name}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="backup-name" className="sr-only">Backup Name</Label>
              <Input
                id="backup-name"
                placeholder="Enter backup name (e.g., 'Pre-launch snapshot')"
                value={newBackupName}
                onChange={(e) => setNewBackupName(e.target.value)}
              />
            </div>
            <Button onClick={createBackup} disabled={saving || !newBackupName.trim()}>
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

      {/* Backup Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GlobalLink Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Layers className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <CardTitle className="text-lg">GlobalLink Universe</CardTitle>
                <CardDescription>{globalLinkBackups.length} backup(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : globalLinkBackups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No backups yet. Create one above.
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {globalLinkBackups.map((backup) => (
                    <BackupCard
                      key={backup.id}
                      backup={backup}
                      restoring={restoring === backup.id}
                      onRestore={() => setRestoreConfirm(backup)}
                      onSetDefault={() => setAsDefault(backup)}
                      onExport={() => exportBackup(backup)}
                      onDelete={() => setDeleteConfirm(backup)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* TransPerfect Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Globe className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">TransPerfect Universe</CardTitle>
                <CardDescription>{transperfectBackups.length} backup(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transperfectBackups.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No backups yet. Create one above.
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {transperfectBackups.map((backup) => (
                    <BackupCard
                      key={backup.id}
                      backup={backup}
                      restoring={restoring === backup.id}
                      onRestore={() => setRestoreConfirm(backup)}
                      onSetDefault={() => setAsDefault(backup)}
                      onExport={() => exportBackup(backup)}
                      onDelete={() => setDeleteConfirm(backup)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
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
              onClick={() => deleteConfirm && deleteBackup(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current {restoreConfirm?.universe_name} configuration with the backup "{restoreConfirm?.backup_name}". 
              Consider creating a new backup first if you want to preserve the current state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreConfirm && restoreBackup(restoreConfirm)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Individual backup card component
interface BackupCardProps {
  backup: UniverseBackup;
  restoring: boolean;
  onRestore: () => void;
  onSetDefault: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const BackupCard: React.FC<BackupCardProps> = ({
  backup,
  restoring,
  onRestore,
  onSetDefault,
  onExport,
  onDelete,
}) => {
  const data = backup.backup_data as UniverseData;
  const itemCount = data.linkedGuides?.length || data.productCount || 0;

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
            <span>{itemCount} items</span>
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
          {!backup.is_default && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onSetDefault}
              title="Set as default"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExport}
            title="Export as JSON"
          >
            <Download className="h-4 w-4" />
          </Button>
          {!backup.is_default && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Delete backup"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniverseBackupManager;
