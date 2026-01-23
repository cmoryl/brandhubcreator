import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GuideCardSkeletonProps {
  count?: number;
}

/**
 * Skeleton loader for brand/product guide cards.
 * Matches the exact layout of the actual cards for a seamless transition.
 * Uses forwardRef to properly handle refs from parent components like TabsContent.
 */
export const GuideCardSkeleton = React.forwardRef<HTMLDivElement, GuideCardSkeletonProps>(
  ({ count = 3 }, ref) => {
    return (
      <div ref={ref} className="contents">
        {Array.from({ length: count }).map((_, i) => (
          <Card 
            key={i}
            className="overflow-hidden border-0 bg-card shadow-lg animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <CardContent className="p-0">
              {/* Cover image placeholder */}
              <div className="h-44 bg-muted/50">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
              
              {/* Content */}
              <div className="p-5">
                {/* Title */}
                <Skeleton className="h-5 w-3/4 mb-2" />
                
                {/* Tagline */}
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                
                {/* Color swatches */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="w-6 h-6 rounded-full" />
                  ))}
                </div>
                
                {/* CTA button */}
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
);

GuideCardSkeleton.displayName = 'GuideCardSkeleton';

/**
 * Full grid skeleton for the organization portal
 */
export function PortalGridSkeleton() {
  return (
    <div className="space-y-16">
      {/* Brands section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GuideCardSkeleton count={3} />
        </div>
      </section>
      
      {/* Products section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GuideCardSkeleton count={3} />
        </div>
      </section>
    </div>
  );
}
