import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from 'next-themes';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

/**
 * PageSkeleton - Content-aware skeleton loading for the portal.
 * Shows a shimmer layout that mirrors the actual portal structure
 * so users perceive faster loading (layout shift = 0).
 */
export function PageSkeleton() {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;
  
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header skeleton */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="BrandHUB" 
              className="h-10 w-10 object-contain" 
            />
            <span className="font-semibold text-xl text-foreground">
              Brand<span className="text-accent">HUB</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </header>

      {/* Hero skeleton - matches portal hero layout */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-10 w-72 rounded-lg" />
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-5 w-full max-w-md rounded" />
              <Skeleton className="h-5 w-3/4 max-w-md rounded" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Skeleton className="h-6 w-40 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border/50">
              <Skeleton className="h-36 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandEditorSkeleton() {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;
  
  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="BrandHUB" className="h-8 w-8 object-contain" />
          <span className="font-semibold text-foreground">
            Brand<span className="text-accent">HUB</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </header>
      
      {/* Editor layout skeleton */}
      <div className="flex-1 flex">
        {/* Sidebar skeleton */}
        <div className="w-64 border-r border-border/50 p-4 space-y-2 hidden lg:block">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 sm:p-8 max-w-5xl">
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-64 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthPageSkeleton() {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md text-center">
        <div className="relative mb-8 mx-auto w-fit">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
            <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
              <img 
                src={logo} 
                alt="BrandHUB" 
                className="h-8 w-8 object-contain animate-pulse" 
              />
            </div>
          </div>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Signing In</p>
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
