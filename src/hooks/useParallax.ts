import { useEffect, useState, useCallback, useRef } from 'react';

interface ParallaxOptions {
  speed?: number; // 0-1, lower = slower parallax
  maxOffset?: number; // Max pixel offset
}

export function useParallax({ speed = 0.5, maxOffset = 100 }: ParallaxOptions = {}) {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);

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
    
    // Defer initial read to next frame to avoid forced reflow during render
    rafRef.current = requestAnimationFrame(() => {
      lastScrollY.current = window.scrollY;
      updateOffset();
    });
    
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

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateTransform = () => {
      const rect = element.getBoundingClientRect();
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
    
    // Defer initial calculation to next frame
    rafRef.current = requestAnimationFrame(updateTransform);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [elementRef, speed, maxOffset]);

  return transform;
}
