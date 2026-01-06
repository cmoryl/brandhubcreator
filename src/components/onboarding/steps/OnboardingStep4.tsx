import { Rocket, ArrowLeft, Loader2, Sparkles, Check } from 'lucide-react';
import { OnboardingData } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStep4Props {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading: boolean;
}

export const OnboardingStep4 = ({ data, onUpdate, onBack, onComplete, isLoading }: OnboardingStep4Props) => {
  const summaryItems = [
    { label: 'Organization', value: data.organizationName },
    { label: 'Workspace URL', value: `${data.slug}.brandforge.app` },
    { label: 'Custom Domain', value: data.customDomain || 'Not configured' },
    { label: 'White-label', value: data.hidePlatformBranding ? 'Enabled' : 'Disabled' },
  ];

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">Ready to Launch!</CardTitle>
        <CardDescription className="text-base">
          Create your first brand and start building
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Summary */}
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
            Setup Summary
          </h4>
          <div className="space-y-2">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* First Brand */}
        <div className="space-y-2">
          <Label htmlFor="first-brand" className="text-base">Create Your First Brand (Optional)</Label>
          <Input
            id="first-brand"
            placeholder="e.g., My Company Brand"
            value={data.firstBrandName || ''}
            onChange={(e) => onUpdate({ firstBrandName: e.target.value || null })}
            className="h-12 text-base"
          />
          <p className="text-sm text-muted-foreground">
            You can skip this and create brands later from the dashboard
          </p>
        </div>

        {/* What's Next */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-medium">What happens next:</h4>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Your workspace will be created at <strong>{data.slug}.brandforge.app</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>You can invite team members from the dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Create and manage unlimited brand guides for your clients</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={onComplete}
            disabled={isLoading}
            className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Launch Workspace
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
