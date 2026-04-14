import { useCallback } from 'react';
import { BrandGuide, ProductGuide, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useDownloadTracking, estimateSize } from '@/hooks/useDownloadTracking';

// Version for backup format compatibility
const BACKUP_VERSION = '2.0';
const MAX_AUTO_BACKUPS = 5;
const AUTO_BACKUP_KEY = 'brandhub_auto_backups_v2';

export interface BrandBackupData {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  type: 'brand' | 'product';
  guide: BrandGuide | ProductGuide;
  metadata: {
    originalId: string;
    originalSlug?: string;
    organizationId?: string | null;
  };
}

export interface FullBackupData {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  brands: BrandBackupData[];
  products: BrandBackupData[];
  metadata: {
    totalBrands: number;
    totalProducts: number;
    organizationId?: string | null;
    organizationName?: string;
  };
}

interface AutoBackupEntry {
  id: string;
  timestamp: number;
  guideId: string;
  guideName: string;
  guideType: 'brand' | 'product';
  data: BrandBackupData;
}

export const useBrandBackup = () => {
  const { user } = useAuth();

  // Create a backup of a single brand/product
  const exportGuide = useCallback((guide: BrandGuide | ProductGuide): BrandBackupData => {
    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || undefined,
      type: guide.type,
      guide: {
        ...guide,
        // Remove sensitive/transient fields
        id: guide.id,
        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt,
      },
      metadata: {
        originalId: guide.id,
        originalSlug: guide.slug,
        organizationId: guide.organizationId,
      },
    };
  }, [user?.email]);

  // Download a single guide as JSON
  const { trackDownload } = useDownloadTracking();

  const downloadGuide = useCallback((guide: BrandGuide | ProductGuide) => {
    const backup = exportGuide(guide);
    const fileName = `${guide.slug || guide.hero.name.toLowerCase().replace(/\s+/g, '-')}-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackDownload({
      entityId: guide.id,
      entityType: 'parentBrandId' in guide ? 'product' : 'brand',
      entityName: guide.hero.name,
      details: {
        download_type: 'backup',
        format: 'json',
        file_name: fileName,
        file_size_bytes: blob.size,
        source_section: 'backup',
      },
      organizationId: guide.organizationId || undefined,
    });
    
    toast.success(`Exported ${guide.hero.name} backup`);
  }, [exportGuide, trackDownload]);

  // Download all guides as a full backup
  const downloadFullBackup = useCallback((brands: BrandGuide[], products: ProductGuide[], organizationName?: string) => {
    const backup: FullBackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || undefined,
      brands: brands.map(b => exportGuide(b)),
      products: products.map(p => exportGuide(p)),
      metadata: {
        totalBrands: brands.length,
        totalProducts: products.length,
        organizationId: brands[0]?.organizationId || products[0]?.organizationId || null,
        organizationName,
      },
    };

    const fileName = `brandhub-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackDownload({
      entityType: 'organization',
      entityName: organizationName || 'Full Backup',
      details: {
        download_type: 'backup',
        format: 'json',
        file_name: fileName,
        file_size_bytes: blob.size,
        item_count: brands.length + products.length,
        source_section: 'full_backup',
      },
      organizationId: backup.metadata.organizationId || undefined,
    });
    
    toast.success(`Exported full backup with ${brands.length} brands and ${products.length} products`);
  }, [exportGuide, user?.email, trackDownload]);

  // Parse and validate an uploaded backup file
  const parseBackupFile = useCallback(async (file: File): Promise<BrandBackupData | FullBackupData | null> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Check if it's a full backup or single guide
      if (data.brands && Array.isArray(data.brands)) {
        // Full backup
        if (!data.version) {
          toast.error('Invalid backup file: missing version');
          return null;
        }
        return data as FullBackupData;
      } else if (data.guide && data.type) {
        // Single guide backup
        if (!data.version) {
          toast.error('Invalid backup file: missing version');
          return null;
        }
        return data as BrandBackupData;
      } else {
        toast.error('Invalid backup file format');
        return null;
      }
    } catch (err) {
      console.error('Failed to parse backup file:', err);
      toast.error('Failed to parse backup file. Make sure it\'s a valid JSON file.');
      return null;
    }
  }, []);

  // Import a single guide from backup (creates a new entry)
  const importGuide = useCallback(async (
    backup: BrandBackupData,
    organizationId?: string | null
  ): Promise<{ success: boolean; id?: string }> => {
    if (!user) {
      toast.error('Please sign in to import guides');
      return { success: false };
    }

    try {
      const guide = backup.guide;
      const tableName = backup.type === 'brand' ? 'brands' : 'products';
      
      // Generate new slug to avoid conflicts
      const baseSlug = guide.slug || guide.hero.name.toLowerCase().replace(/\s+/g, '-');
      const newSlug = `${baseSlug}-imported-${Date.now().toString(36)}`;
      
      // Prepare data for insert
      const guideData = {
        ...guide,
        // Remove fields that shouldn't be imported
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        organizationId: undefined,
        isFavorite: false,
      };

      // Extract the guide_data portion (everything except metadata fields)
      const { type, slug, isFavorite, isPublic, sectionOrder, hiddenSections, ...restGuideData } = guideData as any;

      // Preserve the original is_public setting from the backup
      // This allows users to import brands that were public and keep them public
      const originalIsPublic = (guide as any).isPublic ?? backup.guide.isPublic ?? false;
      
      const insertData = {
        user_id: user.id,
        organization_id: organizationId || null,
        name: guide.hero.name,
        slug: newSlug,
        is_favorite: false,
        is_public: originalIsPublic,
        section_order: sectionOrder || DEFAULT_SECTION_ORDER,
        hidden_sections: hiddenSections || [],
        guide_data: restGuideData,
        ...(backup.type === 'product' && (guide as ProductGuide).parentBrandId 
          ? { parent_brand_id: null } // Don't import parent reference
          : {}
        ),
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to import guide:', error);
        toast.error(`Failed to import ${guide.hero.name}: ${error.message}`);
        return { success: false };
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Import error:', err);
      toast.error('An error occurred during import');
      return { success: false };
    }
  }, [user]);

  // Merge a backup into an existing guide (updates existing entry with new sections)
  const mergeGuide = useCallback(async (
    backup: BrandBackupData,
    existingGuideId: string,
    mergeOptions: {
      overwriteExisting?: boolean;  // If true, overwrite even if existing section has data
      sectionsToMerge?: string[];   // Specific sections to merge, or all if undefined
    } = {}
  ): Promise<{ success: boolean; mergedSections: string[] }> => {
    if (!user) {
      toast.error('Please sign in to update guides');
      return { success: false, mergedSections: [] };
    }

    const { overwriteExisting = false, sectionsToMerge } = mergeOptions;

    try {
      const tableName = backup.type === 'brand' ? 'brands' : 'products';
      const incomingGuide = backup.guide;
      
      // Fetch the existing guide data
      const { data: existingData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', existingGuideId)
        .single();

      if (fetchError || !existingData) {
        toast.error('Could not find the existing guide');
        return { success: false, mergedSections: [] };
      }

      const existingGuideData = existingData.guide_data as any || {};
      const incomingGuideData = { ...incomingGuide } as any;
      
      // Remove metadata fields from incoming data
      delete incomingGuideData.id;
      delete incomingGuideData.createdAt;
      delete incomingGuideData.updatedAt;
      delete incomingGuideData.organizationId;
      delete incomingGuideData.type;
      delete incomingGuideData.slug;
      delete incomingGuideData.isFavorite;
      delete incomingGuideData.isPublic;
      delete incomingGuideData.sectionOrder;
      delete incomingGuideData.hiddenSections;

      // Track which sections were merged
      const mergedSections: string[] = [];

      // Define array-based sections that should be merged element-by-element
      const arraySections = [
        'colors', 'typography', 'logos', 'assets', 'patterns', 'gradients',
        'iconography', 'imagery', 'socialMedia', 'brandCollateral', 
        'caseStudies', 'brandApplications', 'documents', 'templates',
        'brochures', 'speakers', 'schedule', 'sponsors', 'eventLogos'
      ];

      // Merge the guide data
      const mergedGuideData = { ...existingGuideData };

      for (const [key, incomingValue] of Object.entries(incomingGuideData)) {
        // Skip if we have a specific list and this section isn't in it
        if (sectionsToMerge && !sectionsToMerge.includes(key)) {
          continue;
        }

        const existingValue = existingGuideData[key];
        
        // Check if this section should be merged
        if (arraySections.includes(key) && Array.isArray(incomingValue)) {
          // For arrays, merge by adding new items
          const existingArray = Array.isArray(existingValue) ? existingValue : [];
          
          if (overwriteExisting || existingArray.length === 0) {
            // Replace or set if empty
            if ((incomingValue as any[]).length > 0) {
              mergedGuideData[key] = incomingValue;
              mergedSections.push(key);
            }
          } else {
            // Merge: add items that don't exist (by name or id)
            const existingIds = new Set(existingArray.map((item: any) => item.id || item.name));
            const newItems = (incomingValue as any[]).filter(
              (item: any) => !existingIds.has(item.id) && !existingIds.has(item.name)
            );
            if (newItems.length > 0) {
              mergedGuideData[key] = [...existingArray, ...newItems];
              mergedSections.push(key);
            }
          }
        } else if (typeof incomingValue === 'object' && incomingValue !== null && !Array.isArray(incomingValue)) {
          // For objects (like hero, eventDetails), deep merge
          const existingObj = (typeof existingValue === 'object' && existingValue !== null) ? existingValue : {};
          
          if (overwriteExisting) {
            mergedGuideData[key] = { ...existingObj, ...incomingValue };
            mergedSections.push(key);
          } else {
            // Only fill in missing fields
            const merged = { ...existingObj };
            let hasNewFields = false;
            for (const [subKey, subValue] of Object.entries(incomingValue as object)) {
              if (merged[subKey] === undefined || merged[subKey] === null || merged[subKey] === '') {
                merged[subKey] = subValue;
                hasNewFields = true;
              }
            }
            if (hasNewFields) {
              mergedGuideData[key] = merged;
              mergedSections.push(key);
            }
          }
        } else if (incomingValue !== undefined && incomingValue !== null) {
          // For primitive values
          if (overwriteExisting || existingValue === undefined || existingValue === null || existingValue === '') {
            mergedGuideData[key] = incomingValue;
            mergedSections.push(key);
          }
        }
      }

      // Update the guide in the database
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          guide_data: mergedGuideData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGuideId);

      if (updateError) {
        console.error('Failed to merge guide:', updateError);
        toast.error(`Failed to update guide: ${updateError.message}`);
        return { success: false, mergedSections: [] };
      }

      return { success: true, mergedSections };
    } catch (err) {
      console.error('Merge error:', err);
      toast.error('An error occurred during merge');
      return { success: false, mergedSections: [] };
    }
  }, [user]);

  // Import a full backup
  const importFullBackup = useCallback(async (
    backup: FullBackupData,
    organizationId?: string | null
  ): Promise<{ success: boolean; imported: { brands: number; products: number } }> => {
    if (!user) {
      toast.error('Please sign in to import backups');
      return { success: false, imported: { brands: 0, products: 0 } };
    }

    let importedBrands = 0;
    let importedProducts = 0;

    // Import brands first
    for (const brandBackup of backup.brands) {
      const result = await importGuide(brandBackup, organizationId);
      if (result.success) {
        importedBrands++;
      }
    }

    // Then import products
    for (const productBackup of backup.products) {
      const result = await importGuide(productBackup, organizationId);
      if (result.success) {
        importedProducts++;
      }
    }

    if (importedBrands > 0 || importedProducts > 0) {
      toast.success(`Imported ${importedBrands} brands and ${importedProducts} products`);
    }

    return {
      success: importedBrands > 0 || importedProducts > 0,
      imported: { brands: importedBrands, products: importedProducts },
    };
  }, [importGuide, user]);

  // Auto-backup: Save a snapshot to localStorage (for recovery)
  const createAutoBackup = useCallback((guide: BrandGuide | ProductGuide) => {
    try {
      const backups: AutoBackupEntry[] = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]');
      
      const newBackup: AutoBackupEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        guideId: guide.id,
        guideName: guide.hero.name,
        guideType: guide.type,
        data: exportGuide(guide),
      };

      // Keep only the most recent backups per guide
      const otherGuideBackups = backups.filter(b => b.guideId !== guide.id);
      const thisGuideBackups = backups
        .filter(b => b.guideId === guide.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_AUTO_BACKUPS - 1); // Keep N-1 to make room for new one

      const updatedBackups = [...otherGuideBackups, ...thisGuideBackups, newBackup]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_AUTO_BACKUPS * 10); // Total cap across all guides

      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(updatedBackups));
    } catch (err) {
      console.warn('Failed to create auto-backup:', err);
    }
  }, [exportGuide]);

  // Get auto-backups for a specific guide
  const getAutoBackups = useCallback((guideId: string): AutoBackupEntry[] => {
    try {
      const backups: AutoBackupEntry[] = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]');
      return backups
        .filter(b => b.guideId === guideId)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, []);

  // Get all auto-backups
  const getAllAutoBackups = useCallback((): AutoBackupEntry[] => {
    try {
      const backups: AutoBackupEntry[] = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]');
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }, []);

  // Restore from an auto-backup
  const restoreFromAutoBackup = useCallback(async (
    backupId: string,
    organizationId?: string | null
  ): Promise<{ success: boolean; id?: string }> => {
    const backups = getAllAutoBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      toast.error('Backup not found');
      return { success: false };
    }

    return importGuide(backup.data, organizationId);
  }, [getAllAutoBackups, importGuide]);

  // Clear all auto-backups
  const clearAutoBackups = useCallback(() => {
    localStorage.removeItem(AUTO_BACKUP_KEY);
    toast.success('Auto-backups cleared');
  }, []);

  return {
    // Export functions
    exportGuide,
    downloadGuide,
    downloadFullBackup,
    
    // Import functions
    parseBackupFile,
    importGuide,
    importFullBackup,
    mergeGuide,
    
    // Auto-backup functions
    createAutoBackup,
    getAutoBackups,
    getAllAutoBackups,
    restoreFromAutoBackup,
    clearAutoBackups,
  };
};
