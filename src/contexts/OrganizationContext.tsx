import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Organization, OrganizationMember, OrganizationFeatures, OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/types/organization';

interface OrganizationContextType {
  organization: Organization | null;
  members: OrganizationMember[];
  userRole: OrganizationMember['role'] | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: () => Promise<boolean>;
  inviteMember: (email: string, role: OrganizationMember['role']) => Promise<void>;
  acceptInvite: (inviteToken: string) => Promise<boolean>;
  checkPendingInvite: () => Promise<OrganizationMember | null>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: OrganizationMember['role']) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const dbToOrganization = (db: any): Organization => ({
  id: db.id,
  name: db.name,
  slug: db.slug,
  customDomain: db.custom_domain,
  logoUrl: db.logo_url,
  faviconUrl: db.favicon_url,
  primaryColor: db.primary_color,
  secondaryColor: db.secondary_color,
  accentColor: db.accent_color,
  emailFromName: db.email_from_name,
  emailFromAddress: db.email_from_address,
  hidePlatformBranding: db.hide_platform_branding,
  features: db.features as OrganizationFeatures,
  portalSettings: (db.portal_settings as OrganizationPortalSettings) || DEFAULT_PORTAL_SETTINGS,
  onboardingCompleted: db.onboarding_completed,
  onboardingStep: db.onboarding_step,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const dbToMember = (db: any): OrganizationMember => ({
  id: db.id,
  organizationId: db.organization_id,
  userId: db.user_id,
  role: db.role,
  invitedEmail: db.invited_email,
  inviteToken: db.invite_token,
  inviteAcceptedAt: db.invite_accepted_at,
  inviteExpiresAt: db.invite_expires_at,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<OrganizationMember['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchOrganization = async () => {
    if (!user) {
      setOrganization(null);
      setMembers([]);
      setUserRole(null);
      setIsLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    try {
      // First check if user is a member of any organization
      // Add timeout to prevent indefinite hanging
      // SECURITY: Explicitly select columns, excluding invite_token
      const memberPromise = supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, invited_email, invite_accepted_at, invite_expires_at, created_at, updated_at, organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Organization fetch timeout')), 15000)
      );

      const { data: memberData, error: memberError } = await Promise.race([
        memberPromise,
        timeoutPromise as Promise<never>
      ]).catch(err => {
        console.warn('[ORG] Fetch timed out or failed:', err);
        return { data: null, error: err };
      }) as any;

      if (memberError && memberError.code !== 'PGRST116') {
        // Don't block on backend errors - allow user to proceed
        console.error('Error fetching organization membership:', memberError);
        setIsLoading(false);
        return;
      }

      if (!memberData) {
        // Check for pending invites by email before giving up
        // SECURITY: Exclude invite_token and check expiration
        if (user.email) {
          const { data: pendingInvite } = await supabase
            .from('organization_members')
            .select('id, organization_id, user_id, role, invited_email, invite_accepted_at, invite_expires_at, created_at, updated_at, organizations(*)')
            .eq('invited_email', user.email)
            .is('user_id', null)
            .gt('invite_expires_at', new Date().toISOString())
            .maybeSingle();

          if (pendingInvite) {
            // Auto-accept the invite
            const { error: acceptError } = await supabase
              .from('organization_members')
              .update({
                user_id: user.id,
                invite_accepted_at: new Date().toISOString(),
                invite_token: null,
              })
              .eq('id', pendingInvite.id);

            if (!acceptError) {
              // Refetch to get the updated data
              const org = dbToOrganization(pendingInvite.organizations);
              setOrganization(org);
              setUserRole(pendingInvite.role as OrganizationMember['role']);
              setNeedsOnboarding(false);
              setIsLoading(false);
              return;
            }
          }
        }

        // User has no organization - allow using the app without onboarding
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

      const org = dbToOrganization(memberData.organizations);
      setOrganization(org);
      setUserRole(memberData.role as OrganizationMember['role']);
      setNeedsOnboarding(false);

      // Fetch all members if user is admin or owner
      // SECURITY: Explicitly exclude invite_token to prevent token theft
      if (memberData.role === 'owner' || memberData.role === 'admin') {
        const { data: membersData } = await supabase
          .from('organization_members')
          .select('id, organization_id, user_id, role, invited_email, invite_accepted_at, invite_expires_at, created_at, updated_at')
          .eq('organization_id', org.id);

        if (membersData) {
          setMembers(membersData.map(dbToMember));
        }
      }
    } catch (error) {
      console.error('Error in fetchOrganization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  const createOrganization = async (name: string, slug: string): Promise<Organization | null> => {
    if (!user) return null;

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
      // Check if slug is already taken using RPC function (works without org membership)
      const { data: slugTaken, error: slugError } = await supabase
        .rpc('is_slug_taken', { check_slug: normalizedSlug });

      if (slugError) {
        console.error('Error checking slug:', slugError);
      } else if (slugTaken) {
        throw new Error(`The workspace URL "${normalizedSlug}" is already taken. Please choose a different one.`);
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: normalizedSlug,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          throw new Error(`The workspace URL "${normalizedSlug}" is already taken. Please choose a different one.`);
        }
        throw orgError;
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      const org = dbToOrganization(orgData);
      setOrganization(org);
      setUserRole('owner');
      setNeedsOnboarding(false);

      return org;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return;

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.customDomain !== undefined) dbUpdates.custom_domain = updates.customDomain;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.faviconUrl !== undefined) dbUpdates.favicon_url = updates.faviconUrl;
    if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
    if (updates.secondaryColor !== undefined) dbUpdates.secondary_color = updates.secondaryColor;
    if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
    if (updates.emailFromName !== undefined) dbUpdates.email_from_name = updates.emailFromName;
    if (updates.emailFromAddress !== undefined) dbUpdates.email_from_address = updates.emailFromAddress;
    if (updates.hidePlatformBranding !== undefined) dbUpdates.hide_platform_branding = updates.hidePlatformBranding;
    if (updates.features !== undefined) dbUpdates.features = updates.features;
    if (updates.portalSettings !== undefined) dbUpdates.portal_settings = updates.portalSettings;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.onboardingStep !== undefined) dbUpdates.onboarding_step = updates.onboardingStep;

    const { error } = await supabase
      .from('organizations')
      .update(dbUpdates)
      .eq('id', organization.id);

    if (error) {
      console.error('Error updating organization:', error);
      throw error;
    }

    setOrganization({ ...organization, ...updates });
  };

  const inviteMember = async (email: string, role: OrganizationMember['role']) => {
    if (!organization) return;

    const inviteToken = crypto.randomUUID();

    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: null, // Will be set when invite is accepted
        role,
        invited_email: email,
        invite_token: inviteToken,
      });

    if (error) {
      console.error('Error inviting member:', error);
      throw error;
    }

    await fetchOrganization();
  };

  const acceptInvite = async (inviteToken: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use secure RPC function to validate and accept invite
      // This prevents invite_token from being exposed to client queries
      const { data, error } = await supabase
        .rpc('validate_and_accept_invite', {
          p_invite_token: inviteToken,
          p_user_id: user.id
        });

      if (error) {
        console.error('Error accepting invite:', error);
        return false;
      }

      // If no rows returned, the token was invalid or expired
      if (!data || data.length === 0) {
        console.error('Invalid or expired invite token');
        return false;
      }

      await fetchOrganization();
      return true;
    } catch (error) {
      console.error('Error in acceptInvite:', error);
      return false;
    }
  };

  const checkPendingInvite = async (): Promise<OrganizationMember | null> => {
    if (!user?.email) return null;

    // SECURITY: Only select needed fields, exclude invite_token, check expiration
    const { data, error } = await supabase
      .from('organization_members')
      .select('id, organization_id, user_id, role, invited_email, invite_accepted_at, invite_expires_at, created_at, updated_at, organizations(*)')
      .eq('invited_email', user.email)
      .is('user_id', null)
      .gt('invite_expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return dbToMember(data);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      throw error;
    }

    setMembers(members.filter(m => m.id !== memberId));
  };

  const updateMemberRole = async (memberId: string, role: OrganizationMember['role']) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member role:', error);
      throw error;
    }

    setMembers(members.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const deleteOrganization = async (): Promise<boolean> => {
    if (!organization || userRole !== 'owner') {
      console.error('Only owners can delete organizations');
      return false;
    }

    try {
      // Delete all members first (cascade should handle this, but be explicit)
      const { error: membersError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organization.id);

      if (membersError) {
        console.error('Error deleting organization members:', membersError);
        throw membersError;
      }

      // Delete the organization
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);

      if (orgError) {
        console.error('Error deleting organization:', orgError);
        throw orgError;
      }

      // Reset state
      setOrganization(null);
      setMembers([]);
      setUserRole(null);
      setNeedsOnboarding(false);

      return true;
    } catch (error) {
      console.error('Error in deleteOrganization:', error);
      return false;
    }
  };

  const completeOnboarding = async () => {
    await updateOrganization({ onboardingCompleted: true, onboardingStep: 4 });
    setNeedsOnboarding(false);
  };

  return (
    <OrganizationContext.Provider value={{
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
      refetch: fetchOrganization,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
