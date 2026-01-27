/**
 * useOrganizationData Hook
 * Manages organization state and operations with clean separation from context
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationService } from '@/lib/organization/service';
import { 
  Organization, 
  OrganizationMember, 
  MemberRole 
} from '@/lib/organization/types';

interface OrganizationState {
  organization: Organization | null;
  members: OrganizationMember[];
  userRole: MemberRole | null;
  isLoading: boolean;
  needsOnboarding: boolean;
}

interface OrganizationActions {
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: () => Promise<boolean>;
  inviteMember: (email: string, role: MemberRole) => Promise<void>;
  acceptInvite: (inviteToken: string) => Promise<boolean>;
  checkPendingInvite: () => Promise<OrganizationMember | null>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: MemberRole) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refetch: () => Promise<void>;
}

export type UseOrganizationDataReturn = OrganizationState & OrganizationActions;

export const useOrganizationData = (): UseOrganizationDataReturn => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<MemberRole | null>(null);
  // Start with isLoading false to prevent flash - will be set true when fetch starts
  const [isLoading, setIsLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  // Track if initial fetch completed to avoid double-fetching
  const fetchedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setMembers([]);
      setUserRole(null);
      setIsLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    // Skip if already fetched for this user
    if (fetchedRef.current && userIdRef.current === user.id) {
      return;
    }

    setIsLoading(true);

    try {
      // First check if user has existing membership
      const { organization: org, member } = await OrganizationService.fetchUserMembership(user.id);

      if (org && member) {
        setOrganization(org);
        setUserRole(member.role);
        setNeedsOnboarding(false);
        userIdRef.current = user.id;
        fetchedRef.current = true;

        // Fetch all members if user is admin or owner
        if (member.role === 'owner' || member.role === 'admin') {
          const allMembers = await OrganizationService.fetchMembers(org.id);
          setMembers(allMembers);
        }
        
        setIsLoading(false);
        return;
      }

      // Check for pending invites
      if (user.email) {
        const { invite, organization: inviteOrg } = await OrganizationService.checkPendingInvite(user.email);
        
        if (invite && inviteOrg) {
          // Auto-accept the invite
          const accepted = await OrganizationService.acceptInvite(invite.id, user.id);
          
          if (accepted) {
            setOrganization(inviteOrg);
            setUserRole(invite.role);
            setNeedsOnboarding(false);
            userIdRef.current = user.id;
            fetchedRef.current = true;
            setIsLoading(false);
            return;
          }
        }
      }

      // No organization - user can proceed without onboarding
      setNeedsOnboarding(false);
      userIdRef.current = user.id;
      fetchedRef.current = true;
    } catch (error) {
      console.error('[useOrganizationData] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch on user change
  useEffect(() => {
    if (user?.id !== userIdRef.current) {
      fetchedRef.current = false;
    }
    fetchOrganization();
  }, [user, fetchOrganization]);

  const createOrganization = useCallback(async (name: string, slug: string): Promise<Organization | null> => {
    if (!user) return null;

    const org = await OrganizationService.createOrganization(name, slug, user.id);
    
    if (org) {
      setOrganization(org);
      setUserRole('owner');
      setNeedsOnboarding(false);
    }

    return org;
  }, [user]);

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!organization) return;

    await OrganizationService.updateOrganization(organization.id, updates);
    setOrganization(prev => prev ? { ...prev, ...updates } : null);
  }, [organization]);

  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    if (!organization || userRole !== 'owner') {
      console.error('[useOrganizationData] Only owners can delete organizations');
      return false;
    }

    const success = await OrganizationService.deleteOrganization(organization.id);

    if (success) {
      setOrganization(null);
      setMembers([]);
      setUserRole(null);
      setNeedsOnboarding(false);
    }

    return success;
  }, [organization, userRole]);

  const inviteMember = useCallback(async (email: string, role: MemberRole) => {
    if (!organization) return;

    await OrganizationService.inviteMember(organization.id, email, role);
    
    // Refetch members
    const allMembers = await OrganizationService.fetchMembers(organization.id);
    setMembers(allMembers);
  }, [organization]);

  const acceptInvite = useCallback(async (inviteToken: string): Promise<boolean> => {
    if (!user) return false;

    const result = await OrganizationService.acceptInviteByToken(inviteToken, user.id);

    if (result.success) {
      await fetchOrganization();
      return true;
    }

    return false;
  }, [user, fetchOrganization]);

  const checkPendingInvite = useCallback(async (): Promise<OrganizationMember | null> => {
    if (!user?.email) return null;

    const { invite } = await OrganizationService.checkPendingInvite(user.email);
    return invite;
  }, [user?.email]);

  const removeMember = useCallback(async (memberId: string) => {
    await OrganizationService.removeMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, role: MemberRole) => {
    await OrganizationService.updateMemberRole(memberId, role);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!organization) return;
    
    await OrganizationService.updateOrganization(organization.id, { 
      onboardingCompleted: true, 
      onboardingStep: 4 
    });
    
    setOrganization(prev => prev ? {
      ...prev,
      onboardingCompleted: true,
      onboardingStep: 4
    } : null);
    setNeedsOnboarding(false);
  }, [organization]);

  const refetch = useCallback(async () => {
    fetchedRef.current = false;
    await fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    members,
    userRole,
    isLoading,
    needsOnboarding,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    acceptInvite,
    checkPendingInvite,
    removeMember,
    updateMemberRole,
    completeOnboarding,
    refetch,
  };
};
