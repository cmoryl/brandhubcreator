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
    // No user = no admin access
    if (!user) {
      return {
        isGuideAdmin: false,
        isLoading: false,
        canEdit: false,
      };
    }

    // Check if user can edit this org's content
    const canEditOrg = 
      (orgRole === 'owner' || orgRole === 'admin') &&
      // If we know the entity's org, verify it matches the user's org
      (!entityOrgId || organization?.id === entityOrgId);

    // While loading, assume admin for authenticated users to prevent UI flicker
    // This ensures the eye icons show while contexts are hydrating
    const isStillLoading = authLoading || orgLoading;
    
    if (isStillLoading) {
      return {
        isGuideAdmin: true, // Optimistic: show admin UI while loading
        isLoading: true,
        canEdit: true,
      };
    }

    // Final determination
    const isGuideAdmin = isGlobalAdmin || canEditOrg;
    
    return {
      isGuideAdmin,
      isLoading: false,
      canEdit: isGuideAdmin,
    };
  }, [user, isGlobalAdmin, authLoading, orgRole, organization?.id, orgLoading, entityOrgId]);

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
