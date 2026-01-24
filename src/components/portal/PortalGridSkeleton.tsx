/**
 * Portal Grid Skeleton
 * Loading skeleton for portal grids
 */

import { GuideCardSkeleton } from '@/components/ui/guide-card-skeleton';

interface PortalGridSkeletonProps {
  count?: number;
}

export const PortalGridSkeleton = ({ count = 6 }: PortalGridSkeletonProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    <GuideCardSkeleton count={count} />
  </div>
);
