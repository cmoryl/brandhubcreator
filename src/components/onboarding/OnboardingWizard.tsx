import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBrands } from '@/contexts/BrandContext';
import { useToast } from '@/hooks/use-toast';
import { OnboardingData, DEFAULT_ONBOARDING_DATA } from '@/types/organization';
import { OnboardingStep1 } from './steps/OnboardingStep1';
import { OnboardingStep2 } from './steps/OnboardingStep2';
import { OnboardingStep3 } from './steps/OnboardingStep3';
import { OnboardingStep4 } from './steps/OnboardingStep4';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { organization, createOrganization, updateOrganization, completeOnboarding } = useOrganization();
  const { addBrand } = useBrands();
  const { toast } = useToast();
  
  const [step, setStep] = useState(organization?.onboardingStep || 1);
  const [data, setData] = useState<OnboardingData>({
    ...DEFAULT_ONBOARDING_DATA,
    organizationName: organization?.name || '',
    slug: organization?.slug || '',
    logoUrl: organization?.logoUrl || null,
    primaryColor: organization?.primaryColor || '#6366f1',
    secondaryColor: organization?.secondaryColor || '#8b5cf6',
    accentColor: organization?.accentColor || '#f59e0b',
    customDomain: organization?.customDomain || null,
    hidePlatformBranding: organization?.hidePlatformBranding || false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleStep1Complete = async () => {
    setIsLoading(true);
    try {
      if (!organization) {
        const newOrg = await createOrganization(data.organizationName, data.slug);
        if (!newOrg) {
          throw new Error('Failed to create organization');
        }
      } else {
        await updateOrganization({
          name: data.organizationName,
          slug: data.slug,
          onboardingStep: 2,
        });
      }
      setStep(2);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save organization details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Complete = async () => {
    setIsLoading(true);
    try {
      await updateOrganization({
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        onboardingStep: 3,
      });
      setStep(3);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branding',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Complete = async () => {
    setIsLoading(true);
    try {
      await updateOrganization({
        customDomain: data.customDomain,
        hidePlatformBranding: data.hidePlatformBranding,
        onboardingStep: 4,
      });
      setStep(4);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Create first brand if specified
      if (data.firstBrandName) {
        await addBrand(data.firstBrandName);
      }
      
      await completeOnboarding();
      
      toast({
        title: 'Setup Complete!',
        description: 'Your workspace is ready. Welcome to BrandHub!',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete setup',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <span className="font-semibold text-xl">BrandHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of 4
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <Progress value={progress} className="h-1" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <OnboardingStep1
              data={data}
              onUpdate={updateData}
              onNext={handleStep1Complete}
              isLoading={isLoading}
            />
          )}
          {step === 2 && (
            <OnboardingStep2
              data={data}
              onUpdate={updateData}
              onBack={() => setStep(1)}
              onNext={handleStep2Complete}
              isLoading={isLoading}
            />
          )}
          {step === 3 && (
            <OnboardingStep3
              data={data}
              onUpdate={updateData}
              onBack={() => setStep(2)}
              onNext={handleStep3Complete}
              isLoading={isLoading}
            />
          )}
          {step === 4 && (
            <OnboardingStep4
              data={data}
              onUpdate={updateData}
              onBack={() => setStep(3)}
              onComplete={handleComplete}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};
