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
}

/**
 * Sticky breadcrumbs that remain fixed at the top when scrolling.
 * Used across Brand, Product, and Event editors for consistent navigation.
 */
export const StickyBreadcrumbs = React.forwardRef<
  HTMLDivElement,
  StickyBreadcrumbsProps
>(({ items, currentPage, currentIcon, className, showHome = true }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3',
        'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
        'border-b border-border/50',
        'shadow-sm',
        className
      )}
    >
      <AppBreadcrumbs
        items={items}
        currentPage={currentPage}
        currentIcon={currentIcon}
        showHome={showHome}
        className="mb-0"
      />
    </div>
  );
});

StickyBreadcrumbs.displayName = 'StickyBreadcrumbs';

export default StickyBreadcrumbs;
