import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();

  useEffect(() => {
    // If not authenticated, redirect to auth page
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // If user already has an organization, redirect to home
    if (!authLoading && !orgLoading && user && organization) {
      navigate('/');
    }
  }, [authLoading, orgLoading, user, organization, navigate]);

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show onboarding wizard for authenticated users without an organization
  if (user && !organization) {
    return <OnboardingWizard />;
  }

  return null;
};

export default OnboardingPage;
