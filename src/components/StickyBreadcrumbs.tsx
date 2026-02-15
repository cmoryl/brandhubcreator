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
    <>
      {/* Fixed breadcrumb bar */}
      <div
        ref={ref}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-1',
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
      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className="h-5" aria-hidden="true" />
    </>
  );
});

StickyBreadcrumbs.displayName = 'StickyBreadcrumbs';

export default StickyBreadcrumbs;
