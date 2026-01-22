import { useState, useEffect, useRef } from 'react';

/**
 * Hook to prevent loading screen flickers by ensuring a minimum display time.
 * This prevents rapid "flash" transitions when multiple loading states resolve
 * at slightly different times.
 */
export function useStableLoading(
  isLoading: boolean,
  minDisplayTime: number = 300
): boolean {
  const [stableLoading, setStableLoading] = useState(isLoading);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Started loading - record the time
      loadingStartTime.current = Date.now();
      setStableLoading(true);
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // Finished loading - ensure minimum display time
      const elapsed = loadingStartTime.current 
        ? Date.now() - loadingStartTime.current 
        : minDisplayTime;
      
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      if (remainingTime > 0) {
        timeoutRef.current = setTimeout(() => {
          setStableLoading(false);
          loadingStartTime.current = null;
        }, remainingTime);
      } else {
        setStableLoading(false);
        loadingStartTime.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDisplayTime]);

  return stableLoading;
}

/**
 * Hook to consolidate multiple loading states with debouncing.
 * Prevents flickers when multiple async operations complete at different times.
 */
export function useConsolidatedLoading(
  loadingStates: boolean[],
  debounceMs: number = 100
): boolean {
  const [isLoading, setIsLoading] = useState(loadingStates.some(Boolean));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const anyLoading = loadingStates.some(Boolean);
    
    if (anyLoading) {
      // Immediately show loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
