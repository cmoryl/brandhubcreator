import { useState, useRef, useEffect } from 'react';

/**
 * Hook to stabilize a loading flag to prevent UI flickering.
 * Ensures a minimum display time before hiding the loading state,
 * AND a maximum time after which loading is forced off (escape hatch).
 * 
 * @param isLoading - The raw loading state
 * @param minDisplayTime - Minimum time (ms) to show loading once it starts (default: 50ms)
 * @param maxLoadingTime - Maximum time (ms) after which loading is forced off (default: 8000ms)
 * @returns Stabilized loading state
 */
export function useStableLoading(
  isLoading: boolean,
  minDisplayTime: number = 50,
  maxLoadingTime: number = 8000
): boolean {
  const [stableLoading, setStableLoading] = useState(isLoading);
  const loadingStartRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLoading) {
      // Loading started
      if (!loadingStartRef.current) {
        loadingStartRef.current = Date.now();
      }
      setStableLoading(true);
      
      // Set max loading timeout as escape hatch
      if (!maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          console.warn('[useStableLoading] Max loading time exceeded, forcing load complete');
          setStableLoading(false);
          loadingStartRef.current = null;
        }, maxLoadingTime);
      }
    } else {
      // Loading finished - ensure minimum display time
      if (loadingStartRef.current) {
        const elapsed = Date.now() - loadingStartRef.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        timeoutRef.current = setTimeout(() => {
          setStableLoading(false);
          loadingStartRef.current = null;
          // Clear max timeout since loading completed naturally
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = null;
          }
        }, remaining);
      } else {
        setStableLoading(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDisplayTime, maxLoadingTime]);

  // Cleanup max timeout on unmount
  useEffect(() => {
    return () => {
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
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
