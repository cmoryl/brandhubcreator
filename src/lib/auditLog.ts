import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

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
  | 'join'
  | 'approve'
  | 'reject'
  | 'role_change'
  | 'settings_change'
  | 'member_remove'
  | 'backup'
  | 'restore';

export type AuditEntityType = 
  | 'brand' 
  | 'product' 
  | 'event'
  | 'organization' 
  | 'user' 
  | 'settings'
  | 'member'
  | 'role'
  | 'backup'
  | 'demo'
  | 'location'
  | 'pdf'
  | 'image'
  | 'icon_library';

export type AuditOutcome = 'success' | 'failure' | 'partial';

export interface AuditLogEntry {
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  actionType: AuditActionType;
  details?: Json;
  outcome?: AuditOutcome;
  targetUserId?: string;
  targetUserEmail?: string;
  organizationId?: string;
  oldValue?: Json;
  newValue?: Json;
}

/**
 * Get browser and device info for audit logs
 */
const getSessionInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let deviceType = 'desktop';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera')) browser = 'Opera';

  // Detect device type
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

  // Get session ID from localStorage or create one
  let sessionId = sessionStorage.getItem('audit_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('audit_session_id', sessionId);
  }

  return { browser, deviceType, sessionId };
};

/**
 * Log an activity to the audit_logs table using the secure SECURITY DEFINER function
 * This ensures proper access validation and prevents unauthorized log insertion
 */
export const logActivity = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[AUDIT] No user logged in, skipping audit log');
      return;
    }

    const { browser, deviceType, sessionId } = getSessionInfo();

    // Use the secure RPC function with enhanced fields
    const { error } = await supabase.rpc('insert_audit_log', {
      p_brand_id: entry.entityId || null,
      p_entity_type: entry.entityType,
      p_action_type: entry.actionType,
      p_entity_name: entry.entityName || null,
      p_details: entry.details || {},
      p_outcome: entry.outcome || 'success',
      p_browser: browser,
      p_device_type: deviceType,
      p_session_id: sessionId,
      p_target_user_id: entry.targetUserId || null,
      p_target_user_email: entry.targetUserEmail || null,
      p_organization_id: entry.organizationId || null,
      p_old_value: entry.oldValue || null,
      p_new_value: entry.newValue || null,
    });

    if (error) {
      // Silently fail for non-critical audit logging - don't break user flow
      console.error('[AUDIT] Failed to log activity:', error.message);
    } else {
      logger.admin('Activity logged:', entry.actionType, entry.entityType, entry.entityName);
    }
  } catch (err) {
    console.error('[AUDIT] Error logging activity:', err);
  }
};

// ============= Brand Logging =============

export const logBrandCreated = (brandId: string, brandName: string, organizationId?: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'create',
    organizationId,
  });

export const logBrandUpdated = (brandId: string, brandName: string, changedFields?: string[], organizationId?: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'update',
    details: changedFields ? { changedFields } : undefined,
    organizationId,
  });

export const logBrandPublished = (brandId: string, brandName: string, isPublic: boolean, organizationId?: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: isPublic ? 'publish' : 'unpublish',
    organizationId,
  });

export const logBrandDeleted = (brandId: string, brandName: string, organizationId?: string) => 
  logActivity({
    entityType: 'brand',
    entityId: brandId,
    entityName: brandName,
    actionType: 'delete',
    organizationId,
  });

// ============= Product Logging =============

export const logProductCreated = (productId: string, productName: string, organizationId?: string) => 
  logActivity({
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    actionType: 'create',
    organizationId,
  });

export const logProductUpdated = (productId: string, productName: string, organizationId?: string) => 
  logActivity({
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    actionType: 'update',
    organizationId,
  });

export const logProductDeleted = (productId: string, productName: string, organizationId?: string) => 
  logActivity({
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    actionType: 'delete',
    organizationId,
  });

// ============= Event Logging =============

export const logEventCreated = (eventId: string, eventName: string, organizationId?: string) => 
  logActivity({
    entityType: 'event',
    entityId: eventId,
    entityName: eventName,
    actionType: 'create',
    organizationId,
  });

export const logEventUpdated = (eventId: string, eventName: string, organizationId?: string) => 
  logActivity({
    entityType: 'event',
    entityId: eventId,
    entityName: eventName,
    actionType: 'update',
    organizationId,
  });

export const logEventDeleted = (eventId: string, eventName: string, organizationId?: string) => 
  logActivity({
    entityType: 'event',
    entityId: eventId,
    entityName: eventName,
    actionType: 'delete',
    organizationId,
  });

// ============= User Management Logging =============

export const logUserApproved = (targetUserId: string, targetEmail: string) => 
  logActivity({
    entityType: 'user',
    entityName: targetEmail,
    actionType: 'approve',
    targetUserId,
    targetUserEmail: targetEmail,
  });

export const logUserRejected = (targetUserId: string, targetEmail: string, reason?: string) => 
  logActivity({
    entityType: 'user',
    entityName: targetEmail,
    actionType: 'reject',
    targetUserId,
    targetUserEmail: targetEmail,
    details: reason ? { reason } : undefined,
    outcome: 'success',
  });

export const logUserDeleted = (targetUserId: string, targetEmail: string) => 
  logActivity({
    entityType: 'user',
    entityName: targetEmail,
    actionType: 'delete',
    targetUserId,
    targetUserEmail: targetEmail,
  });

export const logRoleChanged = (
  targetUserId: string, 
  targetEmail: string, 
  oldRole: string, 
  newRole: string
) => 
  logActivity({
    entityType: 'role',
    entityName: targetEmail,
    actionType: 'role_change',
    targetUserId,
    targetUserEmail: targetEmail,
    oldValue: { role: oldRole } as Json,
    newValue: { role: newRole } as Json,
    details: { oldRole, newRole },
  });

