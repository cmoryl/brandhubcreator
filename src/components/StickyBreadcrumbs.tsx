import * as React from 'react';
import { cn } from '@/lib/utils';
import { AppBreadcrumbs } from './AppBreadcrumbs';

interface BreadcrumbConfig {
  label: string;
  icon?: React.ElementType;
  href?: string;
}

interface StickyBreadcrumbsProps {
  items?: BreadcrumbConfig[];
  currentPage?: string;
  currentIcon?: React.ElementType;
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

/**
 * Sticky breadcrumbs that remain fixed at the top when scrolling.
 * Used across Brand, Product, and Event editors for consistent navigation.
 */
export const StickyBreadcrumbs = React.forwardRef<
  HTMLDivElement,
  StickyBreadcrumbsProps
>(({ items, currentPage, currentIcon, className, showHome = true, homeHref }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-1 -mx-4 sm:-mx-6 lg:-mx-8',
        'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
        'border-b border-border/50',
        'shadow-sm',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        <AppBreadcrumbs
          items={items}
          currentPage={currentPage}
          currentIcon={currentIcon}
          showHome={showHome}
          homeHref={homeHref}
          className="mb-0"
        />
      </div>
    </div>
  );
});

StickyBreadcrumbs.displayName = 'StickyBreadcrumbs';

export default StickyBreadcrumbs;
