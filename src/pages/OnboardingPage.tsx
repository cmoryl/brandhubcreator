import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Onboarding flow disabled: never block access.
    // If a non-authenticated visitor hits /onboarding, send them to the public home page.
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // If an authenticated user hits /onboarding, send them to the main app.
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return null;
};

export default OnboardingPage;
