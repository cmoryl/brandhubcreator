/**
 * Responsive Container Components
 * Provides consistent responsive layouts across the app
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Responsive padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Center the container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-3 sm:px-4 md:px-6',
  md: 'px-4 sm:px-6 md:px-8',
  lg: 'px-4 sm:px-8 md:px-12 lg:px-16',
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'xl',
  padding = 'md',
  centered = true,
}) => {
  return (
    <div
      className={cn(
        sizeClasses[size],
        paddingClasses[padding],
        centered && 'mx-auto',
        'w-full',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Responsive Grid Component
 * Automatically adjusts columns based on screen size
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  /** Grid column configuration */
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6',
  lg: 'gap-4 sm:gap-6 md:gap-8',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
}) => {
  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', colClasses, gapClasses[gap], className)}>
      {children}
    </div>
  );
};

/**
 * Responsive Stack Component
 * Vertical on mobile, horizontal on larger screens (or vice versa)
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  /** Direction on mobile */
  mobileDirection?: 'row' | 'col';
  /** Direction on desktop */
  desktopDirection?: 'row' | 'col';
  /** Breakpoint to switch */
  breakAt?: 'sm' | 'md' | 'lg';
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
  /** Alignment */
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className,
  mobileDirection = 'col',
  desktopDirection = 'row',
  breakAt = 'md',
  gap = 'md',
  align = 'start',
}) => {
  const directionClass = {
    sm: mobileDirection === 'col' ? 'flex-col sm:flex-row' : 'flex-row sm:flex-col',
    md: mobileDirection === 'col' ? 'flex-col md:flex-row' : 'flex-row md:flex-col',
    lg: mobileDirection === 'col' ? 'flex-col lg:flex-row' : 'flex-row lg:flex-col',
  }[breakAt];

  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];

  return (
    <div className={cn('flex', directionClass, gapClasses[gap], alignClass, className)}>
      {children}
    </div>
  );
};

/**
 * Mobile-only visibility wrapper
 */
export const MobileOnly: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn('sm:hidden', className)}>{children}</div>
);

/**
 * Desktop-only visibility wrapper
 */
export const DesktopOnly: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn('hidden sm:block', className)}>{children}</div>
);

/**
 * Tablet and up visibility wrapper
 */
export const TabletUp: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn('hidden md:block', className)}>{children}</div>
);
