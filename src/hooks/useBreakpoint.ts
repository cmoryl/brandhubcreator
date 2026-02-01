/**
 * Responsive breakpoint detection hook
 * Provides consistent breakpoint values across the app
 */

import { useState, useEffect } from 'react';

// Tailwind default breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface BreakpointState {
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // 640px - 1023px
  isDesktop: boolean;     // >= 1024px
  isSmallMobile: boolean; // < 375px (iPhone SE)
  breakpoint: Breakpoint | 'xs';
  width: number;
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSmallMobile: false,
        breakpoint: 'lg',
        width: 1024,
      };
    }
    return getBreakpointState(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getBreakpointState(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

function getBreakpointState(width: number): BreakpointState {
  const breakpoint = getBreakpoint(width);
  
  return {
    isMobile: width < BREAKPOINTS.sm,
    isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSmallMobile: width < 375,
    breakpoint,
    width,
  };
}

function getBreakpoint(width: number): Breakpoint | 'xs' {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook to check if screen is at least a certain breakpoint
 */
export function useMinBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useBreakpoint();
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Hook to check if screen is at most a certain breakpoint
 */
export function useMaxBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useBreakpoint();
  return width < BREAKPOINTS[breakpoint];
}
