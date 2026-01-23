/**
 * Organization Domain Types
 * Centralized type definitions for organization-related features
 */

export interface OrganizationFeatures {
  maxBrands: number;
  maxProducts: number;
  maxUsers: number;
  aiAudit: boolean;
  pdfExport: boolean;
  customDomain: boolean;
}

export interface OrganizationPortalSettings {
  heroFullWidth?: boolean;
}

export const DEFAULT_PORTAL_SETTINGS: OrganizationPortalSettings = {
  heroFullWidth: false,
};

export const DEFAULT_FEATURES: OrganizationFeatures = {
  maxBrands: 10,
  maxProducts: 50,
  maxUsers: 5,
  aiAudit: true,
  pdfExport: true,
  customDomain: false,
};

export interface Organization {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  emailFromName: string | null;
  emailFromAddress: string | null;
  hidePlatformBranding: boolean;
  features: OrganizationFeatures;
  portalSettings: OrganizationPortalSettings;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string | null;
  role: MemberRole;
  invitedEmail: string | null;
  inviteToken: string | null;
  inviteAcceptedAt: string | null;
  inviteExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingData {
  organizationName: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string | null;
  hidePlatformBranding: boolean;
  firstBrandName: string | null;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  organizationName: '',
  slug: '',
  logoUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#f59e0b',
  customDomain: null,
  hidePlatformBranding: false,
  firstBrandName: null,
};

// Database row mappers
export const dbToOrganization = (db: any): Organization => ({
  id: db.id,
  name: db.name,
  slug: db.slug,
  customDomain: db.custom_domain,
  logoUrl: db.logo_url,
  faviconUrl: db.favicon_url,
  primaryColor: db.primary_color || '#6366f1',
  secondaryColor: db.secondary_color || '#8b5cf6',
  accentColor: db.accent_color || '#f59e0b',
  emailFromName: db.email_from_name,
  emailFromAddress: db.email_from_address,
  hidePlatformBranding: db.hide_platform_branding || false,
  features: (db.features as OrganizationFeatures) || DEFAULT_FEATURES,
  portalSettings: (db.portal_settings as OrganizationPortalSettings) || DEFAULT_PORTAL_SETTINGS,
  onboardingCompleted: db.onboarding_completed || false,
  onboardingStep: db.onboarding_step || 0,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const dbToMember = (db: any): OrganizationMember => ({
  id: db.id,
  organizationId: db.organization_id,
  userId: db.user_id,
  role: db.role as MemberRole,
  invitedEmail: db.invited_email,
  inviteToken: db.invite_token,
  inviteAcceptedAt: db.invite_accepted_at,
  inviteExpiresAt: db.invite_expires_at,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

// Helper to convert Organization to DB update format
export const organizationToDbUpdate = (updates: Partial<Organization>): Record<string, any> => {
  const dbUpdates: Record<string, any> = {};
  
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
  
  return dbUpdates;
};
