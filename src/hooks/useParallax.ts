import { useEffect, useState, useCallback, useRef } from 'react';

interface ParallaxOptions {
  speed?: number; // 0-1, lower = slower parallax
  maxOffset?: number; // Max pixel offset
}

export function useParallax({ speed = 0.5, maxOffset = 100 }: ParallaxOptions = {}) {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);
  const isFirstRender = useRef(true);

  const updateOffset = useCallback(() => {
    const calculatedOffset = Math.min(lastScrollY.current * speed, maxOffset);
    setOffset(calculatedOffset);
    rafRef.current = null;
  }, [speed, maxOffset]);

  const handleScroll = useCallback(() => {
    // Cache scroll position without forcing layout
    lastScrollY.current = window.scrollY;
    
    // Batch updates with requestAnimationFrame to avoid forced reflows
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(updateOffset);
    }
  }, [updateOffset]);

  useEffect(() => {
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Defer initial read using requestIdleCallback or setTimeout fallback
    // This prevents forced reflow during initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initializeScroll = () => {
        lastScrollY.current = window.scrollY;
        updateOffset();
      };
      
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(initializeScroll, { timeout: 100 });
      } else {
        setTimeout(initializeScroll, 0);
      }
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, updateOffset]);

  return offset;
}

// Hook for element-specific parallax with ref
export function useElementParallax(elementRef: React.RefObject<HTMLElement>, options: ParallaxOptions = {}) {
  const { speed = 0.3, maxOffset = 50 } = options;
  const [transform, setTransform] = useState('translateY(0px)');
  const rafRef = useRef<number | null>(null);
  const cachedRect = useRef<DOMRect | null>(null);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateTransform = () => {
      const now = performance.now();
      // Throttle getBoundingClientRect to max 30fps to reduce reflow
      if (now - lastUpdateTime.current > 33) {
        cachedRect.current = element.getBoundingClientRect();
        lastUpdateTime.current = now;
      }
      
      const rect = cachedRect.current;
      if (!rect) return;
      
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the element is through the viewport
      const elementCenter = rect.top + rect.height / 2;
      const progress = (viewportHeight - elementCenter) / viewportHeight;
      
      // Apply parallax only when element is in view
      if (rect.top < viewportHeight && rect.bottom > 0) {
        const offset = Math.min(Math.max(progress * 100 * speed, -maxOffset), maxOffset);
        setTransform(`translateY(${offset}px)`);
      }
      rafRef.current = null;
    };

    const handleScroll = () => {
      // Batch updates with requestAnimationFrame to avoid forced reflows
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateTransform);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Defer initial calculation to next idle period
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        cachedRect.current = element.getBoundingClientRect();
        updateTransform();
      }, { timeout: 100 });
    } else {
      rafRef.current = requestAnimationFrame(() => {
        cachedRect.current = element.getBoundingClientRect();
        updateTransform();
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [elementRef, speed, maxOffset]);

  return transform;
}
