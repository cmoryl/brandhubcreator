import { useState, useRef, useEffect } from 'react';

/**
 * Hook to stabilize a loading flag to prevent UI flickering.
 * Now includes a delay before showing loading to prevent flash for fast loads.
 * 
 * @param isLoading - The raw loading state
 * @param options - Configuration options
 * @returns Stabilized loading state
 */
export interface StableLoadingOptions {
  /** Delay before showing loading state (prevents flash for fast loads) */
  showDelay?: number;
  /** Minimum time to show loading once visible */
  minDisplayTime?: number;
  /** Maximum time after which loading is forced off */
  maxLoadingTime?: number;
}

export function useStableLoading(
  isLoading: boolean,
  options: StableLoadingOptions | number = {}
): boolean {
  // Support legacy signature: useStableLoading(isLoading, minDisplayTime, maxLoadingTime)
  const opts: StableLoadingOptions = typeof options === 'number' 
    ? { minDisplayTime: options } 
    : options;
  
  const {
    showDelay = 150,      // Wait 150ms before showing loading
    minDisplayTime = 300, // Show for at least 300ms once visible
    maxLoadingTime = 8000 // Force off after 8s
  } = opts;

  const [stableLoading, setStableLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableLoadingRef = useRef(false);

  // Keep ref in sync with state to avoid dependency issues
  useEffect(() => {
    stableLoadingRef.current = stableLoading;
  }, [stableLoading]);

  useEffect(() => {
    // Clear pending timeouts
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isLoading) {
      // Loading started - delay before showing to prevent flash
      if (!loadingStartRef.current) {
        loadingStartRef.current = Date.now();
        
        showTimeoutRef.current = setTimeout(() => {
          setStableLoading(true);
          
          // Set max loading timeout as escape hatch
          if (!maxTimeoutRef.current) {
            maxTimeoutRef.current = setTimeout(() => {
              console.warn('[useStableLoading] Max loading time exceeded, forcing load complete');
              setStableLoading(false);
              loadingStartRef.current = null;
            }, maxLoadingTime);
          }
        }, showDelay);
      }
    } else {
      // Loading finished
      if (loadingStartRef.current) {
        const elapsed = Date.now() - loadingStartRef.current;
        
        // If loading finished before showDelay, never show the loading state
        if (elapsed < showDelay) {
          loadingStartRef.current = null;
          // Clear max timeout
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = null;
          }
          return;
        }
        
        // If we're showing loading, ensure minimum display time
        if (stableLoadingRef.current) {
          const visibleTime = elapsed - showDelay;
          const remaining = Math.max(0, minDisplayTime - visibleTime);
          
          hideTimeoutRef.current = setTimeout(() => {
            setStableLoading(false);
            loadingStartRef.current = null;
            if (maxTimeoutRef.current) {
              clearTimeout(maxTimeoutRef.current);
              maxTimeoutRef.current = null;
            }
          }, remaining);
        } else {
          loadingStartRef.current = null;
        }
      }
    }

    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isLoading, showDelay, minDisplayTime, maxLoadingTime]);

  // Cleanup max timeout on unmount
  useEffect(() => {
    return () => {
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return stableLoading;
}

/**
 * Hook to consolidate multiple loading states with debounce.
 * Shows loading immediately when any state is true,
 * hides after debounce when all are false.
 * 
 * @param loadingStates - Array of loading boolean flags
 * @param debounceMs - Debounce time before hiding loading (default: 50ms)
 * @returns Consolidated loading state
 */
export function useConsolidatedLoading(
  loadingStates: boolean[],
  debounceMs: number = 50
): boolean {
  const [isLoading, setIsLoading] = useState(loadingStates.some(Boolean));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const anyLoading = loadingStates.some(Boolean);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (anyLoading) {
      setIsLoading(true);
    } else {
      // Debounce hiding loading to prevent flickers
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadingStates, debounceMs]);

  return isLoading;

}

/**
 * Hook for optimized page loading - prevents flash for fast loads
 * while ensuring smooth transitions for slower ones.
 */
export function usePageLoading(
  isDataLoading: boolean,
  hasData: boolean
): boolean {
  // Only show loading if we need data AND don't have it yet
  const needsLoading = isDataLoading && !hasData;
  
  return useStableLoading(needsLoading, {
    showDelay: 100,      // Wait 100ms before showing (most loads complete faster)
    minDisplayTime: 400, // Show for at least 400ms for smooth UX
    maxLoadingTime: 10000
  });
}