// ============= Organization Logging =============

export const logOrgCreated = (orgId: string, orgName: string) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'create',
    organizationId: orgId,
  });

export const logOrgUpdated = (orgId: string, orgName: string, changedFields?: string[]) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'update',
    organizationId: orgId,
    details: changedFields ? { changedFields } : undefined,
  });

export const logOrgDeleted = (orgId: string, orgName: string) => 
  logActivity({
    entityType: 'organization',
    entityId: orgId,
    entityName: orgName,
    actionType: 'delete',
  });

export const logMemberInvited = (orgId: string, orgName: string, invitedEmail: string, role: string) => 
  logActivity({
    entityType: 'member',
    entityId: orgId,
    entityName: orgName,
    actionType: 'invite',
    targetUserEmail: invitedEmail,
    organizationId: orgId,
    details: { invitedEmail, role },
  });

export const logMemberJoined = (orgId: string, orgName: string) => 
  logActivity({
    entityType: 'member',
    entityId: orgId,
    entityName: orgName,
    actionType: 'join',
    organizationId: orgId,
  });

export const logMemberRemoved = (
  orgId: string, 
  orgName: string, 
  targetUserId: string, 
  targetEmail: string
) => 
  logActivity({
    entityType: 'member',
    entityId: orgId,
    entityName: orgName,
    actionType: 'member_remove',
    targetUserId,
    targetUserEmail: targetEmail,
    organizationId: orgId,
  });

export const logMemberRoleChanged = (
  orgId: string,
  orgName: string,
  targetUserId: string,
  targetEmail: string,
  oldRole: string,
  newRole: string
) => 
  logActivity({
    entityType: 'member',
    entityId: orgId,
    entityName: orgName,
    actionType: 'role_change',
    targetUserId,
    targetUserEmail: targetEmail,
    organizationId: orgId,
    oldValue: { role: oldRole } as Json,
    newValue: { role: newRole } as Json,
    details: { oldRole, newRole },
  });

// ============= Settings Logging =============

export const logSettingsChanged = (
  settingType: string, 
  settingName: string, 
  oldValue?: Json, 
  newValue?: Json,
  organizationId?: string
) => 
  logActivity({
    entityType: 'settings',
    entityName: `${settingType}: ${settingName}`,
    actionType: 'settings_change',
    oldValue,
    newValue,
    organizationId,
    details: { settingType, settingName },
  });

export const logPortalSettingsChanged = (orgId: string, orgName: string, changedSettings: string[]) => 
  logActivity({
    entityType: 'settings',
    entityName: `Portal: ${orgName}`,
    actionType: 'settings_change',
    organizationId: orgId,
    details: { changedSettings },
  });

export const logFeatureToggled = (orgId: string, orgName: string, feature: string, enabled: boolean) => 
  logActivity({
    entityType: 'settings',
    entityName: `Feature: ${feature}`,
    actionType: 'settings_change',
    organizationId: orgId,
    oldValue: { enabled: !enabled } as Json,
    newValue: { enabled } as Json,
    details: { feature, enabled },
  });

// ============= Backup Logging =============

export const logBackupCreated = (orgId: string, orgName: string, backupType: string, itemCount: number) => 
  logActivity({
    entityType: 'backup',
    entityName: `${backupType} backup`,
    actionType: 'backup',
    organizationId: orgId,
    details: { backupType, itemCount, orgName },
  });

export const logBackupRestored = (orgId: string, orgName: string, backupType: string) => 
  logActivity({
    entityType: 'backup',
    entityName: `${backupType} restore`,
    actionType: 'restore',
    organizationId: orgId,
    details: { backupType, orgName },
  });

// ============= Export Logging =============

export const logExport = (
  entityType: AuditEntityType, 
  entityId: string, 
  entityName: string, 
  exportFormat: string,
  organizationId?: string
) => 
  logActivity({
    entityType,
    entityId,
    entityName,
    actionType: 'export',
    details: { format: exportFormat },
    organizationId,
  });

// ============= Demo Content Logging =============

export const logDemoCreated = (demoId: string, demoName: string, demoType: string) => 
  logActivity({
    entityType: 'demo',
    entityId: demoId,
    entityName: demoName,
    actionType: 'create',
    details: { demoType },
  });

export const logDemoUpdated = (demoId: string, demoName: string) => 
  logActivity({
    entityType: 'demo',
    entityId: demoId,
    entityName: demoName,
    actionType: 'update',
  });

export const logDemoDeleted = (demoId: string, demoName: string) => 
  logActivity({
    entityType: 'demo',
    entityId: demoId,
    entityName: demoName,
    actionType: 'delete',
  });

// ============= Location Logging =============

export const logLocationCreated = (locationId: string, locationName: string) => 
  logActivity({
    entityType: 'location',
    entityId: locationId,
    entityName: locationName,
    actionType: 'create',
  });

export const logLocationUpdated = (locationId: string, locationName: string) => 
  logActivity({
    entityType: 'location',
    entityId: locationId,
    entityName: locationName,
    actionType: 'update',
  });

export const logLocationDeleted = (locationId: string, locationName: string) => 
  logActivity({
    entityType: 'location',
    entityId: locationId,
    entityName: locationName,
    actionType: 'delete',
  });

// ============= Failed Action Logging =============

export const logActionFailed = (
  entityType: AuditEntityType,
  actionType: AuditActionType,
  entityName: string,
  errorMessage: string,
  entityId?: string,
  organizationId?: string
) => 
  logActivity({
    entityType,
    entityId,
    entityName,
    actionType,
    outcome: 'failure',
    details: { error: errorMessage },
    organizationId,
  });
