/**
 * useDownloadTracking - Hook to log download/export events
 * Centralizes download tracking for audit purposes
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type DownloadType = 'pdf' | 'asset' | 'backup' | 'logo' | 'pattern' | 'icon' | 'zip';

interface DownloadDetails {
  download_type: DownloadType;
  format?: string;
  file_name?: string;
  paper_size?: string;
  theme?: string;
  sections_count?: number;
  resolution?: string;
  [key: string]: unknown;
}

interface TrackDownloadParams {
  entityId?: string;
  entityType: string;
  entityName: string;
  details: DownloadDetails;
}

export function useDownloadTracking() {
  const trackDownload = useCallback(async ({
    entityId,
    entityType,
    entityName,
    details,
  }: TrackDownloadParams) => {
    try {
      await supabase.rpc('insert_audit_log', {
        p_brand_id: entityId || null,
        p_entity_type: entityType,
        p_action_type: 'export',
        p_entity_name: entityName,
        p_details: details as unknown as Json,
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience for tracking failures
      console.warn('Failed to track download:', error);
    }
  }, []);

  return { trackDownload };
}
