/**
 * useQRCodes - Hook for managing QR codes in the database
 * Provides CRUD operations for QR codes with real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export type QRDotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
export type QRCornerStyle = 'square' | 'dot' | 'extra-rounded';

export interface QRCode {
  id: string;
  name: string;
  description?: string;
  url: string;
  fgColor: string;
  bgColor: string;
  logoUrl?: string;
  logoType: 'none' | 'brand' | 'custom';
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  dotStyle: QRDotStyle;
  cornerStyle: QRCornerStyle;
  useCase?: 'event' | 'product' | 'marketing' | 'contact' | 'wifi' | 'other';
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseQRCode {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  description: string | null;
  url: string;
  fg_color: string;
  bg_color: string;
  logo_url: string | null;
  logo_type: string;
  size: number;
  error_correction: string;
  dot_style: string | null;
  corner_style: string | null;
  use_case: string | null;
  is_active: boolean;
  scan_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Convert database record to frontend type
const toFrontendQR = (record: DatabaseQRCode): QRCode => ({
  id: record.id,
  name: record.name,
  description: record.description || undefined,
  url: record.url,
  fgColor: record.fg_color,
  bgColor: record.bg_color,
  logoUrl: record.logo_url || undefined,
  logoType: (record.logo_type as QRCode['logoType']) || 'none',
  size: record.size,
  errorCorrection: (record.error_correction as QRCode['errorCorrection']) || 'M',
  dotStyle: (record.dot_style as QRDotStyle) || 'square',
  cornerStyle: (record.corner_style as QRCornerStyle) || 'square',
  useCase: record.use_case as QRCode['useCase'],
  isActive: record.is_active,
  scanCount: record.scan_count,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

// Query key factory
export const qrCodeKeys = {
  all: ['qr-codes'] as const,
  entity: (entityType: string, entityId: string, orgId?: string) => 
    [...qrCodeKeys.all, entityType, entityId, orgId || ''] as const,
};

export function useQRCodes(
  entityType: 'brand' | 'product' | 'event',
  entityId: string | undefined
) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch QR codes for entity
  const { data: qrCodes = [], isLoading, error } = useQuery({
    queryKey: qrCodeKeys.entity(entityType, entityId || '', organization?.id),
    queryFn: async () => {
      if (!entityId || !organization?.id) return [];
      
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useQRCodes] Fetch error:', error);
        throw error;
      }

      return (data || []).map((record: DatabaseQRCode) => toFrontendQR(record));
    },
    enabled: !!entityId && !!organization?.id,
    staleTime: 30000,
  });

  // Add QR code mutation
  const addMutation = useMutation({
    mutationFn: async (qrCode: Omit<QRCode, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>) => {
      if (!organization?.id || !entityId) {
        throw new Error('Missing organization or entity ID');
      }

      const { data: session } = await supabase.auth.getSession();
      
      const insertData = {
        organization_id: organization.id,
        entity_type: entityType,
        entity_id: entityId,
        name: qrCode.name,
        description: qrCode.description || null,
        url: qrCode.url,
        fg_color: qrCode.fgColor,
        bg_color: qrCode.bgColor,
        logo_url: qrCode.logoUrl || null,
        logo_type: qrCode.logoType || 'none',
        size: qrCode.size || 256,
        error_correction: qrCode.errorCorrection || 'M',
        dot_style: qrCode.dotStyle || 'square',
        corner_style: qrCode.cornerStyle || 'square',
        use_case: qrCode.useCase || null,
        is_active: qrCode.isActive ?? true,
        created_by: session.session?.user?.id || null,
      };
      
      const { data, error } = await supabase
        .from('qr_codes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[useQRCodes] Insert error:', error);
        throw error;
      }

      return toFrontendQR(data as DatabaseQRCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.entity(entityType, entityId || '', organization?.id) });
      toast.success('QR code created');
    },
    onError: (error) => {
      toast.error(`Failed to create QR code: ${error.message}`);
    },
  });

  // Update QR code mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QRCode> }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.fgColor !== undefined) updateData.fg_color = updates.fgColor;
      if (updates.bgColor !== undefined) updateData.bg_color = updates.bgColor;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl || null;
      if (updates.logoType !== undefined) updateData.logo_type = updates.logoType;
      if (updates.size !== undefined) updateData.size = updates.size;
      if (updates.errorCorrection !== undefined) updateData.error_correction = updates.errorCorrection;
      if (updates.dotStyle !== undefined) updateData.dot_style = updates.dotStyle;
      if (updates.cornerStyle !== undefined) updateData.corner_style = updates.cornerStyle;
      if (updates.useCase !== undefined) updateData.use_case = updates.useCase || null;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase
        .from('qr_codes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('[useQRCodes] Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.entity(entityType, entityId || '', organization?.id) });
      toast.success('QR code updated');
    },
    onError: (error) => {
      toast.error(`Failed to update QR code: ${error.message}`);
    },
  });

  // Delete QR code mutation
  const deleteMutation = useMutation({
    mutationFn: async (qrCodeId: string) => {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrCodeId);

      if (error) {
        console.error('[useQRCodes] Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.entity(entityType, entityId || '', organization?.id) });
      toast.success('QR code deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete QR code: ${error.message}`);
    },
  });

  return {
    qrCodes,
    isLoading,
    error,
    addQRCode: addMutation.mutateAsync,
    updateQRCode: updateMutation.mutateAsync,
    deleteQRCode: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
