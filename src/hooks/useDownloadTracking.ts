/**
 * useDownloadTracking - Enhanced hook to log download/export events
 * Captures user identity, browser/device metadata, file details, and organization context
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type DownloadType = 'pdf' | 'asset' | 'backup' | 'logo' | 'pattern' | 'icon' | 'zip' | 'csv' | 'json' | 'svg' | 'vcard' | 'design_token' | 'lottie' | 'image' | 'report' | 'other';

interface DownloadDetails {
  download_type: DownloadType;
  format?: string;
  file_name?: string;
  file_size_bytes?: number;
  paper_size?: string;
  theme?: string;
  sections_count?: number;
  resolution?: string;
  source_section?: string;
  item_count?: number;
  [key: string]: unknown;
}

interface TrackDownloadParams {
  entityId?: string;
  entityType: string;
  entityName: string;
  details: DownloadDetails;
  organizationId?: string;
}

/** Detect browser name */
function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

/** Detect device type */
function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

/** Estimate blob/string size in bytes */
export function estimateSize(data: Blob | string | ArrayBuffer | null | undefined): number | undefined {
  if (!data) return undefined;
  if (data instanceof Blob) return data.size;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (typeof data === 'string') return new Blob([data]).size;
  return undefined;
}

/** Get a stable session id (per tab) */
function getSessionId(): string {
  let sid = sessionStorage.getItem('_dl_session');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('_dl_session', sid);
  }
  return sid;
}

export function useDownloadTracking() {
  const trackDownload = useCallback(async ({
    entityId,
    entityType,
    entityName,
    details,
    organizationId,
  }: TrackDownloadParams) => {
    try {
      const enrichedDetails: Record<string, unknown> = {
        ...details,
        tracked_at: new Date().toISOString(),
      };

      // Add file size to details if present
      if (details.file_size_bytes) {
        enrichedDetails.file_size_display = formatFileSize(details.file_size_bytes);
      }

      await supabase.rpc('insert_audit_log', {
        p_brand_id: entityId || null,
        p_entity_type: entityType,
        p_action_type: 'export',
        p_entity_name: entityName,
        p_details: enrichedDetails as unknown as Json,
        p_browser: detectBrowser(),
        p_device_type: detectDevice(),
        p_session_id: getSessionId(),
        p_organization_id: organizationId || null,
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience for tracking failures
      console.warn('Failed to track download:', error);
    }
  }, []);

  return { trackDownload };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
