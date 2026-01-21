import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type AuditActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'publish' 
  | 'unpublish' 
  | 'export' 
  | 'login' 
  | 'logout' 
  | 'invite' 
  | 'join';

export type AuditEntityType = 'brand' | 'product' | 'organization' | 'user' | 'settings';

export interface AuditLogEntry {
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  actionType: AuditActionType;
  details?: Json;
}

/**
 * Log an activity to the audit_logs table
 * Call this whenever important actions occur in the app
 */
export const logActivity = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[AUDIT] No user logged in, skipping audit log');
      return;
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        brand_id: entry.entityId,
        entity_type: entry.entityType,
        action_type: entry.actionType,
        entity_name: entry.entityName || null,
        details: entry.details || {},
      }]);

    if (error) {
      console.error('[AUDIT] Failed to log activity:', error);
    } else {
      console.log('[AUDIT] Activity logged:', entry.actionType, entry.entityType, entry.entityName);
    }
  } catch (err) {
    console.error('[AUDIT] Error logging activity:', err);
  }
};

/**
 * Log brand creation
 */
export const logBrandCreated = (brandId: string, brandName: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'create',
  });

/**
 * Log brand update
 */
export const logBrandUpdated = (brandId: string, brandName: string, changedFields?: string[]) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'update',
    details: changedFields ? { changedFields } : undefined,
  });

/**
 * Log brand published/unpublished
 */
export const logBrandPublished = (brandId: string, brandName: string, isPublic: boolean) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: isPublic ? 'publish' : 'unpublish',
  });

/**
 * Log brand deletion
 */
export const logBrandDeleted = (brandId: string, brandName: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'delete',
  });

/**
 * Log product creation
 */
export const logProductCreated = (productId: string, productName: string) => 
  logActivity({
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    actionType: 'create',
  });

/**
 * Log product update
 */
export const logProductUpdated = (productId: string, productName: string) => 
  logActivity({
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    actionType: 'update',
  });

/**
 * Log export action
 */
export const logExport = (entityType: AuditEntityType, entityId: string, entityName: string, exportFormat: string) => 
  logActivity({
    entityType,
    entityId,
    entityName,
    actionType: 'export',
    details: { format: exportFormat },
  });

/**
 * Log organization created
 */
export const logOrgCreated = (orgId: string, orgName: string) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'create',
  });

/**
 * Log member invited
 */
export const logMemberInvited = (orgId: string, orgName: string, invitedEmail: string) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'invite',
    details: { invitedEmail },
  });

/**
 * Log member joined
 */
export const logMemberJoined = (orgId: string, orgName: string) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'join',
  });
