/**
 * Organization Service
 * Centralized data access layer for organization operations
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  Organization, 
  OrganizationMember, 
  dbToOrganization, 
  dbToMember,
  organizationToDbUpdate,
  MemberRole 
} from './types';

const FETCH_TIMEOUT = 15000;

// Secure column selection - excludes invite_token
const MEMBER_SAFE_COLUMNS = 'id, organization_id, user_id, role, invited_email, invite_accepted_at, invite_expires_at, created_at, updated_at';

export class OrganizationService {
  /**
   * Fetch the organization membership for a user
   */
  static async fetchUserMembership(userId: string): Promise<{
    organization: Organization | null;
    member: OrganizationMember | null;
  }> {
    const memberPromise = supabase
      .from('organization_members')
      .select(`${MEMBER_SAFE_COLUMNS}, organizations(*)`)
      .eq('user_id', userId)
      .maybeSingle();
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Organization fetch timeout')), FETCH_TIMEOUT)
    );

    try {
      const { data, error } = await Promise.race([memberPromise, timeoutPromise]);
      
      if (error && error.code !== 'PGRST116') {
        console.error('[OrgService] Error fetching membership:', error);
        return { organization: null, member: null };
      }

      if (!data) {
        return { organization: null, member: null };
      }

      return {
        organization: dbToOrganization(data.organizations),
        member: dbToMember(data),
      };
    } catch (err) {
      console.warn('[OrgService] Fetch timed out or failed:', err);
      return { organization: null, member: null };
    }
  }

  /**
   * Check for pending invite by email
   */
  static async checkPendingInvite(email: string): Promise<{
    invite: OrganizationMember | null;
    organization: Organization | null;
  }> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`${MEMBER_SAFE_COLUMNS}, organizations(*)`)
      .eq('invited_email', email)
      .is('user_id', null)
      .gt('invite_expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return { invite: null, organization: null };
    }

    return {
      invite: dbToMember(data),
      organization: dbToOrganization(data.organizations),
    };
  }

  /**
   * Accept a pending invite
   */
  static async acceptInvite(inviteId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('organization_members')
      .update({
        user_id: userId,
        invite_accepted_at: new Date().toISOString(),
        invite_token: null,
      })
      .eq('id', inviteId);

    return !error;
  }

  /**
   * Accept invite via secure RPC
   */
  static async acceptInviteByToken(inviteToken: string, userId: string): Promise<{
    success: boolean;
    orgId?: string;
    memberId?: string;
    role?: MemberRole;
  }> {
    const { data, error } = await supabase
      .rpc('validate_and_accept_invite', {
        p_invite_token: inviteToken,
        p_user_id: userId
      });

    if (error || !data || data.length === 0) {
      console.error('[OrgService] Error accepting invite:', error);
      return { success: false };
    }

    return {
      success: true,
      orgId: data[0].org_id,
      memberId: data[0].member_id,
      role: data[0].member_role as MemberRole,
    };
  }

  /**
   * Fetch all members of an organization
   */
  static async fetchMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(MEMBER_SAFE_COLUMNS)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('[OrgService] Error fetching members:', error);
      return [];
    }

    return (data || []).map(dbToMember);
  }

  /**
   * Check if a slug is already taken
   */
  static async isSlugTaken(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_slug_taken', { check_slug: slug });

    if (error) {
      console.error('[OrgService] Error checking slug:', error);
      return true; // Assume taken on error
    }

    return !!data;
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    name: string, 
    slug: string, 
    userId: string
  ): Promise<Organization | null> {
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check slug availability
    if (await this.isSlugTaken(normalizedSlug)) {
      throw new Error(`The workspace URL "${normalizedSlug}" is already taken.`);
    }

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: normalizedSlug,
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      if (orgError.code === '23505') {
        throw new Error(`The workspace URL "${normalizedSlug}" is already taken.`);
      }
      throw orgError;
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      // Rollback org creation
      await supabase.from('organizations').delete().eq('id', orgData.id);
      throw memberError;
    }

    return dbToOrganization(orgData);
  }

  /**
   * Update an organization
   */
  static async updateOrganization(
    organizationId: string, 
    updates: Partial<Organization>
  ): Promise<void> {
    const dbUpdates = organizationToDbUpdate(updates);

    const { error } = await supabase
      .from('organizations')
      .update(dbUpdates)
      .eq('id', organizationId);

    if (error) {
      console.error('[OrgService] Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Delete an organization
   */
  static async deleteOrganization(organizationId: string): Promise<boolean> {
    // Delete all members first
    const { error: membersError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId);

    if (membersError) {
      console.error('[OrgService] Error deleting members:', membersError);
      throw membersError;
    }

    // Delete the organization
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (orgError) {
      console.error('[OrgService] Error deleting organization:', orgError);
      throw orgError;
    }

    return true;
  }

  /**
   * Invite a member to the organization
   */
  static async inviteMember(
    organizationId: string, 
    email: string, 
    role: MemberRole
  ): Promise<void> {
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: null,
        role,
        invited_email: email,
        invite_token: inviteToken,
        invite_expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('[OrgService] Error inviting member:', error);
      throw error;
    }
  }

  /**
   * Remove a member from the organization
   */
  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('[OrgService] Error removing member:', error);
      throw error;
    }
  }

  /**
   * Update a member's role
   */
  static async updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error('[OrgService] Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Fetch public portal organization data
   */
  static async fetchPublicPortalOrg(slug: string): Promise<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    portalSettings: any;
  } | null> {
    const { data, error } = await supabase
      .rpc('get_public_portal_org', { p_slug: slug })
      .maybeSingle();

    if (error || !data) {
      console.error('[OrgService] Error fetching public portal org:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      accentColor: data.accent_color,
      portalSettings: data.portal_settings,
    };
  }
}
