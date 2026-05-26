import { useState, useRef } from 'react';
import { Download, Upload, History, Trash2, RefreshCw, Check, FileJson, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useBrandBackup, BrandBackupData, FullBackupData } from '@/hooks/useBrandBackup';
import { BrandGuide, ProductGuide } from '@/types/brand';
import { useBrands } from '@/contexts/BrandContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { BrandBackupDialog } from './BrandBackupDialog';
import { ClaudeSkillExportButton } from './ClaudeSkillExportButton';

interface BrandBackupManagerProps {
  guide?: BrandGuide | ProductGuide;
  variant?: 'button' | 'dropdown-item';
  showFullBackup?: boolean;
}

export const BrandBackupManager = ({ 
  guide, 
  variant = 'button',
  showFullBackup = false 
}: BrandBackupManagerProps) => {
  const { brands, products, refetch } = useBrands();
  const { organization } = useOrganization();
  const {
    downloadGuide,
    downloadFullBackup,
    parseBackupFile,
    importGuide,
    importFullBackup,
    getAutoBackups,
    getAllAutoBackups,
    restoreFromAutoBackup,
    clearAutoBackups,
  } = useBrandBackup();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [importPreview, setImportPreview] = useState<BrandBackupData | FullBackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoBackups = guide ? getAutoBackups(guide.id) : getAllAutoBackups();

  const handleExport = () => {
    if (guide) {
      downloadGuide(guide);
    } else if (showFullBackup) {
      downloadFullBackup(brands, products, organization?.name);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const backup = await parseBackupFile(file);
    if (backup) {
      setImportPreview(backup);
      setIsImportDialogOpen(true);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importPreview) return;

    setIsImporting(true);
    try {
      if ('brands' in importPreview) {
        // Full backup
        const result = await importFullBackup(importPreview, organization?.id);
        if (result.success) {
          await refetch();
          setIsImportDialogOpen(false);
          setImportPreview(null);
        }
      } else {
        // Single guide
        const result = await importGuide(importPreview, organization?.id);
        if (result.success) {
          await refetch();
          setIsImportDialogOpen(false);
          setImportPreview(null);
        }
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      const result = await restoreFromAutoBackup(backupId, organization?.id);
      if (result.success) {
        await refetch();
        toast.success('Restored from backup successfully');
        setIsHistoryDialogOpen(false);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const renderImportPreview = () => {
    if (!importPreview) return null;

    if ('brands' in importPreview) {
      // Full backup preview
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Full Backup</Badge>
            <span className="text-sm text-muted-foreground">
              from {new Date(importPreview.exportedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{importPreview.metadata.totalBrands}</div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{importPreview.metadata.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
          </div>
          {importPreview.metadata.organizationName && (
            <p className="text-sm text-muted-foreground">
              Originally from: {importPreview.metadata.organizationName}
            </p>
          )}
        </div>
      );
    } else {
      // Single guide preview
      const guideData = importPreview.guide;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={importPreview.type === 'brand' ? 'default' : 'secondary'}>
              {importPreview.type === 'brand' ? 'Brand Guide' : 'Product Guide'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              from {new Date(importPreview.exportedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold">{guideData.hero.name}</h4>
            {guideData.hero.tagline && (
              <p className="text-sm text-muted-foreground mt-1">{guideData.hero.tagline}</p>
            )}
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{guideData.colors?.length || 0} colors</span>
            <span>{guideData.logos?.length || 0} logos</span>
            <span>{guideData.typography?.length || 0} fonts</span>
          </div>
        </div>
      );
    }
  };

  if (variant === 'dropdown-item') {
    return (
      <>
        <DropdownMenuItem onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Backup
        </DropdownMenuItem>
        {guide && <ClaudeSkillExportButton guide={guide as any} variant="dropdown-item" />}
        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import Backup
        </DropdownMenuItem>
        {autoBackups.length > 0 && (
          <DropdownMenuItem onClick={() => setIsHistoryDialogOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            View History ({autoBackups.length})
          </DropdownMenuItem>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
          aria-label="Select backup file to import"
        />
        
        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Backup</DialogTitle>
              <DialogDescription>
                This will create new copies of the imported guides. Your existing data will not be affected.
              </DialogDescription>
            </DialogHeader>
            {renderImportPreview()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Backup History</DialogTitle>
              <DialogDescription>
                Auto-saved snapshots for recovery
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {autoBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{backup.guideName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(backup.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(backup.id)}
                      disabled={isRestoring}
                      aria-label={`Restore backup from ${formatDistanceToNow(backup.timestamp, { addSuffix: true })}`}
                    >
                      {isRestoring ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        'Restore'
                      )}
                    </Button>
                  </div>
                ))}
                {autoBackups.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No auto-backups available
                  </p>
                )}
              </div>
            </ScrollArea>
            {autoBackups.length > 0 && (
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearAutoBackups();
                    setIsHistoryDialogOpen(false);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Button variant - use the new enhanced dialog
  return (
    <div className="flex items-center gap-2">
      <BrandBackupDialog
        guide={guide}
        showFullBackup={showFullBackup}
        trigger={
          <Button variant="outline" size="sm" className="gap-2" aria-label="Backup options">
            <FolderOpen className="h-4 w-4" />
            Backup
          </Button>
        }
      />
      {guide && <ClaudeSkillExportButton guide={guide as any} />}
    </div>
  );
};
