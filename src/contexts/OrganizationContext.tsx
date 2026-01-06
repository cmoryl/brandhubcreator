import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Organization, OrganizationMember, OrganizationFeatures } from '@/types/organization';

interface OrganizationContextType {
  organization: Organization | null;
  members: OrganizationMember[];
  userRole: OrganizationMember['role'] | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  createOrganization: (name: string, slug: string) => Promise<Organization | null>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  inviteMember: (email: string, role: OrganizationMember['role']) => Promise<void>;
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
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error fetching organization membership:', memberError);
        setIsLoading(false);
        return;
      }

      if (!memberData) {
        // User has no organization - allow using the app without onboarding
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

      const org = dbToOrganization(memberData.organizations);
      setOrganization(org);
      setUserRole(memberData.role as OrganizationMember['role']);
      setNeedsOnboarding(!org.onboardingCompleted);

      // Fetch all members if user is admin or owner
      if (memberData.role === 'owner' || memberData.role === 'admin') {
        const { data: membersData } = await supabase
          .from('organization_members')
          .select('*')
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

    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        })
        .select()
        .single();

      if (orgError) throw orgError;

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
    } catch (error) {
      console.error('Error creating organization:', error);
      return null;
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
        user_id: crypto.randomUUID(), // Placeholder until invite is accepted
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
      inviteMember,
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
