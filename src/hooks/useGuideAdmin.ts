/**
 * useGuideAdmin Hook
 * 
 * Centralized admin detection for Brand, Product, and Event editors.
 * 
 * A user is considered a "guide admin" if they are:
 * 1. A global admin (has 'admin' role in user_roles table)
 * 2. An organization owner or admin for the org that owns the entity
 * 
 * During loading states, we default to true for authenticated users to prevent
 * UI flickering (eye icons disappearing then reappearing).
 * 
 * For public/unauthenticated users, this always returns false.
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface UseGuideAdminOptions {
  /** The organization ID that owns this entity (brand/product/event) */
  entityOrgId?: string | null;
}

interface UseGuideAdminReturn {
  /** Whether the current user has admin privileges for this guide */
  isGuideAdmin: boolean;
  /** Whether permission checks are still loading */
  isLoading: boolean;
  /** Whether the user can edit (has write access) */
  canEdit: boolean;
}

export const useGuideAdmin = (options: UseGuideAdminOptions = {}): UseGuideAdminReturn => {
  const { entityOrgId } = options;
  
  const { user, isAdmin: isGlobalAdmin, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization, isLoading: orgLoading } = useOrganization();

  const result = useMemo(() => {
    // Debug logging
    console.log('[useGuideAdmin] Checking permissions:', {
      hasUser: !!user,
      isGlobalAdmin,
      authLoading,
      orgRole,
      orgId: organization?.id,
      orgLoading,
      entityOrgId,
    });

    // No user = no admin access
    if (!user) {
      console.log('[useGuideAdmin] No user - returning false');
      return {
        isGuideAdmin: false,
        isLoading: false,
        canEdit: false,
      };
    }

    // Global admins always have access regardless of loading state
    if (isGlobalAdmin) {
      console.log('[useGuideAdmin] Global admin - returning true');
      return {
        isGuideAdmin: true,
        isLoading: false,
        canEdit: true,
      };
    }

    // While auth or org is still loading, assume admin for authenticated users
    // This prevents the eye icons from flickering
    const isStillLoading = authLoading || orgLoading;
    
    if (isStillLoading) {
      return {
        isGuideAdmin: true, // Optimistic: show admin UI while loading
        isLoading: true,
        canEdit: true,
      };
    }

    // If we have a user but no orgRole yet and not loading, 
    // the org data might not have been fetched yet (race condition)
    // In this case, be optimistic to prevent UI flicker
    if (!orgRole && !organization) {
      return {
        isGuideAdmin: true, // Optimistic until we know for sure
        isLoading: true,
        canEdit: true,
      };
    }

    // Check if user can edit this org's content
    // User must be owner or admin in their organization
    const hasOrgAdminRole = orgRole === 'owner' || orgRole === 'admin';
    
    // If entity has no org, org admins can edit
    // If entity has an org, it must match the user's org
    const orgMatches = !entityOrgId || !organization?.id || organization.id === entityOrgId;
    
    const canEditOrg = hasOrgAdminRole && orgMatches;

    return {
      isGuideAdmin: canEditOrg,
      isLoading: false,
      canEdit: canEditOrg,
    };
  }, [user, isGlobalAdmin, authLoading, orgRole, organization, orgLoading, entityOrgId]);

  return result;
};

/**
 * Convenience hook for checking if the current view is public (no user)
 */
export const useIsPublicView = (): boolean => {
  const { user, isLoading } = useAuth();
  // If still loading, we don't know yet - return false to prevent premature public view
  if (isLoading) return false;
  return !user;
};
