import { useState } from 'react';
import { Loader2, Trash2, RefreshCw, AlertTriangle, FolderX, FileX, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrphanedLogoFiles, type OrphanFile } from '@/hooks/useOrphanedLogoFiles';

const BUCKET = 'organization-assets';

function formatBytes(n: number | null): string {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function OrphanedFilesSection({ canDelete = false }: { canDelete?: boolean }) {
  const scan = useOrphanedLogoFiles(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(scan.orphans.map((o) => o.path)));
  const clearAll = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const paths = Array.from(selected);
    if (!confirm(`Delete ${paths.length} orphaned file(s) from storage? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) throw error;
      toast.success(`Deleted ${paths.length} orphaned file(s)`);
      setSelected(new Set());
      scan.rescan();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const byKind = {
    folder: scan.orphans.filter((o) => o.kind === 'orphan-folder'),
    file: scan.orphans.filter((o) => o.kind === 'orphan-file'),
  };
  const totalBytes = scan.orphans.reduce((sum, o) => sum + (o.size || 0), 0);

  return (
    <section className="rounded-xl border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderX className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Orphaned storage files</h2>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Storage audit
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Scans the <code className="text-[11px]">{BUCKET}/client-logos/</code> bucket for files
            not referenced by any <code className="text-[11px]">global_client_logos</code> row.
            Catches abandoned uploads after deletions or replacements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={scan.rescan} disabled={scan.loading}>
            {scan.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            {scan.scannedAt ? 'Rescan' : 'Scan storage'}
          </Button>
          {canDelete && scan.orphans.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteSelected}
              disabled={deleting || selected.size === 0}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Delete selected ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {scan.error && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{scan.error}</span>
        </div>
      )}

      {!scan.scannedAt && !scan.loading && !scan.error && (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          Click <span className="font-medium text-foreground">Scan storage</span> to compare stored
          files against database references.
        </div>
      )}

      {scan.scannedAt && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <StatBox label="Storage files" value={scan.totalStorageFiles} />
            <StatBox label="DB-referenced" value={scan.totalReferenced} />
            <StatBox label="Brand rows" value={scan.knownLogoIds} />
            <StatBox
              label="Orphans"
              value={scan.orphans.length}
              tone={scan.orphans.length === 0 ? 'success' : 'warning'}
            />
            <StatBox label="Reclaimable" value={formatBytes(totalBytes)} tone="muted" />
          </div>

          {scan.orphans.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              No orphaned files found. Every stored file is referenced by a brand row.
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <span>
                  {byKind.folder.length} from deleted brand{byKind.folder.length === 1 ? '' : 's'}
                  {' · '}
                  {byKind.file.length} unreferenced in existing rows
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button className="hover:text-foreground underline" onClick={selectAll}>
                    Select all
                  </button>
                  <button className="hover:text-foreground underline" onClick={clearAll}>
                    Clear
                  </button>
                </span>
              </div>
              <div className="overflow-x-auto rounded-md border border-border max-h-[420px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground sticky top-0">
                    <tr>
                      {canDelete && <th className="w-8 px-2 py-2"></th>}
                      <th className="text-left px-3 py-2 font-medium">Path</th>
                      <th className="text-left px-3 py-2 font-medium">Reason</th>
                      <th className="text-right px-3 py-2 font-medium">Size</th>
                      <th className="text-left px-3 py-2 font-medium">Updated</th>
                      <th className="w-8 px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.orphans.map((o) => (
                      <OrphanRow
                        key={o.path}
                        orphan={o}
                        checked={selected.has(o.path)}
                        onToggle={() => toggle(o.path)}
                        canDelete={canDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {scan.unknownFolders.length > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              <FileX className="inline h-3 w-3 mr-1" />
              {scan.unknownFolders.length} folder
              {scan.unknownFolders.length === 1 ? '' : 's'} reference no existing brand row.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function OrphanRow({
  orphan,
  checked,
  onToggle,
  canDelete,
}: {
  orphan: OrphanFile;
  checked: boolean;
  onToggle: () => void;
  canDelete: boolean;
}) {
  return (
    <tr className="border-t border-border hover:bg-muted/20">
      {canDelete && (
        <td className="px-2 py-2 align-middle">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-3.5 w-3.5"
            aria-label={`Select ${orphan.filename}`}
          />
        </td>
      )}
      <td className="px-3 py-2 font-mono text-[11px] break-all">
        <div className="text-muted-foreground">{orphan.logoId}/</div>
        <div className="text-foreground">{orphan.filename}</div>
      </td>
      <td className="px-3 py-2">
        {orphan.kind === 'orphan-folder' ? (
          <Badge variant="destructive" className="text-[10px]">
            Brand row deleted
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Unreferenced
          </Badge>
        )}
      </td>
      <td className="px-3 py-2 text-right text-muted-foreground">{formatBytes(orphan.size)}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {orphan.updatedAt ? new Date(orphan.updatedAt).toLocaleDateString() : '—'}
      </td>
      <td className="px-2 py-2">
        <a
          href={orphan.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open file"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </td>
    </tr>
  );
}

function StatBox({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const tones: Record<string, string> = {
    default: 'border-border bg-background',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    muted: 'border-border bg-muted/30',
  };
  return (
    <div className={`rounded-md border px-3 py-2 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
