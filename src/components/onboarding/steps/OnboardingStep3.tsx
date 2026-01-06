import { Globe2, ArrowRight, ArrowLeft, Loader2, EyeOff } from 'lucide-react';
import { OnboardingData } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStep3Props {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const OnboardingStep3 = ({ data, onUpdate, onBack, onNext, isLoading }: OnboardingStep3Props) => {
  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
          <Globe2 className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">White-Label Settings</CardTitle>
        <CardDescription className="text-base">
          Make the platform completely yours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Custom Domain */}
        <div className="space-y-2">
          <Label htmlFor="custom-domain" className="text-base">Custom Domain (Optional)</Label>
          <Input
            id="custom-domain"
            placeholder="brands.yourdomain.com"
            value={data.customDomain || ''}
            onChange={(e) => onUpdate({ customDomain: e.target.value || null })}
            className="h-12 text-base"
          />
          <p className="text-sm text-muted-foreground">
            Connect your own domain for a fully branded experience. You can set this up later.
          </p>
        </div>

        {/* Hide Platform Branding */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Label className="text-base font-medium">Hide BrandForge Branding</Label>
              <p className="text-sm text-muted-foreground">
                Remove all "Powered by BrandForge" references
              </p>
            </div>
          </div>
          <Switch
            checked={data.hidePlatformBranding}
            onCheckedChange={(checked) => onUpdate({ hidePlatformBranding: checked })}
          />
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <h4 className="font-medium text-sm mb-2">What's included in white-label:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your logo and colors throughout the app</li>
            <li>• Custom subdomain or your own domain</li>
            <li>• Branded email notifications (coming soon)</li>
            <li>• Removal of all BrandForge references</li>
            <li>• Custom favicon for browser tabs</li>
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
            onClick={onNext}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
