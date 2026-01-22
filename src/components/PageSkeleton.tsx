import { useTheme } from 'next-themes';
import { Skeleton } from "@/components/ui/skeleton";
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

export function PageSkeleton() {
  const { resolvedTheme } = useTheme();
  const tpLogo = resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite;

  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={tpLogo} alt="TransPerfect" className="h-8 w-auto" />
            <span className="font-serif font-semibold text-foreground">BrandHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      {/* Loading content */}
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative mb-8">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
            <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
              <img src={tpLogo} alt="TransPerfect" className="h-8 w-auto animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Loading TransPerfect Portal</p>
        <p className="text-muted-foreground text-sm">Preparing your experience...</p>
        <div className="w-48 mt-6">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandEditorSkeleton() {
  const { resolvedTheme } = useTheme();
  const tpLogo = resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <img src={tpLogo} alt="TransPerfect" className="h-8 w-auto" />
          <span className="font-serif font-semibold text-foreground">BrandHub</span>
        </div>
      </header>
      
      {/* Loading content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8 mx-auto w-fit">
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
              <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                <img src={tpLogo} alt="TransPerfect" className="h-8 w-auto animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Loading TransPerfect Brand Guide</p>
          <p className="text-muted-foreground text-sm">Preparing your brand guidelines...</p>
          <div className="w-48 mt-6 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthPageSkeleton() {
  const { resolvedTheme } = useTheme();
  const tpLogo = resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mb-8 mx-auto w-fit">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
            <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
              <img src={tpLogo} alt="TransPerfect" className="h-8 w-auto animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Loading TransPerfect Portal</p>
        <p className="text-muted-foreground text-sm">Preparing authentication...</p>
        <div className="w-48 mt-6 mx-auto">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
