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
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationFeatures {
  maxBrands: number;
  maxProducts: number;
  maxUsers: number;
  aiAudit: boolean;
  pdfExport: boolean;
  customDomain: boolean;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
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
