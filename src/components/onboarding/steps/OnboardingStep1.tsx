import { useEffect, useState } from 'react';
import { Building2, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingData } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStep1Props {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  isLoading: boolean;
}

export const OnboardingStep1 = ({ data, onUpdate, onNext, isLoading }: OnboardingStep1Props) => {
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from organization name
  useEffect(() => {
    if (!slugTouched && data.organizationName) {
      const slug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      onUpdate({ slug });
    }
  }, [data.organizationName, slugTouched]);

  const isValid = data.organizationName.length >= 2 && data.slug.length >= 2;

  return (
    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl">Create Your Workspace</CardTitle>
        <CardDescription className="text-base">
          Set up your organization's private brand management platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-base">Organization Name</Label>
          <Input
            id="org-name"
            placeholder="Acme Inc."
            value={data.organizationName}
            onChange={(e) => onUpdate({ organizationName: e.target.value })}
            className="h-12 text-base"
          />
          <p className="text-sm text-muted-foreground">
            This is your company or team name
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-base">Workspace URL</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center">
              <span className="text-muted-foreground text-sm bg-muted px-3 py-3 rounded-l-md border border-r-0 border-input h-12 flex items-center">
                https://
              </span>
              <Input
                id="slug"
                placeholder="acme"
                value={data.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  onUpdate({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                }}
                className="rounded-l-none h-12 text-base"
              />
              <span className="text-muted-foreground text-sm bg-muted px-3 py-3 rounded-r-md border border-l-0 border-input h-12 flex items-center">
                .brandforge.app
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Your team will access the app at this URL
          </p>
        </div>

        <Button
          onClick={onNext}
          disabled={!isValid || isLoading}
          className="w-full h-12 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
