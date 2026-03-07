import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configuration
const BATCH_SIZE = 5; // Process 5 items at a time
const MAX_SINGLE_ITEM_SIZE = 5 * 1024 * 1024; // 5MB per item warning
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total warning

export interface BackupItem {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  size?: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  error?: string;
}

export interface BackupProgress {
  phase: 'idle' | 'estimating' | 'backing-up' | 'uploading' | 'complete' | 'error';
  currentItem?: string;
  processedItems: number;
  totalItems: number;
  processedBytes: number;
  totalEstimatedBytes: number;
  errors: string[];
  items: BackupItem[];
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  totalSize: number;
  itemsBackedUp: {
    brands: number;
    products: number;
    events: number;
  };
  errors: string[];
  duration: number;
}

interface ChunkedBackupOptions {
  organizationId: string;
  includeBrands?: boolean;
  includeProducts?: boolean;
  includeEvents?: boolean;
  onProgress?: (progress: BackupProgress) => void;
  abortSignal?: AbortSignal;
}

export const useChunkedBackup = () => {
  const [progress, setProgress] = useState<BackupProgress>({
    phase: 'idle',
    processedItems: 0,
    totalItems: 0,
    processedBytes: 0,
    totalEstimatedBytes: 0,
    errors: [],
    items: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((updates: Partial<BackupProgress>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...updates };
      return newProgress;
    });
  }, []);

  const estimateItemSize = (item: unknown): number => {
    try {
      return JSON.stringify(item).length;
    } catch {
      return 10000; // Default estimate if stringification fails
    }
  };

  const fetchItemsMetadata = async (organizationId: string, type: 'brand' | 'product' | 'event') => {
    const tableName = type === 'brand' ? 'brands' : type === 'product' ? 'products' : 'events';
    
    // Fetch only metadata first (no guide_data)
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

  const uploadBackupChunk = async (
    path: string,
    data: unknown,
    retries = 3
  ): Promise<{ success: boolean; error?: string }> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const jsonData = JSON.stringify(data);
        
        const { error } = await supabase.storage
          .from('brand-backups')
          .upload(path, jsonData, {
            contentType: 'application/json',
            upsert: true,
          });

        if (error) {
          if (attempt === retries) {
            return { success: false, error: error.message };
          }
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          continue;
        }

        return { success: true };
      } catch (err) {
        if (attempt === retries) {
          return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    return { success: false, error: 'Max retries exceeded' };
  };

  const processBatch = async <T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    batchSize: number = BATCH_SIZE
  ) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(processor));
    }
  };

  const createChunkedBackup = useCallback(async (
    options: ChunkedBackupOptions
  ): Promise<BackupResult> => {
    const startTime = Date.now();
    const {
      organizationId,
      includeBrands = true,
      includeProducts = true,
      includeEvents = true,
      onProgress,
      abortSignal,
    } = options;

    // Setup abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortSignal || abortControllerRef.current.signal;

    const result: BackupResult = {
      success: false,
      totalSize: 0,
      itemsBackedUp: { brands: 0, products: 0, events: 0 },
      errors: [],
      duration: 0,
    };

    const allItems: BackupItem[] = [];
    const errors: string[] = [];

    try {
      // Phase 1: Estimation
      updateProgress({
        phase: 'estimating',
        processedItems: 0,
        totalItems: 0,
        processedBytes: 0,
        totalEstimatedBytes: 0,
        errors: [],
        items: [],
      });

      // Fetch metadata for all items
      const [brandsMetadata, productsMetadata, eventsMetadata] = await Promise.all([
        includeBrands ? fetchItemsMetadata(organizationId, 'brand') : Promise.resolve([]),
        includeProducts ? fetchItemsMetadata(organizationId, 'product') : Promise.resolve([]),
        includeEvents ? fetchItemsMetadata(organizationId, 'event') : Promise.resolve([]),
      ]);

      if (signal.aborted) {
        throw new Error('Backup cancelled');
      }

      // Create item list
      brandsMetadata.forEach(b => {
        allItems.push({
          id: b.id,
          name: b.name || 'Unnamed Brand',
          type: 'brand',
          status: 'pending',
        });
      });

      productsMetadata.forEach(p => {
        allItems.push({
          id: p.id,
          name: p.name || 'Unnamed Product',
          type: 'product',
          status: 'pending',
        });
      });

      eventsMetadata.forEach(e => {
        allItems.push({
          id: e.id,
          name: e.name || 'Unnamed Event',
          type: 'event',
          status: 'pending',
        });
      });

      const totalItems = allItems.length;

      if (totalItems === 0) {
        toast.info('No items to backup');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      updateProgress({
        phase: 'backing-up',
        totalItems,
        items: [...allItems],
      });

      onProgress?.({
        phase: 'backing-up',
        processedItems: 0,
        totalItems,
        processedBytes: 0,
        totalEstimatedBytes: 0,
        errors: [],
        items: [...allItems],
      });

      // Phase 2: Fetch and process items in batches
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', organizationId)
        .single();

      if (!org) {
        throw new Error('Organization not found');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basePath = `${org.id}/${timestamp}`;

      let processedItems = 0;
      let totalBytes = 0;

      // Process items by type, in batches
      const processItem = async (item: BackupItem) => {
        if (signal.aborted) return;

        try {
          // Update item status to processing
          item.status = 'processing';
          updateProgress({
            currentItem: item.name,
            items: [...allItems],
          });

          // Fetch full item data
          const fullData = await fetchFullItem(item.id, item.type);
          const itemSize = estimateItemSize(fullData);
          item.size = itemSize;

          // Check for oversized items
          if (itemSize > MAX_SINGLE_ITEM_SIZE) {
            console.warn(`Large item detected: ${item.name} (${(itemSize / 1024 / 1024).toFixed(2)}MB)`);
          }

          // Upload individual item
          const typePath = item.type === 'brand' ? 'brands' : item.type === 'product' ? 'products' : 'events';
          const itemPath = `${basePath}/${typePath}/${item.id}.json`;

          const uploadResult = await uploadBackupChunk(itemPath, fullData);

          if (uploadResult.success) {
            item.status = 'completed';
            totalBytes += itemSize;

            if (item.type === 'brand') result.itemsBackedUp.brands++;
            else if (item.type === 'product') result.itemsBackedUp.products++;
            else result.itemsBackedUp.events++;
          } else {
            item.status = 'error';
            item.error = uploadResult.error;
            errors.push(`Failed to backup ${item.name}: ${uploadResult.error}`);
          }
        } catch (err) {
          item.status = 'error';
          item.error = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Error backing up ${item.name}: ${item.error}`);
        }

        processedItems++;
        updateProgress({
          processedItems,
          processedBytes: totalBytes,
          items: [...allItems],
          errors: [...errors],
        });

        onProgress?.({
          phase: 'backing-up',
          currentItem: item.name,
          processedItems,
          totalItems,
          processedBytes: totalBytes,
          totalEstimatedBytes: 0,
          errors: [...errors],
          items: [...allItems],
        });
      };

      // Process all items in batches
      await processBatch(allItems, processItem, BATCH_SIZE);

      if (signal.aborted) {
        throw new Error('Backup cancelled');
      }

      // Phase 3: Create and upload manifest
      updateProgress({ phase: 'uploading', currentItem: 'Creating manifest...' });

      const manifestData = {
        version: '2.1',
        type: 'chunked-manifest',
        createdAt: new Date().toISOString(),
        backupType: 'manual',
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
          total: result.itemsBackedUp.brands + result.itemsBackedUp.products + result.itemsBackedUp.events,
        },
        totalSizeBytes: totalBytes,
        errors: errors.length > 0 ? errors : undefined,
      };

      const manifestPath = `${basePath}/manifest.json`;
      const manifestResult = await uploadBackupChunk(manifestPath, manifestData);

      if (!manifestResult.success) {
        throw new Error(`Failed to upload manifest: ${manifestResult.error}`);
      }

      // Phase 4: Record in backup_history
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('backup_history')
        .insert({
          organization_id: organizationId,
          backup_type: 'manual',
          backup_path: manifestPath,
          brands_count: result.itemsBackedUp.brands,
          products_count: result.itemsBackedUp.products,
          file_size_bytes: totalBytes,
          created_by: user?.id || null,
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          error_message: errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
        });

      result.success = true;
      result.backupPath = manifestPath;
      result.totalSize = totalBytes;
      result.errors = errors;
      result.duration = Date.now() - startTime;

      updateProgress({
        phase: 'complete',
        processedItems: totalItems,
        processedBytes: totalBytes,
        errors,
        items: [...allItems],
      });

      onProgress?.({
        phase: 'complete',
        processedItems: totalItems,
        totalItems,
        processedBytes: totalBytes,
        totalEstimatedBytes: totalBytes,
        errors,
        items: [...allItems],
      });

      const successCount = result.itemsBackedUp.brands + result.itemsBackedUp.products + result.itemsBackedUp.events;
      if (errors.length > 0) {
        toast.warning(`Backup completed with ${errors.length} error(s). ${successCount} items saved.`);
      } else {
        toast.success(`Backup complete! ${successCount} items saved (${(totalBytes / 1024).toFixed(1)} KB)`);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backup failed';
      errors.push(errorMessage);
      
      result.errors = errors;
      result.duration = Date.now() - startTime;

      updateProgress({
        phase: 'error',
        errors,
        items: [...allItems],
      });

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
      processedBytes: 0,
      totalEstimatedBytes: 0,
      errors: [],
      items: [],
    });
  }, []);

  return {
    progress,
    createChunkedBackup,
    cancelBackup,
    resetProgress,
  };
};
