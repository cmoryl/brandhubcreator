/**
 * Portal Grid Skeleton
 * Loading skeleton for portal grids
 */

import { GuideCardSkeleton } from '@/components/ui/guide-card-skeleton';

interface PortalGridSkeletonProps {
  count?: number;
}

export const PortalGridSkeleton = ({ count = 6 }: PortalGridSkeletonProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <GuideCardSkeleton key={i} />
    ))}
  </div>
);
