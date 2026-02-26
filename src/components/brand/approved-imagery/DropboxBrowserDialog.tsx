import { useState, useCallback } from 'react';
import { FolderOpen, Download, Loader2, RefreshCw, ImageIcon, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { ApprovedImage } from '@/types/brand';

interface DropboxFile {
  id: string;
  name: string;
  path: string;
  size: number;
  modified: string;
  thumbnailData: string | null;
}

interface DropboxBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  onFolderPathChange: (path: string) => void;
  onImportImages: (images: ApprovedImage[]) => void;
  sectionName: string;
  entityId?: string;
  entityType?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const PARALLEL_DOWNLOADS = 3;

export const DropboxBrowserDialog = ({
  open,
  onOpenChange,
  folderPath,
  onFolderPathChange,
  onImportImages,
  sectionName,
  entityId,
  entityType = 'brand',
}: DropboxBrowserDialogProps) => {
  const { organization } = useOrganization();
  const [editPath, setEditPath] = useState(folderPath || '');
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [sharedLinkUrl, setSharedLinkUrl] = useState<string | null>(null);

  const fetchFolder = useCallback(async (path: string, continueCursor?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dropbox-imagery', {
        body: {
          action: 'list',
          folderPath: continueCursor ? undefined : path,
          cursor: continueCursor,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newFiles = data.files || [];
      if (continueCursor) {
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles);
      }
      setHasMore(data.hasMore || false);
      setCursor(data.cursor || null);
      setSharedLinkUrl(data.sharedLinkUrl || null);
      setLoaded(true);

      if (!continueCursor) {
        onFolderPathChange(path);
      }
    } catch (err: any) {
      console.error('Dropbox fetch error:', err);
      toast.error(err.message || 'Failed to load Dropbox folder');
    } finally {
      setLoading(false);
    }
  }, [onFolderPathChange]);

  const handleConnect = () => {
    const path = editPath.trim() || '';
    const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
    setEditPath(normalizedPath);
    setSelectedIds(new Set());
    fetchFolder(normalizedPath);
  };

  const handleLoadMore = () => {
    if (cursor) fetchFolder(editPath, cursor);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const handleImport = async () => {
    const selected = files.filter(f => selectedIds.has(f.id));
    if (selected.length === 0) return;

    // Filter out oversized files
    const oversized = selected.filter(f => f.size > MAX_FILE_SIZE);
    const eligible = selected.filter(f => f.size <= MAX_FILE_SIZE);

    if (oversized.length > 0) {
      toast.warning(`${oversized.length} file(s) skipped — exceeds 20MB limit`);
    }
    if (eligible.length === 0) {
      toast.error('No eligible files to import');
      return;
    }

    if (!organization?.id || !entityId) {
      toast.error('Missing organization or entity context for storage upload');
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      const images: ApprovedImage[] = [];
      let completed = 0;

      // Process in parallel batches
      for (let i = 0; i < eligible.length; i += PARALLEL_DOWNLOADS) {
        const batch = eligible.slice(i, i + PARALLEL_DOWNLOADS);
        const results = await Promise.allSettled(
          batch.map(async (file) => {
            const { data, error } = await supabase.functions.invoke('dropbox-imagery', {
              body: {
                action: 'download',
                filePath: file.path || `/${file.name}`,
                fileName: file.name,
                sharedLinkUrl,
                organizationId: organization.id,
                entityType,
                entityId,
              },
            });

            if (error || data?.error) {
              console.error('Failed to import', file.name, data?.error || error);
              return null;
            }

            return {
              id: `dbx-${file.id}`,
              url: data.downloadUrl,
              thumbnailUrl: file.thumbnailData || data.downloadUrl,
              title: file.name.replace(/\.[^.]+$/, ''),
              source: 'dropbox' as const,
              category: sectionName,
              approvedAt: new Date().toISOString(),
            };
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            images.push(result.value);
          }
          completed++;
          setImportProgress(Math.round((completed / eligible.length) * 100));
        }
      }

      if (images.length > 0) {
        onImportImages(images);
        toast.success(`Imported ${images.length} image${images.length !== 1 ? 's' : ''} from Dropbox`);
        setSelectedIds(new Set());
        onOpenChange(false);
      } else {
        toast.error('No images could be imported');
      }
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Dropbox — {sectionName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Browse and import images from Dropbox into your brand guide.
          </DialogDescription>
        </DialogHeader>

        {/* Folder path input */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Input
            placeholder="/path/to/folder (leave empty for root)"
            value={editPath}
            onChange={(e) => setEditPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            className="flex-1"
          />
          <Button onClick={handleConnect} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1.5">{loaded ? 'Refresh' : 'Load'}</span>
          </Button>
        </div>

        {/* File grid */}
        <ScrollArea className="flex-1 min-h-0 max-h-[55vh]">
          {!loaded && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-10 w-10 opacity-30 mb-3" />
              <p className="text-sm">Enter a Dropbox folder path and click Load</p>
            </div>
          ) : files.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-30 mb-3" />
              <p className="text-sm">No images found in this folder</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {files.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  const isOversized = file.size > MAX_FILE_SIZE;
                  return (
                    <button
                      key={file.id}
                      onClick={() => !isOversized && toggleSelect(file.id)}
                      disabled={isOversized}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                        isOversized
                          ? 'border-border opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        {file.thumbnailData ? (
                          <img
                            src={file.thumbnailData}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="px-1.5 py-1 flex items-center gap-1">
                        <p className="text-[10px] text-muted-foreground line-clamp-1 flex-1">{file.name}</p>
                        <span className="text-[9px] text-muted-foreground/60 shrink-0">{formatSize(file.size)}</span>
                      </div>
                      {isOversized && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="text-[10px] font-medium text-destructive">Too large</span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {files.length > 0 && (
          <div className="px-5 py-3 border-t border-border space-y-2">
            {importing && (
              <Progress value={importProgress} className="h-1.5" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedIds.size === files.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary">{selectedIds.size} selected</Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importing}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Import Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
