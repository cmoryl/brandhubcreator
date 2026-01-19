import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Organization, OrganizationFeatures, OrganizationPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/types/organization';

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

export const useAdminOrganizations = () => {
  const { isAdmin } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isAdmin) {
        setOrganizations([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching organizations:', error);
          return;
        }

        setOrganizations(data.map(dbToOrganization));
      } catch (error) {
        console.error('Error in fetchOrganizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [isAdmin]);

  return { organizations, isLoading };
};
