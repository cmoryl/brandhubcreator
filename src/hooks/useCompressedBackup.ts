import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';

// Configuration
const BATCH_SIZE = 5; // Process 5 items at a time

export interface BackupItem {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  size?: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  error?: string;
}

export interface BackupProgress {
  phase: 'idle' | 'fetching' | 'compressing' | 'uploading' | 'complete' | 'error';
  currentItem?: string;
  processedItems: number;
  totalItems: number;
  uncompressedBytes: number;
  compressedBytes: number;
  errors: string[];
  items: BackupItem[];
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  uncompressedSize: number;
  compressedSize: number;
  compressionRatio: number;
  itemsBackedUp: {
    brands: number;
    products: number;
    events: number;
  };
  errors: string[];
  duration: number;
}

interface CompressedBackupOptions {
  organizationId: string;
  includeBrands?: boolean;
  includeProducts?: boolean;
  includeEvents?: boolean;
  compressionLevel?: number; // 1-9, default 6
  onProgress?: (progress: BackupProgress) => void;
  abortSignal?: AbortSignal;
}

export const useCompressedBackup = () => {
  const [progress, setProgress] = useState<BackupProgress>({
    phase: 'idle',
    processedItems: 0,
    totalItems: 0,
    uncompressedBytes: 0,
    compressedBytes: 0,
    errors: [],
    items: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((updates: Partial<BackupProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchItemsMetadata = async (organizationId: string, type: 'brand' | 'product' | 'event') => {
    const tableName = type === 'brand' ? 'brands' : type === 'product' ? 'products' : 'events';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id, name, slug, created_at, updated_at')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data || [];
  };

  const fetchFullItem = async (id: string, type: 'brand' | 'product' | 'event') => {
    const tableName = type === 'brand' ? 'brands' : type === 'product' ? 'products' : 'events';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  const fetchBrandIntelligence = async (entityId: string, entityType: 'brand' | 'product' | 'event') => {
    const { data, error } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .maybeSingle();

    if (error) {
      console.warn(`[Backup] Could not fetch intelligence for ${entityType}/${entityId}:`, error.message);
      return null;
    }
    return data;
  };

  const processBatch = async <T,>(
    items: T[],
    processor: (item: T) => Promise<void>,
    batchSize: number = BATCH_SIZE
  ) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(processor));
    }
  };

  const createCompressedBackup = useCallback(async (
    options: CompressedBackupOptions
  ): Promise<BackupResult> => {
    const startTime = Date.now();
    const {
      organizationId,
      includeBrands = true,
      includeProducts = true,
      includeEvents = true,
      compressionLevel = 6,
      onProgress,
      abortSignal,
    } = options;

    abortControllerRef.current = new AbortController();
    const signal = abortSignal || abortControllerRef.current.signal;

    const result: BackupResult = {
      success: false,
      uncompressedSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      itemsBackedUp: { brands: 0, products: 0, events: 0 },
      errors: [],
      duration: 0,
    };

    const allItems: BackupItem[] = [];
    const errors: string[] = [];
    const zip = new JSZip();
    let intelligenceCount = 0;

    try {
      updateProgress({
        phase: 'fetching',
        processedItems: 0,
        totalItems: 0,
        uncompressedBytes: 0,
        compressedBytes: 0,
        errors: [],
        items: [],
      });

      // Fetch metadata for all items in parallel
      const [brandsMetadata, productsMetadata, eventsMetadata] = await Promise.all([
        includeBrands ? fetchItemsMetadata(organizationId, 'brand') : Promise.resolve([]),
        includeProducts ? fetchItemsMetadata(organizationId, 'product') : Promise.resolve([]),
        includeEvents ? fetchItemsMetadata(organizationId, 'event') : Promise.resolve([]),
      ]);

      if (signal.aborted) throw new Error('Backup cancelled');

      // Create item list
      brandsMetadata.forEach(b => {
        allItems.push({ id: b.id, name: b.name || 'Unnamed Brand', type: 'brand', status: 'pending' });
      });
      productsMetadata.forEach(p => {
        allItems.push({ id: p.id, name: p.name || 'Unnamed Product', type: 'product', status: 'pending' });
      });
      eventsMetadata.forEach(e => {
        allItems.push({ id: e.id, name: e.name || 'Unnamed Event', type: 'event', status: 'pending' });
      });

      const totalItems = allItems.length;

      if (totalItems === 0) {
        toast.info('No items to backup');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      updateProgress({ totalItems, items: [...allItems] });

      // Fetch organization info
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', organizationId)
        .single();

      if (!org) throw new Error('Organization not found');

      let processedItems = 0;
      let uncompressedBytes = 0;

      // Process and add items to ZIP
      const processItem = async (item: BackupItem) => {
        if (signal.aborted) return;

        try {
          item.status = 'processing';
          updateProgress({ currentItem: item.name, items: [...allItems] });

          const fullData = await fetchFullItem(item.id, item.type);
          const jsonData = JSON.stringify(fullData, null, 2);
          const itemSize = jsonData.length;
          item.size = itemSize;
          uncompressedBytes += itemSize;

          // Add to ZIP with folder structure
          const folder = item.type === 'brand' ? 'brands' : item.type === 'product' ? 'products' : 'events';
          zip.file(`${folder}/${item.id}.json`, jsonData);

          // Fetch and include brand intelligence data
          const intelligenceData = await fetchBrandIntelligence(item.id, item.type);
          if (intelligenceData) {
            const intelligenceJson = JSON.stringify(intelligenceData, null, 2);
            zip.file(`intelligence/${item.type}s/${item.id}.json`, intelligenceJson);
            uncompressedBytes += intelligenceJson.length;
            intelligenceCount++;
          }

          item.status = 'completed';
          if (item.type === 'brand') result.itemsBackedUp.brands++;
          else if (item.type === 'product') result.itemsBackedUp.products++;
          else result.itemsBackedUp.events++;
        } catch (err) {
          item.status = 'error';
          item.error = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Failed to backup ${item.name}: ${item.error}`);
        }

        processedItems++;
        updateProgress({
          processedItems,
          uncompressedBytes,
          items: [...allItems],
          errors: [...errors],
        });

        onProgress?.({
          phase: 'fetching',
          currentItem: item.name,
          processedItems,
          totalItems,
          uncompressedBytes,
          compressedBytes: 0,
          errors: [...errors],
          items: [...allItems],
        });
      };

      await processBatch(allItems, processItem, BATCH_SIZE);

      if (signal.aborted) throw new Error('Backup cancelled');

      // Add manifest to ZIP
      const manifestData = {
        version: '3.1',
        type: 'compressed-backup',
        format: 'zip',
        createdAt: new Date().toISOString(),
        organization: { id: org.id, name: org.name, slug: org.slug },
        manifest: {
          brands: allItems.filter(i => i.type === 'brand' && i.status === 'completed').map(i => ({ id: i.id, name: i.name })),
          products: allItems.filter(i => i.type === 'product' && i.status === 'completed').map(i => ({ id: i.id, name: i.name })),
          events: allItems.filter(i => i.type === 'event' && i.status === 'completed').map(i => ({ id: i.id, name: i.name })),
        },
        counts: {
          brands: result.itemsBackedUp.brands,
          products: result.itemsBackedUp.products,
          events: result.itemsBackedUp.events,
          intelligence: intelligenceCount,
          total: result.itemsBackedUp.brands + result.itemsBackedUp.products + result.itemsBackedUp.events,
        },
        uncompressedSizeBytes: uncompressedBytes,
        features: {
          includesBrandIntelligence: true,
        },
      };

      zip.file('manifest.json', JSON.stringify(manifestData, null, 2));

      // Compress the ZIP
      updateProgress({ phase: 'compressing', currentItem: 'Compressing backup...' });

      const compressedBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel },
      }, (metadata) => {
        // Progress callback for compression
        onProgress?.({
          phase: 'compressing',
          currentItem: `Compressing... ${Math.round(metadata.percent)}%`,
          processedItems: totalItems,
          totalItems,
          uncompressedBytes,
          compressedBytes: 0,
          errors: [...errors],
          items: [...allItems],
        });
      });

      const compressedSize = compressedBlob.size;
      result.compressedSize = compressedSize;
      result.uncompressedSize = uncompressedBytes;
      result.compressionRatio = uncompressedBytes > 0 ? Math.round((1 - compressedSize / uncompressedBytes) * 100) : 0;

      updateProgress({ 
        phase: 'uploading', 
        currentItem: 'Uploading compressed backup...',
        compressedBytes: compressedSize 
      });

      // Upload to storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${org.id}/${timestamp}/backup.zip`;

      const { error: uploadError } = await supabase.storage
        .from('brand-backups')
        .upload(backupPath, compressedBlob, {
          contentType: 'application/zip',
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Record in backup_history
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('backup_history')
        .insert({
          organization_id: organizationId,
          backup_type: 'manual',
          backup_path: backupPath,
          brands_count: result.itemsBackedUp.brands,
          products_count: result.itemsBackedUp.products,
          file_size_bytes: compressedSize,
          created_by: user?.id || null,
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          error_message: errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
        });

      result.success = true;
      result.backupPath = backupPath;
      result.errors = errors;
      result.duration = Date.now() - startTime;

      updateProgress({
        phase: 'complete',
        processedItems: totalItems,
        uncompressedBytes,
        compressedBytes: compressedSize,
        errors,
        items: [...allItems],
      });

      const totalCount = result.itemsBackedUp.brands + result.itemsBackedUp.products + result.itemsBackedUp.events;
      const savedPercent = result.compressionRatio;
      const intelligenceNote = intelligenceCount > 0 ? ` + ${intelligenceCount} intelligence records` : '';
      
      if (errors.length > 0) {
        toast.warning(`Backup completed with ${errors.length} error(s). ${totalCount} items${intelligenceNote} compressed.`);
      } else {
        toast.success(
          `Backup complete! ${totalCount} items${intelligenceNote} (${formatBytes(compressedSize)}, ${savedPercent}% smaller)`
        );
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backup failed';
      errors.push(errorMessage);
      
      result.errors = errors;
      result.duration = Date.now() - startTime;

      updateProgress({ phase: 'error', errors, items: [...allItems] });

      if (errorMessage !== 'Backup cancelled') {
        toast.error(errorMessage);
      }

      return result;
    }
  }, [updateProgress]);

  const cancelBackup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      toast.info('Backup cancelled');
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      phase: 'idle',
      processedItems: 0,
      totalItems: 0,
      uncompressedBytes: 0,
      compressedBytes: 0,
      errors: [],
      items: [],
    });
  }, []);

  return {
    progress,
    createCompressedBackup,
    cancelBackup,
    resetProgress,
  };
};

// Helper function
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
