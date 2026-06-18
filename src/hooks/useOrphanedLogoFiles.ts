import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ClientLogoFile } from '@/types/brand';

const BUCKET = 'organization-assets';
const ROOT = 'client-logos';

export interface OrphanFile {
  path: string;
  publicUrl: string;
  logoId: string;
  filename: string;
  size: number | null;
  updatedAt: string | null;
  /** 'orphan-folder' = the parent logo row no longer exists; 'orphan-file' = row exists but file not referenced */
  kind: 'orphan-folder' | 'orphan-file';
}

export interface OrphanScanResult {
  loading: boolean;
  error: string | null;
  scannedAt: Date | null;
  totalStorageFiles: number;
  totalReferenced: number;
  orphans: OrphanFile[];
  knownLogoIds: number;
  unknownFolders: string[];
  rescan: () => void;
}

interface ListedFile {
  name: string;
  metadata?: { size?: number | null } | null;
  updated_at?: string | null;
}

const normalizeUrl = (u: string) => {
  try {
    const url = new URL(u);
    return `${url.origin}${url.pathname}`.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
};

const pathFromPublicUrl = (u: string): string | null => {
  try {
    const url = new URL(u);
    // /storage/v1/object/public/<bucket>/<path>
    const m = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m) return null;
    if (m[1] !== BUCKET) return null;
    return decodeURIComponent(m[2]);
  } catch {
    return null;
  }
};

export function useOrphanedLogoFiles(autoRun = false): OrphanScanResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedAt, setScannedAt] = useState<Date | null>(null);
  const [totalStorageFiles, setTotalStorageFiles] = useState(0);
  const [totalReferenced, setTotalReferenced] = useState(0);
  const [orphans, setOrphans] = useState<OrphanFile[]>([]);
  const [knownLogoIds, setKnownLogoIds] = useState(0);
  const [unknownFolders, setUnknownFolders] = useState<string[]>([]);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Pull all referenced URLs + logo ids from DB
      const { data: rows, error: dbErr } = await supabase
        .from('global_client_logos')
        .select('id, files')
        .limit(5000);
      if (dbErr) throw dbErr;

      const knownIds = new Set<string>();
      const referencedPaths = new Set<string>();
      const referencedUrls = new Set<string>();
      let refCount = 0;
      for (const r of rows || []) {
        knownIds.add(r.id);
        const files = (Array.isArray(r.files) ? r.files : []) as unknown as ClientLogoFile[];
        for (const f of files) {
          if (!f?.url) continue;
          refCount += 1;
          referencedUrls.add(normalizeUrl(f.url));
          const p = pathFromPublicUrl(f.url);
          if (p) referencedPaths.add(p);
        }
      }
      setKnownLogoIds(knownIds.size);
      setTotalReferenced(refCount);

      // 2. List top-level folders under client-logos/
      const folders: string[] = [];
      let offset = 0;
      const pageSize = 1000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error: listErr } = await supabase.storage
          .from(BUCKET)
          .list(ROOT, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } });
        if (listErr) throw listErr;
        if (!data || data.length === 0) break;
        for (const entry of data) {
          // Folders have null id / no metadata in supabase-js storage list
          if (!entry.id || !entry.metadata) folders.push(entry.name);
        }
        if (data.length < pageSize) break;
        offset += pageSize;
      }

      const unknown: string[] = [];
      const foundOrphans: OrphanFile[] = [];
      let storageFileCount = 0;

      // 3. List files inside each folder
      for (const folder of folders) {
        const folderPath = `${ROOT}/${folder}`;
        const isKnown = knownIds.has(folder);
        if (!isKnown) unknown.push(folder);

        let foffset = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { data: files, error: fErr } = await supabase.storage
            .from(BUCKET)
            .list(folderPath, { limit: pageSize, offset: foffset, sortBy: { column: 'name', order: 'asc' } });
          if (fErr) throw fErr;
          if (!files || files.length === 0) break;
          for (const f of files as ListedFile[]) {
            // Skip nested folders
            if (!('metadata' in f) || !f.metadata) continue;
            storageFileCount += 1;
            const fullPath = `${folderPath}/${f.name}`;
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
            const publicUrl = urlData.publicUrl;
            const referenced =
              referencedPaths.has(fullPath) || referencedUrls.has(normalizeUrl(publicUrl));
            if (!referenced) {
              foundOrphans.push({
                path: fullPath,
                publicUrl,
                logoId: folder,
                filename: f.name,
                size: f.metadata?.size ?? null,
                updatedAt: f.updated_at ?? null,
                kind: isKnown ? 'orphan-file' : 'orphan-folder',
              });
            }
          }
          if (files.length < pageSize) break;
          foffset += pageSize;
        }
      }

      setTotalStorageFiles(storageFileCount);
      setOrphans(foundOrphans);
      setUnknownFolders(unknown);
      setScannedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRun) scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  return {
    loading,
    error,
    scannedAt,
    totalStorageFiles,
    totalReferenced,
    orphans,
    knownLogoIds,
    unknownFolders,
    rescan: scan,
  };
}
